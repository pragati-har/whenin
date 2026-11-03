import type { ButtonHTMLAttributes, ReactNode } from 'react';

type ButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: 'primary' | 'secondary' | 'ghost';
  icon?: ReactNode;
};

export function Button({ variant = 'primary', icon, className = '', children, ...props }: ButtonProps) {
  const styles = {
    primary: 'bg-[#c85d2b] text-white hover:bg-[#b35221]',
    secondary: 'bg-[#f1e5dd] text-[#2d1b16] hover:bg-[#ead7ca]',
    ghost: 'bg-transparent text-[#2d1b16] hover:bg-[#f5eee8]',
  };

  return (
    <button
      className={`inline-flex items-center justify-center gap-2 rounded-xl px-4 py-2.5 font-medium transition ${styles[variant]} disabled:cursor-not-allowed disabled:opacity-60 ${className}`}
      {...props}
    >
      {icon}
      {children}
    </button>
  );
}
