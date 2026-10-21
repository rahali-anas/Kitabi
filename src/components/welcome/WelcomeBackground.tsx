import { useEffect, useRef } from 'react';

export function WelcomeBackground() {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let width = window.innerWidth;
    let height = window.innerHeight;
    let animationFrameId: number;

    // Theme-aware color
    let particleColor = 'rgba(17, 17, 17, 0.15)'; // Default light mode ink
    const updateColor = () => {
      const isDark = document.documentElement.classList.contains('dark');
      particleColor = isDark ? 'rgba(237, 237, 237, 0.15)' : 'rgba(17, 17, 17, 0.15)';
    };
    updateColor();

    // Resize handler
    const handleResize = () => {
      width = window.innerWidth;
      height = window.innerHeight;
      canvas.width = width;
      canvas.height = height;
    };
    handleResize();
    window.addEventListener('resize', handleResize);

    // Mouse tracking
    const mouse = { x: -1000, y: -1000 };
    const handleMouseMove = (e: MouseEvent) => {
      mouse.x = e.clientX;
      mouse.y = e.clientY;
    };
    const handleMouseLeave = () => {
      mouse.x = -1000;
      mouse.y = -1000;
    };
    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mouseleave', handleMouseLeave);

    // Theme observer
    const observer = new MutationObserver((mutations) => {
      mutations.forEach((mutation) => {
        if (mutation.attributeName === 'class') updateColor();
      });
    });
    observer.observe(document.documentElement, { attributes: true });

    // Particle setup
    const particleCount = 60;
    const particles: { x: number; y: number; vx: number; vy: number; baseX: number; baseY: number }[] = [];

    for (let i = 0; i < particleCount; i++) {
      const x = Math.random() * width;
      const y = Math.random() * height;
      particles.push({
        x,
        y,
        vx: (Math.random() - 0.5) * 0.3, // Slow drift
        vy: (Math.random() - 0.5) * 0.3,
        baseX: x,
        baseY: y,
      });
    }

    // Animation loop
    const animate = () => {
      ctx.clearRect(0, 0, width, height);
      ctx.fillStyle = particleColor;

      for (let i = 0; i < particles.length; i++) {
        const p = particles[i];

        // Slow drift
        p.x += p.vx;
        p.y += p.vy;

        // Wrap around edges
        if (p.x < 0) p.x = width;
        if (p.x > width) p.x = 0;
        if (p.y < 0) p.y = height;
        if (p.y > height) p.y = 0;

        // Mouse interaction
        const dx = mouse.x - p.x;
        const dy = mouse.y - p.y;
        const distance = Math.sqrt(dx * dx + dy * dy);
        const maxDistance = 200;

        if (distance < maxDistance) {
          const force = (maxDistance - distance) / maxDistance;
          // Push slightly away from the cursor
          p.x -= (dx / distance) * force * 2;
          p.y -= (dy / distance) * force * 2;
        }

        // Return to drift slowly
        p.x += p.vx;
        p.y += p.vy;

        // Draw particle
        ctx.beginPath();
        ctx.arc(p.x, p.y, 1.5, 0, Math.PI * 2);
        ctx.fill();
      }

      animationFrameId = requestAnimationFrame(animate);
    };
    animate();

    return () => {
      window.removeEventListener('resize', handleResize);
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseleave', handleMouseLeave);
      observer.disconnect();
      cancelAnimationFrame(animationFrameId);
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 0,
        pointerEvents: 'none',
        opacity: 0.8,
      }}
    />
  );
}