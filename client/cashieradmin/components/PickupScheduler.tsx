/**
 * Pickup Scheduler Component
 * Allows admin to schedule pickup date and time for verified orders
 */

'use client';

import React, { useState } from 'react';
import { Card, CardBody, CardHeader } from '@nextui-org/card';
import { Button } from '@nextui-org/button';
import { Input } from '@nextui-org/input';
import { Textarea } from '@nextui-org/input';
import { Divider } from '@nextui-org/divider';
import { Modal, ModalContent, ModalHeader, ModalBody, ModalFooter } from '@nextui-org/modal';
import {
  CalendarIcon,
  ClockIcon,
  CheckCircleIcon,
  ExclamationTriangleIcon,
  UserIcon,
} from '@heroicons/react/24/outline';

interface PickupSchedulerProps {
  request: any;
  onSuccess: () => void;
  onCancel: () => void;
  isOpen: boolean;
}

export default function PickupScheduler({ request, onSuccess, onCancel, isOpen }: PickupSchedulerProps) {
  const [scheduling, setScheduling] = useState(false);

  const [formData, setFormData] = useState({
    pickup_date: '',
    pickup_time: '10:00',
    baker_id: '',
    baker_notes: '',
  });

  const [capacityWarning, setCapacityWarning] = useState<string | null>(null);

  // Get minimum pickup date (preparation_days from now)
  const getMinPickupDate = () => {
    const preparationDays = request?.preparation_days || 3;
    const minDate = new Date();
    minDate.setDate(minDate.getDate() + preparationDays);
    return minDate.toISOString().split('T')[0];
  };

  // Check capacity when date changes
  const handleDateChange = async (date: string) => {
    setFormData({ ...formData, pickup_date: date });

    if (!date) {
      setCapacityWarning(null);
      return;
    }

    // TODO: Check capacity with API
    // For now, just show a placeholder warning
    setCapacityWarning(null);
  };

  const handleSubmit = async () => {
    // Validation
    if (!formData.pickup_date) {
      alert('Please select a pickup date');
      return;
    }

    if (!formData.pickup_time) {
      alert('Please select a pickup time');
      return;
    }

    // Validate date is not in the past
    const selectedDate = new Date(`${formData.pickup_date}T${formData.pickup_time}`);
    const minDate = new Date();
    minDate.setDate(minDate.getDate() + (request?.preparation_days || 3));

    if (selectedDate < minDate) {
      alert(`Pickup date must be at least ${request?.preparation_days || 3} days from now to allow for preparation time`);
      return;
    }

    try {
      setScheduling(true);

      const token = localStorage.getItem('adminToken') || sessionStorage.getItem('adminToken');

      if (!token) {
        alert('Admin authentication required');
        return;
      }

      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api'}/admin/custom-cakes/${request.request_id}/schedule-pickup`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            pickup_date: formData.pickup_date,
            pickup_time: formData.pickup_time,
            assigned_baker_id: formData.baker_id || null,
            baker_notes: formData.baker_notes,
          }),
        }
      );

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ error: 'Unknown error' }));
        throw new Error(errorData.error || 'Failed to schedule pickup');
      }

      const result = await response.json();

      if (result.success) {
        alert(`✅ Pickup scheduled successfully!\n\nDate: ${formData.pickup_date}\nTime: ${formData.pickup_time}\n\nCustomer will be notified via email.`);
        onSuccess();
      } else {
        throw new Error('Invalid response from server');
      }
    } catch (error: any) {
      console.error('Failed to schedule pickup:', error);
      alert(`❌ Failed to schedule pickup: ${error.message || 'Unknown error'}`);
    } finally {
      setScheduling(false);
    }
  };

  if (!request) return null;

  const minPickupDate = getMinPickupDate();

  return (
    <Modal isOpen={isOpen} onClose={onCancel} size="3xl" scrollBehavior="inside">
      <ModalContent>
        <ModalHeader className="flex flex-col gap-1">
          <h2 className="text-2xl font-bold">Schedule Pickup</h2>
          <p className="text-sm text-gray-500">Request #{request.request_id} - {request.customer_name}</p>
        </ModalHeader>

        <ModalBody>
          <div className="space-y-6">
            {/* Order Summary */}
            <Card>
              <CardHeader>
                <h3 className="font-bold">Order Summary</h3>
              </CardHeader>
              <Divider />
              <CardBody>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm text-gray-500">Customer</p>
                    <p className="font-semibold">{request.customer_name}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">Contact</p>
                    <p className="font-semibold">{request.customer_phone}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">Quoted Price</p>
                    <p className="font-semibold text-green-600">₱{request.quoted_price?.toFixed(2)}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">Preparation Time</p>
                    <p className="font-semibold">{request.preparation_days || 3} days</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">Layers</p>
                    <p className="font-semibold">{request.num_layers}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">Frosting</p>
                    <p className="font-semibold capitalize">{request.frosting_type}</p>
                  </div>
                </div>

                {request.special_instructions && (
                  <div className="mt-4 pt-4 border-t">
                    <p className="text-sm text-gray-500">Special Instructions</p>
                    <p className="text-gray-800 mt-1">{request.special_instructions}</p>
                  </div>
                )}
              </CardBody>
            </Card>

            {/* Preparation Time Notice */}
            <Card className="bg-amber-50 border-2 border-amber-200">
              <CardBody className="p-4">
                <div className="flex items-start gap-3">
                  <ExclamationTriangleIcon className="w-6 h-6 text-amber-600 flex-shrink-0 mt-0.5" />
                  <div>
                    <h3 className="font-bold text-amber-900 mb-1">Preparation Time Required</h3>
                    <p className="text-sm text-amber-800">
                      This order requires <span className="font-bold">{request.preparation_days || 3} days</span> of
                      preparation time. The earliest pickup date is{' '}
                      <span className="font-bold">{new Date(minPickupDate).toLocaleDateString()}</span>.
                    </p>
                  </div>
                </div>
              </CardBody>
            </Card>

            {/* Scheduling Form */}
            <div className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Pickup Date */}
                <Input
                  label="Pickup Date *"
                  type="date"
                  min={minPickupDate}
                  value={formData.pickup_date}
                  onValueChange={handleDateChange}
                  startContent={<CalendarIcon className="w-4 h-4 text-default-400" />}
                  isRequired
                />

                {/* Pickup Time */}
                <Input
                  label="Pickup Time *"
                  type="time"
                  value={formData.pickup_time}
                  onValueChange={(value) => setFormData({ ...formData, pickup_time: value })}
                  startContent={<ClockIcon className="w-4 h-4 text-default-400" />}
                  isRequired
                />

                {/* Baker ID (Optional) */}
                <Input
                  label="Assigned Baker ID (Optional)"
                  type="number"
                  placeholder="e.g., 1"
                  value={formData.baker_id}
                  onValueChange={(value) => setFormData({ ...formData, baker_id: value })}
                  startContent={<UserIcon className="w-4 h-4 text-default-400" />}
                />
              </div>

              {/* Capacity Warning */}
              {capacityWarning && (
                <Card className="bg-red-50 border-2 border-red-200">
                  <CardBody className="p-3">
                    <div className="flex items-center gap-2">
                      <ExclamationTriangleIcon className="w-5 h-5 text-red-600" />
                      <p className="text-sm text-red-800">{capacityWarning}</p>
                    </div>
                  </CardBody>
                </Card>
              )}

              {/* Baker Notes */}
              <Textarea
                label="Baker Notes (Optional)"
                placeholder="Special instructions for the baker..."
                value={formData.baker_notes}
                onValueChange={(value) => setFormData({ ...formData, baker_notes: value })}
                minRows={3}
              />

              {/* Recommended Times */}
              <Card className="bg-blue-50 border border-blue-200">
                <CardHeader>
                  <h4 className="text-sm font-bold text-blue-900">Recommended Pickup Times</h4>
                </CardHeader>
                <Divider />
                <CardBody>
                  <div className="grid grid-cols-2 gap-2 text-sm">
                    <Button
                      size="sm"
                      variant="flat"
                      color="primary"
                      onPress={() => setFormData({ ...formData, pickup_time: '10:00' })}
                    >
                      10:00 AM
                    </Button>
                    <Button
                      size="sm"
                      variant="flat"
                      color="primary"
                      onPress={() => setFormData({ ...formData, pickup_time: '14:00' })}
                    >
                      2:00 PM
                    </Button>
                    <Button
                      size="sm"
                      variant="flat"
                      color="primary"
                      onPress={() => setFormData({ ...formData, pickup_time: '16:00' })}
                    >
                      4:00 PM
                    </Button>
                    <Button
                      size="sm"
                      variant="flat"
                      color="primary"
                      onPress={() => setFormData({ ...formData, pickup_time: '18:00' })}
                    >
                      6:00 PM
                    </Button>
                  </div>
                </CardBody>
              </Card>

              {/* What Happens Next */}
              <Card className="bg-green-50 border border-green-200">
                <CardBody className="p-4">
                  <p className="text-sm text-green-800">
                    <span className="font-bold">What happens next?</span>
                    <br />
                    1. Customer receives email with pickup date/time
                    <br />
                    2. Order status changes to "Scheduled"
                    <br />
                    3. Assigned baker can start production
                    <br />
                    4. Update status to "In Production" when work begins
                  </p>
                </CardBody>
              </Card>
            </div>
          </div>
        </ModalBody>

        <ModalFooter>
          <Button color="danger" variant="light" onPress={onCancel} isDisabled={scheduling}>
            Cancel
          </Button>
          <Button
            color="success"
            onPress={handleSubmit}
            isLoading={scheduling}
            startContent={!scheduling && <CheckCircleIcon className="w-5 h-5" />}
          >
            {scheduling ? 'Scheduling...' : 'Schedule Pickup'}
          </Button>
        </ModalFooter>
      </ModalContent>
    </Modal>
  );
}
