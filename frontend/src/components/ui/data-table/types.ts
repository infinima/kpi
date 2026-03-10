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
};

export type TableRowData = Record<string, string | number | null | undefined>;

export type SortDirection = "asc" | "desc" | null;
