"use client";

import { Input } from "@/components/ui/input";
import { sanitizeCustomerNumberInput } from "@/lib/admin-unit/customer-number";
import { cn } from "@/lib/utils";

type CustomerNumberInputProps = Omit<React.ComponentProps<typeof Input>, "type" | "value" | "onChange"> & {
  value: string;
  onValueChange: (value: string) => void;
};

export function CustomerNumberInput({
  className,
  onValueChange,
  value,
  ...props
}: CustomerNumberInputProps) {
  return (
    <div className="flex overflow-hidden rounded-xl border border-slate-200 bg-white transition-[background-color,border-color,box-shadow] duration-200 ease-[cubic-bezier(0.22,1,0.36,1)] focus-within:border-[#006747]/42 focus-within:shadow-[0_0_0_4px_rgba(189,232,208,0.46),0_18px_38px_-32px_rgba(0,103,71,0.42)]">
      <span className="flex min-w-[4.7rem] items-center justify-center border-r border-slate-200 bg-slate-50 px-3 text-sm font-black tracking-[-0.03em] text-slate-700">
        +62
      </span>
      <Input
        {...props}
        autoComplete="tel-national"
        className={cn(
          "h-11 flex-1 border-0 bg-transparent px-3 text-sm font-semibold text-slate-800 shadow-none placeholder:text-slate-300 focus-visible:ring-0",
          className
        )}
        inputMode="numeric"
        maxLength={12}
        minLength={9}
        onChange={(event) => onValueChange(sanitizeCustomerNumberInput(event.target.value))}
        pattern="[0-9]{9,12}"
        placeholder="812 3456 7890"
        type="text"
        value={value}
      />
    </div>
  );
}
