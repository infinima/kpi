import { PDFDocument, rgb } from "pdf-lib";
import * as fontkit from "fontkit";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

type DiplomaGenerator = (params: {
    teamName: string;
    members: string[];
    degree: "FIRST_DEGREE" | "SECOND_DEGREE" | "THIRD_DEGREE" | "PARTICIPANT";
    year: string;
}) => Promise<Buffer>;

function resolveGeneratorId(eventId: number, available: number[]): number {
    if (available.includes(eventId)) return eventId;
    return Math.max(...available);
}

const AVAILABLE_EVENT_IDS = [1];

async function generateDiplomaEvent1(
    teamName: string,
    members: string[],
    degree: "FIRST_DEGREE" | "SECOND_DEGREE" | "THIRD_DEGREE" | "PARTICIPANT",
    year: string = new Date().getFullYear().toString()
): Promise<Buffer> {

    const templateMap = {
        FIRST_DEGREE: "diploma_first_degree_template.pdf",
        SECOND_DEGREE: "diploma_second_degree_template.pdf",
        THIRD_DEGREE: "diploma_third_degree_template.pdf",
        PARTICIPANT: "diploma_participant_template.pdf"
    };

    const templatePath = path.resolve(
        __dirname,
        "../static/papers/1/" + templateMap[degree]
    );
    const templateBytes = fs.readFileSync(templatePath);

    const pdfDoc = await PDFDocument.load(templateBytes);
    // @ts-ignore
    pdfDoc.registerFontkit(fontkit);

    const page = pdfDoc.getPages()[0];
    const { width } = page.getSize();

    // ==== Загружаем шрифты ====
    const mainFontBytes = fs.readFileSync(
        path.resolve(__dirname, "../static/Philosopher-Regular.ttf")
    );
    const mainFont = await pdfDoc.embedFont(mainFontBytes);

    const futuraFontBytes = fs.readFileSync(
        path.resolve(__dirname, "../static/AG_Futura-Regular.ttf")
    );
    const futuraFont = await pdfDoc.embedFont(futuraFontBytes);

    page.setFontColor(rgb(0, 0, 0));

    // ===== Layout =====
    const teamFontSize = 45;
    const teamMaxWidth = 400;
    const teamStartX = 43;
    const teamBaseY = degree == "PARTICIPANT" ? 485 : 455;
    const teamBaseYDelta = 25;

    const memberFontSize = 22;
    const memberStartX = 41;
    const memberStartY = 325;

    const yearY = 24;

    // ===== Утилита переноса по словам =====
    function splitTextIntoLines(
        text: string,
        font: any,
        fontSize: number,
        maxWidth: number
    ): string[] {
        const words = text.split(" ");
        const lines: string[] = [];
        let current = "";

        for (const word of words) {
            const attempt = (current ? current + " " : "") + word;
            const w = font.widthOfTextAtSize(attempt, fontSize);

            if (w <= maxWidth) {
                current = attempt;
            } else {
                if (current) lines.push(current);
                current = word;
            }
        }
        if (current) lines.push(current);
        return lines;
    }

    // ===== Название команды =====
    const teamLines = splitTextIntoLines(teamName, mainFont, teamFontSize, teamMaxWidth).slice(0, 3);
    const teamLinesNum = teamLines.length;

    teamLines.forEach((line, i) => {
        const y = teamBaseY - i * (teamFontSize + 6);
        page.drawText(line, {
            x: teamStartX,
            y: y - (teamLinesNum === 1 ? teamBaseYDelta : 0),
            size: teamFontSize,
            font: mainFont
        });
    });

    // ===== Участники (всегда 4 по требованию) =====
    members.slice(0, 4).forEach((fullName, i) => {
        const y = memberStartY - i * (memberFontSize + 4);
        page.drawText(fullName, {
            x: memberStartX,
            y,
            size: memberFontSize,
            font: futuraFont
        });
    });

    // ===== Год =====
    const yearWidth = futuraFont.widthOfTextAtSize(year, 20);
    page.drawText(year, {
        x: width - yearWidth - 25,
        y: yearY,
        size: 20,
        font: futuraFont
    });

    return Buffer.from(await pdfDoc.save());
}

const DIPLOMA_GENERATORS: Record<number, DiplomaGenerator> = {
    1: ({ teamName, members, degree, year }) => generateDiplomaEvent1(teamName, members, degree, year),
};

export async function generateDiploma(
    teamName: string,
    members: string[],
    degree: "FIRST_DEGREE" | "SECOND_DEGREE" | "THIRD_DEGREE" | "PARTICIPANT",
    eventId: number,
    year: string = new Date().getFullYear().toString()
): Promise<Buffer> {
    const resolvedId = resolveGeneratorId(eventId, AVAILABLE_EVENT_IDS);
    const generator = DIPLOMA_GENERATORS[resolvedId];
    return generator({ teamName, members, degree, year });
}
