'use client';

import { cn } from '@/lib/utils';
import { motion } from 'framer-motion';

interface CardProps {
  children: React.ReactNode;
  className?: string;
  glowColor?: string;
  hover?: boolean;
  onClick?: () => void;
}

export default function Card({
  children,
  className,
  glowColor,
  hover = true,
  onClick,
}: CardProps) {
  return (
    <motion.div
      whileHover={hover ? { y: -4, scale: 1.01 } : undefined}
      className={cn(
        'relative rounded-3xl bg-navy-light/80 backdrop-blur-sm border border-white/10 p-6 transition-all duration-300',
        hover && 'cursor-pointer',
        className
      )}
      style={
        glowColor
          ? {
              boxShadow: `0 0 20px ${glowColor}20, 0 0 40px ${glowColor}10`,
            }
          : undefined
      }
      onMouseEnter={(e) => {
        if (glowColor && hover) {
          (e.currentTarget as HTMLElement).style.boxShadow = `0 0 30px ${glowColor}40, 0 0 60px ${glowColor}20`;
        }
      }}
      onMouseLeave={(e) => {
        if (glowColor && hover) {
          (e.currentTarget as HTMLElement).style.boxShadow = `0 0 20px ${glowColor}20, 0 0 40px ${glowColor}10`;
        }
      }}
      onClick={onClick}
    >
      {children}
    </motion.div>
  );
}
