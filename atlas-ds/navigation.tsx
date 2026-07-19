import * as React from "react";

import { cx } from "./foundation.js";
import { AtlasIcon } from "./icons.js";

export interface BreadcrumbItem {
  id: string;
  label: React.ReactNode;
  href?: string;
}

export interface BreadcrumbsProps
  extends Omit<React.HTMLAttributes<HTMLElement>, "children"> {
  items: readonly BreadcrumbItem[];
  label?: string;
}

export function Breadcrumbs({
  items,
  label = "Breadcrumb",
  className,
  ...props
}: BreadcrumbsProps) {
  return (
    <nav
      className={cx("atlas-breadcrumbs", className)}
      aria-label={label}
      {...props}
    >
      <ol>
        {items.map((item, index) => {
          const current = index === items.length - 1;
          return (
            <li key={item.id}>
              {item.href && !current ? (
                <a href={item.href}>{item.label}</a>
              ) : (
                <span aria-current={current ? "page" : undefined}>
                  {item.label}
                </span>
              )}
            </li>
          );
        })}
      </ol>
    </nav>
  );
}

export interface TabItem {
  id: string;
  label: React.ReactNode;
  panel: React.ReactNode;
  disabled?: boolean;
}

export interface TabsProps
  extends Omit<React.HTMLAttributes<HTMLDivElement>, "children"> {
  items: readonly TabItem[];
  selectedId: string;
  onSelectionChange: (id: string) => void;
  label: string;
}

export function Tabs({
  items,
  selectedId,
  onSelectionChange,
  label,
  className,
  ...props
}: TabsProps) {
  const instanceId = React.useId();

  const selectFromKeyboard = (
    event: React.KeyboardEvent<HTMLButtonElement>,
    currentId: string,
  ) => {
    const enabledItems = items.filter((item) => !item.disabled);
    const currentIndex = enabledItems.findIndex((item) => item.id === currentId);
    let nextIndex: number | undefined;

    if (event.key === "ArrowRight") {
      nextIndex = (currentIndex + 1) % enabledItems.length;
    } else if (event.key === "ArrowLeft") {
      nextIndex =
        (currentIndex - 1 + enabledItems.length) % enabledItems.length;
    } else if (event.key === "Home") {
      nextIndex = 0;
    } else if (event.key === "End") {
      nextIndex = enabledItems.length - 1;
    }

    if (nextIndex === undefined || !enabledItems[nextIndex]) return;
    event.preventDefault();
    onSelectionChange(enabledItems[nextIndex].id);
    const tabButtons =
      event.currentTarget.parentElement?.querySelectorAll<HTMLButtonElement>(
        '[role="tab"]:not(:disabled)',
      );
    tabButtons?.[nextIndex]?.focus();
  };

  return (
    <div className={cx("atlas-tabs", className)} {...props}>
      <div className="atlas-tabs__list" role="tablist" aria-label={label}>
        {items.map((item) => {
          const selected = item.id === selectedId;
          const tabId = `${instanceId}-${item.id}-tab`;
          const panelId = `${instanceId}-${item.id}-panel`;
          return (
            <button
              key={item.id}
              id={tabId}
              type="button"
              role="tab"
              className="atlas-tabs__tab"
              aria-selected={selected}
              aria-controls={panelId}
              tabIndex={selected ? 0 : -1}
              disabled={item.disabled}
              onClick={() => onSelectionChange(item.id)}
              onKeyDown={(event) => selectFromKeyboard(event, item.id)}
            >
              {item.label}
            </button>
          );
        })}
      </div>
      {items.map((item) => {
        const selected = item.id === selectedId;
        return (
          <div
            key={item.id}
            id={`${instanceId}-${item.id}-panel`}
            className="atlas-tabs__panel"
            role="tabpanel"
            aria-labelledby={`${instanceId}-${item.id}-tab`}
            hidden={!selected}
            tabIndex={0}
          >
            {item.panel}
          </div>
        );
      })}
    </div>
  );
}

export interface NavigationItem {
  id: string;
  label: React.ReactNode;
  href?: string;
  badge?: React.ReactNode;
  disabled?: boolean;
}

export interface SideNavigationProps
  extends Omit<React.HTMLAttributes<HTMLElement>, "children"> {
  items: readonly NavigationItem[];
  activeId?: string;
  onNavigate?: (id: string) => void;
  label: string;
}

export function SideNavigation({
  items,
  activeId,
  onNavigate,
  label,
  className,
  ...props
}: SideNavigationProps) {
  return (
    <nav
      className={cx("atlas-side-nav", className)}
      aria-label={label}
      {...props}
    >
      <ul>
        {items.map((item) => {
          const active = item.id === activeId;
          const content = (
            <>
              <span>{item.label}</span>
              {item.badge ? (
                <span className="atlas-side-nav__badge">{item.badge}</span>
              ) : null}
            </>
          );
          return (
            <li key={item.id}>
              {item.href ? (
                <a
                  href={item.href}
                  aria-current={active ? "page" : undefined}
                  aria-disabled={item.disabled || undefined}
                  onClick={(event) => {
                    if (item.disabled) {
                      event.preventDefault();
                      return;
                    }
                    onNavigate?.(item.id);
                  }}
                >
                  {content}
                </a>
              ) : (
                <button
                  type="button"
                  aria-current={active ? "page" : undefined}
                  disabled={item.disabled}
                  onClick={() => onNavigate?.(item.id)}
                >
                  {content}
                </button>
              )}
            </li>
          );
        })}
      </ul>
    </nav>
  );
}

export interface NavigationBarProps
  extends Omit<React.HTMLAttributes<HTMLElement>, "children"> {
  items: readonly NavigationItem[];
  activeId?: string;
  onNavigate?: (id: string) => void;
  label: string;
}

/** Primary horizontal navigation between application destinations. */
export function NavigationBar({
  items,
  activeId,
  onNavigate,
  label,
  className,
  ...props
}: NavigationBarProps) {
  return (
    <nav className={cx("atlas-navigation-bar", className)} aria-label={label} {...props}>
      <ul>
        {items.map((item) => {
          const active = item.id === activeId;
          return (
            <li key={item.id}>
              {item.href ? (
                <a
                  href={item.href}
                  aria-current={active ? "page" : undefined}
                  aria-disabled={item.disabled || undefined}
                  onClick={(event) => {
                    if (item.disabled) event.preventDefault();
                    else onNavigate?.(item.id);
                  }}
                >
                  {item.label}
                </a>
              ) : (
                <button
                  type="button"
                  aria-current={active ? "page" : undefined}
                  disabled={item.disabled}
                  onClick={() => onNavigate?.(item.id)}
                >
                  {item.label}
                </button>
              )}
            </li>
          );
        })}
      </ul>
    </nav>
  );
}

export interface CompactNavigationItem extends NavigationItem {
  icon: React.ReactNode;
}

export interface NavigationRailProps
  extends Omit<React.HTMLAttributes<HTMLElement>, "children"> {
  items: readonly CompactNavigationItem[];
  activeId?: string;
  onNavigate?: (id: string) => void;
  label: string;
}

/** Compact vertical destination navigation; labels remain visible by design. */
export function NavigationRail({
  items,
  activeId,
  onNavigate,
  label,
  className,
  ...props
}: NavigationRailProps) {
  return (
    <nav className={cx("atlas-navigation-rail", className)} aria-label={label} {...props}>
      <ul>
        {items.map((item) => {
          const active = item.id === activeId;
          return (
            <li key={item.id}>
              <button
                type="button"
                aria-current={active ? "page" : undefined}
                disabled={item.disabled}
                onClick={() => onNavigate?.(item.id)}
              >
                <span className="atlas-navigation-rail__icon" aria-hidden="true">{item.icon}</span>
                <span>{item.label}</span>
              </button>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}

export type TabBarProps = NavigationRailProps;

/** Compact horizontal destination navigation, commonly anchored at an edge. */
export function TabBar({
  items,
  activeId,
  onNavigate,
  label,
  className,
  ...props
}: TabBarProps) {
  return (
    <nav className={cx("atlas-tab-bar", className)} aria-label={label} {...props}>
      <ul>
        {items.map((item) => {
          const active = item.id === activeId;
          return (
            <li key={item.id}>
              <button
                type="button"
                aria-current={active ? "page" : undefined}
                disabled={item.disabled}
                onClick={() => onNavigate?.(item.id)}
              >
                <span className="atlas-tab-bar__icon" aria-hidden="true">{item.icon}</span>
                <span>{item.label}</span>
              </button>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}

export type StepStatus = "complete" | "current" | "upcoming" | "error";

export interface StepIndicatorItem {
  id: string;
  label: React.ReactNode;
  description?: React.ReactNode;
  status: StepStatus;
}

export interface StepIndicatorProps
  extends Omit<React.HTMLAttributes<HTMLElement>, "children"> {
  items: readonly StepIndicatorItem[];
  label?: string;
  compact?: boolean;
}

/** Progress through a multi-step process; it is not a numeric stepper input. */
export function StepIndicator({
  items,
  label = "Progress",
  compact = false,
  className,
  style,
  ...props
}: StepIndicatorProps) {
  const currentIndex = items.findIndex((item) => item.status === "current");
  const allComplete = items.length > 0 && items.every((item) => item.status === "complete");
  return (
    <nav
      className={cx("atlas-step-indicator", className)}
      aria-label={label}
      data-compact={compact || undefined}
      style={{ ...style, "--atlas-step-count": items.length } as React.CSSProperties}
      {...props}
    >
      <ol>
        {items.map((item, index) => (
          <li key={item.id} data-status={item.status} aria-current={item.status === "current" ? "step" : undefined}>
            <span className="atlas-step-indicator__marker" aria-hidden="true">
              {item.status === "complete" ? <AtlasIcon name="Check" size="xs" /> : index + 1}
            </span>
            {!compact ? (
              <span className="atlas-step-indicator__body">
                <span className="atlas-step-indicator__label">{item.label}</span>
                {item.description ? <span className="atlas-step-indicator__description">{item.description}</span> : null}
              </span>
            ) : null}
          </li>
        ))}
      </ol>
      {currentIndex >= 0 ? (
        <span className="atlas-sr-only">Step {currentIndex + 1} of {items.length}</span>
      ) : allComplete ? (
        <span className="atlas-sr-only">All {items.length} steps complete</span>
      ) : null}
    </nav>
  );
}

export interface TreeNode {
  id: string;
  label: React.ReactNode;
  children?: readonly TreeNode[];
  icon?: React.ReactNode;
  disabled?: boolean;
}

export interface TreeViewProps
  extends Omit<React.HTMLAttributes<HTMLUListElement>, "children"> {
  nodes: readonly TreeNode[];
  label: string;
  expandedIds: readonly string[];
  selectedId?: string;
  onExpandedChange: (ids: readonly string[]) => void;
  onSelectionChange: (id: string) => void;
}

function visibleTreeItems(root: HTMLElement): HTMLButtonElement[] {
  return Array.from(root.querySelectorAll<HTMLButtonElement>('[role="treeitem"]'))
    .filter((item) => item.offsetParent !== null || item.getClientRects().length > 0);
}

/** A controlled single-select hierarchy following the APG tree contract. */
export function TreeView({
  nodes,
  label,
  expandedIds,
  selectedId,
  onExpandedChange,
  onSelectionChange,
  className,
  ...props
}: TreeViewProps) {
  const expanded = new Set(expandedIds);

  const toggle = (id: string, next: boolean) => {
    const nextIds = new Set(expandedIds);
    if (next) nextIds.add(id);
    else nextIds.delete(id);
    onExpandedChange([...nextIds]);
  };

  const renderNodes = (items: readonly TreeNode[], level: number): React.ReactNode =>
    items.map((node, index) => {
      const hasChildren = Boolean(node.children?.length);
      const isExpanded = hasChildren && expanded.has(node.id);
      const selected = node.id === selectedId;
      const tabStop = selected || (!selectedId && level === 1 && index === 0);
      return (
        <li key={node.id} role="none">
          <button
            type="button"
            role="treeitem"
            className="atlas-tree__item"
            data-tree-id={node.id}
            aria-level={level}
            aria-expanded={hasChildren ? isExpanded : undefined}
            aria-selected={selected}
            disabled={node.disabled}
            tabIndex={tabStop ? 0 : -1}
            onClick={() => {
              onSelectionChange(node.id);
              if (hasChildren) toggle(node.id, !isExpanded);
            }}
            onKeyDown={(event) => {
              const tree = event.currentTarget.closest<HTMLElement>('[role="tree"]');
              if (!tree) return;
              const items = visibleTreeItems(tree);
              const currentIndex = items.indexOf(event.currentTarget);
              let target: HTMLButtonElement | undefined;
              if (event.key === "ArrowDown") target = items[currentIndex + 1] ?? items[0];
              else if (event.key === "ArrowUp") target = items[currentIndex - 1] ?? items.at(-1);
              else if (event.key === "Home") target = items[0];
              else if (event.key === "End") target = items.at(-1);
              else if (event.key === "ArrowRight" && hasChildren && !isExpanded) {
                event.preventDefault();
                toggle(node.id, true);
                return;
              } else if (event.key === "ArrowRight" && hasChildren && isExpanded) {
                const child = event.currentTarget.parentElement?.querySelector<HTMLButtonElement>(
                  ':scope > [role="group"] [role="treeitem"]',
                );
                if (child) {
                  event.preventDefault();
                  child.focus();
                  return;
                }
              } else if (event.key === "ArrowLeft") {
                if (hasChildren && isExpanded) {
                  event.preventDefault();
                  toggle(node.id, false);
                  return;
                }
                const parentGroup = event.currentTarget.closest('[role="group"]');
                const parentItem = parentGroup?.parentElement?.querySelector<HTMLButtonElement>(
                  ':scope > [role="treeitem"]',
                );
                if (parentItem) {
                  event.preventDefault();
                  parentItem.focus();
                  return;
                }
              }
              if (target) {
                event.preventDefault();
                target.focus();
              }
            }}
          >
            <span className="atlas-tree__expander" aria-hidden="true">
              {hasChildren ? <AtlasIcon name={isExpanded ? "ChevronDown" : "ChevronRight"} size="xs" /> : null}
            </span>
            <span className="atlas-tree__icon" aria-hidden="true">
              {node.icon ?? <AtlasIcon name={hasChildren ? "Folder" : "File"} size="sm" />}
            </span>
            <span className="atlas-tree__label">{node.label}</span>
          </button>
          {hasChildren && isExpanded ? (
            <ul role="group">{renderNodes(node.children ?? [], level + 1)}</ul>
          ) : null}
        </li>
      );
    });

  return (
    <ul className={cx("atlas-tree", className)} role="tree" aria-label={label} {...props}>
      {renderNodes(nodes, 1)}
    </ul>
  );
}
