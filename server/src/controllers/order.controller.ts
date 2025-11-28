import { Response } from 'express';
import { AuthRequest, CreateOrderRequest } from '../models/types';
import { query, transaction, callProcedure } from '../config/database';
import { successResponse, calculateOrderTotal, generateSessionId } from '../utils/helpers';
import { AppError } from '../middleware/error.middleware';
import { getFirstRow } from '../utils/typeGuards';
import { PoolConnection } from 'mysql2/promise';

// Create order (from kiosk or cashier)
export const createOrder = async (req: AuthRequest, res: Response) => {
  const orderData: CreateOrderRequest = req.body;

  const result = await transaction(async (conn: PoolConnection) => {
    // Calculate order total
    let subtotal = 0;
    const orderItems: any[] = [];

    for (const item of orderData.items) {
      // Get item price
      const [menuItem] = await conn.query(
        `SELECT mi.*,
          (SELECT unit_price FROM menu_item_price
           WHERE menu_item_id = mi.menu_item_id
           AND is_active = TRUE
           AND CURDATE() BETWEEN valid_from AND valid_until
           ORDER BY price_type = 'base' DESC
           LIMIT 1) as current_price
         FROM menu_item mi
         WHERE mi.menu_item_id = ?`,
        [item.menu_item_id]
      );

      const menuItemData: any = Array.isArray(menuItem) ? menuItem[0] : menuItem;

      if (!menuItemData) {
        throw new AppError(`Menu item ${item.menu_item_id} not found`, 404);
      }

      const itemPrice = menuItemData.current_price || 0;
      const itemSubtotal = itemPrice * item.quantity;

      orderItems.push({
        menu_item_id: item.menu_item_id,
        item_name: menuItemData.name,
        quantity: item.quantity,
        unit_price: itemPrice,
        subtotal: itemSubtotal,
      });

      subtotal += itemSubtotal;
    }

    // Get applicable tax
    const [taxRuleRows] = await conn.query(
      `SELECT * FROM tax_rules
       WHERE is_active = TRUE
       ORDER BY created_at DESC
       LIMIT 1`
    );

    const taxRate = Array.isArray(taxRuleRows) && taxRuleRows.length > 0 ? (taxRuleRows[0] as any).tax_rate : 0;

    const totals = calculateOrderTotal(subtotal, taxRate, 0);

    // Generate order number and verification code
    // Use last 9 digits of timestamp + 3-digit random = ORD-123456789-123 (17 chars, fits in VARCHAR(20))
    const timestamp = Date.now().toString().slice(-9);
    const randomSuffix = Math.floor(Math.random() * 1000).toString().padStart(3, '0');
    const orderNumber = `ORD-${timestamp}-${randomSuffix}`;
    const verificationCode = Math.floor(100000 + Math.random() * 900000).toString(); // 6-digit code

    // Create order
    const [orderResult] = await conn.query(
      `INSERT INTO customer_order
       (order_number, verification_code, customer_id, order_type, payment_method, payment_status, order_status,
        subtotal, total_amount, discount_amount, tax_amount, final_amount,
        special_instructions, kiosk_session_id, is_preorder, gcash_reference_number)
       VALUES (?, ?, ?, ?, ?, 'unpaid', 'pending', ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        orderNumber,
        verificationCode,
        orderData.customer_id || null,
        orderData.order_type,
        orderData.payment_method,
        totals.subtotal,
        totals.total,
        totals.discount,
        totals.tax,
        totals.total,
        orderData.special_instructions || null,
        orderData.kiosk_session_id || generateSessionId(),
        orderData.order_type === 'custom_order',
        orderData.payment_reference_number || null,
      ]
    );

    const orderId = (orderResult as any).insertId;

    // Insert order items (V3 schema - only required fields)
    // Database will auto-set: flavor_cost=0, size_multiplier=1, design_cost=0
    // Trigger will auto-set: item_total=subtotal for simple orders
    for (const orderItem of orderItems) {
      await conn.query(
        `INSERT INTO order_item
         (order_id, menu_item_id, item_name, quantity, unit_price, subtotal)
         VALUES (?, ?, ?, ?, ?, ?)`,
        [
          orderId,
          orderItem.menu_item_id,
          orderItem.item_name,
          orderItem.quantity,
          orderItem.unit_price,
          orderItem.subtotal,
        ]
      );
    }

    return {
      order_id: orderId,
      order_number: orderNumber,
      verification_code: verificationCode,
      total_amount: totals.total,
      items_count: orderItems.length,
    };
  });

  res.status(201).json(successResponse('Order created successfully', result));
};

// Get order by verification code (using order_id as fallback)
export const getOrderByVerificationCode = async (req: AuthRequest, res: Response) => {
  const { code } = req.params;

  // Try to find order by order_id (numeric) or kiosk_session_id
  let order = null;

  // If code is numeric, try order_id first
  if (!isNaN(Number(code))) {
    order = getFirstRow<any>(await query(
      `SELECT * FROM customer_order
       WHERE order_id = ?`,
      [code]
    ));
  }

  // If not found, try kiosk_session_id
  if (!order) {
    order = getFirstRow<any>(await query(
      `SELECT * FROM customer_order
       WHERE kiosk_session_id = ?
       AND DATE(order_datetime) = CURDATE()
       ORDER BY order_datetime DESC
       LIMIT 1`,
      [code]
    ));
  }

  if (!order) {
    throw new AppError('Order not found', 404);
  }

  // Get order items
  const items = await query(
    `SELECT oi.*, mi.name as item_name
     FROM order_item oi
     JOIN menu_item mi ON oi.menu_item_id = mi.menu_item_id
     WHERE oi.order_id = ?`,
    [order.order_id]
  );

  res.json(successResponse('Order retrieved', { ...order, items }));
};

// Verify payment
export const verifyPayment = async (req: AuthRequest, res: Response) => {
  const { order_id, reference_number, payment_method } = req.body;
  const cashier_id = req.user?.id;

  // Handle cash and cashless payments
  await transaction(async (conn: PoolConnection) => {
    const orderData = getFirstRow<any>(await conn.query(
      'SELECT total_amount FROM customer_order WHERE order_id = ?',
      [order_id]
    ));

    if (!orderData) {
      throw new AppError('Order not found', 404);
    }

    await conn.query(
      `UPDATE customer_order
       SET payment_status = 'paid',
           payment_verified_by = ?,
           payment_verified_at = NOW()
       WHERE order_id = ?`,
      [cashier_id, order_id]
    );

    await conn.query(
      `INSERT INTO payment_transaction
       (order_id, payment_method, amount, reference_number, payment_status, verified_by, verified_at)
       VALUES (?, ?, ?, ?, 'verified', ?, NOW())`,
      [order_id, payment_method, orderData.total_amount, reference_number || null, cashier_id]
    );
  });

  res.json(successResponse('Payment verified successfully'));
};

// Verify order with code (cashier)
export const verifyOrder = async (req: AuthRequest, res: Response) => {
  const { verification_code } = req.body;
  const cashier_id = req.user?.id;

  const result = await callProcedure('VerifyOrder', [verification_code, cashier_id]);

  res.json(successResponse('Order verified', result[0][0]));
};

// Get order details
export const getOrderDetails = async (req: AuthRequest, res: Response) => {
  const { id } = req.params;

  const order = getFirstRow<any>(await query(
    'SELECT * FROM customer_order WHERE order_id = ?',
    [id]
  ));

  if (!order) {
    throw new AppError('Order not found', 404);
  }

  const items = await query(
    `SELECT oi.*, mi.name as item_name, mi.image_url
     FROM order_item oi
     JOIN menu_item mi ON oi.menu_item_id = mi.menu_item_id
     WHERE oi.order_id = ?`,
    [id]
  );

  res.json(successResponse('Order details retrieved', { ...order, items }));
};

// Update order status
export const updateOrderStatus = async (req: AuthRequest, res: Response) => {
  const { id } = req.params;
  const { status } = req.body;
  const cashier_id = req.user?.id;

  await query(
    'UPDATE customer_order SET order_status = ?, cashier_id = ? WHERE order_id = ?',
    [status, cashier_id, id]
  );

  res.json(successResponse('Order status updated'));
};

// Get orders list with filters
export const getOrders = async (req: AuthRequest, res: Response) => {
  const {
    status,
    payment_status,
    order_type,
    date_from,
    date_to,
    page = '1',
    limit = '20',
  } = req.query;

  // Parse and validate pagination parameters
  const pageNum = Math.max(1, parseInt(page as string, 10) || 1);
  const limitNum = Math.min(100, Math.max(1, parseInt(limit as string, 10) || 20));
  const offset = (pageNum - 1) * limitNum;

  let sql = `
    SELECT co.*, c.name, c.phone
    FROM customer_order co
    LEFT JOIN customer c ON co.customer_id = c.customer_id
    WHERE 1=1
  `;

  const params: any[] = [];

  if (status) {
    sql += ` AND co.order_status = ?`;
    params.push(status);
  }

  if (payment_status) {
    sql += ` AND co.payment_status = ?`;
    params.push(payment_status);
  }

  if (order_type) {
    sql += ` AND co.order_type = ?`;
    params.push(order_type);
  }

  if (date_from) {
    sql += ` AND DATE(co.created_at) >= ?`;
    params.push(date_from);
  }

  if (date_to) {
    sql += ` AND DATE(co.created_at) <= ?`;
    params.push(date_to);
  }

  // Get total count
  const countSql = sql.replace(/SELECT co\.\*.*FROM/, 'SELECT COUNT(*) as total FROM');
  const countResult = getFirstRow<any>(await query(countSql, params));
  const total = countResult?.total || 0;

  sql += ` ORDER BY co.created_at DESC`;
  sql += ` LIMIT ? OFFSET ?`;
  params.push(limitNum, offset);

  const orders = await query(sql, params);

  res.json(successResponse('Orders retrieved', {
    orders,
    pagination: {
      page: pageNum,
      limit: limitNum,
      total,
      totalPages: Math.ceil(total / limitNum)
    }
  }));
};
