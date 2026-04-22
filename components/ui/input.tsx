import * as React from "react";

import { cn } from "@/lib/utils";

const Input = React.forwardRef<HTMLInputElement, React.ComponentProps<"input">>(
  ({ className, ...props }, ref) => {
    return (
      <input
        className={cn(
          "flex h-11 w-full rounded-xl border border-transparent bg-surface-low px-4 py-2 text-sm text-foreground shadow-none transition-all placeholder:text-muted-foreground focus-visible:border-primary/20 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/20",
          className
        )}
        ref={ref}
        {...props}
      />
    );
  }
);
Input.displayName = "Input";

export { Input };
