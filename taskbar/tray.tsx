import { useEffect, useState } from "react";
import { activateFooterItem, useFooterItems, usePanelWindows } from "./footer-panels";

export function TrayIcons() {
  const items = useFooterItems();
  usePanelWindows();
  if (items.length === 0) return null;
  return (
    <div className="bbd-tray-icons" role="group" aria-label="Sidebar footer">
      {items.map((item) => (
        <button
          key={item.key}
          type="button"
          className="bbd-tray-icon"
          aria-label={item.label}
          title={item.title}
          onClick={() => activateFooterItem(item)}
          dangerouslySetInnerHTML={{ __html: item.iconHtml }}
        />
      ))}
    </div>
  );
}

export function TrayClock() {
  const [now, setNow] = useState(() => new Date());
  useEffect(() => {
    const timer = window.setInterval(() => setNow(new Date()), 15_000);
    return () => window.clearInterval(timer);
  }, []);
  return (
    <time className="bbd-clock" dateTime={now.toISOString()} title={now.toLocaleDateString(undefined, { dateStyle: "full" })}>
      {now.toLocaleTimeString(undefined, { hour: "numeric", minute: "2-digit" })}
    </time>
  );
}
