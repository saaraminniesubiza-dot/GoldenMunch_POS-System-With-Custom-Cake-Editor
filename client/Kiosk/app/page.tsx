"use client";

import { useState, useEffect } from 'react';
import { Button } from '@heroui/button';
import { Card, CardBody } from '@heroui/card';
import { Spinner } from '@heroui/spinner';
import { useCart } from '@/contexts/CartContext';
import { MenuService } from '@/services/menu.service';
import type { MenuItem, Category } from '@/types/api';
import { KioskSidebar } from '@/components/KioskSidebar';
import { MenuCard } from '@/components/MenuCard';

export default function HomePage() {
  const [menuItems, setMenuItems] = useState<MenuItem[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [filteredItems, setFilteredItems] = useState<MenuItem[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedItem, setSelectedItem] = useState<MenuItem | null>(null);
  const { items: cartItems } = useCart();

  // Fetch menu items and categories
  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      setError(null);

      try {
        const [items, cats] = await Promise.all([
          MenuService.getMenuItems(),
          MenuService.getCategories()
        ]);

        setMenuItems(items);
        setCategories(cats);
        setFilteredItems(items);
      } catch (err: any) {
        setError(err.message || 'Failed to load menu. Please try again.');
      } finally {
        setLoading(false);
      }
    };

    fetchData();

    // Auto-refresh menu every 30 seconds
    const refreshInterval = setInterval(() => {
      MenuService.getMenuItems().then(items => {
        setMenuItems(items);
      }).catch(err => {
        console.error('Auto-refresh failed:', err);
      });

      MenuService.getCategories().then(cats => {
        setCategories(cats);
      }).catch(err => {
        console.error('Category refresh failed:', err);
      });
    }, 30000);

    return () => clearInterval(refreshInterval);
  }, []);

  // Filter items by category
  useEffect(() => {
    let filtered = menuItems;

    if (selectedCategory !== null) {
      filtered = menuItems.filter(item =>
        item.categories?.some(cat => cat.category_id === selectedCategory)
      );
    }

    setFilteredItems(filtered);
  }, [menuItems, selectedCategory]);

  const getCartQuantity = (itemId: number): number => {
    const cartItem = cartItems.find(item => item.menuItem.menu_item_id === itemId);
    return cartItem?.quantity || 0;
  };

  const handleItemClick = (item: MenuItem) => {
    setSelectedItem(item);
  };

  const handleCloseSidebar = () => {
    setSelectedItem(null);
  };

  if (loading) {
    return (
      <div className="h-[1920px] flex items-center justify-center">
        <div className="text-center">
          <Spinner
            size="lg"
            classNames={{
              wrapper: "w-32 h-32",
              circle1: "border-b-sunny-yellow",
              circle2: "border-b-deep-orange-yellow"
            }}
          />
          <p className="text-4xl font-bold text-charcoal-gray mt-8">
            Loading Menu...
          </p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="h-[1920px] flex items-center justify-center p-6">
        <Card className="max-w-2xl bg-pure-white/20 backdrop-blur-lg border-2 border-sunny-yellow/40">
          <CardBody className="text-center p-12">
            <div className="text-9xl mb-8">⚠️</div>
            <h1 className="text-5xl font-bold text-charcoal-gray mb-6">
              Oops! Something went wrong
            </h1>
            <p className="text-2xl text-charcoal-gray/70 mb-10">{error}</p>
            <Button
              size="lg"
              className="bg-gradient-to-r from-sunny-yellow to-deep-orange-yellow text-charcoal-gray font-bold text-2xl px-12 py-8 shadow-lg hover:shadow-xl transition-all"
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
    <>
      <div className="h-[1920px] overflow-y-auto pr-[30vw] max-pr-[576px] flex flex-col">
        {/* Hero Header */}
        <div className="bg-gradient-to-br from-sunny-yellow/25 via-pure-white/20 to-deep-orange-yellow/25 backdrop-blur-sm border-b-4 border-sunny-yellow py-10 px-12 mb-6 shadow-lg">
          <div className="max-w-[1400px] mx-auto text-center">
            <div className="text-9xl mb-6 animate-float drop-shadow-xl">🍰</div>
            <h1 className="text-8xl font-black bg-gradient-to-br from-sunny-yellow via-deep-orange-yellow to-sunny-yellow bg-clip-text text-transparent drop-shadow-[0_0_30px_rgba(251,205,47,0.6)] mb-4">
              Golden Munch
            </h1>
            <p className="text-3xl text-black font-bold drop-shadow-lg">
              Fresh • Delicious • Made with Love
            </p>
          </div>
        </div>

        <div className="max-w-[1400px] mx-auto px-12">
          {/* Categories */}
          {categories.length > 0 && (
            <div className="mb-6">
              <div className="flex gap-4 justify-center flex-wrap">
                <Button
                  size="lg"
                  className={`${
                    selectedCategory === null
                      ? 'bg-gradient-to-br from-sunny-yellow to-deep-orange-yellow text-black scale-105 shadow-xl shadow-sunny-yellow/40'
                      : 'bg-gradient-to-br from-pure-white/80 to-sunny-yellow/10 backdrop-blur-sm border-2 border-sunny-yellow/50 text-black hover:border-sunny-yellow hover:shadow-lg'
                  } font-bold text-xl px-10 py-7 rounded-2xl transition-all touch-target`}
                  onClick={() => setSelectedCategory(null)}
                >
                  All Items
                </Button>
                {categories.map((category) => (
                  <Button
                    key={category.category_id}
                    size="lg"
                    className={`${
                      selectedCategory === category.category_id
                        ? 'bg-gradient-to-br from-sunny-yellow to-deep-orange-yellow text-black scale-105 shadow-xl shadow-sunny-yellow/40'
                        : 'bg-gradient-to-br from-pure-white/80 to-sunny-yellow/10 backdrop-blur-sm border-2 border-sunny-yellow/50 text-black hover:border-sunny-yellow hover:shadow-lg'
                    } font-bold text-xl px-10 py-7 rounded-2xl transition-all touch-target`}
                    onClick={() => setSelectedCategory(category.category_id)}
                  >
                    {category.name}
                  </Button>
                ))}
              </div>
            </div>
          )}

          {/* Menu Items Grid */}
          {filteredItems.length === 0 ? (
            <Card className="bg-gradient-to-br from-pure-white/90 via-sunny-yellow/10 to-deep-orange-yellow/15 backdrop-blur-lg border-2 border-sunny-yellow/60 shadow-xl">
              <CardBody className="text-center py-24">
                <div className="text-[120px] mb-8 animate-float drop-shadow-xl">🍽️</div>
                <h3 className="text-5xl font-bold text-black mb-6 drop-shadow-lg">
                  No items found
                </h3>
                <p className="text-2xl text-black/70 mb-10">
                  No items in this category
                </p>
                {selectedCategory !== null && (
                  <Button
                    size="lg"
                    className="bg-gradient-to-r from-sunny-yellow to-deep-orange-yellow text-black font-bold px-12 py-8 text-2xl touch-target shadow-xl hover:scale-105 transition-all"
                    onClick={() => setSelectedCategory(null)}
                  >
                    Clear Filter
                  </Button>
                )}
              </CardBody>
            </Card>
          ) : (
            <>
              <div className="text-center mb-6">
                <h2 className="text-4xl font-bold text-black drop-shadow-lg">
                  {filteredItems.length} Delicious {filteredItems.length === 1 ? 'Item' : 'Items'}
                </h2>
              </div>

              {/* 4 Column Grid - Flexible height for scrolling */}
              <div className="grid grid-cols-4 gap-8 pb-6 flex-1">
                {filteredItems.map((item) => (
                  <MenuCard
                    key={item.menu_item_id}
                    item={item}
                    onClick={handleItemClick}
                    cartQuantity={getCartQuantity(item.menu_item_id)}
                  />
                ))}
              </div>
            </>
          )}
        </div>

        {/* Promotional Section - Fixed at Bottom */}
        <div className="mt-auto bg-gradient-to-r from-sunny-yellow/30 via-deep-orange-yellow/25 to-sunny-yellow/30 backdrop-blur-md border-t-4 border-sunny-yellow py-8 px-12 shadow-2xl">
          <div className="max-w-[1400px] mx-auto">
            <div className="flex items-center justify-between gap-8">
              <div className="flex-1">
                <h3 className="text-4xl font-black text-black mb-2 drop-shadow-lg">
                  🎂 Design Your Dream Cake!
                </h3>
                <p className="text-xl text-black/90 font-bold">
                  Create a custom cake perfectly tailored to your celebration
                </p>
              </div>
              <Button
                size="lg"
                className="bg-gradient-to-br from-sunny-yellow via-deep-orange-yellow to-sunny-yellow text-black font-black text-3xl px-16 py-12 rounded-3xl shadow-2xl hover:shadow-[0_0_50px_rgba(251,205,47,0.7)] hover:scale-105 transition-all touch-target border-4 border-deep-orange-yellow/50 animate-pulse-slow"
                onClick={() => window.location.href = '/cake-editor'}
              >
                🍰 Custom Cake Editor
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Sidebar */}
      <KioskSidebar
        selectedItem={selectedItem}
        onClose={handleCloseSidebar}
      />
    </>
  );
}
