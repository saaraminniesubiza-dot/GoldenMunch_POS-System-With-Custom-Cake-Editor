'use client';

import { useState } from 'react';
import { Card, CardBody, CardHeader } from '@heroui/card';
import { Button } from '@heroui/button';
import { Input } from '@heroui/input';
import { Divider } from '@heroui/divider';
import { Chip } from '@heroui/chip';
import { SettingsService } from '@/services/settings.service';
import { QrCodeIcon, CheckCircleIcon, XCircleIcon } from '@heroicons/react/24/outline';
import Image from 'next/image';

export default function PaymentQRSettingsPage() {
  const [gcashQR, setGcashQR] = useState<File | null>(null);
  const [paymayaQR, setPaymayaQR] = useState<File | null>(null);
  const [gcashPreview, setGcashPreview] = useState<string | null>(null);
  const [paymayaPreview, setPaymayaPreview] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const [success, setSuccess] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleFileSelect = (file: File, type: 'gcash' | 'paymaya') => {
    if (file && file.type.startsWith('image/')) {
      const reader = new FileReader();
      reader.onloadend = () => {
        const result = reader.result as string;
        if (type === 'gcash') {
          setGcashQR(file);
          setGcashPreview(result);
        } else {
          setPaymayaQR(file);
          setPaymayaPreview(result);
        }
      };
      reader.readAsDataURL(file);
    } else {
      setError('Please select a valid image file (PNG, JPG)');
    }
  };

  const handleUpload = async () => {
    if (!gcashQR && !paymayaQR) {
      setError('Please select at least one QR code to upload');
      return;
    }

    setUploading(true);
    setError(null);
    setSuccess(null);

    try {
      // Upload GCash QR
      if (gcashQR) {
        const formData = new FormData();
        formData.append('qr_code', gcashQR);
        formData.append('payment_method', 'gcash');

        await SettingsService.uploadPaymentQR(formData);
      }

      // Upload PayMaya QR
      if (paymayaQR) {
        const formData = new FormData();
        formData.append('qr_code', paymayaQR);
        formData.append('payment_method', 'paymaya');

        await SettingsService.uploadPaymentQR(formData);
      }

      setSuccess('QR codes uploaded successfully!');
      // Clear after successful upload
      setTimeout(() => {
        setGcashQR(null);
        setPaymayaQR(null);
        setGcashPreview(null);
        setPaymayaPreview(null);
        setSuccess(null);
      }, 3000);
    } catch (err: any) {
      console.error('Upload error:', err);
      setError(err.response?.data?.error || 'Failed to upload QR codes');
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold bg-gradient-to-r from-golden-orange to-deep-amber bg-clip-text text-transparent">
            Payment QR Codes
          </h1>
          <p className="text-default-500 mt-1">
            Upload static QR codes for GCash and PayMaya payments
          </p>
        </div>
      </div>

      {/* Instructions Card */}
      <Card className="bg-blue-50 border-2 border-blue-200">
        <CardBody>
          <div className="flex gap-3">
            <QrCodeIcon className="h-6 w-6 text-blue-600 flex-shrink-0" />
            <div>
              <h3 className="font-semibold text-blue-900 mb-2">How it works:</h3>
              <ol className="text-sm text-blue-800 space-y-1 list-decimal list-inside">
                <li>Upload your GCash and PayMaya merchant QR code images</li>
                <li>When customers select cashless payment, they'll see your QR code</li>
                <li>Customers scan with their app and complete payment</li>
                <li>Customers enter the reference number they receive</li>
                <li>You verify the payment using the reference number</li>
              </ol>
            </div>
          </div>
        </CardBody>
      </Card>

      {/* Success/Error Messages */}
      {success && (
        <Card className="bg-success-50 border-2 border-success-200">
          <CardBody>
            <div className="flex items-center gap-3">
              <CheckCircleIcon className="h-6 w-6 text-success-600" />
              <p className="text-success-700 font-semibold">{success}</p>
            </div>
          </CardBody>
        </Card>
      )}

      {error && (
        <Card className="bg-danger-50 border-2 border-danger-200">
          <CardBody>
            <div className="flex items-center gap-3">
              <XCircleIcon className="h-6 w-6 text-danger-600" />
              <p className="text-danger-700 font-semibold">{error}</p>
            </div>
          </CardBody>
        </Card>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* GCash QR Upload */}
        <Card>
          <CardHeader className="pb-3">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-blue-100 rounded-lg">
                <QrCodeIcon className="h-6 w-6 text-blue-600" />
              </div>
              <div>
                <h2 className="text-xl font-bold">GCash QR Code</h2>
                <p className="text-sm text-default-500">Upload your GCash merchant QR</p>
              </div>
            </div>
          </CardHeader>
          <Divider />
          <CardBody className="space-y-4">
            {/* Preview */}
            {gcashPreview ? (
              <div className="relative">
                <div className="aspect-square bg-default-100 rounded-lg overflow-hidden flex items-center justify-center">
                  <Image
                    src={gcashPreview}
                    alt="GCash QR Preview"
                    width={300}
                    height={300}
                    className="object-contain"
                  />
                </div>
                <Button
                  size="sm"
                  color="danger"
                  variant="flat"
                  className="absolute top-2 right-2"
                  onPress={() => {
                    setGcashQR(null);
                    setGcashPreview(null);
                  }}
                >
                  Remove
                </Button>
              </div>
            ) : (
              <div className="border-2 border-dashed border-default-300 rounded-lg p-8 text-center">
                <QrCodeIcon className="h-16 w-16 mx-auto text-default-400 mb-4" />
                <p className="text-sm text-default-500 mb-4">
                  No QR code uploaded yet
                </p>
                <Input
                  type="file"
                  accept="image/*"
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (file) handleFileSelect(file, 'gcash');
                  }}
                  className="max-w-xs mx-auto"
                />
              </div>
            )}

            <div className="bg-warning-50 p-3 rounded-lg">
              <p className="text-xs text-warning-700">
                <strong>Note:</strong> This QR code will be displayed to all customers selecting GCash payment.
                Make sure it's your merchant QR code that accepts payments to your account.
              </p>
            </div>
          </CardBody>
        </Card>

        {/* PayMaya QR Upload */}
        <Card>
          <CardHeader className="pb-3">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-green-100 rounded-lg">
                <QrCodeIcon className="h-6 w-6 text-green-600" />
              </div>
              <div>
                <h2 className="text-xl font-bold">PayMaya QR Code</h2>
                <p className="text-sm text-default-500">Upload your PayMaya merchant QR</p>
              </div>
            </div>
          </CardHeader>
          <Divider />
          <CardBody className="space-y-4">
            {/* Preview */}
            {paymayaPreview ? (
              <div className="relative">
                <div className="aspect-square bg-default-100 rounded-lg overflow-hidden flex items-center justify-center">
                  <Image
                    src={paymayaPreview}
                    alt="PayMaya QR Preview"
                    width={300}
                    height={300}
                    className="object-contain"
                  />
                </div>
                <Button
                  size="sm"
                  color="danger"
                  variant="flat"
                  className="absolute top-2 right-2"
                  onPress={() => {
                    setPaymayaQR(null);
                    setPaymayaPreview(null);
                  }}
                >
                  Remove
                </Button>
              </div>
            ) : (
              <div className="border-2 border-dashed border-default-300 rounded-lg p-8 text-center">
                <QrCodeIcon className="h-16 w-16 mx-auto text-default-400 mb-4" />
                <p className="text-sm text-default-500 mb-4">
                  No QR code uploaded yet
                </p>
                <Input
                  type="file"
                  accept="image/*"
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (file) handleFileSelect(file, 'paymaya');
                  }}
                  className="max-w-xs mx-auto"
                />
              </div>
            )}

            <div className="bg-warning-50 p-3 rounded-lg">
              <p className="text-xs text-warning-700">
                <strong>Note:</strong> This QR code will be displayed to all customers selecting PayMaya payment.
                Make sure it's your merchant QR code that accepts payments to your account.
              </p>
            </div>
          </CardBody>
        </Card>
      </div>

      {/* Upload Button */}
      <div className="flex justify-end">
        <Button
          size="lg"
          color="primary"
          isLoading={uploading}
          isDisabled={!gcashQR && !paymayaQR}
          onPress={handleUpload}
          startContent={!uploading && <CheckCircleIcon className="h-5 w-5" />}
        >
          {uploading ? 'Uploading...' : 'Save QR Codes'}
        </Button>
      </div>

      {/* Current QR Codes Info */}
      <Card>
        <CardHeader>
          <h3 className="text-lg font-semibold">Current Configuration</h3>
        </CardHeader>
        <Divider />
        <CardBody>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <p className="text-sm text-default-500 mb-2">GCash Status:</p>
              <Chip color="warning" variant="flat">
                Check settings for current status
              </Chip>
            </div>
            <div>
              <p className="text-sm text-default-500 mb-2">PayMaya Status:</p>
              <Chip color="warning" variant="flat">
                Check settings for current status
              </Chip>
            </div>
          </div>
          <p className="text-xs text-default-400 mt-4">
            QR codes are stored in the database and served to the kiosk when customers select cashless payment.
          </p>
        </CardBody>
      </Card>
    </div>
  );
}
