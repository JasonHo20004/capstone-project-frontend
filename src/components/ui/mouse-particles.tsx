import React, { useRef, useEffect } from 'react';

type Particle = {
  x: number;
  y: number;
  vx: number;
  vy: number;
  size: number;
  color: string;
};

// Vibrant, gamified colors
const COLORS = ['#3b82f6', '#8b5cf6', '#10b981', '#f59e0b', '#ec4899', '#06b6d4'];

const CONFIG = {
  MAX_DISTANCE: 120, // Max distance to form constellation connected lines
  MOUSE_RADIUS: 140, // Distance for mouse repel
  REPEL_STRENGTH: 3, // How fast they scatter away
};

export const MouseParticles = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const wrapperRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    const wrapper = wrapperRef.current;
    if (!canvas || !wrapper) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let particles: Particle[] = [];
    let animationFrameId: number;
    let mouse = { x: -1000, y: -1000 };

    // Use window listener so we can maintain pointer-events-none on canvas
    // to never block clicks on the actual UI overlay.
    const handleMouseMove = (e: MouseEvent) => {
      const rect = wrapper.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;

      // Only update if inside the banner area
      if (x >= 0 && x <= rect.width && y >= 0 && y <= rect.height) {
        mouse.x = x;
        mouse.y = y;
      } else {
        mouse.x = -1000;
        mouse.y = -1000;
      }
    };

    const handleMouseLeave = () => {
      mouse.x = -1000;
      mouse.y = -1000;
    };

    window.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseleave', handleMouseLeave); // If leaves browser

    const resizeCanvas = () => {
      const rect = wrapper.getBoundingClientRect();
      const dpr = window.devicePixelRatio || 1;
      canvas.width = rect.width * dpr;
      canvas.height = rect.height * dpr;
      ctx.scale(dpr, dpr);
      canvas.style.width = `${rect.width}px`;
      canvas.style.height = `${rect.height}px`;

      initParticles();
    };

    const initParticles = () => {
      particles = [];
      const rect = wrapper.getBoundingClientRect();
      // Scale particle count nicely based on the banner area
      const count = Math.floor((rect.width * rect.height) / 9000); 

      for (let i = 0; i < Math.min(count, 150); i++) {
        particles.push({
          x: Math.random() * rect.width,
          y: Math.random() * rect.height,
          vx: (Math.random() - 0.5) * 1.5,
          vy: (Math.random() - 0.5) * 1.5,
          size: Math.random() * 2 + 1.5, // sizes 1.5 to 3.5
          color: COLORS[Math.floor(Math.random() * COLORS.length)],
        });
      }
    };

    const drawParticles = () => {
      const rect = wrapper.getBoundingClientRect();
      ctx.clearRect(0, 0, rect.width, rect.height);

      for (let i = 0; i < particles.length; i++) {
        const p = particles[i];

        // Ensure particles stay within bounds
        if (p.x < 0) p.vx *= -1;
        if (p.x > rect.width) p.vx *= -1;
        if (p.y < 0) p.vy *= -1;
        if (p.y > rect.height) p.vy *= -1;

        // Base movement
        p.x += p.vx;
        p.y += p.vy;

        // Core physics: Mouse Repel (Scatter effect)
        const dx = p.x - mouse.x;
        const dy = p.y - mouse.y;
        const dist = Math.sqrt(dx * dx + dy * dy);

        if (dist < CONFIG.MOUSE_RADIUS && mouse.x !== -1000) {
          const forceDirectionX = dx / dist;
          const forceDirectionY = dy / dist;
          // Exponential decay force based on distance
          const pushForce = Math.pow((CONFIG.MOUSE_RADIUS - dist) / CONFIG.MOUSE_RADIUS, 2);
          
          p.x += forceDirectionX * pushForce * CONFIG.REPEL_STRENGTH;
          p.y += forceDirectionY * pushForce * CONFIG.REPEL_STRENGTH;
        }

        // Draw the constellation network lines
        for (let j = i + 1; j < particles.length; j++) {
          const p2 = particles[j];
          const dx2 = p.x - p2.x;
          const dy2 = p.y - p2.y;
          const dist2 = Math.sqrt(dx2 * dx2 + dy2 * dy2);

          if (dist2 < CONFIG.MAX_DISTANCE) {
            ctx.beginPath();
            const opacity = Math.max(0, 1 - dist2 / CONFIG.MAX_DISTANCE);
            // Dynamic colorful lines
            ctx.strokeStyle = `rgba(255, 255, 255, ${opacity * 0.2})`;
            ctx.lineWidth = 1;
            ctx.moveTo(p.x, p.y);
            ctx.lineTo(p2.x, p2.y);
            ctx.stroke();
          }
        }

        // Draw particle node
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
        
        ctx.shadowBlur = 12;
        ctx.shadowColor = p.color;
        ctx.fillStyle = p.color;
        ctx.fill();
        ctx.shadowBlur = 0;
      }
    };

    const animate = () => {
      drawParticles();
      animationFrameId = requestAnimationFrame(animate);
    };

    window.addEventListener('resize', resizeCanvas);
    
    // First paint setup
    resizeCanvas();
    animate();

    return () => {
      window.removeEventListener('resize', resizeCanvas);
      window.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseleave', handleMouseLeave);
      cancelAnimationFrame(animationFrameId);
    };
  }, []);

  // pointer-events-none ensures it never intercepts real UI clicks
  return (
    <div ref={wrapperRef} className="absolute inset-0 z-0 overflow-hidden pointer-events-none">
      <canvas ref={canvasRef} className="block w-full h-full" />
    </div>
  );
};
