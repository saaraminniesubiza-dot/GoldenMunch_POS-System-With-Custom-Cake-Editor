'use client';

import React from 'react';
import { Card, CardBody } from '@heroui/card';
import { Chip } from '@heroui/chip';
import Image from 'next/image';
import type { MenuItem } from '@/types/api';
import { getImageUrl } from '@/utils/imageUtils';

interface MenuCardProps {
  item: MenuItem;
  onClick: (item: MenuItem) => void;
  cartQuantity?: number;
}

export const MenuCard: React.FC<MenuCardProps> = ({ item, onClick, cartQuantity = 0 }) => {
  const isAvailable = item.status === 'available' &&
    (item.is_infinite_stock || item.stock_quantity > 0);

  return (
    <Card
      isPressable
      onPress={() => onClick(item)}
      className={`
        relative overflow-hidden cursor-pointer h-[420px]
        border-3 border-sunny-yellow/60
        bg-gradient-to-br from-pure-white via-sunny-yellow/10 to-deep-orange-yellow/15
        backdrop-blur-sm shadow-xl
        transition-all duration-300
        touch-manipulation
        ${isAvailable
          ? 'hover:border-sunny-yellow hover:shadow-[0_0_40px_rgba(251,205,47,0.6)] hover:scale-[1.02]'
          : 'opacity-60 cursor-not-allowed grayscale'
        }
      `}
    >
      <CardBody className="p-0 h-full flex flex-col">
        {/* Image Section - Larger for portrait (250px) */}
        <div className="relative h-[250px] w-full overflow-hidden bg-gradient-to-br from-sunny-yellow/20 via-deep-orange-yellow/15 to-sunny-yellow/30">
          {getImageUrl(item.image_url) ? (
            <Image
              src={getImageUrl(item.image_url) || ''}
              alt={item.name}
              fill
              className={`object-cover transition-transform duration-500 ${isAvailable ? 'group-hover:scale-110' : ''}`}
              sizes="50vw"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center">
              <span className="text-9xl">🍰</span>
            </div>
          )}

          {/* Badges - Larger for touch visibility */}
          <div className="absolute top-4 right-4 flex flex-col gap-3 z-10">
            {item.is_featured && (
              <Chip
                size="lg"
                className="font-bold text-base px-4 py-2 bg-deep-orange-yellow text-white shadow-xl"
              >
                ⭐ Popular
              </Chip>
            )}
            {!isAvailable && (
              <Chip
                size="lg"
                className="font-bold text-base px-4 py-2 bg-red-500 text-white shadow-xl"
              >
                Sold Out
              </Chip>
            )}
            {cartQuantity > 0 && (
              <Chip
                size="lg"
                className="font-bold text-base px-4 py-2 bg-green-600 text-white shadow-xl animate-pulse"
              >
                {cartQuantity} in cart
              </Chip>
            )}
          </div>
        </div>

        {/* Info Section - Larger text for portrait touchscreen (170px) */}
        <div className="h-[170px] bg-gradient-to-b from-pure-white/95 to-sunny-yellow/5 backdrop-blur-sm p-5 flex flex-col justify-between border-t-3 border-sunny-yellow/30">
          {/* Item Name - Larger, always black */}
          <h3 className="text-2xl font-bold text-black line-clamp-2 leading-tight">
            {item.name}
          </h3>

          {/* Price & Category */}
          <div className="flex items-end justify-between mt-3">
            <div>
              <span className="text-4xl font-black text-black">
                ${(Number(item.current_price) || 0).toFixed(2)}
              </span>
            </div>
            <Chip
              size="lg"
              className="bg-sunny-yellow text-black font-bold text-base px-5 py-2 shadow-md"
            >
              {item.item_type}
            </Chip>
          </div>

          {/* Tap to View Indicator - Larger for touch */}
          {isAvailable && (
            <div className="mt-3">
              <div className="inline-block bg-gradient-to-r from-sunny-yellow to-deep-orange-yellow px-6 py-3 rounded-full shadow-lg touch-target">
                <span className="text-black font-bold text-base">
                  👆 Tap for details
                </span>
              </div>
            </div>
          )}
        </div>
      </CardBody>
    </Card>
  );
};

export default MenuCard;
