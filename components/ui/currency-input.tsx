"use client";

import { useState } from "react";

import { Input } from "@/components/ui/input";

export function getCurrencyInputDigits(value: string | number) {
  return String(value).replace(/\D/g, "");
}

export function formatCurrencyInput(value: string | number) {
  return getCurrencyInputDigits(value).replace(/\B(?=(\d{3})+(?!\d))/g, ".");
}

type CurrencyInputProps = Omit<React.ComponentProps<typeof Input>, "defaultValue" | "onChange" | "type" | "value"> & {
  defaultValue?: string | number;
  onValueChange?: (value: string) => void;
  value?: string | number;
};

export function CurrencyInput({
  defaultValue = "",
  inputMode = "numeric",
  onValueChange,
  pattern = "[0-9.]*",
  value,
  ...props
}: CurrencyInputProps) {
  const [internalValue, setInternalValue] = useState(() => getCurrencyInputDigits(defaultValue));
  const digits = value === undefined ? internalValue : getCurrencyInputDigits(value);

  return (
    <Input
      {...props}
      inputMode={inputMode}
      onChange={(event) => {
        const nextValue = getCurrencyInputDigits(event.target.value);
        if (value === undefined) setInternalValue(nextValue);
        onValueChange?.(nextValue);
      }}
      pattern={pattern}
      type="text"
      value={formatCurrencyInput(digits)}
    />
  );
}
