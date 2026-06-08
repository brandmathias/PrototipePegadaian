import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";

import { cn } from "@/lib/utils";

const buttonVariants = cva(
  "interactive-tap inline-flex min-w-0 max-w-full items-center justify-center gap-2 whitespace-normal rounded-md text-center text-sm font-semibold leading-tight transition-[transform,background-color,border-color,color,opacity,box-shadow] duration-200 ease-out focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-50",
  {
    variants: {
      variant: {
        default:
          "bg-primary text-primary-foreground shadow-inset hover:opacity-95 active:scale-[0.99]",
        secondary:
          "bg-surface-lowest text-primary border border-border hover:bg-surface-low",
        accent:
          "bg-accent text-accent-foreground hover:brightness-[0.98]",
        ghost: "text-primary hover:bg-primary/5",
        destructive:
          "bg-destructive text-destructive-foreground hover:opacity-95"
      },
      size: {
        default: "min-h-11 px-5 py-2.5",
        sm: "min-h-9 px-4 py-2",
        lg: "min-h-12 px-6 py-3",
        icon: "size-10"
      }
    },
    defaultVariants: {
      variant: "default",
      size: "default"
    }
  }
);

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, ...props }, ref) => (
    <button
      className={cn(buttonVariants({ variant, size, className }))}
      ref={ref}
      {...props}
    />
  )
);
Button.displayName = "Button";

export { Button, buttonVariants };
