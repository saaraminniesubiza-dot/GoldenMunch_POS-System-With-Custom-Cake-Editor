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

interface Sparkle {
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
  const [sparkles, setSparkles] = useState<Sparkle[]>([]);

  useEffect(() => {
    setMounted(true);

    // Light, fresh food emojis
    const emojis = ['🥐', '🍰', '🧁', '☕', '🥖', '✨', '🌼', '🌸', '☀️'];

    // Generate floating particles
    const generatedParticles = [...Array(12)].map(() => ({
      left: Math.random() * 100,
      top: Math.random() * 100,
      delay: Math.random() * 10,
      duration: 25 + Math.random() * 20,
      size: 30 + Math.random() * 40,
      emoji: emojis[Math.floor(Math.random() * emojis.length)],
    }));

    // Generate cream bubbles
    const generatedBubbles = [...Array(25)].map(() => ({
      left: Math.random() * 100,
      delay: Math.random() * 15,
      duration: 12 + Math.random() * 10,
      size: 40 + Math.random() * 100,
    }));

    // Generate sparkles
    const generatedSparkles = [...Array(50)].map(() => ({
      left: Math.random() * 100,
      top: Math.random() * 100,
      delay: Math.random() * 5,
      duration: 2 + Math.random() * 3,
      size: 2 + Math.random() * 4,
    }));

    setParticles(generatedParticles);
    setBubbles(generatedBubbles);
    setSparkles(generatedSparkles);
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
      {/* Light Cream Gradient Base - Emphasizing light colors */}
      <div className="absolute inset-0 bg-gradient-to-br from-[#FFF9F2] via-[#E8DCC8] to-[#D9B38C]" />

      {/* Layered Soft Waves */}
      <div className="absolute inset-0 bg-gradient-to-t from-[#C9B8A5]/30 via-transparent to-[#FFF9F2]/40 animate-wave" />
      <div className="absolute inset-0 bg-gradient-to-b from-[#D9B38C]/20 via-transparent to-[#E8DCC8]/30 animate-wave-reverse" />

      {/* Large Animated Orbs - Light & Airy */}
      <div className="absolute -top-40 left-1/4 w-96 h-96 bg-gradient-to-br from-[#FFF9F2]/60 to-[#E8DCC8]/40 rounded-full mix-blend-soft-light filter blur-3xl animate-pulse-slow" />
      <div className="absolute top-1/3 -left-32 w-80 h-80 bg-gradient-to-br from-[#D9B38C]/40 to-[#FFF9F2]/50 rounded-full mix-blend-soft-light filter blur-3xl animate-blob" />
      <div className="absolute top-1/3 -right-32 w-80 h-80 bg-gradient-to-br from-[#E8DCC8]/50 to-[#C9B8A5]/30 rounded-full mix-blend-soft-light filter blur-3xl animate-blob animation-delay-2000" />
      <div className="absolute bottom-1/4 left-1/2 w-96 h-96 bg-gradient-to-br from-[#FFF9F2]/50 to-[#D9B38C]/35 rounded-full mix-blend-soft-light filter blur-3xl animate-blob animation-delay-4000" />
      <div className="absolute -bottom-40 right-1/4 w-96 h-96 bg-gradient-to-br from-[#C9B8A5]/40 to-[#FFF9F2]/60 rounded-full mix-blend-soft-light filter blur-3xl animate-pulse-slow animation-delay-3000" />

      {/* Cream Bubbles Rising */}
      <div className="absolute inset-0">
        {bubbles.map((bubble, i) => (
          <div
            key={`bubble-${i}`}
            className="absolute bottom-0 rounded-full bg-[#FFF9F2]/40 backdrop-blur-sm animate-rise-bubble border border-[#D9B38C]/25"
            style={{
              left: `${bubble.left}%`,
              width: `${bubble.size}px`,
              height: `${bubble.size}px`,
              animationDelay: `${bubble.delay}s`,
              animationDuration: `${bubble.duration}s`,
            }}
          />
        ))}
      </div>

      {/* Floating Particles */}
      <div className="absolute inset-0">
        {particles.map((particle, i) => (
          <div
            key={`particle-${i}`}
            className="absolute animate-float-gentle opacity-40 hover:opacity-90 transition-opacity duration-700 drop-shadow-lg"
            style={{
              left: `${particle.left}%`,
              top: `${particle.top}%`,
              fontSize: `${particle.size}px`,
              animationDelay: `${particle.delay}s`,
              animationDuration: `${particle.duration}s`,
              filter: 'drop-shadow(0 0 6px rgba(217, 179, 140, 0.3))',
            }}
          >
            {particle.emoji}
          </div>
        ))}
      </div>

      {/* Caramel Sparkle Effect */}
      <div className="absolute inset-0">
        {sparkles.map((sparkle, i) => (
          <div
            key={`sparkle-${i}`}
            className="absolute rounded-full bg-[#D9B38C] animate-twinkle shadow-[0_0_8px_rgba(217,179,140,0.5)]"
            style={{
              left: `${sparkle.left}%`,
              top: `${sparkle.top}%`,
              width: `${sparkle.size}px`,
              height: `${sparkle.size}px`,
              animationDelay: `${sparkle.delay}s`,
              animationDuration: `${sparkle.duration}s`,
            }}
          />
        ))}
      </div>

      {/* Light Shimmer Overlay */}
      <div className="absolute inset-0 bg-gradient-to-b from-[#FFF9F2]/30 via-transparent to-transparent animate-shimmer-down" />

      {/* Soft Vignette */}
      <div className="absolute inset-0 bg-gradient-radial from-transparent via-transparent to-[#C9B8A5]/20" />

      {/* Bottom Soft Glow */}
      <div className="absolute bottom-0 left-0 right-0 h-48 bg-gradient-to-t from-[#E8DCC8]/30 to-transparent" />

      {/* Top Light Glow */}
      <div className="absolute top-0 left-0 right-0 h-48 bg-gradient-to-b from-[#FFF9F2]/40 to-transparent" />
    </div>
  );
};

export default AnimatedBackground;
