import { CaretDownIcon } from "@phosphor-icons/react/dist/ssr";
import { useState } from "react";
import { Tooltip } from "./tooltip";

interface SelectProps {
  label: string;
  value?: string;
  onChange: (value: string) => void;
  options: string[];
  description?: string;
}

export const Select = ({ label, value, onChange, options, description }: SelectProps) => {
  const [localValue, setLocalValue] = useState(options[0] || '');
  const [isOpen, setIsOpen] = useState(false);
  const effectiveValue = value !== undefined ? value : localValue;

  const handleSelect = (option: string) => {
    if (value === undefined) {
      setLocalValue(option);
    }
    onChange(option);
    setIsOpen(false);
  };

  return (
    <div className="w-full">
      <div className="flex items-center justify-between text-xs w-full font-mono">
        <div className="relative inline-block group">
          <label className="capitalize text-base-content/80 inline-flex justify-center items-center gap-1 cursor-help">
            {label}
            <Tooltip description={description} />
          </label>
        </div>
        <div className="relative">
          <button
            type="button"
            onClick={() => setIsOpen(!isOpen)}
            className="flex items-center justify-between gap-2 h-8 px-3 bg-base-100/10 border border-base-content/10 rounded-lg text-base-content/80 hover:bg-base-content/10 transition-colors min-w-[170px]"
          >
            <span className="capitalize text-xs">{effectiveValue}</span>
            <CaretDownIcon weight="bold" className={`transition-transform ${isOpen ? 'rotate-180' : ''}`} />
          </button>
          {isOpen && (
            <div className="absolute right-0 mt-1 bg-base-100 border border-base-content/10 rounded-lg shadow-lg z-50 min-w-[120px] overflow-hidden">
              {options.map((option) => (
                <button
                  key={option}
                  type="button"
                  onClick={() => handleSelect(option)}
                  className={`capitalize text-xs w-full text-left px-3 py-2 hover:bg-base-content/15 transition-colors ${option === effectiveValue ? 'bg-base-content/25 text-base-content' : 'text-base-content/80'
                    }`}
                >
                  {option}
                </button>
              ))}
            </div>
          )}
        </div>
      </div>
      {isOpen && (
        <div
          className="fixed inset-0 z-40"
          onClick={() => setIsOpen(false)}
        />
      )}
    </div>
  );
};
