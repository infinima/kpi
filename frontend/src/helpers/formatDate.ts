export function formatDate(dateString: string): string {
    const date = new Date(dateString);

    if (isNaN(date.getTime())) return dateString; // fallback

    return date.toLocaleString("ru-RU", {
        year: "numeric",
        month: "long",
        day: "numeric",
        hour: "2-digit",
        minute: "2-digit",
    });
}

export function formatDateOnly(dateString: string): string {
    const date = new Date(dateString);

    if (isNaN(date.getTime())) return dateString;

    return date.toLocaleDateString("ru-RU", {
        year: "numeric",
        month: "long",
        day: "numeric",
    });
}