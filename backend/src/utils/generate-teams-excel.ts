import ExcelJS from "exceljs";
import { normalizeTeamMembers } from "./normalize-team-members.js";

type TeamRow = {
    id: number;
    league_id: number;
    league_name: string | null;
    import_id: number | null;
    owner_user_id: number | null;
    owner_full_name: string | null;
    owner_email: string | null;
    owner_phone_number: string | null;
    name: string;
    members: unknown;
    appreciations: unknown;
    documents: string;
    school: string;
    region: string;
    meals_count: number;
    maintainer_full_name: string | null;
    maintainer_activity: string | null;
    status: string;
    payment_link: string | null;
    answers_kvartaly: unknown;
    penalty_kvartaly: number;
    place_kvartaly: number | null;
    answers_fudzi: unknown;
    penalty_fudzi: number;
    place_fudzi: number | null;
    place_final: number | null;
    diploma: string | null;
    special_nominations: unknown;
    created_at: string;
    updated_at: string;
    deleted_at: string | null;
};

const HEADER_FILL = { type: "pattern", pattern: "solid", fgColor: { argb: "FFC6EFCE" } } as const;

function normalizeJson<T>(value: unknown, fallback: T): T {
    if (value === null || value === undefined) return fallback;
    if (typeof value === "string") {
        try {
            return JSON.parse(value) as T;
        } catch {
            return fallback;
        }
    }
    return value as T;
}

function toJoinedString(value: unknown): string {
    const arr = normalizeJson<unknown[]>(value, []);
    if (!Array.isArray(arr)) return String(value ?? "");
    return arr.map(v => String(v ?? "")).join("; ");
}

function formatDiploma(value: string | null): string {
    switch (value) {
        case "FIRST_DEGREE":
            return "Диплом I степени";
        case "SECOND_DEGREE":
            return "Диплом II степени";
        case "THIRD_DEGREE":
            return "Диплом III степени";
        case "PARTICIPANT":
            return "Участник";
        default:
            return "";
    }
}

function formatTeamStatus(value: string): string {
    switch (value) {
        case "IN_RESERVE":
            return "В резерве";
        case "ON_CHECKING":
            return "На проверке";
        case "ACCEPTED":
            return "Принята";
        case "PAID":
            return "Оплачена";
        case "ARRIVED":
            return "Прибыла";
        default:
            return value;
    }
}

function columnLetter(index: number): string {
    let result = "";
    let n = index;
    while (n > 0) {
        const r = (n - 1) % 26;
        result = String.fromCharCode(65 + r) + result;
        n = Math.floor((n - 1) / 26);
    }
    return result;
}

export async function generateTeamsExcel(teams: TeamRow[]): Promise<Buffer> {
    const workbook = new ExcelJS.Workbook();
    workbook.creator = "KPI";

    const worksheet = workbook.addWorksheet("Команды");

    const columns = [
        { header: "ID", key: "id", width: 8 },
        { header: "Название лиги", key: "league_name", width: 14 },
        { header: "Руководитель ФИО", key: "owner_full_name", width: 30 },
        { header: "Руководитель email", key: "owner_email", width: 22 },
        { header: "Руководитель телефон", key: "owner_phone_number", width: 18 },
        { header: "Команда", key: "name", width: 24 },
        { header: "Статус", key: "status", width: 12 },
        { header: "Участник 1", key: "member_1", width: 30 },
        { header: "Участник 2", key: "member_2", width: 30 },
        { header: "Участник 3", key: "member_3", width: 30 },
        { header: "Участник 4", key: "member_4", width: 30 },
        { header: "Школа", key: "school", width: 24 },
        { header: "Регион", key: "region", width: 18 },
        { header: "Сопровождающий ФИО", key: "maintainer_full_name", width: 30 },
        { header: "Сопровождающий активность", key: "maintainer_activity", width: 28 },
        { header: "Питание (кол-во)", key: "meals_count", width: 8 },
        { header: "Благодарности", key: "appreciations", width: 30 },
        { header: "Документы", key: "documents", width: 30 },
        { header: "Кварталы место", key: "place_kvartaly", width: 8 },
        { header: "Фудзи место", key: "place_fudzi", width: 8 },
        { header: "Итоговое место", key: "place_final", width: 14 },
        { header: "Диплом", key: "diploma", width: 16 },
        { header: "Спецноминации", key: "special_nominations", width: 26 },
        { header: "Ссылка на оплату", key: "payment_link", width: 18 },
        { header: "Создано", key: "created_at", width: 18 },
        { header: "Обновлено", key: "updated_at", width: 18 },
    ];

    worksheet.columns = columns;

    for (const team of teams) {
        const { participants: members } = normalizeTeamMembers(team.members);

        worksheet.addRow({
            id: team.id,
            league_id: team.league_id,
            league_name: team.league_name ?? "",
            owner_user_id: team.owner_user_id ?? "",
            owner_full_name: team.owner_full_name ?? "",
            owner_email: team.owner_email ?? "",
            owner_phone_number: team.owner_phone_number ?? "",
            name: team.name,
            member_1: members[0] ?? "",
            member_2: members[1] ?? "",
            member_3: members[2] ?? "",
            member_4: members[3] ?? "",
            appreciations: toJoinedString(team.appreciations),
            documents: team.documents ?? "",
            school: team.school,
            region: team.region,
            meals_count: team.meals_count,
            maintainer_full_name: team.maintainer_full_name ?? "",
            maintainer_activity: team.maintainer_activity ?? "",
            status: formatTeamStatus(team.status),
            payment_link: team.payment_link ?? "",
            place_kvartaly: team.place_kvartaly ?? "",
            place_fudzi: team.place_fudzi ?? "",
            place_final: team.place_final ?? "",
            diploma: formatDiploma(team.diploma),
            special_nominations: toJoinedString(team.special_nominations),
            created_at: team.created_at,
            updated_at: team.updated_at,
        });
    }

    const headerRow = worksheet.getRow(1);
    headerRow.eachCell(cell => {
        cell.fill = HEADER_FILL;
        cell.font = { bold: true };
    });

    const lastColumn = columnLetter(columns.length);
    worksheet.autoFilter = {
        from: "A1",
        to: `${lastColumn}1`,
    };

    const buffer = await workbook.xlsx.writeBuffer();
    return Buffer.isBuffer(buffer) ? buffer : Buffer.from(buffer as ArrayBuffer);
}
