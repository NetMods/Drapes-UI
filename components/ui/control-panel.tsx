import { useBackgroundProps } from "@/lib/background-context";
import { ColorPicker } from "./color-picker";
import { Select } from "./select";
import { RangeSlider } from "./slider";
import { Toggle } from "./toggle";

interface Control {
  type: 'slider' | 'color' | 'toggle' | 'select';
  key: string;
  label: string;
  min?: number;
  max?: number;
  step?: number;
  options?: string[];
  description?: string;
}

export const ControlPanel = ({ controls }: { controls: Control[] }) => {

  const { props: values, updateProp } = useBackgroundProps();

  const renderControl = (control: Control) => {
    switch (control.type) {
      case 'slider':
        return (
          <RangeSlider
            key={control.key}
            label={control.label}
            min={control.min ?? 0}
            max={control.max ?? 100}
            step={control.step}
            value={values[control.key]}
            onChange={(value) => updateProp(control.key, value)}
            description={control.description}
          />
        );
      case 'color':
        return (
          <ColorPicker
            key={control.key}
            label={control.label}
            value={values[control.key]}
            onChange={(value) => updateProp(control.key, value)}
            description={control.description}
          />
        );
      case 'toggle':
        return (
          <Toggle
            key={control.key}
            label={control.label}
            value={values[control.key]}
            onChange={(value) => updateProp(control.key, value)}
            description={control.description}
          />
        );
      case 'select':
        return (
          <Select
            key={control.key}
            label={control.label}
            value={values[control.key]}
            onChange={(value) => updateProp(control.key, value)}
            options={control.options ?? []}
            description={control.description}
          />
        );
      default:
        return null;
    }
  };

  return (
    <div className="flex flex-col gap-2 bg-base-200/30 p-2 rounded-lg">
      {controls.map(renderControl)}
    </div>
  );
};
