import React, { useState, useEffect } from 'react';
import { cn } from '@/lib/utils';
import { X } from 'lucide-react';

export const Button = React.forwardRef<HTMLButtonElement, React.ButtonHTMLAttributes<HTMLButtonElement> & { variant?: 'primary' | 'secondary' | 'outline' | 'ghost' | 'danger', size?: 'sm' | 'md' | 'lg' }>(
  ({ className, variant = 'primary', size = 'md', ...props }, ref) => {
    const variants = {
      primary: 'bg-[#00A854] text-white hover:bg-[#009048] border border-transparent',
      secondary: 'bg-slate-100 text-slate-900 hover:bg-slate-200 border border-transparent',
      outline: 'bg-white text-slate-700 border border-slate-300 hover:bg-slate-50',
      ghost: 'bg-transparent text-slate-700 hover:bg-slate-100 border border-transparent',
      danger: 'bg-red-50 text-red-600 hover:bg-red-100 border border-transparent',
    };
    const sizes = {
      sm: 'h-8 px-3 text-xs',
      md: 'h-10 px-4 text-sm',
      lg: 'h-12 px-6 text-base',
    };
    return (
      <button
        ref={ref}
        className={cn('inline-flex items-center justify-center rounded-md font-medium transition-colors focus:outline-none focus:ring-2 focus:ring-[#00A854] focus:ring-offset-2 disabled:opacity-50 disabled:pointer-events-none', variants[variant], sizes[size], className)}
        {...props}
      />
    );
  }
);
Button.displayName = 'Button';

export const Input = React.forwardRef<HTMLInputElement, React.InputHTMLAttributes<HTMLInputElement>>(
  ({ className, ...props }, ref) => {
    return (
      <input
        ref={ref}
        className={cn('flex h-10 w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-[#00A854] focus:border-transparent disabled:cursor-not-allowed disabled:opacity-50', className)}
        {...props}
      />
    );
  }
);
Input.displayName = 'Input';

export const Card = ({ className, children, ...props }: React.HTMLAttributes<HTMLDivElement>) => (
  <div className={cn('rounded-xl border border-slate-200 bg-white text-slate-950 shadow-sm', className)} {...props}>
    {children}
  </div>
);

export const Badge = ({ className, variant = 'default', children, ...props }: React.HTMLAttributes<HTMLDivElement> & { variant?: 'default' | 'success' | 'warning' | 'danger' | 'outline' }) => {
  const variants = {
    default: 'bg-slate-100 text-slate-800',
    success: 'bg-green-100 text-green-800',
    warning: 'bg-yellow-100 text-yellow-800',
    danger: 'bg-red-100 text-red-800',
    outline: 'border border-slate-200 text-slate-800',
  };
  return (
    <div className={cn('inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold transition-colors', variants[variant], className)} {...props}>
      {children}
    </div>
  );
};

export const Drawer = ({ isOpen, onClose, title, children, position = 'right', width = 'w-96' }: { isOpen: boolean, onClose: () => void, title: string, children: React.ReactNode, position?: 'right' | 'bottom', width?: string }) => {
  if (!isOpen) return null;
  
  return (
    <div className="fixed inset-0 z-50 flex">
      <div className="fixed inset-0 bg-black/30 backdrop-blur-sm transition-opacity" onClick={onClose} />
      <div className={cn("fixed bg-white shadow-2xl transition-transform duration-300 ease-in-out flex flex-col", 
        position === 'right' ? `inset-y-0 right-0 ${width} border-l border-slate-200` : "inset-x-0 bottom-0 h-1/2 border-t border-slate-200"
      )}>
        <div className="flex items-center justify-between border-b border-slate-200 px-6 py-4">
          <h2 className="text-lg font-semibold text-slate-900">{title}</h2>
          <button onClick={onClose} className="rounded-full p-1 hover:bg-slate-100 transition-colors">
            <X className="h-5 w-5 text-slate-500" />
          </button>
        </div>
        <div className="flex-1 overflow-y-auto p-6">
          {children}
        </div>
      </div>
    </div>
  );
};

export const Tabs = ({ tabs, activeTab, onChange }: { tabs: string[], activeTab: string, onChange: (tab: string) => void }) => (
  <div className="flex space-x-1 border-b border-slate-200">
    {tabs.map(tab => (
      <button
        key={tab}
        onClick={() => onChange(tab)}
        className={cn(
          "px-4 py-2.5 text-sm font-medium transition-all relative",
          activeTab === tab ? "text-[#00A854]" : "text-slate-500 hover:text-slate-700"
        )}
      >
        {tab}
        {activeTab === tab && (
          <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-[#00A854]" />
        )}
      </button>
    ))}
  </div>
);
