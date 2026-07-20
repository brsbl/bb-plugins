import type { ComponentProps } from "react";

type ImageProps = Omit<ComponentProps<"img">, "src"> & {
  fill?: boolean;
  priority?: boolean;
  src: string;
};

/** Browser-only adapter for the Next.js image used by the pinned upstream demo. */
export default function Image({ fill: _fill, priority: _priority, ...props }: ImageProps) {
  return <img {...props} />;
}
