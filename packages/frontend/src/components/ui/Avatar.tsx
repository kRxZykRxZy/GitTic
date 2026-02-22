import React from "react";
import { clsx } from "clsx";

export interface AvatarProps extends React.HTMLAttributes<HTMLDivElement> {
  src?: string;
  alt?: string;
  size?: "sm" | "md" | "lg";
  fallback?: string;
}

export const Avatar = React.forwardRef<HTMLDivElement, AvatarProps>(
  ({ className, src, alt, size = "md", fallback, ...props }, ref) => {
    const sizeClasses = {
      sm: "w-6 h-6 text-xs",
      md: "w-8 h-8 text-sm",
      lg: "w-12 h-12 text-lg",
    };

    return (
      <div
        ref={ref}
        className={clsx(
          "relative rounded-full bg-accent-blue text-white flex items-center justify-center font-semibold",
          sizeClasses[size],
          className
        )}
        {...props}
      >
        {src ? (
          <img
            src={src}
            alt={alt}
            className="w-full h-full rounded-full object-cover"
          />
        ) : (
          <span>{fallback || "U"}</span>
        )}
      </div>
    );
  }
);

Avatar.displayName = "Avatar";
