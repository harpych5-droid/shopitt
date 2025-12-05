import { useEffect, useRef, useState } from 'react';

/**
 * Hook to trigger confetti animation
 * @param triggerCondition - boolean that triggers confetti when true
 * @param duration - how long confetti lasts in ms
 */
export const useConfetti = (triggerCondition: boolean, duration = 2000) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const confettiRef = useRef<ConfettiPiece[]>([]);

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
    if (!triggerCondition || !canvasRef.current) return;

    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Reset canvas size
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;

    const colors = [
      '#3B82F6', // blue
      '#EC4899', // pink
      '#8B5CF6', // purple
      '#F59E0B', // amber
      '#10B981', // emerald
    ];

    // Create confetti pieces
    const pieceCount = 50;
    const pieces: ConfettiPiece[] = [];

    for (let i = 0; i < pieceCount; i++) {
      pieces.push({
        x: canvas.width / 2,
        y: canvas.height / 2,
        vx: (Math.random() - 0.5) * 8,
        vy: Math.random() * -8 - 4,
        angle: Math.random() * Math.PI * 2,
        vangle: (Math.random() - 0.5) * 0.1,
        size: Math.random() * 6 + 3,
        color: colors[Math.floor(Math.random() * colors.length)],
        life: 1,
      });
    }

    confettiRef.current = pieces;
    const startTime = Date.now();

    const animate = () => {
      const elapsed = Date.now() - startTime;
      const progress = elapsed / duration;

      ctx.clearRect(0, 0, canvas.width, canvas.height);

      confettiRef.current.forEach((piece) => {
        // Physics
        piece.vy += 0.2; // gravity
        piece.x += piece.vx;
        piece.y += piece.vy;
        piece.angle += piece.vangle;
        piece.life = Math.max(0, 1 - progress);

        // Draw
        ctx.save();
        ctx.globalAlpha = piece.life;
        ctx.translate(piece.x, piece.y);
        ctx.rotate(piece.angle);
        ctx.fillStyle = piece.color;
        ctx.fillRect(-piece.size / 2, -piece.size / 2, piece.size, piece.size);
        ctx.restore();
      });

      if (progress < 1) {
        requestAnimationFrame(animate);
      } else {
        ctx.clearRect(0, 0, canvas.width, canvas.height);
      }
    };

    animate();

    const handleResize = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, [triggerCondition, duration]);

  return canvasRef;
};

/**
 * Hook for smooth scroll fade-in animation on images
 */
export const useFadeInOnScroll = (threshold = 0.3) => {
  const ref = useRef<HTMLElement | null>(null);
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsVisible(true);
          observer.unobserve(entry.target);
        }
      },
      { threshold }
    );

    if (ref.current) {
      observer.observe(ref.current);
    }

    return () => observer.disconnect();
  }, [threshold]);

  return { ref, isVisible };
};

/**
 * Hook for detecting when item is added to cart
 */
export const useItemAddedAnimation = () => {
  const [isAnimating, setIsAnimating] = useState(false);

  const triggerAnimation = () => {
    setIsAnimating(true);
    setTimeout(() => setIsAnimating(false), 600);
  };

  return { isAnimating, triggerAnimation };
};

/**
 * Hook for hover scale effect
 */
export const useHoverScale = (scale = 1.05, duration = 200) => {
  const ref = useRef<HTMLElement | null>(null);

  useEffect(() => {
    const element = ref.current;
    if (!element) return;

    const handleMouseEnter = () => {
      element.style.transition = `transform ${duration}ms cubic-bezier(0.23, 1, 0.320, 1)`;
      element.style.transform = `scale(${scale})`;
    };

    const handleMouseLeave = () => {
      element.style.transform = 'scale(1)';
    };

    element.addEventListener('mouseenter', handleMouseEnter);
    element.addEventListener('mouseleave', handleMouseLeave);

    return () => {
      element.removeEventListener('mouseenter', handleMouseEnter);
      element.removeEventListener('mouseleave', handleMouseLeave);
    };
  }, [scale, duration]);

  return ref;
};

/**
 * Hook for card lift and rotate on hover
 */
export const useCardLift = () => {
  const ref = useRef<HTMLElement | null>(null);

  useEffect(() => {
    const element = ref.current;
    if (!element) return;

    const handleMouseMove = (e: MouseEvent) => {
      const rect = element.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;

      const centerX = rect.width / 2;
      const centerY = rect.height / 2;

      const rotateX = (y - centerY) * 0.05;
      const rotateY = (centerX - x) * 0.05;

      element.style.transition = 'none';
      element.style.transform = `
        translateY(-8px) 
        rotateX(${rotateX}deg) 
        rotateY(${rotateY}deg)
        perspective(1000px)
      `;
    };

    const handleMouseLeave = () => {
      element.style.transition = 'transform 0.3s cubic-bezier(0.23, 1, 0.320, 1)';
      element.style.transform = 'translateY(0) rotateX(0) rotateY(0)';
    };

    element.addEventListener('mousemove', handleMouseMove);
    element.addEventListener('mouseleave', handleMouseLeave);

    return () => {
      element.removeEventListener('mousemove', handleMouseMove);
      element.removeEventListener('mouseleave', handleMouseLeave);
    };
  }, []);

  return ref;
};

/**
 * Hook for toast notifications
 */
interface ToastOptions {
  duration?: number;
  type?: 'success' | 'error' | 'info' | 'warning';
}

export const useToast = () => {
  const [toasts, setToasts] = useState<
    Array<{
      id: string;
      message: string;
      type: string;
    }>
  >([]);

  const addToast = (message: string, options: ToastOptions = {}) => {
    const { duration = 3000, type = 'info' } = options;
    const id = Math.random().toString(36).substr(2, 9);

    setToasts((prev) => [...prev, { id, message, type }]);

    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, duration);

    return id;
  };

  const removeToast = (id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  };

  return { toasts, addToast, removeToast };
};
