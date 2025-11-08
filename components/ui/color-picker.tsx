import { useState } from "react";
import { Tooltip } from "./tooltip";
import { ArrowCounterClockwiseIcon } from "@phosphor-icons/react";

interface ColorPickerProps {
  label: string;
  value?: string;
  onChange: (color: string) => void;
  description?: string;
  onReset: () => void;
}

export const ColorPicker = ({ label, value, onChange, description, onReset }: ColorPickerProps) => {
  const [localValue, setLocalValue] = useState('#000000');
  const effectiveValue = value !== undefined ? value : localValue;

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = e.target.value;
    if (value === undefined) {
      setLocalValue(newValue);
    }
    onChange(newValue);
  };

  return (
    <div className="w-full">
      <div className="flex items-center justify-between w-full">
        <label className="font-mono text-xs capitalize text-base-content/80 inline-flex justify-center items-center gap-1 group">
          {label}
          <Tooltip description={description} />
        </label>
        <div className="flex items-center gap-2">
          <button
            onClick={onReset}
            className="text-base-content/60 hover:text-base-content transition-colors"
            aria-label="Reset color"
          >
            <ArrowCounterClockwiseIcon size={16} weight="bold" />
          </button>

          <div className="relative">
            <input
              type="color"
              value={effectiveValue}
              onChange={handleChange}
              className="w-12 h-8 rounded-lg border border-base-content/10 cursor-pointer bg-base-100/10 opacity-0"
            />
            <div
              className="absolute inset-0 rounded-lg pointer-events-none border border-base-content/10"
              style={{ backgroundColor: effectiveValue }}
            />
          </div>
        </div>
      </div>
    </div>
  );
};
