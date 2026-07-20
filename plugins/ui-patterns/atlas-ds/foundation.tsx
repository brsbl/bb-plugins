import * as React from "react";

export type AtlasDensity = "compact" | "comfortable";
export type AtlasTheme = "light" | "dark" | "system";

export function cx(
  ...values: Array<string | false | null | undefined>
): string {
  return values.filter(Boolean).join(" ");
}

export interface AtlasRootProps
  extends React.HTMLAttributes<HTMLDivElement> {
  density?: AtlasDensity;
  theme?: AtlasTheme;
  inert?: boolean;
}

export const AtlasRoot = React.forwardRef<HTMLDivElement, AtlasRootProps>(
  (
    {
      className,
      density = "compact",
      theme = "system",
      inert = false,
      ...props
    },
    ref,
  ) => (
    <div
      ref={ref}
      className={cx("atlas-root", className)}
      data-atlas-ds-root=""
      data-density={density}
      data-theme={theme}
      inert={inert || undefined}
      {...props}
    />
  ),
);
AtlasRoot.displayName = "AtlasRoot";

export interface SurfaceProps extends React.HTMLAttributes<HTMLElement> {
  as?: "article" | "section" | "div";
  elevation?: "flat" | "raised" | "overlay";
}

export const Surface = React.forwardRef<HTMLElement, SurfaceProps>(
  (
    {
      as: Component = "section",
      className,
      elevation = "flat",
      ...props
    },
    ref,
  ) => (
    <Component
      ref={ref as React.Ref<never>}
      className={cx("atlas-surface", className)}
      data-elevation={elevation}
      {...props}
    />
  ),
);
Surface.displayName = "Surface";

export interface StackProps extends React.HTMLAttributes<HTMLDivElement> {
  gap?: "xs" | "sm" | "md" | "lg";
}

export const Stack = React.forwardRef<HTMLDivElement, StackProps>(
  ({ className, gap = "md", ...props }, ref) => (
    <div
      ref={ref}
      className={cx("atlas-stack", className)}
      data-gap={gap}
      {...props}
    />
  ),
);
Stack.displayName = "Stack";

export interface ClusterProps extends React.HTMLAttributes<HTMLDivElement> {
  align?: "start" | "center" | "end";
  justify?: "start" | "between" | "end";
  gap?: "xs" | "sm" | "md";
}

export const Cluster = React.forwardRef<HTMLDivElement, ClusterProps>(
  (
    {
      className,
      align = "center",
      justify = "start",
      gap = "sm",
      ...props
    },
    ref,
  ) => (
    <div
      ref={ref}
      className={cx("atlas-cluster", className)}
      data-align={align}
      data-justify={justify}
      data-gap={gap}
      {...props}
    />
  ),
);
Cluster.displayName = "Cluster";

export function Divider(props: React.HTMLAttributes<HTMLHRElement>) {
  return <hr className={cx("atlas-divider", props.className)} {...props} />;
}

export interface HeadingProps
  extends React.HTMLAttributes<HTMLHeadingElement> {
  level?: 2 | 3 | 4;
  size?: "sm" | "md" | "lg";
}

export const Heading = React.forwardRef<HTMLHeadingElement, HeadingProps>(
  ({ level = 2, size = "md", className, ...props }, ref) => {
    const Component = `h${level}` as "h2" | "h3" | "h4";
    return (
      <Component
        ref={ref}
        className={cx("atlas-heading", className)}
        data-size={size}
        {...props}
      />
    );
  },
);
Heading.displayName = "Heading";

export interface TextProps extends React.HTMLAttributes<HTMLElement> {
  as?: "p" | "span" | "div";
  tone?: "default" | "muted" | "subtle";
  size?: "xs" | "sm" | "md";
}

export const Text = React.forwardRef<HTMLElement, TextProps>(
  (
    {
      as: Component = "p",
      tone = "default",
      size = "sm",
      className,
      ...props
    },
    ref,
  ) => (
    <Component
      ref={ref as React.Ref<never>}
      className={cx("atlas-text", className)}
      data-tone={tone}
      data-size={size}
      {...props}
    />
  ),
);
Text.displayName = "Text";

export function VisuallyHidden({
  className,
  ...props
}: React.HTMLAttributes<HTMLSpanElement>) {
  return <span className={cx("atlas-sr-only", className)} {...props} />;
}

export interface PageHeaderProps
  extends Omit<React.HTMLAttributes<HTMLElement>, "title"> {
  title: React.ReactNode;
  description?: React.ReactNode;
  eyebrow?: React.ReactNode;
  actions?: React.ReactNode;
  level?: 2 | 3 | 4;
}

export function PageHeader({
  title,
  description,
  eyebrow,
  actions,
  level = 2,
  className,
  ...props
}: PageHeaderProps) {
  return (
    <header className={cx("atlas-page-header", className)} {...props}>
      <Stack gap="xs">
        {eyebrow ? (
          <Text as="span" tone="subtle" size="xs" className="atlas-page-header__eyebrow">
            {eyebrow}
          </Text>
        ) : null}
        <Heading level={level} size="md">{title}</Heading>
        {description ? <Text tone="muted">{description}</Text> : null}
      </Stack>
      {actions ? <Cluster justify="end">{actions}</Cluster> : null}
    </header>
  );
}

export interface ApplicationFrameProps
  extends Omit<React.HTMLAttributes<HTMLElement>, "title"> {
  title: React.ReactNode;
  label: string;
  brand?: React.ReactNode;
  navigation?: React.ReactNode;
  actions?: React.ReactNode;
  sidebar?: React.ReactNode;
  children: React.ReactNode;
}

/**
 * A neutral application-context frame for previewing components in a task.
 * It intentionally avoids `main` and global landmark roles because dozens of
 * inert previews may coexist in the gallery.
 */
export function ApplicationFrame({
  title,
  label,
  brand,
  navigation,
  actions,
  sidebar,
  children,
  className,
  ...props
}: ApplicationFrameProps) {
  return (
    <section
      className={cx("atlas-application-frame", className)}
      aria-label={label}
      {...props}
    >
      <header className="atlas-application-frame__bar">
        <Cluster gap="sm">
          {brand ? <span className="atlas-application-frame__brand">{brand}</span> : null}
          <Heading level={3} size="sm">{title}</Heading>
        </Cluster>
        {navigation ? <div className="atlas-application-frame__nav">{navigation}</div> : null}
        {actions ? (
          <Cluster className="atlas-application-frame__actions" justify="end" gap="xs">
            {actions}
          </Cluster>
        ) : null}
      </header>
      <div className="atlas-application-frame__body" data-has-sidebar={Boolean(sidebar) || undefined}>
        {sidebar ? <aside className="atlas-application-frame__sidebar">{sidebar}</aside> : null}
        <div className="atlas-application-frame__content">{children}</div>
      </div>
    </section>
  );
}
