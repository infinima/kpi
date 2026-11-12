import type { TeamInfo } from '../../../entities/team/model/scannerTeam.js';
export type { TeamInfo } from '../../../entities/team/model/scannerTeam.js';

export const teamStatusLabels: Record<TeamInfo["status"], string> = {
    IN_RESERVE: "В резерве",
    ON_CHECKING: "На проверке",
    ACCEPTED: "Принята",
    ARRIVED: "Прибыла",
    DOCUMENTS_SUBMITTED: "Сдала документы",
};

export function getTeamStatusLabel(status: TeamInfo["status"]) {
    return teamStatusLabels[status] ?? status;
}

declare global {
    interface Window {
        BarcodeDetector?: new (options?: { formats?: string[]; }) => {
            detect: (source: ImageBitmapSource) => Promise<Array<{ rawValue?: string; }>>;
        };
    }
}

export { extractUuidFromScannerPayload, uuidPattern } from "../../../shared/lib/qr.js";
