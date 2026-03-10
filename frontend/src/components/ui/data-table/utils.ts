import type {
    SortDirection,
    TableColumnConfig,
    TableRowData,
} from "./types";

export function compareValues(a: unknown, b: unknown) {
    if (a == null && b == null) return 0;
    if (a == null) return -1;
    if (b == null) return 1;

    const aNum = Number(a);
    const bNum = Number(b);

    if (!Number.isNaN(aNum) && !Number.isNaN(bNum) && `${a}` !== "" && `${b}` !== "") {
        return aNum - bNum;
    }

    return String(a).localeCompare(String(b), "ru", {sensitivity: "base"});
}

export function filterTableData(
    data: TableRowData[],
    searchableColumns: TableColumnConfig[],
    filters: Record<string, string>
) {
    return data.filter((row) =>
        searchableColumns.every((column) => {
            const term = filters[column.key]?.trim().toLowerCase();
            if (!term) return true;

            return String(row[column.key] ?? "").toLowerCase().includes(term);
        })
    );
}

export function sortTableData(
    data: TableRowData[],
    sortKey: string | null,
    sortDirection: SortDirection
) {
    if (!sortKey || !sortDirection) {
        return data;
    }

    return [...data].sort((a, b) => {
        const compared = compareValues(a[sortKey], b[sortKey]);
        return sortDirection === "asc" ? compared : -compared;
    });
}

export function createEmptyRow(columns: TableColumnConfig[]) {
    const base: TableRowData = {};

    for (const column of columns) {
        base[column.key] = "";
    }

    return base;
}

export function getEmptyValue(type: TableColumnConfig["type"]) {
    if (type === "number") return "";
    return "";
}

export function renderCellValue(value: unknown, column: TableColumnConfig) {
    if (column.type === "select" && column.options) {
        const found = column.options.find((item) => item.value === value);
        return found?.label ?? String(value ?? "");
    }

    if (value == null) return "";
    return String(value);
}
