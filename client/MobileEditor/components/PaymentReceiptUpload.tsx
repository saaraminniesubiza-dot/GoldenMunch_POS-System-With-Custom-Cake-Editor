/**
 * Payment Receipt Upload Component
 * Allows customers to upload payment receipts for verification
 */

'use client';

import React, { useState, useRef, ChangeEvent } from 'react';
import { Card, CardBody, CardHeader } from '@nextui-org/card';
import { Button } from '@nextui-org/button';
import { Input } from '@nextui-org/input';
import { Select, SelectItem } from '@nextui-org/select';
import { Textarea } from '@nextui-org/input';
import { Divider } from '@nextui-org/divider';
import {
  ArrowUpTrayIcon,
  XMarkIcon,
  CheckCircleIcon,
  PhotoIcon,
} from '@heroicons/react/24/outline';

interface PaymentReceiptUploadProps {
  trackingCode: string;
  quotedPrice?: number;
  onSuccess: () => void;
  onCancel: () => void;
}

const PAYMENT_METHODS = [
  { value: 'gcash', label: 'GCash' },
  { value: 'paymaya', label: 'PayMaya' },
  { value: 'bank_transfer', label: 'Bank Transfer' },
  { value: 'cash', label: 'Cash' },
  { value: 'other', label: 'Other' },
];

export default function PaymentReceiptUpload({
  trackingCode,
  quotedPrice,
  onSuccess,
  onCancel,
}: PaymentReceiptUploadProps) {
  const [uploading, setUploading] = useState(false);
  const [dragActive, setDragActive] = useState(false);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [receiptFile, setReceiptFile] = useState<string | null>(null);

  const [formData, setFormData] = useState({
    payment_amount: quotedPrice?.toString() || '',
    payment_method: 'gcash',
    payment_reference: '',
    payment_date: new Date().toISOString().split('T')[0],
    customer_notes: '',
  });

  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true);
    } else if (e.type === 'dragleave') {
      setDragActive(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);

    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFile(e.dataTransfer.files[0]);
    }
  };

  const handleFileInput = (e: ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      handleFile(e.target.files[0]);
    }
  };

  const handleFile = async (file: File) => {
    // Validate file type
    if (!file.type.startsWith('image/')) {
      alert('Please upload an image file');
      return;
    }

    // Validate file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      alert('File size must be less than 5MB');
      return;
    }

    try {
      // Create preview
      const preview = URL.createObjectURL(file);
      setPreviewUrl(preview);

      // Compress and convert to base64
      const compressed = await compressImage(file);
      setReceiptFile(compressed);
    } catch (error) {
      console.error('Failed to process image:', error);
      alert('Failed to process image');
    }
  };

  const compressImage = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = (event) => {
        const img = new Image();
        img.src = event.target?.result as string;
        img.onload = () => {
          const canvas = document.createElement('canvas');
          let width = img.width;
          let height = img.height;

          // Resize if too large
          const MAX_WIDTH = 1200;
          const MAX_HEIGHT = 1200;

          if (width > height) {
            if (width > MAX_WIDTH) {
              height *= MAX_WIDTH / width;
              width = MAX_WIDTH;
            }
          } else {
            if (height > MAX_HEIGHT) {
              width *= MAX_HEIGHT / height;
              height = MAX_HEIGHT;
            }
          }

          canvas.width = width;
          canvas.height = height;

          const ctx = canvas.getContext('2d');
          ctx?.drawImage(img, 0, 0, width, height);

          // Compress to JPEG with 0.8 quality
          const dataUrl = canvas.toDataURL('image/jpeg', 0.8);
          resolve(dataUrl);
        };
        img.onerror = reject;
      };
      reader.onerror = reject;
    });
  };

  const handleRemoveImage = () => {
    setPreviewUrl(null);
    setReceiptFile(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleSubmit = async () => {
    // Validation
    if (!receiptFile) {
      alert('Please upload a receipt image');
      return;
    }

    if (!formData.payment_amount || parseFloat(formData.payment_amount) <= 0) {
      alert('Please enter a valid payment amount');
      return;
    }

    if (!formData.payment_method) {
      alert('Please select a payment method');
      return;
    }

    if (!formData.payment_reference.trim()) {
      alert('Please enter a payment reference number');
      return;
    }

    try {
      setUploading(true);

      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api'}/custom-cake/payment/upload-receipt`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            tracking_code: trackingCode,
            payment_amount: parseFloat(formData.payment_amount),
            payment_method: formData.payment_method,
            payment_reference: formData.payment_reference,
            payment_date: formData.payment_date,
            receipt_file: receiptFile,
            customer_notes: formData.customer_notes,
          }),
        }
      );

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ error: 'Unknown error' }));
        throw new Error(errorData.error || 'Failed to upload receipt');
      }

      const result = await response.json();

      if (result.success) {
        alert('✅ Payment receipt uploaded successfully!\n\nWe will verify your payment and contact you shortly.');
        onSuccess();
      } else {
        throw new Error('Invalid response from server');
      }
    } catch (error: any) {
      console.error('Failed to upload receipt:', error);
      alert(`❌ Failed to upload receipt: ${error.message || 'Unknown error'}\n\nPlease try again.`);
    } finally {
      setUploading(false);
    }
  };

  return (
    <Card className="shadow-lg">
      <CardHeader className="bg-gradient-to-r from-green-500 to-emerald-500 text-white">
        <h3 className="text-lg font-bold">Upload Payment Receipt</h3>
      </CardHeader>
      <Divider />
      <CardBody className="p-6">
        {/* File Upload Area */}
        <div className="mb-6">
          <label className="block text-sm font-medium text-gray-700 mb-2">Receipt Image *</label>

          {!previewUrl ? (
            <div
              className={`border-2 border-dashed rounded-lg p-8 text-center cursor-pointer transition-colors ${
                dragActive
                  ? 'border-primary bg-primary-50'
                  : 'border-gray-300 hover:border-primary hover:bg-gray-50'
              }`}
              onDragEnter={handleDrag}
              onDragLeave={handleDrag}
              onDragOver={handleDrag}
              onDrop={handleDrop}
              onClick={() => fileInputRef.current?.click()}
            >
              <PhotoIcon className="w-12 h-12 mx-auto text-gray-400 mb-3" />
              <p className="text-gray-600 mb-2">
                <span className="font-semibold text-primary">Click to upload</span> or drag and drop
              </p>
              <p className="text-sm text-gray-500">PNG, JPG, JPEG up to 5MB</p>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                onChange={handleFileInput}
                className="hidden"
              />
            </div>
          ) : (
            <div className="relative">
              <img
                src={previewUrl}
                alt="Receipt preview"
                className="w-full h-64 object-contain bg-gray-100 rounded-lg"
              />
              <Button
                isIconOnly
                color="danger"
                size="sm"
                className="absolute top-2 right-2"
                onPress={handleRemoveImage}
              >
                <XMarkIcon className="w-4 h-4" />
              </Button>
            </div>
          )}
        </div>

        {/* Payment Details Form */}
        <div className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Payment Amount */}
            <Input
              label="Payment Amount *"
              type="number"
              step="0.01"
              min="0"
              placeholder="0.00"
              value={formData.payment_amount}
              onValueChange={(value) => setFormData({ ...formData, payment_amount: value })}
              startContent={
                <div className="pointer-events-none flex items-center">
                  <span className="text-default-400 text-small">₱</span>
                </div>
              }
              isRequired
            />

            {/* Payment Method */}
            <Select
              label="Payment Method *"
              placeholder="Select method"
              selectedKeys={[formData.payment_method]}
              onChange={(e) => setFormData({ ...formData, payment_method: e.target.value })}
              isRequired
            >
              {PAYMENT_METHODS.map((method) => (
                <SelectItem key={method.value} value={method.value}>
                  {method.label}
                </SelectItem>
              ))}
            </Select>

            {/* Payment Reference */}
            <Input
              label="Reference Number *"
              placeholder="e.g., GCash-12345678"
              value={formData.payment_reference}
              onValueChange={(value) => setFormData({ ...formData, payment_reference: value })}
              isRequired
            />

            {/* Payment Date */}
            <Input
              label="Payment Date *"
              type="date"
              value={formData.payment_date}
              onValueChange={(value) => setFormData({ ...formData, payment_date: value })}
              isRequired
            />
          </div>

          {/* Customer Notes */}
          <Textarea
            label="Additional Notes (Optional)"
            placeholder="Any additional information about your payment..."
            value={formData.customer_notes}
            onValueChange={(value) => setFormData({ ...formData, customer_notes: value })}
            minRows={3}
          />

          {/* Info Box */}
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <p className="text-sm text-blue-800">
              <span className="font-bold">What happens next?</span>
              <br />
              1. We'll verify your payment receipt within 24 hours
              <br />
              2. You'll receive a confirmation email
              <br />
              3. Once verified, we'll schedule your pickup date
            </p>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex gap-3 mt-6">
          <Button color="danger" variant="light" onPress={onCancel} isDisabled={uploading}>
            Cancel
          </Button>
          <Button
            color="success"
            onPress={handleSubmit}
            isLoading={uploading}
            isDisabled={!receiptFile}
            startContent={!uploading && <CheckCircleIcon className="w-5 h-5" />}
            className="flex-1"
          >
            {uploading ? 'Uploading...' : 'Submit Receipt'}
          </Button>
        </div>
      </CardBody>
    </Card>
  );
}
