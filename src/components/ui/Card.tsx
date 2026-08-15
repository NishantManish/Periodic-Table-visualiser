import React from 'react';
import { motion, HTMLMotionProps } from 'motion/react';

export interface CardProps extends Omit<HTMLMotionProps<'div'>, 'children'> {
  children: React.ReactNode;
  variant?: 'glass' | 'solid' | 'outline' | 'glow';
  hoverEffect?: boolean;
  padding?: 'none' | 'sm' | 'md' | 'lg';
  className?: string;
}

export const Card: React.FC<CardProps> = ({
  children,
  variant = 'glass',
  hoverEffect = true,
  padding = 'md',
  className = '',
  ...props
}) => {
  const baseStyles = 'rounded-2xl transition-all duration-200 relative overflow-hidden';

  const variants = {
    glass:
      'bg-slate-900/80 backdrop-blur-xl border border-slate-800/80 shadow-lg shadow-black/40',
    solid:
      'bg-slate-900 border border-slate-800 text-slate-100 shadow-md',
    outline:
      'bg-transparent border border-slate-800 hover:border-slate-700 text-slate-200',
    glow:
      'bg-slate-900/90 backdrop-blur-xl border border-sky-500/30 shadow-lg shadow-sky-500/10',
  };

  const paddings = {
    none: 'p-0',
    sm: 'p-3 sm:p-4',
    md: 'p-5 sm:p-6',
    lg: 'p-6 sm:p-8',
  };

  return (
    <motion.div
      whileHover={hoverEffect ? { y: -2, transition: { duration: 0.15 } } : undefined}
      className={`${baseStyles} ${variants[variant]} ${paddings[padding]} ${className}`}
      {...props}
    >
      {children}
    </motion.div>
  );
};
