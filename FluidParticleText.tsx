"use client";

import React, { useRef, useState, useEffect } from 'react';

export const FluidParticleText = () => {
  const containerRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [isHovering, setIsHovering] = useState(false);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let particles: Array<{ x: number; y: number; vx: number; vy: number; life: number; maxLife: number; size: number }> = [];
    let mouse = { x: -1000, y: -1000 };
    let animationFrameId: number;

    const resize = () => {
      if (!containerRef.current) return;
      const rect = containerRef.current.getBoundingClientRect();
      canvas.width = rect.width;
      canvas.height = rect.height;
    };
    
    resize();
    window.addEventListener('resize', resize);

    const handleMouseMove = (e: MouseEvent) => {
      const rect = canvas.getBoundingClientRect();
      mouse.x = e.clientX - rect.left;
      mouse.y = e.clientY - rect.top;
      
      // Spawn particles on mouse move
      if (isHovering) {
        for (let i = 0; i < 3; i++) {
          particles.push({
            x: mouse.x + (Math.random() - 0.5) * 20,
            y: mouse.y + (Math.random() - 0.5) * 20,
            vx: (Math.random() - 0.5) * 2,
            vy: (Math.random() - 0.5) * 2 - 0.5, // slightly upwards
            life: 1,
            maxLife: Math.random() * 50 + 30,
            size: Math.random() * 2 + 0.5
          });
        }
      }
    };

    canvas.addEventListener('mousemove', handleMouseMove);

    const render = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      // Draw pink fluid glow around mouse
      if (isHovering) {
        const gradient = ctx.createRadialGradient(mouse.x, mouse.y, 0, mouse.x, mouse.y, 100);
        gradient.addColorStop(0, 'rgba(255, 192, 203, 0.15)'); // Pink with low opacity
        gradient.addColorStop(1, 'rgba(255, 192, 203, 0)');
        ctx.fillStyle = gradient;
        ctx.fillRect(0, 0, canvas.width, canvas.height);
      }

      // Update and draw particles
      particles.forEach((p, index) => {
        p.x += p.vx;
        p.y += p.vy;
        p.life++;

        if (p.life >= p.maxLife) {
          particles.splice(index, 1);
        } else {
          ctx.beginPath();
          ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
          const alpha = 1 - p.life / p.maxLife;
          ctx.fillStyle = `rgba(255, 192, 203, ${alpha * 0.8})`; // Pink particles
          ctx.fill();
        }
      });

      animationFrameId = requestAnimationFrame(render);
    };

    render();

    return () => {
      window.removeEventListener('resize', resize);
      canvas.removeEventListener('mousemove', handleMouseMove);
      cancelAnimationFrame(animationFrameId);
    };
  }, [isHovering]);

  return (
    <div 
      ref={containerRef}
      className="relative mb-4 -ml-4 p-4 inline-block"
      onMouseEnter={() => setIsHovering(true)}
      onMouseLeave={() => setIsHovering(false)}
    >
      <canvas 
        ref={canvasRef}
        className="absolute inset-0 pointer-events-auto z-20"
        style={{ mixBlendMode: 'screen' }}
      />
      <h2 className="relative z-10 text-3xl font-serif italic tracking-[0.1em] text-white/70 pointer-events-none drop-shadow-md">
        Boundless ideas. Tangible results.
      </h2>
    </div>
  );
};
