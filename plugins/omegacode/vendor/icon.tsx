import {
  Check,
  ChevronDown,
  Circle,
  CircleCheck,
  Loader2,
  Pause,
  Workflow,
  X,
  type LucideProps,
} from "lucide-react";

const ICONS = {
  Check,
  ChevronDown,
  Circle,
  CircleCheck,
  Pause,
  Spinner: Loader2,
  Workflow,
  X,
} as const;

type IconName = keyof typeof ICONS;

export function Icon({
  name,
  className,
  ...rest
}: LucideProps & { name: IconName }) {
  const Glyph = ICONS[name];
  const classes =
    name === "Spinner"
      ? ["animate-spin", className].filter(Boolean).join(" ")
      : className;
  return <Glyph className={classes} {...rest} />;
}
