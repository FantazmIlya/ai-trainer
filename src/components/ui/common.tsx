import React from 'react';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export const Button = React.forwardRef<HTMLButtonElement, React.ButtonHTMLAttributes<HTMLButtonElement> & { variant?: 'primary' | 'secondary' | 'outline' | 'ghost' }>(
  ({ className, variant = 'primary', ...props }, ref) => {
    const variants = {
      primary: 'bg-[#1D1D1F] text-white hover:bg-black',
      secondary: 'bg-[#0071E3] text-white hover:bg-[#0077ED]',
      outline: 'bg-transparent border-2 border-[#1D1D1F] text-[#1D1D1F] hover:bg-[#1D1D1F] hover:text-white',
      ghost: 'bg-transparent hover:bg-black/5 text-[#1D1D1F]',
    };

    return (
      <button
        ref={ref}
        className={cn('apple-button flex items-center justify-center disabled:opacity-50 disabled:pointer-events-none', variants[variant], className)}
        {...props}
      />
    );
  }
);

export const Input = React.forwardRef<HTMLInputElement, React.InputHTMLAttributes<HTMLInputElement>>(
  ({ className, ...props }, ref) => {
    return (
      <input
        ref={ref}
        className={cn(
          'w-full px-4 py-3 rounded-2xl bg-white/50 border border-black/10 focus:border-[#0071E3] focus:ring-2 focus:ring-[#0071E3]/20 transition-all outline-none text-[#1D1D1F]',
          className
        )}
        {...props}
      />
    );
  }
);

export const Card = ({ children, className }: { children: React.ReactNode; className?: string }) => (
  <div className={cn('apple-card', className)}>
    {children}
  </div>
);
