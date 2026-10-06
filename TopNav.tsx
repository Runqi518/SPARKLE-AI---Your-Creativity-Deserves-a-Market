"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Lightbulb, Box, BadgeDollarSign } from "lucide-react";

export function TopNav({ 
  leftContent 
}: { 
  leftContent?: React.ReactNode 
}) {
  const pathname = usePathname();

  const navItems = [
    { label: "创意", href: "/", icon: Lightbulb },
    { label: "素材", href: "/assets", icon: Box },
    { label: "商业", href: "/commercial", icon: BadgeDollarSign },
  ];

  return (
    <header className="h-14 border-b border-white/10 bg-black/20 backdrop-blur-md flex items-center justify-between px-6 z-50 relative">
      <div className="flex items-center gap-6">
        <Link href="/" className="flex items-center gap-2 mr-4 group">
          <div className="w-5 h-5 rounded glass-pink flex items-center justify-center font-bold text-[10px] group-hover:scale-110 transition-transform">
            S
          </div>
          <span className="font-bold text-base tracking-wide text-white group-hover:text-pink-300 transition-colors">Sparkle</span>
          {pathname === "/" && <span className="text-[10px] text-glass-muted ml-1 font-medium tracking-widest uppercase">From Prompt to Profit.</span>}
        </Link>
        
        {leftContent}
      </div>

      <div className="flex items-center gap-6">
        {/* Navigation - Glass Pill */}
        <div className="flex bg-black/40 backdrop-blur-xl rounded-full p-1 border border-white/10 shadow-inner">
          {navItems.map((item) => {
            const isActive = item.href === "/" 
              ? pathname === "/" || pathname.startsWith("/project") 
              : pathname.startsWith(item.href);
              
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`flex items-center gap-1.5 px-4 py-1 rounded-full text-xs transition-all duration-300 ${
                  isActive 
                    ? "glass-silver shadow-md" 
                    : "text-glass-muted hover:text-white hover:bg-white/5"
                }`}
              >
                <item.icon className="w-3.5 h-3.5" />
                {item.label}
              </Link>
            );
          })}
        </div>

        {/* Avatar */}
        <div className="flex items-center gap-4">
          <div className="w-8 h-8 rounded-full border border-white/30 overflow-hidden shadow-[0_0_10px_rgba(255,255,255,0.2)]">
            <img src="https://api.dicebear.com/7.x/avataaars/svg?seed=Felix" alt="avatar" className="w-full h-full object-cover bg-white/10 backdrop-blur" />
          </div>
        </div>
      </div>
    </header>
  );
}
