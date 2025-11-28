"use client";

import { useState, useEffect } from 'react';
import { Button } from '@heroui/button';
import { Card, CardBody } from '@heroui/card';
import { Spinner } from '@heroui/spinner';
import { Input } from '@heroui/input';
import { useCart } from '@/contexts/CartContext';
import { MenuService } from '@/services/menu.service';
import type { MenuItem, Category } from '@/types/api';
import { KioskSidebar } from '@/components/KioskSidebar';
import { MenuCard } from '@/components/MenuCard';

export default function MenuPage() {
  const [menuItems, setMenuItems] = useState<MenuItem[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [filteredItems, setFilteredItems] = useState<MenuItem[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<number | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
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

    // Auto-refresh every 30 seconds
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

  // Filter items by category and search
  useEffect(() => {
    let filtered = menuItems;

    if (selectedCategory !== null) {
      filtered = menuItems;
    }

    if (searchQuery) {
      filtered = filtered.filter(item =>
        item.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        item.description?.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }

    setFilteredItems(filtered);
  }, [menuItems, selectedCategory, searchQuery]);

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
      <div className="min-h-screen flex items-center justify-center">
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
      <div className="min-h-screen flex items-center justify-center p-6">
        <Card className="max-w-2xl bg-pure-white/20 backdrop-blur-lg border-2 border-sunny-yellow/40">
          <CardBody className="text-center p-12">
            <div className="text-9xl mb-8">⚠️</div>
            <h1 className="text-5xl font-bold text-charcoal-gray mb-6">
              Oops! Something went wrong
            </h1>
            <p className="text-2xl text-charcoal-gray/70 mb-10">
              {error}
            </p>
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
      <div className="min-h-screen pr-[30vw] max-pr-[576px]">
        {/* Vibrant Header */}
        <div className="sticky top-0 z-40 bg-gradient-to-br from-sunny-yellow/25 via-pure-white/20 to-deep-orange-yellow/25 backdrop-blur-sm border-b-4 border-sunny-yellow py-8 px-12 mb-8 shadow-lg">
          <div className="max-w-[1400px] mx-auto">
            {/* Title */}
            <div className="text-center mb-8">
              <h1 className="text-7xl font-black bg-gradient-to-br from-sunny-yellow via-deep-orange-yellow to-sunny-yellow bg-clip-text text-transparent drop-shadow-[0_0_30px_rgba(251,205,47,0.6)] mb-3 tracking-tight">
                Golden Munch
              </h1>
              <p className="text-3xl text-black font-bold drop-shadow-lg">
                Fresh • Delicious • Made with Love
              </p>
            </div>

            {/* Search Bar */}
            <div className="max-w-3xl mx-auto">
              <Input
                placeholder="Search for delicious treats..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                size="lg"
                startContent={<span className="text-3xl">🔍</span>}
                classNames={{
                  input: "text-2xl py-4 text-black",
                  inputWrapper: "bg-gradient-to-r from-pure-white/95 to-sunny-yellow/10 backdrop-blur-md shadow-lg border-2 border-sunny-yellow/60 hover:border-sunny-yellow hover:shadow-xl transition-all h-20"
                }}
              />
            </div>
          </div>
        </div>

        <div className="max-w-[1400px] mx-auto px-12">
          {/* Categories */}
          {categories.length > 0 && (
            <div className="mb-10">
              <div className="flex flex-wrap gap-4 justify-center">
                <Button
                  size="lg"
                  className={`
                    ${selectedCategory === null
                      ? 'bg-gradient-to-br from-sunny-yellow to-deep-orange-yellow text-black scale-105 shadow-xl shadow-sunny-yellow/40'
                      : 'bg-gradient-to-br from-pure-white/80 to-sunny-yellow/10 backdrop-blur-sm border-2 border-sunny-yellow/50 text-black hover:border-sunny-yellow hover:shadow-lg'
                    }
                    font-bold text-xl px-10 py-7 rounded-2xl transition-all touch-target
                  `}
                  onClick={() => setSelectedCategory(null)}
                >
                  All Items
                </Button>
                {categories.map((category) => (
                  <Button
                    key={category.category_id}
                    size="lg"
                    className={`
                      ${selectedCategory === category.category_id
                        ? 'bg-gradient-to-br from-sunny-yellow to-deep-orange-yellow text-black scale-105 shadow-xl shadow-sunny-yellow/40'
                        : 'bg-gradient-to-br from-pure-white/80 to-sunny-yellow/10 backdrop-blur-sm border-2 border-sunny-yellow/50 text-black hover:border-sunny-yellow hover:shadow-lg'
                      }
                      font-bold text-xl px-10 py-7 rounded-2xl transition-all touch-target
                    `}
                    onClick={() => setSelectedCategory(category.category_id)}
                  >
                    {category.name}
                  </Button>
                ))}
              </div>
            </div>
          )}

          {/* Menu Items - 4 Per Row */}
          {filteredItems.length === 0 ? (
            <Card className="bg-gradient-to-br from-pure-white/90 via-sunny-yellow/10 to-deep-orange-yellow/15 backdrop-blur-lg border-2 border-sunny-yellow/60 shadow-xl">
              <CardBody className="text-center py-24">
                <div className="text-[120px] mb-8 animate-float drop-shadow-xl">🍽️</div>
                <h3 className="text-5xl font-bold text-black mb-6 drop-shadow-lg">
                  No items found
                </h3>
                <p className="text-2xl text-black/70 mb-10">
                  {searchQuery
                    ? `No results for "${searchQuery}"`
                    : "No items available right now."
                  }
                </p>
                {(searchQuery || selectedCategory !== null) && (
                  <Button
                    size="lg"
                    className="bg-gradient-to-r from-sunny-yellow to-deep-orange-yellow text-black font-bold text-2xl px-12 py-8 touch-target shadow-xl hover:scale-105 transition-all"
                    onClick={() => {
                      setSearchQuery('');
                      setSelectedCategory(null);
                    }}
                  >
                    Clear Filters
                  </Button>
                )}
              </CardBody>
            </Card>
          ) : (
            <>
              <div className="mb-8 text-center">
                <h2 className="text-4xl font-bold text-black drop-shadow-lg">
                  {filteredItems.length} Delicious {filteredItems.length === 1 ? 'Item' : 'Items'}
                </h2>
              </div>

              {/* 4 Column Grid for 24-inch Display */}
              <div className="grid grid-cols-4 gap-8 pb-16">
                {filteredItems.map((item, index) => (
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
      </div>

      {/* Sidebar */}
      <KioskSidebar
        selectedItem={selectedItem}
        onClose={handleCloseSidebar}
      />
    </>
  );
}
