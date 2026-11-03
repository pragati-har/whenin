import type { InputHTMLAttributes } from 'react';

type Props = InputHTMLAttributes<HTMLInputElement> & {
  label: string;
};

export function InputField({ label, className = '', ...props }: Props) {
  return (
    <label className="block w-full text-sm font-medium text-[#2d1b16]">
      <span className="mb-2 block">{label}</span>
      <input
        className={`w-full rounded-xl border border-[#e7d9cf] bg-white px-3 py-2.5 outline-none transition focus:border-[#c85d2b] focus:ring-2 focus:ring-[#f3d3bd] ${className}`}
        {...props}
      />
    </label>
  );
}
