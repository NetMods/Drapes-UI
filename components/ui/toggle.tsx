import { useState } from 'react';
import { NumberOneIcon, NumberZeroIcon } from "@phosphor-icons/react"

interface ToggleProps {
  label: string;
  value?: boolean;
  onChange: (checked: boolean) => void;
}

export const Toggle = ({ label, value, onChange }: ToggleProps) => {
  const [localValue, setLocalValue] = useState(false);
  const effectiveValue = value !== undefined ? value : localValue;

  const handleToggle = () => {
    const newValue = !effectiveValue;
    if (value === undefined) {
      setLocalValue(newValue);
    }
    onChange(newValue);
  };

  return (
    <div className="flex items-center justify-between w-full">
      <label className="p-3 capitalize text-base-content/80">{label}</label>
      <div>
        <button
          type="button"
          role="switch"
          aria-checked={effectiveValue}
          onClick={handleToggle}
          className={`
            relative inline-flex h-8 w-16 items-center rounded-lg transition-colors border
            ${effectiveValue ? 'bg-base-content/30 border-base-content/15' : 'bg-base-100/10 border-base-100/15'}`
          }
        >
          <span
            className={`
              pointer-events-none inline-flex justify-center items-center text-[12px] size-6 transform rounded-lg 
              transition-transform duration-200 ease-in-out
              ${effectiveValue
                ? 'translate-x-9 bg-base-content text-base-100/80'
                : 'translate-x-1 bg-base-100/50 text-base-content/80'}
            `}
          >
            {effectiveValue
              ? <NumberOneIcon weight='bold' />
              : <NumberZeroIcon weight='bold' />
            }
          </span>

          <span className={`${effectiveValue ? 'block' : 'hidden'} absolute left-2 text-xs text-base-100/60`}>ON</span>
          <span className={`${effectiveValue ? 'hidden' : 'block'} absolute left-1/2 text-base-content/40 text-xs`}>OFF</span>
        </button>
      </div>
    </div>
  );
};
