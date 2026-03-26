const TEAM_QR_PREFIX = "kpi-team:";

export function encodeTeamQrPayload(teamId: number) {
    return `${TEAM_QR_PREFIX}${teamId}`;
}

export function parseTeamQrPayload(raw: string) {
    const normalized = String(raw ?? "").trim();

    if (/^\d+$/.test(normalized)) {
        return Number(normalized);
    }

    if (!normalized.startsWith(TEAM_QR_PREFIX)) {
        return null;
    }

    const idPart = normalized.slice(TEAM_QR_PREFIX.length).trim();
    return /^\d+$/.test(idPart) ? Number(idPart) : null;
}
