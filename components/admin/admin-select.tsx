"use client";

import { useEffect, useId, useRef, useState, type CSSProperties } from "react";
import { createPortal } from "react-dom";
import { Check, ChevronDown, type LucideIcon } from "lucide-react";

import { cn } from "@/lib/utils";

export type AdminSelectOption = {
  value: string | number;
  label: string;
  icon?: LucideIcon;
};

export function AdminSelect({
  ariaLabel,
  allowWrap = false,
  className,
  id,
  options,
  placement = "auto",
  value,
  onValueChange,
  size = "default"
}: {
  ariaLabel?: string;
  allowWrap?: boolean;
  className?: string;
  id?: string;
  options: AdminSelectOption[];
  placement?: "auto" | "bottom" | "top";
  value: string | number;
  onValueChange: (value: string) => void;
  size?: "default" | "compact";
}) {
  const generatedId = useId();
  const selectId = id ?? generatedId;
  const rootRef = useRef<HTMLDivElement | null>(null);
  const buttonRef = useRef<HTMLButtonElement | null>(null);
  const menuRef = useRef<HTMLDivElement | null>(null);
  const [open, setOpen] = useState(false);
  const [menuStyle, setMenuStyle] = useState<CSSProperties | null>(null);
  const [menuPlacement, setMenuPlacement] = useState<"bottom" | "top">("bottom");
  const normalizedValue = String(value);
  const selectedOption = options.find((option) => String(option.value) === normalizedValue) ?? options[0];
  const SelectedIcon = selectedOption?.icon;

  useEffect(() => {
    if (!open) return;

    function handlePointerDown(event: PointerEvent) {
      const target = event.target as Node;
      if (!rootRef.current?.contains(target) && !menuRef.current?.contains(target)) {
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

  useEffect(() => {
    if (!open) {
      setMenuStyle(null);
      return;
    }

    function updateMenuPosition() {
      const trigger = buttonRef.current;
      const menu = menuRef.current;
      if (!trigger || !menu) return;

      const rect = trigger.getBoundingClientRect();
      const gap = 6;
      const viewportPadding = 12;
      const visualViewport = window.visualViewport;
      const viewportHeight = visualViewport?.height ?? window.innerHeight;
      const viewportOffsetTop = visualViewport?.offsetTop ?? 0;
      const viewportWidth = visualViewport?.width ?? window.innerWidth;
      const viewportOffsetLeft = visualViewport?.offsetLeft ?? 0;
      const bottomSpace = viewportOffsetTop + viewportHeight - rect.bottom - viewportPadding;
      const topSpace = rect.top - viewportOffsetTop - viewportPadding;
      const openUp =
        placement === "top" || (placement === "auto" && bottomSpace < 180 && topSpace > bottomSpace);
      const availableSpace = Math.max(openUp ? topSpace : bottomSpace, 160);
      const maxHeight = Math.max(160, Math.min(288, availableSpace - gap));
      const renderedMenuHeight = Math.min(menu.scrollHeight, maxHeight);
      const top = openUp
        ? rect.top - renderedMenuHeight - gap
        : rect.bottom + gap;
      const maxWidth = viewportWidth - viewportPadding * 2;
      const optionWidths = Array.from(menu.querySelectorAll<HTMLElement>(".admin-select-option")).map(
        (option) => option.scrollWidth
      );
      const contentWidth = Math.max(menu.scrollWidth, ...optionWidths);
      const width = Math.min(Math.max(rect.width, contentWidth), maxWidth);
      const left = Math.min(
        Math.max(viewportOffsetLeft + viewportPadding, rect.left),
        viewportOffsetLeft + viewportWidth - width - viewportPadding
      );

      setMenuPlacement(openUp ? "top" : "bottom");

      setMenuStyle({
        left,
        maxHeight,
        minWidth: rect.width,
        top,
        width,
        zIndex: 160
      });

    }

    const rafId = window.requestAnimationFrame(updateMenuPosition);
    const visualViewport = window.visualViewport;
    window.addEventListener("resize", updateMenuPosition);
    window.addEventListener("scroll", updateMenuPosition, true);
    visualViewport?.addEventListener("resize", updateMenuPosition);
    visualViewport?.addEventListener("scroll", updateMenuPosition);

    return () => {
      window.cancelAnimationFrame(rafId);
      window.removeEventListener("resize", updateMenuPosition);
      window.removeEventListener("scroll", updateMenuPosition, true);
      visualViewport?.removeEventListener("resize", updateMenuPosition);
      visualViewport?.removeEventListener("scroll", updateMenuPosition);
    };
  }, [open, placement]);

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
        data-allow-wrap={allowWrap ? "true" : undefined}
        data-active={normalizedValue !== String(options[0]?.value)}
        data-size={size}
        onClick={() => setOpen((current) => !current)}
        ref={buttonRef}
        type="button"
      >
        <span className={cn("flex min-w-0 items-center gap-2 pr-2 text-left", allowWrap && "items-start py-1")}>
          {SelectedIcon ? <SelectedIcon className="size-4 shrink-0 text-current" strokeWidth={2} /> : null}
          <span className={cn(allowWrap ? "whitespace-normal break-words leading-5" : "truncate")}>
            {selectedOption?.label ?? ""}
          </span>
        </span>
        <span className="admin-select-icon">
          <ChevronDown className={cn("size-4 transition duration-500 ease-[cubic-bezier(0.22,1,0.36,1)]", open && "rotate-180")} />
        </span>
      </button>

      {open && typeof document !== "undefined"
        ? createPortal(
          <div
            aria-labelledby={selectId}
            className="admin-select-menu"
            data-placement={menuPlacement}
            ref={menuRef}
            role="listbox"
            style={menuStyle ?? undefined}
          >
          {options.map((option, index) => {
            const active = String(option.value) === normalizedValue;
            const OptionIcon = option.icon;

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
                <span className={cn("flex min-w-0 flex-1 items-center gap-2 text-left", allowWrap && "items-start")}>
                  {OptionIcon ? <OptionIcon className="size-4 shrink-0 text-current" strokeWidth={2} /> : null}
                  <span
                    className={cn(
                      allowWrap ? "whitespace-normal break-words leading-5" : "whitespace-nowrap"
                    )}
                  >
                    {option.label}
                  </span>
                </span>
                <Check className="admin-select-check size-4" />
              </button>
            );
          })}
          </div>,
          document.body
        )
        : null}
    </div>
  );
}
