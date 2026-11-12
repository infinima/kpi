import { request } from "../../../shared/api/request.js";
export type LocationPhoto = { id: number; locationId: number; createdAt: string; };
type PhotoDto = { id: number; location_id: number; created_at: string; };
export const photoApi = {
    async list(locationId: number | string, signal?: AbortSignal): Promise<LocationPhoto[]> {
        const rows = await request<PhotoDto[]>({ method: "GET", path: `photos/location/${locationId}`, signal });
        return rows.map((row) => ({ id: row.id, locationId: row.location_id, createdAt: row.created_at }));
    },
    filePath(id: number) { return `photos/${id}/file`; },
};
