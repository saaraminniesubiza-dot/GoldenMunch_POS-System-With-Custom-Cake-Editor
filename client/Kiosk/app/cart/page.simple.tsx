"use client";

import { useState } from 'react';
import { Card, CardBody, CardHeader } from '@heroui/card';
import { Button } from '@heroui/button';
import { Chip } from '@heroui/chip';
import { Divider } from '@heroui/divider';
import { Input } from '@heroui/input';
import { Select, SelectItem } from '@heroui/select';
import { Modal, ModalContent, ModalHeader, ModalBody, ModalFooter, useDisclosure } from '@heroui/modal';
import NextLink from 'next/link';
import { useRouter } from 'next/navigation';
import { useCart } from '@/contexts/CartContext';
import { OrderService } from '@/services/order.service';
import type {
  OrderType,
  OrderSource,
  PaymentMethod,
  CreateOrderRequest,
  CustomerOrder
} from '@/types/api';

export default function CartPage() {
  const router = useRouter();
  const {
    items: cartItems,
    updateQuantity,
    removeItem,
    clearCart,
    getItemCount,
    getSubtotal,
    getTax,
    getTotal,
    getOrderItems
  } = useCart();

  const [customerName, setCustomerName] = useState("");
  const [customerPhone, setCustomerPhone] = useState("");
  const [specialInstructions, setSpecialInstructions] = useState("");
  const [orderType, setOrderType] = useState<OrderType>('walk_in');
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('cash');
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [completedOrder, setCompletedOrder] = useState<CustomerOrder | null>(null);
  const { isOpen, onOpen, onOpenChange } = useDisclosure();

  const getItemEmoji = (itemType: string): string => {
    const emojiMap: Record<string, string> = {
      cake: '🍰',
      pastry: '🥐',
      beverage: '☕',
      snack: '🍪',
      main_dish: '🍽️',
      appetizer: '🥗',
      dessert: '🍨',
      bread: '🍞',
      other: '🍴'
    };
    return emojiMap[itemType] || '🍴';
  };

  const handleCheckout = async () => {
    setIsProcessing(true);
    setError(null);

    try {
      const orderData: CreateOrderRequest = {
        order_type: orderType,
        order_source: 'kiosk',
        payment_method: paymentMethod,
        special_instructions: specialInstructions || undefined,
        items: getOrderItems(),
      };

      const order = await OrderService.createOrder(orderData);
      setCompletedOrder(order);
      clearCart();
      onOpen();
    } catch (err: any) {
      console.error('Error creating order:', err);
      setError(err.message || 'Failed to create order. Please try again.');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleNewOrder = () => {
    setCustomerName("");
    setCustomerPhone("");
    setSpecialInstructions("");
    setOrderType('walk_in');
    setPaymentMethod('cash');
    setCompletedOrder(null);
    onOpenChange();
    router.push('/');
  };

  if (cartItems.length === 0) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-cream-white to-caramel-beige flex items-center justify-center">
        <div className="text-center max-w-md">
          <div className="text-8xl mb-6">🛒</div>
          <h1 className="text-4xl font-bold text-chocolate-brown mb-4">
            Your Cart is Empty
          </h1>
          <p className="text-xl text-chocolate-brown/70 mb-8">
            Looks like you haven't added any delicious treats yet!
          </p>
          <div className="flex flex-col gap-4">
            <Button
              as={NextLink}
              href="/"
              size="lg"
              className="bg-golden-orange hover:bg-deep-amber text-chocolate-brown font-bold text-xl px-8 py-4"
            >
              🍰 Browse Our Menu
            </Button>
            <Button
              as={NextLink}
              href="/specials"
              size="lg"
              variant="bordered"
              className="border-golden-orange text-chocolate-brown hover:bg-golden-orange/10 font-bold text-lg px-8"
            >
              ⭐ View Today's Specials
            </Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-cream-white to-caramel-beige">
      {/* Header */}
      <div className="bg-gradient-to-r from-golden-orange to-deep-amber text-chocolate-brown p-8 shadow-lg">
        <div className="max-w-7xl mx-auto">
          <h1 className="text-5xl font-bold mb-2">🛒 Your Cart</h1>
          <p className="text-xl opacity-90">
            {getItemCount()} items • Ready to checkout?
          </p>
        </div>
      </div>

      <div className="max-w-7xl mx-auto p-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Cart Items */}
          <div className="lg:col-span-2">
            <Card className="bg-cream-white border-2 border-golden-orange/20 shadow-xl">
              <CardHeader className="p-6">
                <h2 className="text-2xl font-bold text-chocolate-brown">
                  Order Items ({getItemCount()})
                </h2>
              </CardHeader>
              <CardBody className="p-6 pt-0">
                <div className="space-y-4">
                  {cartItems.map((item) => (
                    <div key={`${item.menuItem.menu_item_id}-${item.flavor_id || 0}-${item.size_id || 0}`}>
                      <div className="flex items-center gap-4 p-4 bg-caramel-beige/10 rounded-xl">
                        <div className="text-5xl">
                          {item.menuItem.image_url || getItemEmoji(item.menuItem.item_type)}
                        </div>
                        <div className="flex-1">
                          <h3 className="text-lg font-bold text-chocolate-brown">
                            {item.menuItem.name}
                          </h3>
                          <Chip size="sm" color="default" variant="flat">
                            {item.menuItem.item_type}
                          </Chip>
                          <p className="text-lg font-semibold text-deep-amber mt-1">
                            ${(item.menuItem.current_price || 0).toFixed(2)} each
                          </p>
                          {item.special_instructions && (
                            <p className="text-sm text-chocolate-brown/60 mt-1">
                              Note: {item.special_instructions}
                            </p>
                          )}
                        </div>
                        <div className="flex items-center gap-3">
                          <Button
                            size="sm"
                            variant="bordered"
                            className="border-deep-amber text-deep-amber min-w-unit-10 font-bold text-lg"
                            onClick={() => updateQuantity(item.menuItem.menu_item_id, item.quantity - 1)}
                          >
                            -
                          </Button>
                          <span className="text-chocolate-brown font-bold text-xl min-w-8 text-center">
                            {item.quantity}
                          </span>
                          <Button
                            size="sm"
                            className="bg-golden-orange text-chocolate-brown min-w-unit-10 font-bold text-lg"
                            onClick={() => updateQuantity(item.menuItem.menu_item_id, item.quantity + 1)}
                          >
                            +
                          </Button>
                        </div>
                        <div className="text-right">
                          <p className="text-xl font-bold text-chocolate-brown">
                            ${((item.menuItem.current_price || 0) * item.quantity).toFixed(2)}
                          </p>
                          <Button
                            size="sm"
                            color="danger"
                            variant="light"
                            onClick={() => removeItem(item.menuItem.menu_item_id)}
                          >
                            Remove
                          </Button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>

                <Divider className="my-6" />

                <Button
                  as={NextLink}
                  href="/"
                  size="lg"
                  variant="bordered"
                  className="w-full border-golden-orange text-chocolate-brown hover:bg-golden-orange/10 font-bold"
                >
                  + Add More Items
                </Button>
              </CardBody>
            </Card>
          </div>

          {/* Order Summary & Checkout */}
          <div className="space-y-6">
            {/* Order Information */}
            <Card className="bg-cream-white border-2 border-golden-orange/20 shadow-xl">
              <CardHeader className="p-6">
                <h2 className="text-xl font-bold text-chocolate-brown">
                  📋 Order Information
                </h2>
              </CardHeader>
              <CardBody className="p-6 pt-0 space-y-4">
                <Input
                  label="Your Name (Optional)"
                  placeholder="Enter your name"
                  value={customerName}
                  onChange={(e) => setCustomerName(e.target.value)}
                  size="lg"
                  classNames={{
                    input: "text-chocolate-brown",
                    label: "text-chocolate-brown/70",
                  }}
                />
                <Input
                  label="Phone Number (Optional)"
                  placeholder="For order updates"
                  value={customerPhone}
                  onChange={(e) => setCustomerPhone(e.target.value)}
                  size="lg"
                  classNames={{
                    input: "text-chocolate-brown",
                    label: "text-chocolate-brown/70",
                  }}
                />
                <Select
                  label="Order Type"
                  placeholder="Select order type"
                  selectedKeys={[orderType]}
                  onChange={(e) => setOrderType(e.target.value as OrderType)}
                  size="lg"
                  classNames={{
                    label: "text-chocolate-brown/70",
                    value: "text-chocolate-brown",
                  }}
                >
                  <SelectItem key="walk_in" value="walk_in">Walk-in</SelectItem>
                  <SelectItem key="pickup" value="pickup">Pickup</SelectItem>
                  <SelectItem key="pre_order" value="pre_order">Pre-order</SelectItem>
                </Select>
                <Select
                  label="Payment Method"
                  placeholder="Select payment method"
                  selectedKeys={[paymentMethod]}
                  onChange={(e) => setPaymentMethod(e.target.value as PaymentMethod)}
                  size="lg"
                  classNames={{
                    label: "text-chocolate-brown/70",
                    value: "text-chocolate-brown",
                  }}
                >
                  <SelectItem key="cash" value="cash">Cash</SelectItem>
                  <SelectItem key="gcash" value="gcash">GCash</SelectItem>
                  <SelectItem key="paymaya" value="paymaya">PayMaya</SelectItem>
                  <SelectItem key="card" value="card">Card</SelectItem>
                </Select>
                <Input
                  label="Special Instructions (Optional)"
                  placeholder="Any special requests?"
                  value={specialInstructions}
                  onChange={(e) => setSpecialInstructions(e.target.value)}
                  size="lg"
                  classNames={{
                    input: "text-chocolate-brown",
                    label: "text-chocolate-brown/70",
                  }}
                />
              </CardBody>
            </Card>

            {/* Order Summary */}
            <Card className="bg-cream-white border-2 border-golden-orange/20 shadow-xl">
              <CardHeader className="p-6">
                <h2 className="text-xl font-bold text-chocolate-brown">
                  💰 Order Summary
                </h2>
              </CardHeader>
              <CardBody className="p-6 pt-0">
                <div className="space-y-3">
                  <div className="flex justify-between text-chocolate-brown">
                    <span>Subtotal ({getItemCount()} items)</span>
                    <span className="font-semibold">${getSubtotal().toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between text-chocolate-brown">
                    <span>Tax (12% VAT)</span>
                    <span className="font-semibold">${getTax().toFixed(2)}</span>
                  </div>
                  <Divider />
                  <div className="flex justify-between text-xl font-bold text-chocolate-brown">
                    <span>Total</span>
                    <span className="text-deep-amber">${getTotal().toFixed(2)}</span>
                  </div>
                </div>

                {error && (
                  <div className="mt-4 p-3 bg-red-100 border border-red-400 rounded-lg">
                    <p className="text-red-700 text-sm">{error}</p>
                  </div>
                )}

                <Button
                  size="lg"
                  className="w-full mt-6 bg-golden-orange hover:bg-deep-amber text-chocolate-brown font-bold text-xl py-4"
                  onClick={handleCheckout}
                  isLoading={isProcessing}
                >
                  {isProcessing ? "Processing..." : `💳 Place Order - $${getTotal().toFixed(2)}`}
                </Button>

                <p className="text-xs text-chocolate-brown/60 text-center mt-3">
                  By placing this order, you agree to our terms and conditions
                </p>
              </CardBody>
            </Card>
          </div>
        </div>
      </div>

      {/* Success Modal */}
      <Modal
        isOpen={isOpen}
        onOpenChange={onOpenChange}
        size="2xl"
        isDismissable={false}
        classNames={{
          base: "bg-cream-white",
          header: "border-b border-golden-orange/20",
          body: "py-6",
          footer: "border-t border-golden-orange/20",
        }}
      >
        <ModalContent>
          {(onClose) => (
            <>
              <ModalHeader className="flex flex-col gap-1 text-center">
                <div className="text-6xl mb-2">🎉</div>
                <h2 className="text-2xl font-bold text-chocolate-brown">
                  Order Successful!
                </h2>
              </ModalHeader>
              <ModalBody className="text-center">
                {completedOrder && (
                  <>
                    <p className="text-lg text-chocolate-brown mb-4">
                      Thank you for your order!
                    </p>
                    <div className="bg-golden-orange/10 p-6 rounded-xl mb-4">
                      <p className="text-chocolate-brown font-semibold text-xl mb-2">
                        Order #{completedOrder.order_number}
                      </p>
                      <p className="text-3xl font-bold text-deep-amber mb-2">
                        {completedOrder.verification_code}
                      </p>
                      <p className="text-sm text-chocolate-brown/70">
                        Verification Code (Please save this)
                      </p>
                      <p className="text-chocolate-brown/70 mt-3">
                        Total: ${completedOrder.final_amount.toFixed(2)}
                      </p>
                    </div>
                    <p className="text-chocolate-brown/80">
                      Your order is being prepared!
                    </p>
                    <p className="text-sm text-chocolate-brown/60 mt-2">
                      Present your verification code at the counter when ready.
                    </p>
                  </>
                )}
              </ModalBody>
              <ModalFooter className="flex justify-center gap-4">
                <Button
                  color="primary"
                  className="bg-golden-orange text-chocolate-brown font-bold"
                  onClick={handleNewOrder}
                >
                  🏠 Back to Menu
                </Button>
              </ModalFooter>
            </>
          )}
        </ModalContent>
      </Modal>
    </div>
  );
}
