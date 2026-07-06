import { fireEvent, render, screen } from "@testing-library/react";
import { useState } from "react";
import { describe, expect, it } from "vitest";

import { CurrencyInput } from "@/components/ui/currency-input";

function ControlledCurrencyInput() {
  const [value, setValue] = useState("");
  return <CurrencyInput aria-label="Nominal" onValueChange={setValue} value={value} />;
}

describe("CurrencyInput", () => {
  it("formats rupiah while keeping the controlled value as digits", () => {
    render(<ControlledCurrencyInput />);

    const input = screen.getByLabelText("Nominal");
    fireEvent.change(input, { target: { value: "248275170" } });

    expect(input).toHaveValue("248.275.170");
  });
});
