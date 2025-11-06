import React from 'react';
import { Control } from '@/lib/types';
import { useBackgroundProps } from '@/lib/background-context';

interface ControlPanelProps {
  controls: Control[];
}

export const ControlPanel: React.FC<ControlPanelProps> = ({ controls }) => {
  const { props: values, updateProp } = useBackgroundProps();

  const renderControl = (control: Control) => {
    switch (control.type) {
      case 'slider':
        return (
          <div key={control.key} className="control-group">
            <label>
              {control.label}
              <span>{values[control.key]}</span>
            </label>
            <input
              type="range"
              min={control.min}
              max={control.max}
              step={control.step}
              value={values[control.key]}
              onChange={(e) => updateProp(control.key, parseFloat(e.target.value))}
            />
            {control.description && <small>{control.description}</small>}
          </div>
        );
      case 'color':
        return (
          <div key={control.key} className="control-group">
            <label>{control.label}</label>
            <input
              type="color"
              value={values[control.key]}
              onChange={(e) => updateProp(control.key, e.target.value)}
            />
            {control.description && <small>{control.description}</small>}
          </div>
        );
      case 'toggle':
        return (
          <div key={control.key} className="control-group">
            <label>
              <input
                type="checkbox"
                checked={values[control.key]}
                onChange={(e) => updateProp(control.key, e.target.checked)}
              />
              {control.label}
            </label>
            {control.description && <small>{control.description}</small>}
          </div>
        );
      case 'select':
        return (
          <div key={control.key} className="control-group">
            <label>{control.label}</label>
            <select
              value={values[control.key]}
              onChange={(e) => updateProp(control.key, e.target.value)}
            >
              {control.options?.map(opt => (
                <option key={opt} value={opt}>{opt}</option>
              ))}
            </select>
            {control.description && <small>{control.description}</small>}
          </div>
        );
      default:
        return null;
    }
  };

  return (
    <div className="control-panel">
      {controls.map(renderControl)}
    </div>
  );
};
