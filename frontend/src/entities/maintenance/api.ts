import { request } from "../../shared/api/request.js";
import type { MaintenanceOut } from "../../shared/api/schema.js";
export const maintenanceApi = {
    status(signal?: AbortSignal) { return request<MaintenanceOut>({ method: "GET", path: "maintenance", signal }); },
};
