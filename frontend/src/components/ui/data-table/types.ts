import type { ReactNode } from "react";

export type TableColumnType =
    | "text"
    | "number"
    | "email"
    | "select"
    | "status"
    | "date";

export type TableColumnOption = {
    label: string;
    value: string;
};

export type TableColumnConfig = {
    key: string;
    label: string;
    type: TableColumnType;
    width: number;
    sortable?: boolean;
    editable?: boolean;
    searchable?: boolean;
    required?: boolean;
    options?: TableColumnOption[];
};

export type TableConfig = {
    columns: TableColumnConfig[];
    hideActions?: boolean;
    allowCreate?: boolean;
    actionsWidth?: number;
};

export type TableToolbarContent = ReactNode;

export type TableRowData = Record<string, string | number | null | undefined>;

export type SortDirection = "asc" | "desc" | null;
