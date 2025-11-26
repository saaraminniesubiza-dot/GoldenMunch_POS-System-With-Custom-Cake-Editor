'use client';

import React from 'react';
import { Button } from '@heroui/button';
import { Chip } from '@heroui/chip';
import Link from 'next/link';
import { useCart } from '@/contexts/CartContext';
import { usePathname } from 'next/navigation';

export const CartFooter: React.FC = () => {
  const pathname = usePathname();
  const { getItemCount, getTotal } = useCart();

  // Hide footer on cart, custom-cake, and idle pages
  if (pathname === '/cart' || pathname === '/idle' || pathname === '/custom-cake') {
    return null;
  }

  const itemCount = getItemCount();
  const total = getTotal();

  return (
    <div className="fixed bottom-0 left-0 right-0 z-50 bg-white/20 backdrop-blur-lg border-t border-white/30 shadow-2xl">
      <div className="max-w-7xl mx-auto px-6 py-4">
        <div className="flex items-center gap-4">
          {/* Cart Button */}
          <Button
            as={Link}
            href="/cart"
            size="lg"
            className={`flex-1 ${
              itemCount > 0
                ? 'bg-gradient-to-r from-golden-orange to-deep-amber'
                : 'bg-gray-400'
            } text-white font-bold text-2xl py-8 shadow-xl hover:scale-105 transition-all rounded-2xl min-h-[100px]`}
            isDisabled={itemCount === 0}
          >
            <div className="flex items-center justify-between w-full px-4">
              <div className="flex items-center gap-3">
                <span className="text-5xl">🛒</span>
                <div className="flex flex-col items-start">
                  <span className="text-3xl">Cart</span>
                  {itemCount > 0 && (
                    <span className="text-lg opacity-90">
                      {itemCount} {itemCount === 1 ? 'item' : 'items'}
                    </span>
                  )}
                </div>
              </div>
              {itemCount > 0 && (
                <div className="flex flex-col items-end">
                  <Chip
                    color="warning"
                    size="lg"
                    className="text-xl font-bold mb-1"
                  >
                    {itemCount}
                  </Chip>
                  <span className="text-2xl font-black">₱{total.toFixed(0)}</span>
                </div>
              )}
            </div>
          </Button>

          {/* Custom Cake Button */}
          <Button
            as={Link}
            href="/custom-cake"
            size="lg"
            className="bg-gradient-to-r from-purple-500 via-pink-500 to-purple-600 text-white font-bold text-2xl py-8 px-12 shadow-xl hover:scale-105 transition-all rounded-2xl min-h-[100px]"
          >
            <div className="flex items-center gap-3">
              <span className="text-5xl">🎂</span>
              <span className="text-3xl">Custom Cake</span>
            </div>
          </Button>
        </div>
      </div>
    </div>
  );
};

export default CartFooter;
