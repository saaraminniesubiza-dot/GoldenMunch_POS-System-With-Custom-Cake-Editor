"use client";

import { useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Cake, Sparkles, Heart, Star, Clock } from "lucide-react";

interface FeaturedItem {
  id: number;
  name: string;
  image: string;
  description: string;
  price: string;
}

interface Quote {
  text: string;
  author?: string;
}

export default function IdlePage() {
  const [currentSlide, setCurrentSlide] = useState(0);
  const [currentQuote, setCurrentQuote] = useState(0);
  const [currentCTA, setCurrentCTA] = useState(0);
  const [floatingElements, setFloatingElements] = useState<Array<{ id: number; x: number; y: number; emoji: string }>>([]);

  // Featured menu items - You can fetch these from API later
  const featuredItems: FeaturedItem[] = [
    {
      id: 1,
      name: "Chocolate Dream Cake",
      image: "🍫",
      description: "Rich chocolate layers with creamy ganache",
      price: "₱850"
    },
    {
      id: 2,
      name: "Strawberry Delight",
      image: "🍓",
      description: "Fresh strawberries with vanilla cream",
      price: "₱750"
    },
    {
      id: 3,
      name: "Classic Cupcakes",
      image: "🧁",
      description: "Assorted flavors, freshly baked daily",
      price: "₱150"
    },
    {
      id: 4,
      name: "Custom Cake Creation",
      image: "🎂",
      description: "Design your dream cake in 3D",
      price: "From ₱1,200"
    }
  ];

  // Promotional quotes that rotate
  const quotes: Quote[] = [
    { text: "Life is short, eat dessert first!", author: "Jacques Torres" },
    { text: "Every cake has a story to tell", author: "Golden Munch" },
    { text: "Happiness is a slice of cake", author: "Anonymous" },
    { text: "Baked fresh daily with love", author: "Golden Munch" },
    { text: "Where sweetness meets perfection", author: "Golden Munch" },
    { text: "Creating memories, one cake at a time", author: "Golden Munch" }
  ];

  // Call-to-action messages with variations
  const ctaMessages: string[] = [
    "Click Anywhere to Order NOW!",
    "Tap to Start Your Sweet Journey!",
    "Touch Screen to Order Your Favorites!",
    "Ready to Order? Click Here!",
    "Your Perfect Cake Awaits - Click Now!",
    "Start Ordering Delicious Treats!",
    "Click to Design Your Custom Cake!",
    "Tap Anywhere to Begin Ordering!"
  ];

  // Floating bakery emojis
  const bakeryEmojis = ['🍰', '🧁', '🎂', '🍪', '🥐', '🍩', '🥧', '✨', '⭐', '💫'];

  // Generate floating elements on mount
  useEffect(() => {
    const elements = Array.from({ length: 15 }, (_, i) => ({
      id: i,
      x: Math.random() * 100,
      y: Math.random() * 100,
      emoji: bakeryEmojis[Math.floor(Math.random() * bakeryEmojis.length)]
    }));
    setFloatingElements(elements);
  }, []);

  // Auto-rotate slides every 5 seconds
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentSlide((prev) => (prev + 1) % featuredItems.length);
    }, 5000);
    return () => clearInterval(timer);
  }, [featuredItems.length]);

  // Auto-rotate quotes every 7 seconds
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentQuote((prev) => (prev + 1) % quotes.length);
    }, 7000);
    return () => clearInterval(timer);
  }, [quotes.length]);

  // Auto-rotate CTA messages every 3 seconds
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentCTA((prev) => (prev + 1) % ctaMessages.length);
    }, 3000);
    return () => clearInterval(timer);
  }, [ctaMessages.length]);

  // Handle touch to return to menu
  const handleInteraction = useCallback(() => {
    window.location.href = '/';
  }, []);

  // Handle keyboard
  useEffect(() => {
    const handleKeyPress = (event: KeyboardEvent) => {
      if (event.key === ' ' || event.key === 'Enter' || event.key === 'Escape') {
        handleInteraction();
      }
    };
    document.addEventListener('keydown', handleKeyPress);
    return () => document.removeEventListener('keydown', handleKeyPress);
  }, [handleInteraction]);

  return (
    <div
      className="fixed inset-0 w-screen h-screen overflow-hidden cursor-pointer"
      onClick={handleInteraction}
    >
      {/* Animated gradient background */}
      <div className="absolute inset-0 bg-gradient-to-br from-[#3A1F0F] via-[#662B35] to-[#7B4B28] animate-gradient-shift">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_20%_50%,rgba(234,215,183,0.1)_0%,transparent_50%)]" />
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_80%_20%,rgba(217,119,6,0.15)_0%,transparent_50%)]" />
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_40%_80%,rgba(102,43,53,0.15)_0%,transparent_50%)]" />
      </div>

      {/* Floating bakery elements */}
      {floatingElements.map((element) => (
        <motion.div
          key={element.id}
          className="absolute text-4xl opacity-20 pointer-events-none"
          initial={{ x: `${element.x}%`, y: `${element.y}%` }}
          animate={{
            x: `${element.x + Math.sin(element.id) * 10}%`,
            y: `${element.y + Math.cos(element.id) * 10}%`,
            rotate: [0, 360],
            scale: [1, 1.2, 1]
          }}
          transition={{
            duration: 20 + element.id * 2,
            repeat: Infinity,
            ease: "linear"
          }}
        >
          {element.emoji}
        </motion.div>
      ))}

      {/* Sparkle effects */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        {[...Array(30)].map((_, i) => (
          <motion.div
            key={i}
            className="absolute w-2 h-2 bg-[#EAD7B7] rounded-full"
            style={{
              left: `${Math.random() * 100}%`,
              top: `${Math.random() * 100}%`,
            }}
            animate={{
              opacity: [0, 1, 0],
              scale: [0, 1, 0],
            }}
            transition={{
              duration: 3,
              delay: i * 0.1,
              repeat: Infinity,
              ease: "easeInOut",
            }}
          />
        ))}
      </div>

      {/* Main content container */}
      <div className="relative z-10 h-full flex flex-col items-center justify-center p-8">

        {/* Header with logo and tagline */}
        <motion.div
          initial={{ y: -50, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ duration: 1 }}
          className="text-center mb-12"
        >
          <motion.div
            animate={{ rotate: [0, 5, -5, 0] }}
            transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
            className="text-9xl mb-4"
          >
            🍰
          </motion.div>
          <h1 className="text-7xl font-bold text-[#FAF7F2] mb-4 drop-shadow-2xl">
            Golden Munch
          </h1>
          <p className="text-3xl text-[#EAD7B7] font-light tracking-wide">
            Where Every Bite is Pure Bliss
          </p>
        </motion.div>

        {/* Featured Items Carousel */}
        <div className="w-full max-w-6xl mb-12">
          <AnimatePresence mode="wait">
            <motion.div
              key={currentSlide}
              initial={{ opacity: 0, scale: 0.8, rotateY: 90 }}
              animate={{ opacity: 1, scale: 1, rotateY: 0 }}
              exit={{ opacity: 0, scale: 0.8, rotateY: -90 }}
              transition={{ duration: 0.8 }}
              className="relative"
            >
              <div className="bg-gradient-to-br from-[#FAF7F2]/20 to-[#EAD7B7]/10 backdrop-blur-xl rounded-3xl p-12 shadow-[0_0_60px_rgba(234,215,183,0.3)] border-2 border-[#EAD7B7]/30">
                <div className="flex items-center justify-center gap-16">
                  {/* Item emoji/image */}
                  <motion.div
                    animate={{
                      scale: [1, 1.1, 1],
                      rotate: [0, 5, -5, 0]
                    }}
                    transition={{ duration: 3, repeat: Infinity }}
                    className="text-[200px] drop-shadow-2xl"
                  >
                    {featuredItems[currentSlide].image}
                  </motion.div>

                  {/* Item details */}
                  <div className="flex-1 text-left">
                    <motion.div
                      initial={{ x: 50, opacity: 0 }}
                      animate={{ x: 0, opacity: 1 }}
                      transition={{ delay: 0.3 }}
                    >
                      <div className="flex items-center gap-3 mb-4">
                        <Star className="w-8 h-8 text-[#D97706] fill-[#D97706]" />
                        <span className="text-[#EAD7B7] text-2xl font-semibold tracking-wider uppercase">
                          Featured Special
                        </span>
                      </div>
                      <h2 className="text-6xl font-bold text-[#FAF7F2] mb-6 drop-shadow-lg">
                        {featuredItems[currentSlide].name}
                      </h2>
                      <p className="text-3xl text-[#EAD7B7] mb-8 leading-relaxed">
                        {featuredItems[currentSlide].description}
                      </p>
                      <div className="flex items-center gap-4">
                        <div className="bg-gradient-to-r from-[#D97706] to-[#7B4B28] text-[#FAF7F2] text-4xl font-bold px-8 py-4 rounded-2xl shadow-2xl">
                          {featuredItems[currentSlide].price}
                        </div>
                        <motion.div
                          animate={{ x: [0, 10, 0] }}
                          transition={{ duration: 1.5, repeat: Infinity }}
                        >
                          <Sparkles className="w-10 h-10 text-[#D97706]" />
                        </motion.div>
                      </div>
                    </motion.div>
                  </div>
                </div>
              </div>

              {/* Slide indicators */}
              <div className="flex justify-center gap-3 mt-8">
                {featuredItems.map((_, index) => (
                  <motion.div
                    key={index}
                    className={`h-3 rounded-full transition-all duration-500 ${
                      index === currentSlide
                        ? 'w-16 bg-[#D97706]'
                        : 'w-3 bg-[#EAD7B7]/30'
                    }`}
                    animate={index === currentSlide ? { scale: [1, 1.2, 1] } : {}}
                    transition={{ duration: 0.5, repeat: Infinity }}
                  />
                ))}
              </div>
            </motion.div>
          </AnimatePresence>
        </div>

        {/* Rotating Quotes Section */}
        <motion.div
          initial={{ y: 50, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ duration: 1, delay: 0.5 }}
          className="w-full max-w-4xl mb-8"
        >
          <AnimatePresence mode="wait">
            <motion.div
              key={currentQuote}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.6 }}
              className="text-center"
            >
              <div className="bg-gradient-to-r from-[#FAF7F2]/10 to-[#EAD7B7]/10 backdrop-blur-lg rounded-2xl p-8 border border-[#EAD7B7]/20 shadow-2xl">
                <div className="flex justify-center mb-4">
                  <Heart className="w-8 h-8 text-[#D97706] fill-[#D97706]" />
                </div>
                <p className="text-4xl text-[#FAF7F2] font-light italic mb-4 leading-relaxed">
                  "{quotes[currentQuote].text}"
                </p>
                {quotes[currentQuote].author && (
                  <p className="text-2xl text-[#EAD7B7] font-semibold">
                    — {quotes[currentQuote].author}
                  </p>
                )}
              </div>
            </motion.div>
          </AnimatePresence>
        </motion.div>

        {/* Rotating Call-to-Action Messages */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 1, delay: 1 }}
          className="text-center mb-8"
        >
          <AnimatePresence mode="wait">
            <motion.div
              key={currentCTA}
              initial={{ opacity: 0, scale: 0.8, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.8, y: -20 }}
              transition={{ duration: 0.5 }}
              className="inline-block"
            >
              <motion.div
                animate={{
                  scale: [1, 1.1, 1],
                  boxShadow: [
                    '0 0 40px rgba(234,215,183,0.4)',
                    '0 0 80px rgba(234,215,183,0.8)',
                    '0 0 40px rgba(234,215,183,0.4)'
                  ]
                }}
                transition={{ duration: 2, repeat: Infinity }}
                className="bg-gradient-to-r from-[#D97706] to-[#7B4B28] text-[#FAF7F2] text-5xl font-bold px-16 py-8 rounded-full border-4 border-[#EAD7B7] shadow-2xl"
              >
                {ctaMessages[currentCTA]}
              </motion.div>
            </motion.div>
          </AnimatePresence>
        </motion.div>

        {/* Custom Cake Editor Promotion */}
        <motion.div
          initial={{ opacity: 0, y: 50 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 1, delay: 1.5 }}
          className="text-center"
        >
          <motion.div
            animate={{
              scale: [1, 1.03, 1],
              rotate: [0, 1, -1, 0]
            }}
            transition={{ duration: 3, repeat: Infinity }}
            className="inline-block"
          >
            <div className="bg-gradient-to-br from-[#D97706]/90 via-[#7B4B28]/90 to-[#662B35]/90 backdrop-blur-xl text-[#FAF7F2] px-10 py-6 rounded-3xl border-2 border-[#EAD7B7]/50 shadow-[0_0_50px_rgba(217,119,6,0.6)]">
              <div className="flex items-center gap-4">
                <motion.div
                  animate={{ rotate: [0, 360] }}
                  transition={{ duration: 3, repeat: Infinity, ease: "linear" }}
                >
                  <Sparkles className="w-10 h-10 text-[#FFD700]" />
                </motion.div>
                <div>
                  <p className="text-2xl font-bold">🎨 NEW! Custom Cake Editor</p>
                  <p className="text-lg text-[#EAD7B7]">Design your dream cake in stunning 3D • QR Code Enabled</p>
                </div>
                <motion.div
                  animate={{ rotate: [0, -360] }}
                  transition={{ duration: 3, repeat: Infinity, ease: "linear" }}
                >
                  <Cake className="w-10 h-10 text-[#FFD700]" />
                </motion.div>
              </div>
            </div>
          </motion.div>
        </motion.div>
      </div>

      {/* Custom CSS for gradient animation */}
      <style jsx>{`
        @keyframes gradient-shift {
          0%, 100% {
            background-position: 0% 50%;
          }
          50% {
            background-position: 100% 50%;
          }
        }

        .animate-gradient-shift {
          background-size: 200% 200%;
          animation: gradient-shift 15s ease infinite;
        }
      `}</style>
    </div>
  );
}
