export function formatDateTime(value: string | null | undefined) {
    if (!value) {
        return "Не указано";
    }

    const date = new Date(value);
    if (Number.isNaN(date.getTime())) {
        return value;
    }

    return date.toLocaleString("ru-RU", {
        day: "2-digit",
        month: "2-digit",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit",
    });
}

export function formatRussianPhone(value: string | null | undefined) {
    if (!value) {
        return "Не указан";
    }

    const digits = String(value).replace(/\D/g, "");
    const normalized = digits.startsWith("8")
        ? `7${digits.slice(1, 11)}`
        : digits.startsWith("7")
            ? digits.slice(0, 11)
            : digits.slice(0, 11);

    if (normalized.length !== 11) {
        return value;
    }

    const part1 = normalized.slice(0, 1);
    const part2 = normalized.slice(1, 4);
    const part3 = normalized.slice(4, 7);
    const part4 = normalized.slice(7, 9);
    const part5 = normalized.slice(9, 11);

    return `+${part1} (${part2}) ${part3}-${part4}-${part5}`;
}

export const statusOptions = [
    { label: "В резерве", value: "IN_RESERVE" },
    { label: "На проверке", value: "ON_CHECKING" },
    { label: "Принята", value: "ACCEPTED" },
    { label: "Прибыла", value: "ARRIVED" },
    { label: "Сдала документы", value: "DOCUMENTS_SUBMITTED" },
];

export const diplomaOptions = [
    { label: "Нет", value: "" },
    { label: "I степень", value: "FIRST_DEGREE" },
    { label: "II степень", value: "SECOND_DEGREE" },
    { label: "III степень", value: "THIRD_DEGREE" },
    { label: "Участник", value: "PARTICIPANT" },
];

export const maintainerActivityOptions = [
    { label: "семинар учителей математики", value: "семинар учителей математики" },
    { label: "экскурсия по Технопарку (платно)", value: "экскурсия по Технопарку (платно)" },
    { label: "мастер-класс в Технопарке (платно)", value: "мастер-класс в Технопарке (платно)" },
    { label: "заниматься своими делами", value: "заниматься своими делами" },
];

export function ReadField({ label, value }: { label: string; value: string; }) {
    return (
        <div className="rounded-2xl border border-[var(--color-border)] bg-[rgba(248,250,252,0.76)] p-4">
            <div className="text-xs font-medium uppercase tracking-[0.08em] text-[var(--color-text-secondary)]">
                {label}
            </div>
            <div className="mt-2 text-sm font-medium text-[var(--color-text-main)]">
                {value || "Не указано"}
            </div>
        </div>
    );
}

export function inputClassName(changed: boolean) {
    return `w-full rounded-xl border px-3 py-2 text-sm outline-none focus:border-[var(--color-primary-light)] ${changed
        ? "border-amber-300 bg-[rgba(253,224,71,0.16)]"
        : "border-[var(--color-border)] bg-[var(--color-background)]"
        }`;
}

export function isChanged(left: unknown, right: unknown) {
    return JSON.stringify(left ?? null) !== JSON.stringify(right ?? null);
}

export function buildTextAreaValue(values: string[]) {
    return values.join("\n");
}

export function parseTextAreaValue(value: string) {
    return value
        .split("\n")
        .map((item) => item.trim())
        .filter(Boolean);
}

export function normalizePaymentLink(value: string | number | null | undefined) {
    if (value === null || value === undefined) {
        return null;
    }

    const normalized = String(value).trim();
    return normalized ? normalized : null;
}
