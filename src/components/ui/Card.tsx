import type { ReactNode } from 'react';

export function Card({ children, className = '' }: { children: ReactNode; className?: string }) {
  return <div className={`rounded-2xl border border-[#f0e4d6] bg-[#fffdfb] p-5 shadow-sm ${className}`}>{children}</div>;
}
