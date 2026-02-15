import { useState } from "react";
import { Tooltip } from "./tooltip";

interface TextInputProps {
  label: string;
  value?: string;
  onChange: (value: string) => void;
  description?: string;
  placeholder?: string;
  maxLength?: number;
  onReset?: () => void;
}

export const TextInput = ({
  label,
  value,
  onChange,
  description,
  placeholder = "Type your text...",
  maxLength = 20,
  onReset,
}: TextInputProps) => {
  const [localValue, setLocalValue] = useState("");
  const effectiveValue = value !== undefined ? value : localValue;

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = e.target.value;
    if (maxLength && newValue.length > maxLength) return;
    if (value === undefined) {
      setLocalValue(newValue);
    }
    onChange(newValue);
  };

  return (
    <div className="w-full">
      <div className="flex items-center justify-between text-xs w-full font-mono">
        <div className="relative inline-block group">
          <label className="capitalize text-base-content/80 inline-flex justify-center items-center gap-1 cursor-help">
            {label}
            <Tooltip description={description || ""} />
          </label>
        </div>
        <div className="relative flex items-center gap-1.5">
          <input
            type="text"
            value={effectiveValue}
            onChange={handleChange}
            placeholder={placeholder}
            maxLength={maxLength}
            className="h-8 px-3 bg-base-100/10 border border-base-content/10 rounded-lg text-xs font-mono text-base-content/80 placeholder:text-base-content/30 hover:bg-base-content/10 focus:outline-none focus:border-base-content/30 transition-colors min-w-[170px]"
          />
          {onReset && effectiveValue !== "" && (
            <button
              type="button"
              onClick={onReset}
              className="text-base-content/40 hover:text-base-content/80 transition-colors text-[10px] font-mono"
            >
              reset
            </button>
          )}
        </div>
      </div>
      <div className="flex justify-end mt-1">
        <span className="text-[10px] font-mono text-base-content/30">
          {effectiveValue.length}/{maxLength}
        </span>
      </div>
    </div>
  );
};
