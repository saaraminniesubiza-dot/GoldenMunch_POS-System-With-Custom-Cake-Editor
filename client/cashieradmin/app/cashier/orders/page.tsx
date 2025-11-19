'use client';

import { useEffect, useState } from 'react';
import { Card, CardBody, CardHeader } from '@heroui/card';
import { Table, TableHeader, TableColumn, TableBody, TableRow, TableCell } from '@heroui/table';
import { Chip } from '@heroui/chip';
import { Button } from '@heroui/button';
import { Input } from '@heroui/input';
import { Select, SelectItem } from '@heroui/select';
import { Modal, ModalContent, ModalHeader, ModalBody, ModalFooter, useDisclosure } from '@heroui/modal';
import { Spinner } from '@heroui/spinner';
import { OrderService } from '@/services/order.service';
import type { CustomerOrder, OrderStatus } from '@/types/api';
import { MagnifyingGlassIcon } from '@heroicons/react/24/outline';

const statusColors: Record<string, 'default' | 'primary' | 'secondary' | 'success' | 'warning' | 'danger'> = {
  pending: 'warning',
  confirmed: 'primary',
  preparing: 'secondary',
  ready: 'success',
  completed: 'default',
  cancelled: 'danger',
};

export default function CashierOrdersPage() {
  const [orders, setOrders] = useState<CustomerOrder[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedOrder, setSelectedOrder] = useState<CustomerOrder | null>(null);
  const [statusFilter, setStatusFilter] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const { isOpen, onOpen, onClose } = useDisclosure();
  const [updating, setUpdating] = useState(false);

  useEffect(() => {
    loadOrders();
  }, [statusFilter]);

  const loadOrders = async () => {
    try {
      setLoading(true);
      const response = await OrderService.getOrders(statusFilter || undefined);
      if (response.success && response.data) {
        setOrders(response.data);
      }
    } catch (error) {
      console.error('Failed to load orders:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleViewOrder = async (order: CustomerOrder) => {
    try {
      const response = await OrderService.getOrderById(order.order_id);
      if (response.success && response.data) {
        setSelectedOrder(response.data);
        onOpen();
      }
    } catch (error) {
      console.error('Failed to load order details:', error);
    }
  };

  const handleUpdateStatus = async (newStatus: OrderStatus) => {
    if (!selectedOrder) return;

    try {
      setUpdating(true);
      const response = await OrderService.updateOrderStatus(selectedOrder.order_id, {
        order_status: newStatus,
      });

      if (response.success) {
        onClose();
        loadOrders();
      }
    } catch (error) {
      console.error('Failed to update order status:', error);
    } finally {
      setUpdating(false);
    }
  };

  const filteredOrders = orders.filter(order =>
    order.order_number.toLowerCase().includes(searchTerm.toLowerCase()) ||
    order.verification_code.includes(searchTerm)
  );

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold bg-gradient-to-r from-golden-orange to-deep-amber bg-clip-text text-transparent">
          Orders Management
        </h1>
        <Button color="primary" onPress={loadOrders}>
          Refresh
        </Button>
      </div>

      {/* Filters */}
      <Card>
        <CardBody>
          <div className="flex gap-4">
            <Input
              placeholder="Search by order number or verification code..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              startContent={<MagnifyingGlassIcon className="h-5 w-5 text-default-400" />}
              className="max-w-md"
            />
            <Select
              placeholder="Filter by status"
              selectedKeys={statusFilter ? [statusFilter] : []}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="max-w-xs"
            >
              <SelectItem key="" value="">All Status</SelectItem>
              <SelectItem key="pending" value="pending">Pending</SelectItem>
              <SelectItem key="confirmed" value="confirmed">Confirmed</SelectItem>
              <SelectItem key="preparing" value="preparing">Preparing</SelectItem>
              <SelectItem key="ready" value="ready">Ready</SelectItem>
              <SelectItem key="completed" value="completed">Completed</SelectItem>
            </Select>
          </div>
        </CardBody>
      </Card>

      {/* Orders Table */}
      <Card>
        <CardBody>
          {loading ? (
            <div className="flex justify-center p-8">
              <Spinner size="lg" color="primary" />
            </div>
          ) : (
            <Table aria-label="Orders table">
              <TableHeader>
                <TableColumn>ORDER NUMBER</TableColumn>
                <TableColumn>VERIFICATION CODE</TableColumn>
                <TableColumn>TYPE</TableColumn>
                <TableColumn>AMOUNT</TableColumn>
                <TableColumn>STATUS</TableColumn>
                <TableColumn>DATE</TableColumn>
                <TableColumn>ACTIONS</TableColumn>
              </TableHeader>
              <TableBody emptyContent="No orders found">
                {filteredOrders.map((order) => (
                  <TableRow key={order.order_id}>
                    <TableCell>{order.order_number}</TableCell>
                    <TableCell>
                      <code className="bg-default-100 px-2 py-1 rounded">
                        {order.verification_code}
                      </code>
                    </TableCell>
                    <TableCell className="capitalize">{order.order_type.replace('_', ' ')}</TableCell>
                    <TableCell>₱{order.final_amount.toFixed(2)}</TableCell>
                    <TableCell>
                      <Chip color={statusColors[order.order_status]} size="sm" className="capitalize">
                        {order.order_status}
                      </Chip>
                    </TableCell>
                    <TableCell>
                      {new Date(order.order_datetime).toLocaleString()}
                    </TableCell>
                    <TableCell>
                      <Button
                        size="sm"
                        color="primary"
                        variant="flat"
                        onPress={() => handleViewOrder(order)}
                      >
                        View
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardBody>
      </Card>

      {/* Order Details Modal */}
      <Modal isOpen={isOpen} onClose={onClose} size="2xl" scrollBehavior="inside">
        <ModalContent>
          <ModalHeader>Order Details - {selectedOrder?.order_number}</ModalHeader>
          <ModalBody>
            {selectedOrder && (
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm text-default-500">Verification Code</p>
                    <code className="text-lg font-bold bg-default-100 px-2 py-1 rounded">
                      {selectedOrder.verification_code}
                    </code>
                  </div>
                  <div>
                    <p className="text-sm text-default-500">Status</p>
                    <Chip color={statusColors[selectedOrder.order_status]} className="capitalize mt-1">
                      {selectedOrder.order_status}
                    </Chip>
                  </div>
                  <div>
                    <p className="text-sm text-default-500">Order Type</p>
                    <p className="font-semibold capitalize">
                      {selectedOrder.order_type.replace('_', ' ')}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-default-500">Payment Method</p>
                    <p className="font-semibold uppercase">{selectedOrder.payment_method}</p>
                  </div>
                </div>

                <div>
                  <p className="text-sm text-default-500 mb-2">Items</p>
                  {selectedOrder.items?.map((item, idx) => (
                    <div key={idx} className="flex justify-between p-2 bg-default-50 rounded mb-2">
                      <span>{item.menu_item?.name} x{item.quantity}</span>
                      <span>₱{item.item_total.toFixed(2)}</span>
                    </div>
                  ))}
                </div>

                <div className="border-t pt-4">
                  <div className="flex justify-between mb-2">
                    <span>Subtotal:</span>
                    <span>₱{selectedOrder.total_amount.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between mb-2">
                    <span>Tax:</span>
                    <span>₱{selectedOrder.tax_amount.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between font-bold text-lg">
                    <span>Total:</span>
                    <span>₱{selectedOrder.final_amount.toFixed(2)}</span>
                  </div>
                </div>

                {selectedOrder.special_instructions && (
                  <div>
                    <p className="text-sm text-default-500">Special Instructions</p>
                    <p className="text-sm bg-warning-50 p-2 rounded">
                      {selectedOrder.special_instructions}
                    </p>
                  </div>
                )}
              </div>
            )}
          </ModalBody>
          <ModalFooter>
            <Button variant="light" onPress={onClose}>Close</Button>
            {selectedOrder && selectedOrder.order_status !== 'completed' && selectedOrder.order_status !== 'cancelled' && (
              <div className="flex gap-2">
                {selectedOrder.order_status === 'pending' && (
                  <Button
                    color="primary"
                    onPress={() => handleUpdateStatus('confirmed' as OrderStatus)}
                    isLoading={updating}
                  >
                    Confirm Order
                  </Button>
                )}
                {selectedOrder.order_status === 'confirmed' && (
                  <Button
                    color="primary"
                    onPress={() => handleUpdateStatus('preparing' as OrderStatus)}
                    isLoading={updating}
                  >
                    Start Preparing
                  </Button>
                )}
                {selectedOrder.order_status === 'preparing' && (
                  <Button
                    color="success"
                    onPress={() => handleUpdateStatus('ready' as OrderStatus)}
                    isLoading={updating}
                  >
                    Mark as Ready
                  </Button>
                )}
                {selectedOrder.order_status === 'ready' && (
                  <Button
                    color="success"
                    onPress={() => handleUpdateStatus('completed' as OrderStatus)}
                    isLoading={updating}
                  >
                    Complete Order
                  </Button>
                )}
              </div>
            )}
          </ModalFooter>
        </ModalContent>
      </Modal>
    </div>
  );
}
