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
}

export function DataTable<T>({
  caption,
  columns,
  items,
  getRowId,
  emptyMessage = "No records",
  className,
  ...props
}: DataTableProps<T>) {
  return (
    <div className="atlas-table-frame">
      <table className={cx("atlas-table", className)} {...props}>
        <caption className="atlas-sr-only">{caption}</caption>
        <thead>
          <tr>
            {columns.map((column) => (
              <th
                key={column.id}
                scope="col"
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
            items.map((item) => (
              <tr key={getRowId(item)}>
                {columns.map((column) => {
                  const Component = column.rowHeader ? "th" : "td";
                  return (
                    <Component
                      key={column.id}
                      scope={column.rowHeader ? "row" : undefined}
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
        <li key={item.id} className="atlas-collection__item">
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
