export function formatRussianPhone(value: string) {
    const digits = value.replace(/\D/g, "");
    const normalized = digits.startsWith("8")
        ? `7${digits.slice(1, 11)}`
        : digits.startsWith("7")
            ? digits.slice(0, 11)
            : digits.slice(0, 11);

    if (!normalized) {
        return "";
    }

    const part1 = normalized.slice(0, 1);
    const part2 = normalized.slice(1, 4);
    const part3 = normalized.slice(4, 7);
    const part4 = normalized.slice(7, 9);
    const part5 = normalized.slice(9, 11);

    let formatted = `+${part1}`;
    if (part2) formatted += ` (${part2}`;
    if (part2.length === 3) formatted += ")";
    if (part3) formatted += ` ${part3}`;
    if (part4) formatted += `-${part4}`;
    if (part5) formatted += `-${part5}`;

    return formatted;
}

export function getRussianPhoneDigits(value: string) {
    const digits = value.replace(/\D/g, "");
    if (digits.length !== 11) {
        return null;
    }

    if (digits.startsWith("7")) {
        return digits;
    }

    if (digits.startsWith("8")) {
        return `7${digits.slice(1)}`;
    }

    return null;
}

export function isValidEmail(value: string) {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value.trim());
}
