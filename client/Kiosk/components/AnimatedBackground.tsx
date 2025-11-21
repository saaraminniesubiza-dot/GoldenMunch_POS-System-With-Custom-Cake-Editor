'use client';

import React from 'react';

export const AnimatedBackground: React.FC = () => {
  return (
    <div className="fixed inset-0 -z-10 overflow-hidden">
      {/* Base Gradient */}
      <div className="absolute inset-0 bg-gradient-to-br from-golden-orange/30 via-deep-amber/20 to-orange-300/30" />

      {/* Animated Orbs */}
      <div className="absolute top-0 -left-4 w-72 h-72 bg-golden-orange/30 rounded-full mix-blend-multiply filter blur-3xl animate-blob" />
      <div className="absolute top-0 -right-4 w-72 h-72 bg-deep-amber/30 rounded-full mix-blend-multiply filter blur-3xl animate-blob animation-delay-2000" />
      <div className="absolute -bottom-8 left-20 w-72 h-72 bg-orange-300/30 rounded-full mix-blend-multiply filter blur-3xl animate-blob animation-delay-4000" />
      <div className="absolute bottom-8 right-20 w-72 h-72 bg-golden-orange/20 rounded-full mix-blend-multiply filter blur-3xl animate-blob animation-delay-6000" />

      {/* Floating Particles */}
      <div className="absolute inset-0">
        {[...Array(20)].map((_, i) => (
          <div
            key={i}
            className="absolute w-2 h-2 bg-golden-orange/20 rounded-full animate-float-random"
            style={{
              left: `${Math.random() * 100}%`,
              top: `${Math.random() * 100}%`,
              animationDelay: `${Math.random() * 5}s`,
              animationDuration: `${10 + Math.random() * 10}s`,
            }}
          />
        ))}
      </div>

      {/* Mesh Pattern Overlay */}
      <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHZpZXdCb3g9IjAgMCA2MCA2MCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48ZyBmaWxsPSJub25lIiBmaWxsLXJ1bGU9ImV2ZW5vZGQiPjxnIGZpbGw9IiNGRkE1MDAiIGZpbGwtb3BhY2l0eT0iMC4wNSI+PHBhdGggZD0iTTM2IDM0djJoLTJ2LTJoMnptLTQgMHYyaC0ydi0yaDF6bS00IDB2MmgtMnYtMmgyem0tNCAwdjJoLTJ2LTJoMnptLTQgMHYyaC0ydi0yaDF6bS00IDB2MmgtMnYtMmgyem0tNCAwdjJoLTJ2LTJoMnptLTQgMHYyaC0ydi0yaDF6bS00IDB2MmgtMnYtMmgyem0tNCAwdjJoLTJ2LTJoMXptNDAgMHYyaC0ydi0yaDJ6bTAgNHYyaC0ydi0yaDJ6bTAgNHYyaC0ydi0yaDJ6bTAgNHYyaC0ydi0yaDJ6bTAgNHYyaC0ydi0yaDJ6Ii8+PC9nPjwvZz48L3N2Zz4=')] opacity-30" />

      {/* Shimmer Effect */}
      <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/5 to-transparent animate-shimmer" />
    </div>
  );
};

export default AnimatedBackground;
