'use client';

import React, { useState, useEffect } from 'react';

interface Particle {
  left: number;
  top: number;
  delay: number;
  duration: number;
  size: number;
  emoji: string;
}

interface Bubble {
  left: number;
  delay: number;
  duration: number;
  size: number;
}

interface GoldSparkle {
  left: number;
  top: number;
  delay: number;
  duration: number;
  size: number;
}

export const AnimatedBackground: React.FC = () => {
  const [mounted, setMounted] = useState(false);
  const [particles, setParticles] = useState<Particle[]>([]);
  const [bubbles, setBubbles] = useState<Bubble[]>([]);
  const [goldSparkles, setGoldSparkles] = useState<GoldSparkle[]>([]);

  useEffect(() => {
    setMounted(true);

    // Soft, airy café-themed emojis
    const emojis = ['☕', '🥐', '🍰', '🧁', '🥖', '🥨', '🍪', '🧈', '🍯', '🌸', '✨', '🌼'];

    // Generate MORE floating particles for prominence
    const generatedParticles = [...Array(25)].map(() => ({
      left: Math.random() * 100,
      top: Math.random() * 100,
      delay: Math.random() * 8,
      duration: 18 + Math.random() * 12,
      size: 35 + Math.random() * 50, // LARGER particles
      emoji: emojis[Math.floor(Math.random() * emojis.length)],
    }));

    // Generate MORE bubbles for better visibility
    const generatedBubbles = [...Array(35)].map(() => ({
      left: Math.random() * 100,
      delay: Math.random() * 10,
      duration: 12 + Math.random() * 10,
      size: 40 + Math.random() * 100, // LARGER bubbles
    }));

    // Generate MORE sparkles
    const generatedSparkles = [...Array(60)].map(() => ({
      left: Math.random() * 100,
      top: Math.random() * 100,
      delay: Math.random() * 5,
      duration: 2.5 + Math.random() * 3.5,
      size: 3 + Math.random() * 5, // LARGER sparkles
    }));

    setParticles(generatedParticles);
    setBubbles(generatedBubbles);
    setGoldSparkles(generatedSparkles);
  }, []);

  // Prevent hydration mismatch
  if (!mounted) {
    return (
      <div className="fixed inset-0 -z-10 overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-[#FFF9F2] via-[#E8DCC8] to-[#D9B38C]" />
      </div>
    );
  }

  return (
    <div className="fixed inset-0 -z-10 overflow-hidden">
      {/* Light Caramel & Cream Gradient Base - Soft and Airy */}
      <div className="absolute inset-0 bg-gradient-to-br from-[#FFF9F2] via-[#E8DCC8] to-[#D9B38C]" />

      {/* Layered Gradient Waves - More visible */}
      <div className="absolute inset-0 bg-gradient-to-t from-[#C9B8A5]/30 via-transparent to-[#FFF9F2]/40 animate-wave" />
      <div className="absolute inset-0 bg-gradient-to-b from-[#D9B38C]/25 via-transparent to-[#E8DCC8]/30 animate-wave-reverse" />

      {/* Large Animated Orbs - Warm Caramel Tones - MORE PROMINENT */}
      <div className="absolute -top-40 left-1/4 w-[500px] h-[500px] bg-gradient-to-br from-[#D9B38C]/50 to-[#C67B57]/40 rounded-full mix-blend-multiply filter blur-3xl animate-pulse-slow" />
      <div className="absolute top-1/3 -left-32 w-96 h-96 bg-gradient-to-br from-[#C9B8A5]/45 to-[#E8DCC8]/35 rounded-full mix-blend-multiply filter blur-3xl animate-blob" />
      <div className="absolute top-1/3 -right-32 w-96 h-96 bg-gradient-to-br from-[#D9B38C]/50 to-[#C67B57]/35 rounded-full mix-blend-multiply filter blur-3xl animate-blob animation-delay-2000" />
      <div className="absolute bottom-1/4 left-1/2 w-[500px] h-[500px] bg-gradient-to-br from-[#C67B57]/40 to-[#C9B8A5]/45 rounded-full mix-blend-multiply filter blur-3xl animate-blob animation-delay-4000" />
      <div className="absolute -bottom-40 right-1/4 w-96 h-96 bg-gradient-to-br from-[#E8DCC8]/45 to-[#D9B38C]/40 rounded-full mix-blend-multiply filter blur-3xl animate-pulse-slow animation-delay-3000" />

      {/* Soft Cream Bubbles Rising - MORE VISIBLE */}
      <div className="absolute inset-0">
        {bubbles.map((bubble, i) => (
          <div
            key={`bubble-${i}`}
            className="absolute bottom-0 rounded-full bg-[#D9B38C]/30 backdrop-blur-sm animate-rise-bubble border-2 border-[#C9B8A5]/40"
            style={{
              left: `${bubble.left}%`,
              width: `${bubble.size}px`,
              height: `${bubble.size}px`,
              animationDelay: `${bubble.delay}s`,
              animationDuration: `${bubble.duration}s`,
              boxShadow: '0 0 20px rgba(217, 179, 140, 0.4)',
            }}
          />
        ))}
      </div>

      {/* Floating Café Particles - MORE PROMINENT */}
      <div className="absolute inset-0">
        {particles.map((particle, i) => (
          <div
            key={`particle-${i}`}
            className="absolute animate-float-gentle opacity-70 hover:opacity-100 transition-opacity duration-700"
            style={{
              left: `${particle.left}%`,
              top: `${particle.top}%`,
              fontSize: `${particle.size}px`,
              animationDelay: `${particle.delay}s`,
              animationDuration: `${particle.duration}s`,
              filter: 'drop-shadow(0 0 15px rgba(217, 179, 140, 0.6)) drop-shadow(0 0 25px rgba(217, 179, 140, 0.3))',
            }}
          >
            {particle.emoji}
          </div>
        ))}
      </div>

      {/* Caramel Sparkle Effect - MORE PROMINENT */}
      <div className="absolute inset-0">
        {goldSparkles.map((sparkle, i) => (
          <div
            key={`sparkle-${i}`}
            className="absolute rounded-full bg-[#C67B57] animate-twinkle"
            style={{
              left: `${sparkle.left}%`,
              top: `${sparkle.top}%`,
              width: `${sparkle.size}px`,
              height: `${sparkle.size}px`,
              animationDelay: `${sparkle.delay}s`,
              animationDuration: `${sparkle.duration}s`,
              boxShadow: '0 0 15px rgba(198, 123, 87, 0.8), 0 0 25px rgba(217, 179, 140, 0.5)',
            }}
          />
        ))}
      </div>

      {/* Elegant Shimmer Overlay - More visible */}
      <div className="absolute inset-0 bg-gradient-to-b from-[#FFF9F2]/15 via-transparent to-transparent animate-shimmer-down" />

      {/* Soft Vignette - Lighter */}
      <div className="absolute inset-0 bg-gradient-radial from-transparent via-transparent to-[#C9B8A5]/20" />

      {/* Bottom Glow - Warm Caramel */}
      <div className="absolute bottom-0 left-0 right-0 h-48 bg-gradient-to-t from-[#D9B38C]/25 to-transparent" />

      {/* Top Glow - Soft Cream */}
      <div className="absolute top-0 left-0 right-0 h-48 bg-gradient-to-b from-[#E8DCC8]/20 to-transparent" />
    </div>
  );
};

export default AnimatedBackground;
