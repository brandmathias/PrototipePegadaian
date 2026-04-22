import * as React from "react";

import { cn } from "@/lib/utils";

const Textarea = React.forwardRef<
  HTMLTextAreaElement,
  React.ComponentProps<"textarea">
>(({ className, ...props }, ref) => {
  return (
    <textarea
      className={cn(
        "min-h-28 w-full rounded-2xl border border-transparent bg-surface-low px-4 py-3 text-sm text-foreground placeholder:text-muted-foreground focus-visible:border-primary/20 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/20",
        className
      )}
      ref={ref}
      {...props}
    />
  );
});
Textarea.displayName = "Textarea";

export { Textarea };
