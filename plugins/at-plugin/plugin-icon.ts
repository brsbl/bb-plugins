const MAX_ICON_NAME_LENGTH = 256;

// bb's Plugins icon (the sidebar's Plugins row). Used for plugins that are not
// installed yet and for installed plugins whose branding has no icon name.
export const PLUGIN_ICON = "Plug02";

// Branding icons are either an icon name (built-in or registered) or a file
// path such as "./assets/icon.svg"; only names can be handed to the host.
export function iconName(icon: string | null | undefined): string | undefined {
  const value = icon?.trim();
  if (!value || value.length > MAX_ICON_NAME_LENGTH) return undefined;
  if (/^[./]/.test(value) || /\.(svg|png|jpe?g|gif|webp)$/i.test(value)) return undefined;
  return value;
}

function assetHash(url: string): string | null {
  try {
    return new URL(url, "http://bb.invalid").searchParams.get("h");
  } catch {
    return null;
  }
}

// File-branded plugins are only addressable by name when the same artwork is
// also declared in bb.branding.experimental_icons, which the host registers as
// "<pluginId>/<name>". Match by content hash so a different icon is never shown.
export function installedIconName(plugin: {
  id: string;
  icon: string | null;
  iconUrl: string | null;
  icons: Readonly<Record<string, string>>;
}): string {
  const named = iconName(plugin.icon);
  if (named !== undefined) return named;
  const hash = plugin.iconUrl === null ? null : assetHash(plugin.iconUrl);
  const match = hash === null
    ? undefined
    : Object.entries(plugin.icons).find(([, url]) => assetHash(url) === hash);
  return (match && iconName(`${plugin.id}/${match[0]}`)) ?? PLUGIN_ICON;
}
