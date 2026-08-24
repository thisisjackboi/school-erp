"use client";

import * as React from "react";
import { cn } from "@/lib/utils";

interface AvatarProps extends React.HTMLAttributes<HTMLDivElement> {
  src?: string;
  alt?: string;
  fallback: string;
  size?: "sm" | "md" | "lg";
}

export const Avatar = React.forwardRef<HTMLDivElement, AvatarProps>(
  ({ className, src, alt = "Avatar", fallback, size = "md", ...props }, ref) => {
    const [imageError, setImageError] = React.useState(false);

    const sizeStyles = {
      sm: "h-8 w-8 text-xs",
      md: "h-9 w-9 text-sm",
      lg: "h-12 w-12 text-base",
    };

    return (
      <div
        ref={ref}
        className={cn(
          "relative flex shrink-0 overflow-hidden rounded-full border border-border bg-slate-100 dark:bg-slate-800",
          sizeStyles[size],
          className
        )}
        {...props}
      >
        {src && !imageError ? (
          <img
            src={src}
            alt={alt}
            onError={() => setImageError(true)}
            className="aspect-square h-full w-full object-cover"
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center rounded-full bg-blue-100 font-semibold text-blue-900 dark:bg-blue-900 dark:text-blue-100">
            {fallback}
          </div>
        )}
      </div>
    );
  }
);
Avatar.displayName = "Avatar";
