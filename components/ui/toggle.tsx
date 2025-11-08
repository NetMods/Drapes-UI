import { useState } from 'react';
import { NumberOneIcon, NumberZeroIcon } from "@phosphor-icons/react"
import { Tooltip } from './tooltip';

interface ToggleProps {
  label: string;
  value?: boolean;
  onChange: (checked: boolean) => void;
  description?: string;
}

export const Toggle = ({ label, value, onChange, description }: ToggleProps) => {
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
    <div className="w-full">
      <div className="flex items-center justify-between w-full font-mono">
        <label className="text-xs capitalize text-base-content/80 inline-flex justify-between items-center gap-1 group">
          {label}
          <Tooltip description={description} />
        </label>
        <div className='flex justify-center items-center gap-1'>
          <button
            type="button"
            role="switch"
            aria-checked={effectiveValue}
            onClick={handleToggle}
            className={`
              relative inline-flex h-8 w-16 items-center rounded-lg transition-colors border
              ${effectiveValue ? 'bg-base-content/30 border-base-content/15' : 'bg-base-100/10 border-base-100/15'}
            `}
          >
            <span
              className={`
                pointer-events-none inline-flex justify-center items-center text-[12px] size-6 transform rounded-lg 
                transition-transform duration-200 ease-in-out
                ${effectiveValue
                  ? 'translate-x-[2.2rem] bg-base-content text-base-100/80'
                  : 'translate-x-1 bg-base-100/50 text-base-content/80'}
              `}
            >
              {effectiveValue
                ? <NumberOneIcon weight='bold' />
                : <NumberZeroIcon weight='bold' />
              }
            </span>
            <span className={`${effectiveValue ? 'block' : 'hidden'}  absolute left-2 text-xs text-base-100/50`}>ON</span>
            <span className={`${effectiveValue ? 'hidden' : 'block'} absolute left-1/2 text-base-content/40 text-xs`}>OFF</span>
          </button>
        </div>
      </div>
    </div>
  );
};
