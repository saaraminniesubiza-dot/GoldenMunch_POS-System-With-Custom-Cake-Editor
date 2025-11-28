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
        relative overflow-hidden cursor-pointer h-[330px]
        border-2 border-sunny-yellow/60
        bg-gradient-to-br from-pure-white via-sunny-yellow/10 to-deep-orange-yellow/15
        backdrop-blur-sm shadow-lg
        transition-all duration-300
        ${isAvailable
          ? 'hover:border-sunny-yellow hover:shadow-[0_0_40px_rgba(251,205,47,0.6)] hover:scale-105'
          : 'opacity-60 cursor-not-allowed grayscale'
        }
      `}
    >
      <CardBody className="p-0 h-full flex flex-col">
        {/* Image Section - 60% (200px) - Clean, no text */}
        <div className="relative h-[200px] w-full overflow-hidden bg-gradient-to-br from-sunny-yellow/20 via-deep-orange-yellow/15 to-sunny-yellow/30">
          {getImageUrl(item.image_url) ? (
            <Image
              src={getImageUrl(item.image_url) || ''}
              alt={item.name}
              fill
              className={`object-cover transition-transform duration-500 ${isAvailable ? 'group-hover:scale-110' : ''}`}
              sizes="25vw"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center">
              <span className="text-8xl">🍰</span>
            </div>
          )}

          {/* Badges - Only on Image */}
          <div className="absolute top-3 right-3 flex flex-col gap-2 z-10">
            {item.is_featured && (
              <Chip
                size="lg"
                className="font-bold text-sm px-3 py-1 bg-deep-orange-yellow text-white shadow-lg"
              >
                ⭐ Popular
              </Chip>
            )}
            {!isAvailable && (
              <Chip
                size="lg"
                className="font-bold text-sm px-3 py-1 bg-red-500 text-white shadow-lg"
              >
                Sold Out
              </Chip>
            )}
            {cartQuantity > 0 && (
              <Chip
                size="lg"
                className="font-bold text-sm px-3 py-1 bg-green-600 text-white shadow-lg animate-pulse"
              >
                {cartQuantity} in cart
              </Chip>
            )}
          </div>
        </div>

        {/* Info Section - 40% (130px) - Solid Background, Perfect Contrast */}
        <div className="h-[130px] bg-gradient-to-b from-pure-white/95 to-sunny-yellow/5 backdrop-blur-sm p-4 flex flex-col justify-between border-t-2 border-sunny-yellow/30">
          {/* Item Name */}
          <h3 className="text-lg font-bold text-black line-clamp-1 leading-tight drop-shadow-sm">
            {item.name}
          </h3>

          {/* Price & Category */}
          <div className="flex items-end justify-between mt-2">
            <div>
              <span className="text-3xl font-black text-black drop-shadow-sm">
                ${(Number(item.current_price) || 0).toFixed(2)}
              </span>
            </div>
            <Chip
              size="sm"
              className="bg-sunny-yellow text-black font-bold text-xs px-3 shadow-md"
            >
              {item.item_type}
            </Chip>
          </div>

          {/* Tap to View Indicator */}
          {isAvailable && (
            <div className="mt-2">
              <div className="inline-block bg-gradient-to-r from-sunny-yellow to-deep-orange-yellow px-4 py-1.5 rounded-full shadow-md">
                <span className="text-black font-bold text-xs">
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
