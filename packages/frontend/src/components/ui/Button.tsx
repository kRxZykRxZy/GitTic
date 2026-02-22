import React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { clsx } from "clsx";

const buttonVariants = cva(
  "inline-flex items-center justify-center rounded-md text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:opacity-50 disabled:pointer-events-none ring-offset-background",
  {
    variants: {
      variant: {
        default: "bg-accent-green text-white hover:bg-green-600",
        secondary: "bg-white border border-border-light text-text-primary hover:bg-bg-light",
        ghost: "hover:bg-bg-light text-text-secondary",
        outline: "border border-gray-300 bg-white text-gray-700 hover:bg-gray-50",
        sidebar: "w-full text-left px-3 py-2 rounded-md text-sidebar-text hover:bg-sidebar-hover hover:text-sidebar-text-active transition-colors",
        sidebarActive: "w-full text-left px-3 py-2 rounded-md text-sidebar-text-active bg-sidebar-hover",
      },
      size: {
        default: "h-10 py-2 px-4",
        sm: "h-9 px-3 text-xs",
        lg: "h-11 px-8",
        icon: "h-10 w-10",
        xs: "h-8 px-2 text-xs",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
);

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean;
}

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, asChild = false, ...props }, ref) => {
    return (
      <button
        className={clsx(buttonVariants({ variant, size, className }))}
        ref={ref}
        {...props}
      />
    );
  }
);

Button.displayName = "Button";
