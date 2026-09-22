import type { ComponentType } from "react";
import type { IconProps } from "@phosphor-icons/react";

interface RoadSignIconProps extends Omit<IconProps, "size" | "color"> {
  icon: ComponentType<IconProps>;
  label?: string;
  tone?: "brand" | "blue" | "green" | "slate";
  shape?: "square" | "circle";
  size?: number;
}

const TONE_CLASSES = {
  brand: "bg-orange-50 text-brand ring-orange-100",
  blue: "bg-blue-50 text-blue-600 ring-blue-100",
  green: "bg-emerald-50 text-emerald-600 ring-emerald-100",
  slate: "bg-slate-100 text-slate-600 ring-slate-200",
};

export const RoadSignIcon = ({
  icon: Icon,
  label,
  tone = "brand",
  shape = "square",
  size = 18,
  className = "",
  ...iconProps
}: RoadSignIconProps) => (
  <span
    aria-label={label}
    title={label}
    className={`inline-flex h-9 w-9 shrink-0 items-center justify-center ring-1 ${shape === "circle" ? "rounded-full" : "rounded-md"} ${TONE_CLASSES[tone]} ${className}`}
  >
    <Icon size={size} weight="duotone" {...iconProps} />
  </span>
);
