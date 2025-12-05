import { useRef, useEffect, useState } from 'react';
import './Confetti.css';

interface ConfettiProps {
  trigger: boolean;
  duration?: number;
}

export const Confetti = ({ trigger, duration = 2000 }: ConfettiProps) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [isMobile, setIsMobile] = useState(window.innerWidth < 768);

  interface ConfettiPiece {
    x: number;
    y: number;
    vx: number;
    vy: number;
    angle: number;
    vangle: number;
    size: number;
    color: string;
    life: number;
  }

  useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth < 768);
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  useEffect(() => {
    if (!trigger || !canvasRef.current) return;

    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
    canvas.style.display = 'block';

    const colors = [
      '#3B82F6', // primary blue
      '#EC4899', // accent pink
      '#8B5CF6', // purple
      '#F59E0B', // amber
      '#10B981', // emerald
      '#06B6D4', // cyan
    ];

    // Reduce particle count on mobile for better performance
    const pieceCount = isMobile ? 30 : 60;
    const pieces: ConfettiPiece[] = [];

    for (let i = 0; i < pieceCount; i++) {
      const angle = (i / pieceCount) * Math.PI * 2;
      const velocity = 6 + Math.random() * 4;

      pieces.push({
        x: canvas.width / 2,
        y: canvas.height / 2,
        vx: Math.cos(angle) * velocity,
        vy: Math.sin(angle) * velocity - 2,
        angle: Math.random() * Math.PI * 2,
        vangle: (Math.random() - 0.5) * 0.15,
        size: Math.random() * 8 + 4,
        color: colors[Math.floor(Math.random() * colors.length)],
        life: 1,
      });
    }

    const startTime = Date.now();

    const animate = () => {
      const elapsed = Date.now() - startTime;
      const progress = Math.min(elapsed / duration, 1);

      ctx.clearRect(0, 0, canvas.width, canvas.height);

      pieces.forEach((piece) => {
        // Apply physics
        piece.vy += 0.15; // gravity
        piece.x += piece.vx;
        piece.y += piece.vy;
        piece.angle += piece.vangle;

        // Fade out
        piece.life = Math.max(0, 1 - progress);

        // Draw confetti piece
        ctx.save();
        ctx.globalAlpha = piece.life;
        ctx.translate(piece.x, piece.y);
        ctx.rotate(piece.angle);
        ctx.fillStyle = piece.color;

        // Draw as rectangle with slight randomness
        ctx.fillRect(
          -piece.size / 2,
          -piece.size / 2,
          piece.size,
          piece.size * 0.6
        );

        ctx.restore();
      });

      if (progress < 1) {
        requestAnimationFrame(animate);
      } else {
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        canvas.style.display = 'none';
      }
    };

    animate();

    const handleResize = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, [trigger, duration, isMobile]);

  return (
    <canvas
      ref={canvasRef}
      className="fixed inset-0 pointer-events-none z-50"
      style={{ display: 'none' }}
    />
  );
};

export default Confetti;
