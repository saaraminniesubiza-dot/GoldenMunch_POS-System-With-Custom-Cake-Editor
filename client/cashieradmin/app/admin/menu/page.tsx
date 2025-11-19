'use client';

import { useEffect, useState } from 'react';
import { Card, CardBody } from '@heroui/card';
import { Table, TableHeader, TableColumn, TableBody, TableRow, TableCell } from '@heroui/table';
import { Button } from '@heroui/button';
import { Input } from '@heroui/input';
import { Modal, ModalContent, ModalHeader, ModalBody, ModalFooter, useDisclosure } from '@heroui/modal';
import { Chip } from '@heroui/chip';
import { Spinner } from '@heroui/spinner';
import { Select, SelectItem } from '@heroui/select';
import { Textarea } from '@heroui/input';
import { MenuService } from '@/services/menu.service';
import { ProtectedRoute } from '@/components/protected-route';
import type { MenuItem, CreateMenuItemRequest } from '@/types/api';
import { PlusIcon } from '@heroicons/react/24/outline';

export default function AdminMenuPage() {
  return (
    <ProtectedRoute adminOnly>
      <MenuManagementContent />
    </ProtectedRoute>
  );
}

function MenuManagementContent() {
  const [items, setItems] = useState<MenuItem[]>([]);
  const [loading, setLoading] = useState(true);
  const { isOpen, onOpen, onClose } = useDisclosure();
  const [formData, setFormData] = useState<Partial<CreateMenuItemRequest>>({});
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    loadMenuItems();
  }, []);

  const loadMenuItems = async () => {
    try {
      setLoading(true);
      const response = await MenuService.getMenuItems();
      if (response.success && response.data) {
        setItems(response.data);
      }
    } catch (error) {
      console.error('Failed to load menu items:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async () => {
    try {
      setSaving(true);
      const response = await MenuService.createMenuItem(
        formData as CreateMenuItemRequest,
        imageFile || undefined
      );

      if (response.success) {
        onClose();
        loadMenuItems();
        setFormData({});
        setImageFile(null);
      }
    } catch (error) {
      console.error('Failed to create menu item:', error);
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: number) => {
    if (confirm('Are you sure you want to delete this item?')) {
      try {
        await MenuService.deleteMenuItem(id);
        loadMenuItems();
      } catch (error) {
        console.error('Failed to delete item:', error);
      }
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold bg-gradient-to-r from-golden-orange to-deep-amber bg-clip-text text-transparent">
          Menu Management
        </h1>
        <Button
          color="primary"
          startContent={<PlusIcon className="h-5 w-5" />}
          onPress={onOpen}
        >
          Add Menu Item
        </Button>
      </div>

      <Card>
        <CardBody>
          {loading ? (
            <div className="flex justify-center p-8">
              <Spinner size="lg" color="primary" />
            </div>
          ) : (
            <Table aria-label="Menu items table">
              <TableHeader>
                <TableColumn>NAME</TableColumn>
                <TableColumn>TYPE</TableColumn>
                <TableColumn>PRICE</TableColumn>
                <TableColumn>STOCK</TableColumn>
                <TableColumn>STATUS</TableColumn>
                <TableColumn>ACTIONS</TableColumn>
              </TableHeader>
              <TableBody emptyContent="No menu items found">
                {items.map((item) => (
                  <TableRow key={item.menu_item_id}>
                    <TableCell>{item.name}</TableCell>
                    <TableCell className="capitalize">{item.item_type}</TableCell>
                    <TableCell>₱{item.current_price?.toFixed(2) || '0.00'}</TableCell>
                    <TableCell>
                      {item.is_infinite_stock ? '∞' : item.stock_quantity}
                    </TableCell>
                    <TableCell>
                      <Chip
                        color={item.status === 'available' ? 'success' : 'danger'}
                        size="sm"
                        className="capitalize"
                      >
                        {item.status}
                      </Chip>
                    </TableCell>
                    <TableCell>
                      <div className="flex gap-2">
                        <Button size="sm" color="danger" variant="flat" onPress={() => handleDelete(item.menu_item_id)}>
                          Delete
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardBody>
      </Card>

      {/* Add Item Modal */}
      <Modal isOpen={isOpen} onClose={onClose} size="2xl" scrollBehavior="inside">
        <ModalContent>
          <ModalHeader>Add New Menu Item</ModalHeader>
          <ModalBody>
            <div className="space-y-4">
              <Input
                label="Name"
                placeholder="Enter item name"
                value={formData.name || ''}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                required
              />
              <Textarea
                label="Description"
                placeholder="Enter item description"
                value={formData.description || ''}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              />
              <Select
                label="Item Type"
                placeholder="Select item type"
                selectedKeys={formData.item_type ? [formData.item_type] : []}
                onChange={(e) => setFormData({ ...formData, item_type: e.target.value as any })}
              >
                <SelectItem key="cake" value="cake">Cake</SelectItem>
                <SelectItem key="pastry" value="pastry">Pastry</SelectItem>
                <SelectItem key="beverage" value="beverage">Beverage</SelectItem>
                <SelectItem key="coffee" value="coffee">Coffee</SelectItem>
                <SelectItem key="sandwich" value="sandwich">Sandwich</SelectItem>
                <SelectItem key="bread" value="bread">Bread</SelectItem>
                <SelectItem key="dessert" value="dessert">Dessert</SelectItem>
                <SelectItem key="snack" value="snack">Snack</SelectItem>
                <SelectItem key="other" value="other">Other</SelectItem>
              </Select>
              <Input
                label="Unit of Measure"
                placeholder="e.g., piece, slice, cup"
                value={formData.unit_of_measure || ''}
                onChange={(e) => setFormData({ ...formData, unit_of_measure: e.target.value })}
              />
              <Input
                label="Stock Quantity"
                type="number"
                placeholder="Enter stock quantity"
                value={formData.stock_quantity?.toString() || ''}
                onChange={(e) => setFormData({ ...formData, stock_quantity: parseInt(e.target.value) || 0 })}
              />
              <Input
                label="Minimum Stock Level"
                type="number"
                placeholder="Enter minimum stock level"
                value={formData.min_stock_level?.toString() || ''}
                onChange={(e) => setFormData({ ...formData, min_stock_level: parseInt(e.target.value) || 0 })}
              />
              <Input
                type="file"
                label="Image"
                accept="image/*"
                onChange={(e) => setImageFile(e.target.files?.[0] || null)}
              />
            </div>
          </ModalBody>
          <ModalFooter>
            <Button variant="light" onPress={onClose}>Cancel</Button>
            <Button color="primary" onPress={handleSubmit} isLoading={saving}>
              Create Item
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>
    </div>
  );
}
