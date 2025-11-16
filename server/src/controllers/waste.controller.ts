import { Response } from 'express';
import { AuthRequest } from '../models/types';
import { query } from '../config/database';
import { successResponse } from '../utils/helpers';
import { AppError } from '../middleware/error.middleware';
import { getFirstRow, getAllRows, getInsertId } from '../utils/typeGuards';
import { parsePagination, getQueryString, getQueryNumber, getQueryBoolean, getTypedBody } from '../utils/queryHelpers';

// ==== WASTE TRACKING ====

// Create waste entry
export const createWasteEntry = async (req: AuthRequest, res: Response) => {
  const {
    menu_item_id,
    quantity_wasted,
    waste_reason,
    waste_cost,
    reason_details,
    waste_date,
  } = req.body;
  const cashier_id = req.user?.id;

  // Verify menu item exists
  const item = getFirstRow<any>(await query(
    'SELECT * FROM menu_item WHERE menu_item_id = ?',
    [menu_item_id]
  ));

  if (!item) {
    throw new AppError('Menu item not found', 404);
  }

  // Create waste entry
  const result = await query(
    `INSERT INTO waste_tracking
     (menu_item_id, quantity_wasted, waste_reason, waste_cost, reason_details, reported_by, waste_date)
     VALUES (?, ?, ?, ?, ?, ?, ?)`,
    [
      menu_item_id,
      quantity_wasted,
      waste_reason,
      waste_cost,
      reason_details || null,
      cashier_id,
      waste_date || new Date().toISOString().slice(0, 10),
    ]
  );

  // Update inventory
  await query(
    `UPDATE menu_item
     SET stock_quantity = stock_quantity - ?
     WHERE menu_item_id = ? AND is_infinite_stock = FALSE`,
    [quantity_wasted, menu_item_id]
  );

  // Record inventory transaction
  const currentStock = getFirstRow<any>(await query(
    'SELECT stock_quantity FROM menu_item WHERE menu_item_id = ?',
    [menu_item_id]
  ));

  await query(
    `INSERT INTO inventory_transaction
     (menu_item_id, transaction_type, quantity, previous_quantity, new_quantity,
      notes, performed_by)
     VALUES (?, 'waste', ?, ?, ?, ?, ?)`,
    [
      menu_item_id,
      quantity_wasted,
      item.stock_quantity,
      currentStock?.stock_quantity || 0,
      `Waste entry: ${waste_reason}`,
      cashier_id,
    ]
  );

  res.status(201).json(
    successResponse('Waste entry created', { id: getInsertId(result) })
  );
};

// Get waste entries
export const getWasteEntries = async (req: AuthRequest, res: Response) => {
  const { menu_item_id, waste_reason, date_from, date_to, page = 1, limit = 20 } = req.query;

  let sql = `
    SELECT wt.*, mi.name as item_name, c.name as reported_by_name
    FROM waste_tracking wt
    JOIN menu_item mi ON wt.menu_item_id = mi.menu_item_id
    LEFT JOIN cashier c ON wt.reported_by = c.cashier_id
    WHERE 1=1
  `;

  const params: any[] = [];

  if (menu_item_id) {
    sql += ' AND wt.menu_item_id = ?';
    params.push(menu_item_id);
  }

  if (waste_reason) {
    sql += ' AND wt.waste_reason = ?';
    params.push(waste_reason);
  }

  if (date_from) {
    sql += ' AND wt.waste_date >= ?';
    params.push(date_from);
  }

  if (date_to) {
    sql += ' AND wt.waste_date <= ?';
    params.push(date_to);
  }

  sql += ' ORDER BY wt.waste_date DESC, wt.created_at DESC LIMIT ? OFFSET ?';
  params.push(Number(limit), (Number(page) - 1) * Number(limit));

  const entries = await query(sql, params);

  res.json(successResponse('Waste entries retrieved', entries));
};

// Get waste summary
export const getWasteSummary = async (req: AuthRequest, res: Response) => {
  const { date_from, date_to } = req.query;

  const sql = `
    SELECT
      waste_reason,
      COUNT(*) as total_incidents,
      SUM(quantity_wasted) as total_quantity,
      SUM(waste_cost) as total_cost
    FROM waste_tracking
    WHERE waste_date BETWEEN ? AND ?
    GROUP BY waste_reason
    ORDER BY total_cost DESC
  `;

  const summary = await query(sql, [date_from, date_to]);

  res.json(successResponse('Waste summary retrieved', summary));
};
