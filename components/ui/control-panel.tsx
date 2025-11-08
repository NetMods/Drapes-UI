import { useBackgroundProps } from "@/lib/background-context";
import { ColorPicker } from "./color-picker";
import { Select } from "./select";
import { RangeSlider } from "./slider";
import { Toggle } from "./toggle";

interface Control {
  type: "slider" | "color" | "toggle" | "select";
  key: string;
  label: string;
  min?: number;
  max?: number;
  step?: number;
  options?: string[];
  description?: string;
  defaultValue?: string | number | boolean;
}

export const ControlPanel = ({ controls }: { controls: Control[] }) => {
  const { props: values, updateProp } = useBackgroundProps();

  const sliders = controls.filter((c) => c.type === "slider");
  const others = controls.filter((c) => c.type !== "slider");

  const renderControl = (control: Control) => {
    const safeProps = {
      label: control.label,
      value: values[control.key],
      onChange: (v: any) => updateProp(control.key, v),
      description: control.description,
    };

    switch (control.type) {
      case "slider":
        return (
          <RangeSlider
            key={control.key}
            {...safeProps}
            min={control.min ?? 0}
            max={control.max ?? 100}
            step={control.step}
            onReset={() => updateProp(control.key, control.defaultValue)}
          />
        );

      case "color":
        return (
          <ColorPicker
            key={control.key}
            {...safeProps}
            onReset={() => updateProp(control.key, control.defaultValue)}
          />
        );

      case "toggle":
        return (
          <Toggle
            key={control.key}
            {...safeProps}
          />
        );

      case "select":
        return (
          <Select
            key={control.key}
            {...safeProps}
            options={control.options ?? []}
          />
        );

      default:
        return null;
    }
  };

  return (
    <div className="flex flex-col gap-4">
      {others.length > 0 && (
        <div className="flex flex-col gap-2 bg-base-200/30 p-3 rounded-lg">
          <h3 className="font-sans text-sm font-semibold text-base-content/70 mb-1">
            Options
          </h3>
          {others.map(renderControl)}
        </div>
      )}

      {sliders.length > 0 && (
        <div className="flex flex-col gap-2 bg-base-200/30 p-3 rounded-lg">
          <h3 className="font-sans text-sm font-semibold text-base-content/70 mb-1">
            Parameters
          </h3>
          {sliders.map(renderControl)}
        </div>
      )}
    </div>
  );
};
