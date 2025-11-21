"use client";

import { useState, useEffect } from 'react';
import { Card, CardBody, CardHeader } from '@heroui/card';
import { Button } from '@heroui/button';
import { Chip } from '@heroui/chip';
import { Spinner } from '@heroui/spinner';
import NextLink from 'next/link';
import { MenuService } from '@/services/menu.service';
import type { Category, MenuItem } from '@/types/api';
import { useCart } from '@/contexts/CartContext';

export default function CategoriesPage() {
  const [categories, setCategories] = useState<Category[]>([]);
  const [menuItems, setMenuItems] = useState<MenuItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { getItemCount, getTotal } = useCart();

  const getCategoryItemCount = (categoryId: number): number => {
    return menuItems.filter(item => item.status === 'available').length;
  };

  const getCategoryEmoji = (index: number): string => {
    const emojis = ['🍰', '🥐', '🍪', '☕', '🥪', '🍕', '🍔', '🍜', '🍱', '🍲'];
    return emojis[index % emojis.length];
  };

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      setError(null);

      try {
        const [cats, items] = await Promise.all([
          MenuService.getCategories(),
          MenuService.getMenuItems()
        ]);

        setCategories(cats);
        setMenuItems(items);
      } catch (err: any) {
        console.error('Error fetching data:', err);
        setError(err.message || 'Failed to load categories. Please try again.');
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen bg-mesh-gradient flex items-center justify-center">
        <div className="text-center animate-scale-in">
          <div className="relative">
            <Spinner
              size="lg"
              color="warning"
              classNames={{
                wrapper: "w-24 h-24"
              }}
            />
            <div className="absolute inset-0 animate-ping opacity-20">
              <div className="w-24 h-24 rounded-full bg-golden-orange/30"></div>
            </div>
          </div>
          <p className="text-3xl text-chocolate-brown mt-6 font-bold">
            Loading categories...
          </p>
          <p className="text-lg text-chocolate-brown/60 mt-2">
            Organizing our delicious menu
          </p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-mesh-gradient flex items-center justify-center p-6">
        <Card className="max-w-md card-modern animate-scale-in">
          <CardBody className="text-center p-8">
            <div className="text-8xl mb-6 animate-bounce-slow">⚠️</div>
            <h1 className="text-4xl font-bold text-chocolate-brown mb-4">
              Oops! Something went wrong
            </h1>
            <p className="text-xl text-chocolate-brown/70 mb-8">
              {error}
            </p>
            <Button
              size="lg"
              className="bg-gradient-to-r from-golden-orange to-deep-amber text-white font-bold text-xl px-8 shadow-xl-golden"
              onClick={() => window.location.reload()}
            >
              Try Again
            </Button>
          </CardBody>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-mesh-gradient">
      {/* Hero Header */}
      <div className="relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-r from-golden-orange via-deep-amber to-golden-orange opacity-90"></div>
        <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHZpZXdCb3g9IjAgMCA2MCA2MCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48ZyBmaWxsPSJub25lIiBmaWxsLXJ1bGU9ImV2ZW5vZGQiPjxnIGZpbGw9IiNmZmYiIGZpbGwtb3BhY2l0eT0iMC4xIj48cGF0aCBkPSJNMzYgMzRjMC0yLjIxIDEuNzktNCA0LTRzNCAxLjc5IDQgNC0xLjc5IDQtNCA0LTQtMS43OS00LTR6bTAtMThjMC0yLjIxIDEuNzktNCA0LTRzNCAxLjc5IDQgNC0xLjc5IDQtNCA0LTQtMS43OS00LTR6Ii8+PC9nPjwvZz48L3N2Zz4=')] opacity-10"></div>

        <div className="relative max-w-7xl mx-auto p-12 text-center">
          <div className="inline-block mb-6 animate-float">
            <div className="text-8xl">📂</div>
          </div>
          <h1 className="text-6xl font-black text-white mb-4 drop-shadow-2xl">
            Browse Categories
          </h1>
          <p className="text-2xl text-white/90 max-w-2xl mx-auto">
            Choose from our carefully curated selection of delicious categories
          </p>
        </div>
      </div>

      <div className="max-w-7xl mx-auto p-6 md:p-8 -mt-16">
        {/* Quick Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
          <Card className="card-glass animate-slide-up">
            <CardBody className="p-6 text-center">
              <div className="text-5xl mb-2">📋</div>
              <p className="text-3xl font-bold text-chocolate-brown">{categories.length}</p>
              <p className="text-chocolate-brown/70">Categories</p>
            </CardBody>
          </Card>
          <Card className="card-glass animate-slide-up" style={{ animationDelay: '0.1s' }}>
            <CardBody className="p-6 text-center">
              <div className="text-5xl mb-2">🍴</div>
              <p className="text-3xl font-bold text-chocolate-brown">{menuItems.length}</p>
              <p className="text-chocolate-brown/70">Total Items</p>
            </CardBody>
          </Card>
          <Card className="card-glass animate-slide-up" style={{ animationDelay: '0.2s' }}>
            <CardBody className="p-6 text-center">
              <div className="text-5xl mb-2">✨</div>
              <p className="text-3xl font-bold text-chocolate-brown">
                {menuItems.filter(i => i.is_featured).length}
              </p>
              <p className="text-chocolate-brown/70">Featured</p>
            </CardBody>
          </Card>
        </div>

        {/* Categories Grid */}
        {categories.length === 0 ? (
          <Card className="card-modern animate-scale-in">
            <CardBody className="text-center py-16">
              <div className="text-9xl mb-6 animate-float">📋</div>
              <h3 className="text-4xl font-bold text-chocolate-brown mb-4">
                No categories available
              </h3>
              <p className="text-xl text-chocolate-brown/70 mb-8">
                Categories are being set up. Please check back soon!
              </p>
              <Button
                as={NextLink}
                href="/"
                size="lg"
                className="bg-gradient-to-r from-golden-orange to-deep-amber text-white font-bold px-8 shadow-xl"
              >
                Browse All Items
              </Button>
            </CardBody>
          </Card>
        ) : (
          <div className="space-y-8">
            <h2 className="text-3xl font-bold text-chocolate-brown flex items-center gap-3">
              <span className="text-4xl">🎯</span>
              All Categories
            </h2>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {categories.map((category, index) => (
                <Card
                  key={category.category_id}
                  className="card-modern group cursor-pointer animate-slide-up"
                  style={{ animationDelay: `${index * 0.05}s` }}
                  isPressable
                  as={NextLink}
                  href={`/menu?category=${category.category_id}`}
                >
                  <CardHeader className="p-0 relative overflow-hidden">
                    {/* Gradient Background */}
                    <div className="w-full h-40 bg-gradient-to-br from-golden-orange/20 via-deep-amber/20 to-golden-orange/10 flex items-center justify-center relative">
                      {/* Decorative Pattern */}
                      <div className="absolute inset-0 opacity-10 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjAiIGhlaWdodD0iMjAiIHZpZXdCb3g9IjAgMCAyMCAyMCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48ZyBmaWxsPSJub25lIiBmaWxsLXJ1bGU9ImV2ZW5vZGQiPjxnIGZpbGw9IiMwMDAiPjxjaXJjbGUgY3g9IjMiIGN5PSIzIiByPSIzIi8+PC9nPjwvZz48L3N2Zz4=')]"></div>

                      {/* Emoji/Icon */}
                      <div className="relative z-10 text-7xl animate-float group-hover:scale-110 transition-transform">
                        {category.image_url ? (
                          <img
                            src={category.image_url}
                            alt={category.name}
                            className="w-20 h-20 object-cover rounded-full shadow-xl"
                          />
                        ) : (
                          getCategoryEmoji(index)
                        )}
                      </div>

                      {/* Shine Effect on Hover */}
                      <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white to-transparent opacity-0 group-hover:opacity-20 transform -translate-x-full group-hover:translate-x-full transition-all duration-1000"></div>
                    </div>
                  </CardHeader>

                  <CardBody className="px-5 py-6">
                    <div className="text-center mb-4">
                      <h3 className="text-xl font-bold text-chocolate-brown mb-2 line-clamp-1">
                        {category.name}
                      </h3>
                      <p className="text-sm text-chocolate-brown/60 line-clamp-2 min-h-[40px]">
                        {category.description || 'Delicious items in this category'}
                      </p>
                    </div>

                    <div className="flex items-center justify-between mb-4">
                      <Chip
                        color="warning"
                        variant="flat"
                        size="sm"
                        className="font-semibold"
                      >
                        {getCategoryItemCount(category.category_id)} items
                      </Chip>
                      {category.is_active && (
                        <Chip color="success" variant="dot" size="sm">
                          Available
                        </Chip>
                      )}
                    </div>

                    <div className="w-full bg-gradient-to-r from-golden-orange to-deep-amber text-white font-bold shadow-lg group-hover:shadow-xl-golden transition-all rounded-lg px-4 py-2 text-center">
                      Explore →
                    </div>
                  </CardBody>
                </Card>
              ))}
            </div>
          </div>
        )}

        {/* Quick Navigation */}
        <div className="mt-16 text-center space-y-6 animate-slide-up" style={{ animationDelay: '0.3s' }}>
          <Card className="card-glass inline-block">
            <CardBody className="p-8">
              <h3 className="text-3xl font-bold text-chocolate-brown mb-6">
                Quick Navigation
              </h3>
              <div className="flex flex-wrap justify-center gap-4">
                <Button
                  as={NextLink}
                  href="/"
                  size="lg"
                  className="bg-gradient-to-r from-golden-orange to-deep-amber text-white font-bold px-10 shadow-xl hover:scale-105 transition-transform"
                >
                  🏠 Back to Menu
                </Button>
                <Button
                  as={NextLink}
                  href="/specials"
                  size="lg"
                  variant="bordered"
                  className="border-2 border-golden-orange text-chocolate-brown hover:bg-golden-orange/10 font-bold px-10"
                >
                  ⭐ Today's Specials
                </Button>
                {getItemCount() > 0 && (
                  <Button
                    as={NextLink}
                    href="/cart"
                    size="lg"
                    className="bg-green-600 hover:bg-green-700 text-white font-bold px-10 shadow-xl animate-pulse-slow"
                  >
                    🛒 View Cart ({getItemCount()})
                  </Button>
                )}
              </div>
            </CardBody>
          </Card>
        </div>
      </div>

      {/* Floating Cart for Mobile */}
      {getItemCount() > 0 && (
        <div className="fixed bottom-8 right-8 z-50 lg:hidden">
          <Button
            as={NextLink}
            href="/cart"
            isIconOnly
            className="w-20 h-20 bg-gradient-to-r from-green-500 to-green-600 text-white text-3xl rounded-full shadow-2xl animate-glow"
          >
            🛒
          </Button>
          <div className="absolute -top-2 -right-2 bg-red-500 text-white w-8 h-8 rounded-full flex items-center justify-center font-bold shadow-lg animate-bounce-slow">
            {getItemCount()}
          </div>
        </div>
      )}

      {/* Spacer */}
      <div className="h-20"></div>
    </div>
  );
}
