"use client";

import { useEffect, useId, useRef, useState, type CSSProperties } from "react";
import { Check, ChevronDown } from "lucide-react";

import { cn } from "@/lib/utils";

export type AdminSelectOption = {
  value: string | number;
  label: string;
};

export function AdminSelect({
  ariaLabel,
  className,
  id,
  options,
  value,
  onValueChange,
  size = "default"
}: {
  ariaLabel?: string;
  className?: string;
  id?: string;
  options: AdminSelectOption[];
  value: string | number;
  onValueChange: (value: string) => void;
  size?: "default" | "compact";
}) {
  const generatedId = useId();
  const selectId = id ?? generatedId;
  const rootRef = useRef<HTMLDivElement | null>(null);
  const buttonRef = useRef<HTMLButtonElement | null>(null);
  const [open, setOpen] = useState(false);
  const normalizedValue = String(value);
  const selectedOption = options.find((option) => String(option.value) === normalizedValue) ?? options[0];

  useEffect(() => {
    if (!open) return;

    function handlePointerDown(event: PointerEvent) {
      if (!rootRef.current?.contains(event.target as Node)) {
        setOpen(false);
      }
    }

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") {
        setOpen(false);
        buttonRef.current?.focus();
      }
    }

    document.addEventListener("pointerdown", handlePointerDown);
    document.addEventListener("keydown", handleKeyDown);

    return () => {
      document.removeEventListener("pointerdown", handlePointerDown);
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [open]);

  function selectValue(nextValue: string) {
    onValueChange(nextValue);
    setOpen(false);
    requestAnimationFrame(() => buttonRef.current?.focus());
  }

  return (
    <div className={cn("admin-select-root relative", className)} ref={rootRef}>
      <select
        aria-label={ariaLabel}
        className="sr-only"
        id={selectId}
        value={normalizedValue}
        onChange={(event) => onValueChange(event.target.value)}
      >
        {options.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>

      <button
        aria-expanded={open}
        aria-haspopup="listbox"
        className={cn(
          "admin-select-trigger group w-full",
          size === "compact" ? "h-9 rounded-[1.15rem] pl-3 pr-3 text-[0.72rem]" : "h-12 rounded-[1.35rem] pl-4 pr-3 text-sm"
        )}
        data-active={normalizedValue !== String(options[0]?.value)}
        onClick={() => setOpen((current) => !current)}
        ref={buttonRef}
        type="button"
      >
        <span className="truncate">{selectedOption?.label ?? ""}</span>
        <span className="admin-select-icon">
          <ChevronDown className={cn("size-4 transition duration-500 ease-[cubic-bezier(0.22,1,0.36,1)]", open && "rotate-180")} />
        </span>
      </button>

      {open ? (
        <div className="admin-select-menu" role="listbox" aria-labelledby={selectId}>
          {options.map((option, index) => {
            const active = String(option.value) === normalizedValue;

            return (
              <button
                className="admin-select-option"
                data-active={active}
                key={`${option.value}-${index}`}
                role="option"
                aria-selected={active}
                style={{ "--option-index": index } as CSSProperties}
                type="button"
                onClick={() => selectValue(String(option.value))}
              >
                <span className="truncate">{option.label}</span>
                <Check className="admin-select-check size-4" />
              </button>
            );
          })}
        </div>
      ) : null}
    </div>
  );
}
