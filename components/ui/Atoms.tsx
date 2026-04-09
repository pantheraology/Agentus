import React, { ButtonHTMLAttributes, InputHTMLAttributes, TextareaHTMLAttributes } from 'react';
import { LucideIcon } from 'lucide-react';

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'ghost' | 'destructive';
  size?: 'default' | 'sm' | 'icon';
  icon?: LucideIcon;
}

export const Button: React.FC<ButtonProps> = ({ children, variant = 'primary', size = 'default', className = '', icon: Icon, ...props }) => {
  const base = "inline-flex items-center justify-center rounded-lg text-sm font-medium transition-all duration-200 focus:outline-none disabled:opacity-50 disabled:cursor-not-allowed select-none active:scale-95";
  
  const variants = {
    primary: "bg-[var(--accent-primary)] text-white hover:bg-[oklch(0.60_0.22_265)] shadow-[0_0_15px_rgba(100,50,255,0.3)] hover:shadow-[0_0_20px_rgba(100,50,255,0.5)] border border-transparent",
    secondary: "bg-[var(--bg-card)] text-[var(--fg-primary)] border border-[var(--border-subtle)] hover:border-[var(--fg-secondary)] hover:bg-[var(--bg-panel)]",
    ghost: "text-[var(--fg-secondary)] hover:text-[var(--fg-primary)] hover:bg-[var(--bg-panel)]",
    destructive: "bg-[var(--accent-error)] text-white hover:opacity-90",
  };
  
  const sizes = { 
    default: "h-9 px-4 py-2", 
    sm: "h-8 rounded-md px-3 text-xs", 
    icon: "h-9 w-9 p-0" 
  };

  return (
    <button className={`${base} ${variants[variant]} ${sizes[size]} ${className}`} {...props}>
      {Icon && <Icon size={14} className={children ? "mr-2" : ""} />}
      {children}
    </button>
  );
};

export const Input: React.FC<InputHTMLAttributes<HTMLInputElement>> = (props) => (
  <input {...props} className={`flex h-9 w-full rounded-md border border-[var(--border-subtle)] bg-[var(--bg-deep)] px-3 py-1 text-sm text-[var(--fg-primary)] shadow-inner transition-colors focus:border-[var(--accent-primary)] focus:ring-1 focus:ring-[var(--accent-primary)] outline-none placeholder:text-[var(--fg-muted)] ${props.className || ''}`} />
);

export const Textarea: React.FC<TextareaHTMLAttributes<HTMLTextAreaElement>> = (props) => (
  <textarea {...props} className={`flex min-h-[80px] w-full rounded-md border border-[var(--border-subtle)] bg-[var(--bg-deep)] px-3 py-2 text-sm text-[var(--fg-primary)] shadow-inner transition-colors focus:border-[var(--accent-primary)] focus:ring-1 focus:ring-[var(--accent-primary)] outline-none placeholder:text-[var(--fg-muted)] ${props.className || ''}`} />
);

export const Badge: React.FC<{ children: React.ReactNode; color?: string }> = ({ children, color = 'var(--fg-muted)' }) => (
  <span className="px-1.5 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider bg-[var(--bg-deep)] border border-[var(--border-subtle)]" style={{ color }}>
    {children}
  </span>
);