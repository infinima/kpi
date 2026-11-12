export type SortDirection = "asc" | "desc" | null;

export function compareValues(a: unknown, b: unknown): number {
    if (a == null && b == null) return 0;
    if (a == null) return -1;
    if (b == null) return 1;
    const aNum = Number(a);
    const bNum = Number(b);
    if (!Number.isNaN(aNum) && !Number.isNaN(bNum) && `${a}` !== "" && `${b}` !== "") return aNum - bNum;
    return String(a).localeCompare(String(b), "ru", { sensitivity: "base" });
}

export function nextSort<T extends string>(current: { key: T; direction: SortDirection; } | null, key: T): { key: T; direction: Exclude<SortDirection, null>; } | null {
    if (!current || current.key !== key) return { key, direction: "asc" };
    return current.direction === "asc" ? { key, direction: "desc" } : null;
}

export function matchesColumnFilters<T, C extends { key: string; }>(row: T, columns: readonly C[], filters: Record<string, string>, display: (row: T, column: C) => string): boolean {
    return columns.every((column) => {
        const term = (filters[column.key] ?? "").trim().toLowerCase();
        return !term || display(row, column).toLowerCase().includes(term);
    });
}
