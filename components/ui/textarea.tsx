import * as React from "react";

import { cn } from "@/lib/utils";

const Textarea = React.forwardRef<
  HTMLTextAreaElement,
  React.ComponentProps<"textarea">
>(({ className, ...props }, ref) => {
  return (
    <textarea
      className={cn(
        "min-h-28 w-full rounded-2xl border border-transparent bg-surface-low px-4 py-3 text-sm text-foreground transition-all duration-300 ease-[cubic-bezier(0.22,1,0.36,1)] placeholder:text-muted-foreground focus:border-[#006747]/40 focus:bg-white focus:outline-none focus:ring-4 focus:ring-[#bde8d0]/45 focus-visible:border-[#006747]/40 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-[#bde8d0]/45",
        className
      )}
      ref={ref}
      {...props}
    />
  );
});
Textarea.displayName = "Textarea";

export { Textarea };
