export function registrationPath(eventId: number | string, locationId?: number | string, leagueId?: number | string): string {
    const params = new URLSearchParams({ eventId: String(eventId) });
    if (locationId != null) params.set("locationId", String(locationId));
    if (leagueId != null) params.set("leagueId", String(leagueId));
    return `/lk/reg_team?${params}`;
}
export function authDestination(destination: string, guest: boolean): string {
    return guest ? `/auth?${new URLSearchParams({ returnTo: destination })}` : destination;
}
export function safeReturnTo(value: string | null): string | null {
    if (!value || !value.startsWith("/") || value.startsWith("//")) return null;
    if (["\\", "\r", "\n"].some(character => value.includes(character))) return null;
    return value;
}
