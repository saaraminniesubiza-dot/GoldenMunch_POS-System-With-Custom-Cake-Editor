/**
 * Customer Tracking Portal
 * Allows customers to track their custom cake order status
 */

'use client';

import React, { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import { Card, CardBody, CardHeader } from '@nextui-org/card';
import { Button } from '@nextui-org/button';
import { Spinner } from '@nextui-org/spinner';
import { Chip } from '@nextui-org/chip';
import { Divider } from '@nextui-org/divider';
import {
  CheckCircleIcon,
  ClockIcon,
  CurrencyDollarIcon,
  CalendarIcon,
  XCircleIcon,
  ExclamationTriangleIcon,
  ArrowUpTrayIcon,
  CakeIcon,
} from '@heroicons/react/24/outline';
import dynamic from 'next/dynamic';

// Dynamic import for PaymentReceiptUpload
const PaymentReceiptUpload = dynamic(() => import('@/components/PaymentReceiptUpload'), {
  ssr: false,
  loading: () => <Spinner />,
});

interface TrackingData {
  tracking_code: string;
  request: any;
  current_status: string;
  status_history: any[];
  receipts: any[];
  timeline: any[];
  can_upload_receipt: boolean;
  can_cancel: boolean;
}

// Status configuration
const STATUS_CONFIG: Record<string, { label: string; color: string; icon: any; description: string }> = {
  draft: {
    label: 'Draft',
    color: 'default',
    icon: ClockIcon,
    description: 'Design in progress',
  },
  pending_review: {
    label: 'Pending Review',
    color: 'warning',
    icon: ClockIcon,
    description: 'Waiting for admin review',
  },
  quoted: {
    label: 'Quoted',
    color: 'primary',
    icon: CurrencyDollarIcon,
    description: 'Price quote sent - awaiting payment',
  },
  payment_pending_verification: {
    label: 'Payment Submitted',
    color: 'secondary',
    icon: ClockIcon,
    description: 'Payment receipt uploaded - under verification',
  },
  payment_verified: {
    label: 'Payment Verified',
    color: 'success',
    icon: CheckCircleIcon,
    description: 'Payment confirmed',
  },
  scheduled: {
    label: 'Scheduled',
    color: 'success',
    icon: CalendarIcon,
    description: 'Pickup date scheduled',
  },
  in_production: {
    label: 'In Production',
    color: 'warning',
    icon: CakeIcon,
    description: 'Your cake is being made',
  },
  ready_for_pickup: {
    label: 'Ready for Pickup',
    color: 'success',
    icon: CheckCircleIcon,
    description: 'Your cake is ready!',
  },
  completed: {
    label: 'Completed',
    color: 'success',
    icon: CheckCircleIcon,
    description: 'Order completed',
  },
  cancelled: {
    label: 'Cancelled',
    color: 'danger',
    icon: XCircleIcon,
    description: 'Order cancelled',
  },
  rejected: {
    label: 'Rejected',
    color: 'danger',
    icon: XCircleIcon,
    description: 'Order rejected',
  },
  revision_requested: {
    label: 'Revision Requested',
    color: 'warning',
    icon: ExclamationTriangleIcon,
    description: 'Changes requested',
  },
};

export default function TrackingPage() {
  const params = useParams();
  const trackingCode = params?.trackingCode as string;

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [data, setData] = useState<TrackingData | null>(null);
  const [showPaymentUpload, setShowPaymentUpload] = useState(false);
  const [cancelling, setCancelling] = useState(false);

  useEffect(() => {
    if (trackingCode) {
      fetchTrackingInfo();
    }
  }, [trackingCode]);

  const fetchTrackingInfo = async () => {
    try {
      setLoading(true);
      setError(null);

      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api'}/custom-cake/track/${trackingCode}`
      );

      if (!response.ok) {
        if (response.status === 404) {
          throw new Error('Tracking code not found');
        }
        throw new Error('Failed to fetch tracking information');
      }

      const result = await response.json();

      if (result.success && result.data) {
        setData(result.data);
      } else {
        throw new Error('Invalid response from server');
      }
    } catch (err: any) {
      console.error('Failed to fetch tracking info:', err);
      setError(err.message || 'Unknown error occurred');
    } finally {
      setLoading(false);
    }
  };

  const handleCancelOrder = async () => {
    if (!confirm('Are you sure you want to cancel this order?')) {
      return;
    }

    const reason = prompt('Please provide a reason for cancellation (optional):');

    try {
      setCancelling(true);

      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api'}/custom-cake/${trackingCode}/cancel`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            cancellation_reason: reason || 'Customer requested cancellation',
          }),
        }
      );

      if (!response.ok) {
        throw new Error('Failed to cancel order');
      }

      // Refresh tracking info
      await fetchTrackingInfo();

      alert('Order cancelled successfully');
    } catch (err: any) {
      console.error('Failed to cancel order:', err);
      alert(`Failed to cancel order: ${err.message || 'Unknown error'}`);
    } finally {
      setCancelling(false);
    }
  };

  const handlePaymentUploaded = () => {
    setShowPaymentUpload(false);
    fetchTrackingInfo(); // Refresh data
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-amber-50 to-orange-100">
        <div className="text-center">
          <Spinner size="lg" color="warning" />
          <p className="mt-4 text-gray-600">Loading tracking information...</p>
        </div>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-red-50 to-red-100 p-4">
        <Card className="max-w-md">
          <CardBody className="text-center p-8">
            <div className="w-20 h-20 mx-auto mb-6 bg-red-100 rounded-full flex items-center justify-center">
              <XCircleIcon className="w-12 h-12 text-red-600" />
            </div>
            <h1 className="text-2xl font-bold text-gray-800 mb-3">Tracking Not Found</h1>
            <p className="text-gray-600 mb-6">
              {error || 'Could not find order with this tracking code.'}
            </p>
            <p className="text-sm text-gray-500 mb-6">
              Tracking Code: <span className="font-mono font-bold">{trackingCode}</span>
            </p>
            <Button color="primary" onClick={() => (window.location.href = '/')}>
              Return Home
            </Button>
          </CardBody>
        </Card>
      </div>
    );
  }

  const statusConfig = STATUS_CONFIG[data.current_status] || STATUS_CONFIG.pending_review;
  const StatusIcon = statusConfig.icon;

  return (
    <div className="min-h-screen bg-gradient-to-br from-amber-50 via-orange-50 to-pink-50 py-8 px-4">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-800 mb-2">🎂 Order Tracking</h1>
          <p className="text-lg text-gray-600">
            Tracking Code:{' '}
            <span className="font-mono font-bold text-amber-600">{data.tracking_code}</span>
          </p>
        </div>

        {/* Current Status Card */}
        <Card className="mb-6 shadow-lg">
          <CardHeader className="bg-gradient-to-r from-amber-500 to-orange-500 text-white pb-6">
            <div className="w-full text-center">
              <div className="inline-flex items-center justify-center w-16 h-16 bg-white rounded-full mb-3">
                <StatusIcon className="w-8 h-8 text-amber-600" />
              </div>
              <h2 className="text-2xl font-bold">{statusConfig.label}</h2>
              <p className="text-amber-50 mt-2">{statusConfig.description}</p>
            </div>
          </CardHeader>
          <CardBody className="p-6">
            {/* Quote Information */}
            {data.request.quoted_price && (
              <div className="bg-green-50 border-2 border-green-200 rounded-lg p-4 mb-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-600">Quoted Price</p>
                    <p className="text-3xl font-bold text-green-600">
                      ₱{Number(data.request.quoted_price).toFixed(2)}
                    </p>
                    {data.request.preparation_days && (
                      <p className="text-sm text-gray-500 mt-1">
                        Preparation time: {data.request.preparation_days} days
                      </p>
                    )}
                  </div>
                  {data.request.quote_notes && (
                    <div className="text-right max-w-xs">
                      <p className="text-sm text-gray-600 mb-1">Admin Notes:</p>
                      <p className="text-sm text-gray-700 italic">"{data.request.quote_notes}"</p>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Pickup Schedule */}
            {data.request.scheduled_pickup_date && (
              <div className="bg-blue-50 border-2 border-blue-200 rounded-lg p-4 mb-4">
                <div className="flex items-center gap-3">
                  <CalendarIcon className="w-8 h-8 text-blue-600" />
                  <div>
                    <p className="text-sm text-gray-600">Scheduled Pickup</p>
                    <p className="text-lg font-bold text-blue-600">
                      {new Date(data.request.scheduled_pickup_date).toLocaleDateString()} at{' '}
                      {data.request.scheduled_pickup_time || 'TBD'}
                    </p>
                  </div>
                </div>
              </div>
            )}

            {/* Payment Upload Section */}
            {data.can_upload_receipt && !showPaymentUpload && (
              <div className="bg-amber-50 border-2 border-amber-200 rounded-lg p-4 mb-4">
                <div className="flex items-start justify-between">
                  <div className="flex items-start gap-3">
                    <ArrowUpTrayIcon className="w-6 h-6 text-amber-600 mt-1" />
                    <div>
                      <h3 className="font-bold text-amber-900">Payment Required</h3>
                      <p className="text-sm text-amber-800 mt-1">
                        Please upload your payment receipt to proceed with your order
                      </p>
                    </div>
                  </div>
                  <Button
                    color="warning"
                    size="sm"
                    onPress={() => setShowPaymentUpload(true)}
                    startContent={<ArrowUpTrayIcon className="w-4 h-4" />}
                  >
                    Upload Receipt
                  </Button>
                </div>
              </div>
            )}

            {/* Payment Upload Component */}
            {showPaymentUpload && (
              <div className="mb-4">
                <PaymentReceiptUpload
                  trackingCode={data.tracking_code}
                  quotedPrice={data.request.quoted_price}
                  onSuccess={handlePaymentUploaded}
                  onCancel={() => setShowPaymentUpload(false)}
                />
              </div>
            )}

            {/* Cancel Button */}
            {data.can_cancel && (
              <div className="mt-4">
                <Button
                  color="danger"
                  variant="bordered"
                  size="sm"
                  onPress={handleCancelOrder}
                  isLoading={cancelling}
                  startContent={<XCircleIcon className="w-4 h-4" />}
                >
                  Cancel Order
                </Button>
              </div>
            )}
          </CardBody>
        </Card>

        {/* Timeline */}
        <Card className="mb-6 shadow-lg">
          <CardHeader className="pb-3">
            <h3 className="text-xl font-bold text-gray-800">Order Timeline</h3>
          </CardHeader>
          <Divider />
          <CardBody>
            <div className="space-y-4">
              {data.status_history && data.status_history.length > 0 ? (
                data.status_history.map((item: any, index: number) => {
                  const itemConfig = STATUS_CONFIG[item.new_status] || STATUS_CONFIG.pending_review;
                  const ItemIcon = itemConfig.icon;

                  return (
                    <div key={index} className="flex gap-4">
                      <div className="flex flex-col items-center">
                        <div className="w-10 h-10 rounded-full bg-gray-100 flex items-center justify-center">
                          <ItemIcon className="w-5 h-5 text-gray-600" />
                        </div>
                        {index < data.status_history.length - 1 && (
                          <div className="w-0.5 h-12 bg-gray-200 my-2"></div>
                        )}
                      </div>
                      <div className="flex-1 pb-4">
                        <p className="font-semibold text-gray-800">{itemConfig.label}</p>
                        <p className="text-sm text-gray-500">
                          {new Date(item.changed_at).toLocaleString()}
                        </p>
                        {item.notes && <p className="text-sm text-gray-600 mt-1">{item.notes}</p>}
                      </div>
                    </div>
                  );
                })
              ) : (
                <p className="text-gray-500 text-center py-4">No status history available</p>
              )}
            </div>
          </CardBody>
        </Card>

        {/* Order Details */}
        <Card className="shadow-lg">
          <CardHeader className="pb-3">
            <h3 className="text-xl font-bold text-gray-800">Order Details</h3>
          </CardHeader>
          <Divider />
          <CardBody>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <p className="text-sm text-gray-500">Customer Name</p>
                <p className="font-semibold text-gray-800">{data.request.customer_name}</p>
              </div>
              <div>
                <p className="text-sm text-gray-500">Email</p>
                <p className="font-semibold text-gray-800">{data.request.customer_email}</p>
              </div>
              <div>
                <p className="text-sm text-gray-500">Phone</p>
                <p className="font-semibold text-gray-800">{data.request.customer_phone}</p>
              </div>
              <div>
                <p className="text-sm text-gray-500">Number of Layers</p>
                <p className="font-semibold text-gray-800">{data.request.num_layers || 1}</p>
              </div>
              <div>
                <p className="text-sm text-gray-500">Frosting Type</p>
                <p className="font-semibold text-gray-800 capitalize">
                  {data.request.frosting_type || 'N/A'}
                </p>
              </div>
              <div>
                <p className="text-sm text-gray-500">Submitted</p>
                <p className="font-semibold text-gray-800">
                  {data.request.submitted_at
                    ? new Date(data.request.submitted_at).toLocaleDateString()
                    : 'N/A'}
                </p>
              </div>
            </div>

            {data.request.special_instructions && (
              <div className="mt-4 pt-4 border-t">
                <p className="text-sm text-gray-500">Special Instructions</p>
                <p className="text-gray-800 mt-1">{data.request.special_instructions}</p>
              </div>
            )}
          </CardBody>
        </Card>

        {/* Payment Receipts */}
        {data.receipts && data.receipts.length > 0 && (
          <Card className="mt-6 shadow-lg">
            <CardHeader className="pb-3">
              <h3 className="text-xl font-bold text-gray-800">Payment Receipts</h3>
            </CardHeader>
            <Divider />
            <CardBody>
              <div className="space-y-3">
                {data.receipts.map((receipt: any) => (
                  <div
                    key={receipt.receipt_id}
                    className="flex items-center justify-between p-3 bg-gray-50 rounded-lg"
                  >
                    <div>
                      <p className="font-semibold text-gray-800">
                        ₱{Number(receipt.payment_amount).toFixed(2)}
                      </p>
                      <p className="text-sm text-gray-500">
                        {receipt.payment_method} - {new Date(receipt.uploaded_at).toLocaleString()}
                      </p>
                    </div>
                    <Chip
                      color={
                        receipt.verification_status === 'approved'
                          ? 'success'
                          : receipt.verification_status === 'rejected'
                          ? 'danger'
                          : 'warning'
                      }
                      size="sm"
                    >
                      {receipt.verification_status}
                    </Chip>
                  </div>
                ))}
              </div>
            </CardBody>
          </Card>
        )}
      </div>
    </div>
  );
}
