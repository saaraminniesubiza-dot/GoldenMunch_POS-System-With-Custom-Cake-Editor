/**
 * Payment Verification Component
 * Allows admin to view and verify payment receipts
 */

'use client';

import React, { useState, useEffect } from 'react';
import { Card, CardBody, CardHeader } from '@nextui-org/card';
import { Button } from '@nextui-org/button';
import { Textarea } from '@nextui-org/input';
import { Divider } from '@nextui-org/divider';
import { Chip } from '@nextui-org/chip';
import { Modal, ModalContent, ModalHeader, ModalBody, ModalFooter } from '@nextui-org/modal';
import { Spinner } from '@nextui-org/spinner';
import {
  CheckCircleIcon,
  XMarkIcon,
  MagnifyingGlassIcon,
  ArrowPathIcon,
} from '@heroicons/react/24/outline';

interface PaymentVerificationProps {
  requestId: number;
  onSuccess: () => void;
  onCancel: () => void;
  isOpen: boolean;
}

interface PaymentReceipt {
  receipt_id: number;
  request_id: number;
  receipt_url: string;
  payment_amount: number;
  payment_method: string;
  payment_reference: string;
  payment_date: string;
  verification_status: string;
  customer_notes?: string;
  verification_notes?: string;
  is_primary: boolean;
  uploaded_at: string;
  verified_at?: string;
  verified_by?: number;
}

export default function PaymentVerification({
  requestId,
  onSuccess,
  onCancel,
  isOpen,
}: PaymentVerificationProps) {
  const [loading, setLoading] = useState(false);
  const [receipts, setReceipts] = useState<PaymentReceipt[]>([]);
  const [selectedReceipt, setSelectedReceipt] = useState<PaymentReceipt | null>(null);
  const [verifying, setVerifying] = useState(false);
  const [verificationNotes, setVerificationNotes] = useState('');
  const [imageZoom, setImageZoom] = useState(1);

  useEffect(() => {
    if (isOpen && requestId) {
      fetchReceipts();
    }
  }, [isOpen, requestId]);

  const fetchReceipts = async () => {
    try {
      setLoading(true);

      const token = localStorage.getItem('adminToken') || sessionStorage.getItem('adminToken');

      if (!token) {
        alert('Admin authentication required');
        return;
      }

      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api'}/admin/custom-cakes/${requestId}/receipts`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      if (!response.ok) {
        throw new Error('Failed to fetch receipts');
      }

      const result = await response.json();

      if (result.success && result.data) {
        setReceipts(result.data);

        // Auto-select first pending receipt
        const pendingReceipt = result.data.find((r: PaymentReceipt) => r.verification_status === 'pending');
        if (pendingReceipt) {
          setSelectedReceipt(pendingReceipt);
        } else if (result.data.length > 0) {
          setSelectedReceipt(result.data[0]);
        }
      }
    } catch (error: any) {
      console.error('Failed to fetch receipts:', error);
      alert(`Failed to fetch receipts: ${error.message || 'Unknown error'}`);
    } finally {
      setLoading(false);
    }
  };

  const handleVerify = async (approved: boolean) => {
    if (!selectedReceipt) return;

    if (approved && !verificationNotes.trim()) {
      if (!confirm('No verification notes provided. Continue anyway?')) {
        return;
      }
    }

    if (!approved && !verificationNotes.trim()) {
      alert('Please provide a reason for rejection');
      return;
    }

    try {
      setVerifying(true);

      const token = localStorage.getItem('adminToken') || sessionStorage.getItem('adminToken');

      if (!token) {
        alert('Admin authentication required');
        return;
      }

      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api'}/admin/custom-cakes/${requestId}/verify-payment`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            receipt_id: selectedReceipt.receipt_id,
            approved,
            verification_notes: verificationNotes,
          }),
        }
      );

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ error: 'Unknown error' }));
        throw new Error(errorData.error || 'Failed to verify payment');
      }

      const result = await response.json();

      if (result.success) {
        alert(
          approved
            ? '✅ Payment approved successfully!\n\nCustomer will be notified.'
            : '❌ Payment rejected.\n\nCustomer will be notified to upload a new receipt.'
        );
        onSuccess();
      } else {
        throw new Error('Invalid response from server');
      }
    } catch (error: any) {
      console.error('Failed to verify payment:', error);
      alert(`❌ Failed to verify payment: ${error.message || 'Unknown error'}`);
    } finally {
      setVerifying(false);
    }
  };

  if (!isOpen) return null;

  return (
    <Modal isOpen={isOpen} onClose={onCancel} size="5xl" scrollBehavior="inside">
      <ModalContent>
        <ModalHeader className="flex flex-col gap-1">
          <h2 className="text-2xl font-bold">Payment Verification</h2>
          <p className="text-sm text-gray-500">Request #{requestId}</p>
        </ModalHeader>

        <ModalBody>
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <Spinner size="lg" />
            </div>
          ) : receipts.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-gray-500">No payment receipts uploaded yet</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Receipt List */}
              <div className="lg:col-span-1">
                <h3 className="font-bold mb-3">Receipts ({receipts.length})</h3>
                <div className="space-y-2">
                  {receipts.map((receipt) => (
                    <Card
                      key={receipt.receipt_id}
                      isPressable
                      isHoverable
                      className={`cursor-pointer ${
                        selectedReceipt?.receipt_id === receipt.receipt_id
                          ? 'border-2 border-primary bg-primary-50'
                          : ''
                      }`}
                      onPress={() => {
                        setSelectedReceipt(receipt);
                        setImageZoom(1);
                        setVerificationNotes(receipt.verification_notes || '');
                      }}
                    >
                      <CardBody className="p-3">
                        <div className="flex justify-between items-start mb-2">
                          <p className="font-bold text-lg">₱{receipt.payment_amount.toFixed(2)}</p>
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
                        <p className="text-sm text-gray-600">{receipt.payment_method}</p>
                        <p className="text-xs text-gray-500 mt-1">
                          {new Date(receipt.uploaded_at).toLocaleDateString()}
                        </p>
                        {receipt.is_primary && (
                          <Chip color="primary" size="sm" className="mt-2">
                            Primary
                          </Chip>
                        )}
                      </CardBody>
                    </Card>
                  ))}
                </div>
              </div>

              {/* Receipt Details */}
              {selectedReceipt && (
                <div className="lg:col-span-2">
                  <div className="space-y-4">
                    {/* Receipt Image */}
                    <Card>
                      <CardHeader className="flex justify-between">
                        <h3 className="font-bold">Receipt Image</h3>
                        <div className="flex gap-2">
                          <Button
                            isIconOnly
                            size="sm"
                            variant="flat"
                            onPress={() => setImageZoom(Math.max(0.5, imageZoom - 0.25))}
                          >
                            -
                          </Button>
                          <span className="text-sm px-2 py-1">{Math.round(imageZoom * 100)}%</span>
                          <Button
                            isIconOnly
                            size="sm"
                            variant="flat"
                            onPress={() => setImageZoom(Math.min(3, imageZoom + 0.25))}
                          >
                            +
                          </Button>
                          <Button
                            isIconOnly
                            size="sm"
                            variant="flat"
                            onPress={() => setImageZoom(1)}
                          >
                            <ArrowPathIcon className="w-4 h-4" />
                          </Button>
                        </div>
                      </CardHeader>
                      <Divider />
                      <CardBody>
                        <div className="overflow-auto max-h-96">
                          <img
                            src={selectedReceipt.receipt_url}
                            alt="Payment receipt"
                            className="w-full"
                            style={{ transform: `scale(${imageZoom})` }}
                          />
                        </div>
                      </CardBody>
                    </Card>

                    {/* Payment Details */}
                    <Card>
                      <CardHeader>
                        <h3 className="font-bold">Payment Details</h3>
                      </CardHeader>
                      <Divider />
                      <CardBody>
                        <div className="grid grid-cols-2 gap-4">
                          <div>
                            <p className="text-sm text-gray-500">Amount</p>
                            <p className="font-bold text-lg">₱{selectedReceipt.payment_amount.toFixed(2)}</p>
                          </div>
                          <div>
                            <p className="text-sm text-gray-500">Method</p>
                            <p className="font-semibold capitalize">{selectedReceipt.payment_method}</p>
                          </div>
                          <div>
                            <p className="text-sm text-gray-500">Reference Number</p>
                            <p className="font-semibold font-mono text-sm">{selectedReceipt.payment_reference}</p>
                          </div>
                          <div>
                            <p className="text-sm text-gray-500">Payment Date</p>
                            <p className="font-semibold">
                              {new Date(selectedReceipt.payment_date).toLocaleDateString()}
                            </p>
                          </div>
                          <div>
                            <p className="text-sm text-gray-500">Uploaded</p>
                            <p className="font-semibold text-sm">
                              {new Date(selectedReceipt.uploaded_at).toLocaleString()}
                            </p>
                          </div>
                          {selectedReceipt.verified_at && (
                            <div>
                              <p className="text-sm text-gray-500">Verified</p>
                              <p className="font-semibold text-sm">
                                {new Date(selectedReceipt.verified_at).toLocaleString()}
                              </p>
                            </div>
                          )}
                        </div>

                        {selectedReceipt.customer_notes && (
                          <div className="mt-4 pt-4 border-t">
                            <p className="text-sm text-gray-500">Customer Notes</p>
                            <p className="text-gray-800 mt-1">{selectedReceipt.customer_notes}</p>
                          </div>
                        )}
                      </CardBody>
                    </Card>

                    {/* Verification Form */}
                    {selectedReceipt.verification_status === 'pending' && (
                      <Card className="bg-amber-50 border-2 border-amber-200">
                        <CardHeader>
                          <h3 className="font-bold text-amber-900">Verification Decision</h3>
                        </CardHeader>
                        <Divider />
                        <CardBody>
                          <Textarea
                            label="Verification Notes"
                            placeholder="e.g., Payment verified. Receipt matches quoted amount..."
                            value={verificationNotes}
                            onValueChange={setVerificationNotes}
                            minRows={3}
                            className="mb-4"
                          />

                          <div className="flex gap-3">
                            <Button
                              color="danger"
                              variant="bordered"
                              onPress={() => handleVerify(false)}
                              isLoading={verifying}
                              startContent={!verifying && <XMarkIcon className="w-5 h-5" />}
                              className="flex-1"
                            >
                              Reject
                            </Button>
                            <Button
                              color="success"
                              onPress={() => handleVerify(true)}
                              isLoading={verifying}
                              startContent={!verifying && <CheckCircleIcon className="w-5 h-5" />}
                              className="flex-1"
                            >
                              Approve
                            </Button>
                          </div>

                          <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 mt-4">
                            <p className="text-xs text-blue-800">
                              <span className="font-bold">Approve:</span> Payment is valid, proceed to scheduling
                              <br />
                              <span className="font-bold">Reject:</span> Customer will be asked to upload a new receipt
                            </p>
                          </div>
                        </CardBody>
                      </Card>
                    )}

                    {/* Already Verified */}
                    {selectedReceipt.verification_status !== 'pending' && (
                      <Card
                        className={
                          selectedReceipt.verification_status === 'approved'
                            ? 'bg-green-50 border-2 border-green-200'
                            : 'bg-red-50 border-2 border-red-200'
                        }
                      >
                        <CardBody>
                          <div className="flex items-center gap-3">
                            {selectedReceipt.verification_status === 'approved' ? (
                              <CheckCircleIcon className="w-8 h-8 text-green-600" />
                            ) : (
                              <XMarkIcon className="w-8 h-8 text-red-600" />
                            )}
                            <div>
                              <p className="font-bold">
                                {selectedReceipt.verification_status === 'approved'
                                  ? 'Payment Approved'
                                  : 'Payment Rejected'}
                              </p>
                              {selectedReceipt.verification_notes && (
                                <p className="text-sm text-gray-700 mt-1">
                                  {selectedReceipt.verification_notes}
                                </p>
                              )}
                            </div>
                          </div>
                        </CardBody>
                      </Card>
                    )}
                  </div>
                </div>
              )}
            </div>
          )}
        </ModalBody>

        <ModalFooter>
          <Button color="default" variant="light" onPress={onCancel}>
            Close
          </Button>
        </ModalFooter>
      </ModalContent>
    </Modal>
  );
}
