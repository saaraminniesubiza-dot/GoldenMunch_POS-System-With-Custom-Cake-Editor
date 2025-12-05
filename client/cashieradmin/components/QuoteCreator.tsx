/**
 * Quote Creator Component
 * Allows admin to review cake request and create custom quote
 */

'use client';

import React, { useState, useEffect } from 'react';
import { Card, CardBody, CardHeader } from '@nextui-org/card';
import { Button } from '@nextui-org/button';
import { Input } from '@nextui-org/input';
import { Textarea } from '@nextui-org/input';
import { Divider } from '@nextui-org/divider';
import { Chip } from '@nextui-org/chip';
import { Modal, ModalContent, ModalHeader, ModalBody, ModalFooter } from '@nextui-org/modal';
import {
  CurrencyDollarIcon,
  CheckCircleIcon,
  XMarkIcon,
  CalculatorIcon,
  ClockIcon,
} from '@heroicons/react/24/outline';

interface QuoteCreatorProps {
  request: any;
  onSuccess: () => void;
  onCancel: () => void;
  isOpen: boolean;
}

interface PriceBreakdown {
  base_price: number;
  layers_cost: number;
  decorations_cost: number;
  theme_cost: number;
  text_cost: number;
  frosting_cost: number;
  special_requests_cost: number;
  complexity_multiplier: number;
  subtotal: number;
  total: number;
}

export default function QuoteCreator({ request, onSuccess, onCancel, isOpen }: QuoteCreatorProps) {
  const [creating, setCreating] = useState(false);
  const [suggestedPrice, setSuggestedPrice] = useState<PriceBreakdown | null>(null);
  const [loadingSuggestion, setLoadingSuggestion] = useState(false);

  const [formData, setFormData] = useState({
    quoted_price: '',
    preparation_days: '3',
    quote_notes: '',
  });

  const [breakdown, setBreakdown] = useState({
    base_price: 500,
    layers_cost: 0,
    decorations_cost: 0,
    theme_cost: 0,
    text_cost: 0,
    frosting_cost: 0,
    special_requests_cost: 0,
    complexity_multiplier: 1.0,
  });

  useEffect(() => {
    if (isOpen && request) {
      // Calculate suggested price automatically
      calculateSuggestedPrice();
    }
  }, [isOpen, request]);

  const calculateSuggestedPrice = () => {
    setLoadingSuggestion(true);

    // Simple calculation based on layers and complexity
    const basePrice = 500;
    const layersCost = (request.num_layers - 1) * 300;
    const decorationsCost = request.decorations_3d?.length > 0 ? 200 : 0;
    const themeCost = request.theme_id ? 200 : 0;
    const textCost = request.cake_text ? 100 : 0;
    const frostingCost = request.frosting_type === 'fondant' ? 300 : 100;
    const specialCost = request.special_instructions ? 200 : 0;

    // Complexity multiplier (1.0 - 2.0)
    let complexity = 1.0;
    if (request.num_layers >= 4) complexity += 0.3;
    if (request.decorations_3d?.length > 5) complexity += 0.2;
    if (request.frosting_type === 'fondant') complexity += 0.2;
    if (request.cake_text) complexity += 0.1;

    const subtotal =
      basePrice +
      layersCost +
      decorationsCost +
      themeCost +
      textCost +
      frostingCost +
      specialCost;
    const total = Math.round(subtotal * complexity);

    const calculatedBreakdown = {
      base_price: basePrice,
      layers_cost: layersCost,
      decorations_cost: decorationsCost,
      theme_cost: themeCost,
      text_cost: textCost,
      frosting_cost: frostingCost,
      special_requests_cost: specialCost,
      complexity_multiplier: complexity,
      subtotal,
      total,
    };

    setSuggestedPrice(calculatedBreakdown);
    setBreakdown(calculatedBreakdown);
    setFormData({ ...formData, quoted_price: total.toString() });
    setLoadingSuggestion(false);
  };

  const handleUseSuggested = () => {
    if (suggestedPrice) {
      setFormData({ ...formData, quoted_price: suggestedPrice.total.toString() });
    }
  };

  const handleSubmit = async () => {
    // Validation
    if (!formData.quoted_price || parseFloat(formData.quoted_price) <= 0) {
      alert('Please enter a valid quoted price');
      return;
    }

    if (!formData.preparation_days || parseInt(formData.preparation_days) <= 0) {
      alert('Please enter preparation days');
      return;
    }

    try {
      setCreating(true);

      const token = localStorage.getItem('adminToken') || sessionStorage.getItem('adminToken');

      if (!token) {
        alert('Admin authentication required');
        return;
      }

      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api'}/admin/custom-cakes/${request.request_id}/create-quote`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            quoted_price: parseFloat(formData.quoted_price),
            preparation_days: parseInt(formData.preparation_days),
            quote_notes: formData.quote_notes,
            quote_breakdown: breakdown,
          }),
        }
      );

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ error: 'Unknown error' }));
        throw new Error(errorData.error || 'Failed to create quote');
      }

      const result = await response.json();

      if (result.success) {
        alert(`✅ Quote created successfully!\n\nTracking Code: ${result.data.tracking_code}\nQuoted Price: ₱${formData.quoted_price}\n\nCustomer will be notified via email.`);
        onSuccess();
      } else {
        throw new Error('Invalid response from server');
      }
    } catch (error: any) {
      console.error('Failed to create quote:', error);
      alert(`❌ Failed to create quote: ${error.message || 'Unknown error'}`);
    } finally {
      setCreating(false);
    }
  };

  if (!request) return null;

  return (
    <Modal isOpen={isOpen} onClose={onCancel} size="4xl" scrollBehavior="inside">
      <ModalContent>
        <ModalHeader className="flex flex-col gap-1">
          <h2 className="text-2xl font-bold">Create Quote</h2>
          <p className="text-sm text-gray-500">Request #{request.request_id} - {request.customer_name}</p>
        </ModalHeader>

        <ModalBody>
          <div className="space-y-6">
            {/* Request Summary */}
            <Card>
              <CardHeader>
                <h3 className="font-bold">Request Summary</h3>
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
                    <p className="font-semibold">{request.customer_email}</p>
                    <p className="text-sm text-gray-600">{request.customer_phone}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">Layers</p>
                    <p className="font-semibold">{request.num_layers}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">Frosting</p>
                    <p className="font-semibold capitalize">{request.frosting_type}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">Candles</p>
                    <p className="font-semibold">{request.candles_count} {request.candle_type}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">Text</p>
                    <p className="font-semibold">{request.cake_text || 'None'}</p>
                  </div>
                </div>

                {request.special_instructions && (
                  <div className="mt-4 pt-4 border-t">
                    <p className="text-sm text-gray-500">Special Instructions</p>
                    <p className="text-gray-800 mt-1">{request.special_instructions}</p>
                  </div>
                )}

                {request.dietary_restrictions && (
                  <div className="mt-3">
                    <p className="text-sm text-gray-500">Dietary Restrictions</p>
                    <p className="text-gray-800 mt-1">{request.dietary_restrictions}</p>
                  </div>
                )}
              </CardBody>
            </Card>

            {/* Suggested Price */}
            {suggestedPrice && (
              <Card className="bg-green-50 border-2 border-green-200">
                <CardHeader className="flex justify-between">
                  <div className="flex items-center gap-2">
                    <CalculatorIcon className="w-5 h-5 text-green-600" />
                    <h3 className="font-bold text-green-800">Suggested Price</h3>
                  </div>
                  <Chip color="success" variant="flat">
                    ₱{suggestedPrice.total.toFixed(2)}
                  </Chip>
                </CardHeader>
                <Divider />
                <CardBody>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span>Base Price:</span>
                      <span>₱{suggestedPrice.base_price.toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Layers ({request.num_layers}):</span>
                      <span>₱{suggestedPrice.layers_cost.toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Decorations:</span>
                      <span>₱{suggestedPrice.decorations_cost.toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Theme:</span>
                      <span>₱{suggestedPrice.theme_cost.toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Text:</span>
                      <span>₱{suggestedPrice.text_cost.toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Frosting ({request.frosting_type}):</span>
                      <span>₱{suggestedPrice.frosting_cost.toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Special Requests:</span>
                      <span>₱{suggestedPrice.special_requests_cost.toFixed(2)}</span>
                    </div>
                    <Divider />
                    <div className="flex justify-between font-medium">
                      <span>Subtotal:</span>
                      <span>₱{suggestedPrice.subtotal.toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between text-orange-600">
                      <span>Complexity Multiplier:</span>
                      <span>×{suggestedPrice.complexity_multiplier.toFixed(2)}</span>
                    </div>
                    <Divider />
                    <div className="flex justify-between font-bold text-lg text-green-600">
                      <span>Total:</span>
                      <span>₱{suggestedPrice.total.toFixed(2)}</span>
                    </div>
                  </div>

                  <Button
                    color="success"
                    variant="flat"
                    size="sm"
                    className="w-full mt-4"
                    onPress={handleUseSuggested}
                  >
                    Use Suggested Price
                  </Button>
                </CardBody>
              </Card>
            )}

            {/* Quote Form */}
            <div className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Input
                  label="Quoted Price *"
                  type="number"
                  step="0.01"
                  min="0"
                  placeholder="0.00"
                  value={formData.quoted_price}
                  onValueChange={(value) => setFormData({ ...formData, quoted_price: value })}
                  startContent={
                    <div className="pointer-events-none flex items-center">
                      <span className="text-default-400 text-small">₱</span>
                    </div>
                  }
                  isRequired
                />

                <Input
                  label="Preparation Days *"
                  type="number"
                  min="1"
                  placeholder="3"
                  value={formData.preparation_days}
                  onValueChange={(value) => setFormData({ ...formData, preparation_days: value })}
                  startContent={<ClockIcon className="w-4 h-4 text-default-400" />}
                  isRequired
                />
              </div>

              <Textarea
                label="Quote Notes (Visible to Customer)"
                placeholder="e.g., Beautiful design! We can absolutely make this for you. The fondant work will take 3 days to complete..."
                value={formData.quote_notes}
                onValueChange={(value) => setFormData({ ...formData, quote_notes: value })}
                minRows={4}
              />

              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <p className="text-sm text-blue-800">
                  <span className="font-bold">What happens next?</span>
                  <br />
                  1. Customer receives email with quote and payment instructions
                  <br />
                  2. Customer uploads payment receipt
                  <br />
                  3. You verify payment and schedule pickup
                </p>
              </div>
            </div>
          </div>
        </ModalBody>

        <ModalFooter>
          <Button color="danger" variant="light" onPress={onCancel} isDisabled={creating}>
            Cancel
          </Button>
          <Button
            color="success"
            onPress={handleSubmit}
            isLoading={creating}
            startContent={!creating && <CheckCircleIcon className="w-5 h-5" />}
          >
            {creating ? 'Creating Quote...' : 'Create & Send Quote'}
          </Button>
        </ModalFooter>
      </ModalContent>
    </Modal>
  );
}
