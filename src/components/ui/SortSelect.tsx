import React from 'react';
import { ArrowUpDown, ChevronDown } from 'lucide-react';

interface SortOption {
  value: string;
  label: string;
}

interface SortSelectProps {
  value: string;
  onChange: (value: string) => void;
  options: SortOption[];
  className?: string;
}

export default function SortSelect({ value, onChange, options, className = '' }: SortSelectProps) {
  return (
    <div className={`relative flex items-center bg-white border border-slate-300 hover:border-sky-400 rounded-xl px-3 py-2 transition ${className}`}>
      <ArrowUpDown className="w-4 h-4 text-slate-500 shrink-0 mr-2" />
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="w-full bg-transparent font-semibold text-slate-700 outline-none cursor-pointer text-sm appearance-none pr-6"
      >
        {options.map((opt) => (
          <option key={opt.value} value={opt.value}>
            {opt.label}
          </option>
        ))}
      </select>
      <ChevronDown className="w-4 h-4 text-slate-400 absolute right-3 pointer-events-none" />
    </div>
  );
}
