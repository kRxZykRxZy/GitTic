import React from "react";
import { clsx } from "clsx";

export interface BadgeProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: "default" | "secondary" | "outline";
}

export const Badge = React.forwardRef<HTMLDivElement, BadgeProps>(
  ({ className, variant = "default", ...props }, ref) => {
    const variantClasses = {
      default: "bg-accent-green text-white",
      secondary: "bg-bg-light text-text-secondary border border-border-light",
      outline: "border border-border-light text-text-secondary",
    };

    return (
      <div
        ref={ref}
        className={clsx(
          "inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold",
          variantClasses[variant],
          className
        )}
        {...props}
      />
    );
  }
);

Badge.displayName = "Badge";
