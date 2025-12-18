import { cn } from "@/lib/utils";
import { InfoIcon } from "@phosphor-icons/react";

export const toolTipStyle = cn(
  "font-sans absolute text-[0.8rem] text-center",
  "bottom-full left-1/2 -translate-x-1/2 mb-1",
  "px-3 py-1 text-white/70 bg-base-100/90 rounded-md",

  "border border-white/30",

  "pointer-events-none origin-bottom transition-all duration-150 ease-out",
  "opacity-0 scale-70",
  "group-hover:opacity-100 group-hover:scale-100",

  "after:content-[''] after:absolute after:left-1/2 after:-translate-x-1/2",
  "after:top-full after:border-4 after:border-transparent",
  "after:border-t-base-100/70 after:-mt-px"
)

export const Tooltip = ({
  description,
  className
}: {
  description: string
  className?: string
}) => {
  if (!description) return null;

  return (
    <div className="group relative inline-block">
      <div className={cn(toolTipStyle, "w-60")}>
        {description}
      </div>
      <InfoIcon
        size={15}
        weight="duotone"
        className="cursor-help"
        tabIndex={0}
      />
    </div>
  );
};
