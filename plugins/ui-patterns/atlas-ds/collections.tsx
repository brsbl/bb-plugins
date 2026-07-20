import * as React from "react";

import { Button } from "./controls.js";
import { cx, Heading, Stack, Text } from "./foundation.js";

export interface TableColumn<T> {
  id: string;
  header: React.ReactNode;
  cell: (item: T) => React.ReactNode;
  rowHeader?: boolean;
  align?: "start" | "center" | "end";
}

export interface DataTableProps<T>
  extends Omit<React.TableHTMLAttributes<HTMLTableElement>, "children"> {
  caption: string;
  columns: readonly TableColumn<T>[];
  items: readonly T[];
  getRowId: (item: T) => React.Key;
  emptyMessage?: React.ReactNode;
  interaction?: "table" | "grid";
}

export function DataTable<T>({
  caption,
  columns,
  items,
  getRowId,
  emptyMessage = "No records",
  interaction = "table",
  className,
  ...props
}: DataTableProps<T>) {
  const tableRef = React.useRef<HTMLTableElement>(null);
  const [activeCell, setActiveCell] = React.useState("0:0");
  const grid = interaction === "grid";

  const moveGridFocus = (
    event: React.KeyboardEvent<HTMLTableCellElement>,
    row: number,
    column: number,
  ) => {
    if (!grid) return;
    if (event.target !== event.currentTarget) {
      if (event.key === "Escape") {
        event.preventDefault();
        event.currentTarget.focus();
      }
      return;
    }
    if (event.key === "Enter" || event.key === "F2") {
      const widget = event.currentTarget.querySelector<HTMLElement>(
        "button, input, select, textarea, [tabindex]",
      );
      if (widget) {
        event.preventDefault();
        widget.focus();
      }
      return;
    }
    let nextRow = row;
    let nextColumn = column;
    if (event.key === "ArrowDown") nextRow = Math.min(items.length - 1, row + 1);
    else if (event.key === "ArrowUp") nextRow = Math.max(0, row - 1);
    else if (event.key === "ArrowRight") nextColumn = Math.min(columns.length - 1, column + 1);
    else if (event.key === "ArrowLeft") nextColumn = Math.max(0, column - 1);
    else if (event.key === "Home") nextColumn = 0;
    else if (event.key === "End") nextColumn = columns.length - 1;
    else return;
    event.preventDefault();
    const nextId = `${nextRow}:${nextColumn}`;
    setActiveCell(nextId);
    tableRef.current
      ?.querySelector<HTMLElement>(`[data-grid-cell="${nextId}"]`)
      ?.focus();
  };

  return (
    <div className="atlas-table-frame">
      <table
        ref={tableRef}
        className={cx("atlas-table", className)}
        {...props}
        role={grid ? "grid" : props.role}
        aria-rowcount={grid ? items.length + 1 : undefined}
        aria-colcount={grid ? columns.length : undefined}
      >
        <caption className="atlas-sr-only">{caption}</caption>
        <thead>
          <tr role={grid ? "row" : undefined}>
            {columns.map((column) => (
              <th
                key={column.id}
                scope="col"
                role={grid ? "columnheader" : undefined}
                data-align={column.align ?? "start"}
              >
                {column.header}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {items.length === 0 ? (
            <tr>
              <td className="atlas-table__empty" colSpan={columns.length}>
                {emptyMessage}
              </td>
            </tr>
          ) : (
            items.map((item, rowIndex) => (
              <tr key={getRowId(item)} role={grid ? "row" : undefined}>
                {columns.map((column, columnIndex) => {
                  const Component = column.rowHeader ? "th" : "td";
                  const cellId = `${rowIndex}:${columnIndex}`;
                  return (
                    <Component
                      key={column.id}
                      scope={column.rowHeader ? "row" : undefined}
                      role={grid ? (column.rowHeader ? "rowheader" : "gridcell") : undefined}
                      data-grid-cell={grid ? cellId : undefined}
                      tabIndex={grid ? (activeCell === cellId ? 0 : -1) : undefined}
                      onFocus={grid ? () => setActiveCell(cellId) : undefined}
                      onKeyDown={grid
                        ? (event) => moveGridFocus(event, rowIndex, columnIndex)
                        : undefined}
                      data-align={column.align ?? "start"}
                    >
                      {column.cell(item)}
                    </Component>
                  );
                })}
              </tr>
            ))
          )}
        </tbody>
      </table>
    </div>
  );
}

export interface CollectionItem {
  id: string;
  htmlId?: string;
  primary: React.ReactNode;
  secondary?: React.ReactNode;
  meta?: React.ReactNode;
  leading?: React.ReactNode;
  action?: React.ReactNode;
}

export interface CollectionListProps
  extends Omit<React.HTMLAttributes<HTMLUListElement>, "children"> {
  items: readonly CollectionItem[];
  label: string;
}

export function CollectionList({
  items,
  label,
  className,
  ...props
}: CollectionListProps) {
  return (
    <ul
      className={cx("atlas-collection", className)}
      aria-label={label}
      {...props}
    >
      {items.map((item) => (
        <li key={item.id} id={item.htmlId} className="atlas-collection__item">
          {item.leading ? (
            <span className="atlas-collection__leading">{item.leading}</span>
          ) : null}
          <div className="atlas-collection__body">
            <span className="atlas-collection__primary">{item.primary}</span>
            {item.secondary ? (
              <span className="atlas-collection__secondary">
                {item.secondary}
              </span>
            ) : null}
          </div>
          {item.meta ? (
            <span className="atlas-collection__meta">{item.meta}</span>
          ) : null}
          {item.action ? (
            <span className="atlas-collection__action">{item.action}</span>
          ) : null}
        </li>
      ))}
    </ul>
  );
}

export interface EmptyStateProps
  extends Omit<React.HTMLAttributes<HTMLDivElement>, "title"> {
  title: React.ReactNode;
  description?: React.ReactNode;
  action?: {
    label: string;
    onAction: () => void;
  };
}

export function EmptyState({
  title,
  description,
  action,
  className,
  ...props
}: EmptyStateProps) {
  return (
    <Stack
      className={cx("atlas-empty-state", className)}
      gap="sm"
      {...props}
    >
      <Heading level={3} size="sm">
        {title}
      </Heading>
      {description ? <Text tone="muted">{description}</Text> : null}
      {action ? (
        <div>
          <Button size="sm" onClick={action.onAction}>
            {action.label}
          </Button>
        </div>
      ) : null}
    </Stack>
  );
}
