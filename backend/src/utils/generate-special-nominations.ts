import { PDFDocument, rgb } from "pdf-lib";
import * as fontkit from "fontkit";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

type SpecialNominationsGenerator = (params: {
    teamName: string;
    members: string[];
    specialNominations: string[];
    year: string;
}) => Promise<Buffer>;

function resolveGeneratorId(eventId: number, available: number[]): number {
    if (available.includes(eventId)) return eventId;
    return Math.max(...available);
}

const AVAILABLE_EVENT_IDS = [1, 2];

async function generateSpecialNominationsEvent1(
    teamName: string,
    members: string[],
    specialNominations: string[],
    year: string = new Date().getFullYear().toString()
): Promise<Buffer> {

    const templatePath = path.resolve(
        __dirname,
        "../static/papers/1/special_nomination_template.pdf"
    );
    const templateBytes = fs.readFileSync(templatePath);

    const pdfDoc = await PDFDocument.create();
    // @ts-ignore
    pdfDoc.registerFontkit(fontkit);

    // ==== Шрифты ====
    const mainFontBytes = fs.readFileSync(
        path.resolve(__dirname, "../static/Philosopher-Regular.ttf")
    );
    const mainFont = await pdfDoc.embedFont(mainFontBytes);

    const futuraFontBytes = fs.readFileSync(
        path.resolve(__dirname, "../static/AG_Futura-Regular.ttf")
    );
    const futuraFont = await pdfDoc.embedFont(futuraFontBytes);

    // ==== Layout ====
    const teamFontSize = 45;
    const teamMaxWidth = 350;
    const teamX = 43;
    const teamY = 455;

    const memberFontSize = 22;
    const memberX = 41;
    const memberBaseY = 325;
    const teamBaseYDelta = 27;

    const nominationFontSizeBase = 38;
    const nominationMaxWidth = 380;
    const nominationX = 43;
    const nominationY = 620;
    const nominationYDelta = 21;
    const nominationLineSpacing = 46;

    const yearY = 24;

    function splitText(text: string, font: any, fontSize: number, maxWidth: number) {
        const words = text.split(" ");
        const lines: string[] = [];
        let current = "";

        for (const w of words) {
            const attempt = (current ? current + " " : "") + w;
            if (font.widthOfTextAtSize(attempt, fontSize) <= maxWidth) {
                current = attempt;
            } else {
                if (current) lines.push(current);
                current = w;
            }
        }
        if (current) lines.push(current);
        return lines;
    }

    for (const nom of specialNominations) {
        const doc = await PDFDocument.load(templateBytes);
        const [templatePage] = await pdfDoc.copyPages(doc, [0]);
        pdfDoc.addPage(templatePage);

        const page = templatePage;
        const { width } = page.getSize();

        page.setFontColor(rgb(0, 0, 0));

        // === Team ===
        const teamLines = splitText(teamName, mainFont, teamFontSize, teamMaxWidth).slice(0, 3);
        const teamLinesNum = teamLines.length;
        teamLines.forEach((line, i) => {
            page.drawText(line, {
                x: teamX,
                y: teamY - i * (teamFontSize + 6) - (teamLinesNum == 1 ? teamBaseYDelta : 0),
                size: teamFontSize,
                font: mainFont
            });
        });

        // === Members (4) ===
        members.slice(0, 4).forEach((m, i) => {
            page.drawText(m, {
                x: memberX,
                y: memberBaseY - i * (memberFontSize + 4),
                size: memberFontSize,
                font: futuraFont
            });
        });

        // === Nomination, with «ёлочки» and wrapping ===
        const text = `«${nom.toUpperCase()}»`;

        let fontSize = nominationFontSizeBase;
        let lines = splitText(text, futuraFont, fontSize, nominationMaxWidth);
        const linesNum = lines.length;

        lines.forEach((line, i) => {
            page.drawText(line, {
                x: nominationX,
                y: nominationY - i * nominationLineSpacing - (linesNum == 1 ? nominationYDelta : 0),
                size: fontSize,
                font: futuraFont
            });
        });

        // === Year ===
        const yearWidth = futuraFont.widthOfTextAtSize(year, 20);
        page.drawText(year, {
            x: width - yearWidth - 25,
            y: yearY,
            size: 20,
            font: futuraFont
        });
    }

    return Buffer.from(await pdfDoc.save());
}

async function generateSpecialNominationsEvent2(
    teamName: string,
    members: string[],
    specialNominations: string[],
    year: string = new Date().getFullYear().toString()
): Promise<Buffer> {

    const templatePath = path.resolve(
        __dirname,
        "../static/papers/2/special_nomination_template.pdf"
    );
    const templateBytes = fs.readFileSync(templatePath);

    const pdfDoc = await PDFDocument.create();
    // @ts-ignore
    pdfDoc.registerFontkit(fontkit);

    const mainFontBytes = fs.readFileSync(
        path.resolve(__dirname, "../static/Garamond.ttf")
    );
    const mainFont = await pdfDoc.embedFont(mainFontBytes);

    const CorbelFontBytes = fs.readFileSync(
        path.resolve(__dirname, "../static/Corbel-Bold.ttf")
    );
    const CorbelFont = await pdfDoc.embedFont(CorbelFontBytes);

    const { width } = (await PDFDocument.load(templateBytes)).getPages()[0].getSize();
    const totalWidthUnits = 260;
    const leftWidthUnits = 66;
    const rightWidthUnits = 194;
    const rightAreaX = width * (leftWidthUnits / totalWidthUnits);
    const rightAreaWidth = width * (rightWidthUnits / totalWidthUnits);

    const teamFontSize = 45;
    const teamMaxWidth = rightAreaWidth;
    const teamBaseY = 467;
    const teamBaseYDelta = 25;

    const memberFontSize = 20;
    const memberStartY = 325;

    const nominationFontSizeBase = 38;
    const nominationMaxWidth = 380;
    const nominationY = 591;
    const nominationYDelta = 15;
    const nominationLineSpacing = 40;

    function splitText(text: string, font: any, fontSize: number, maxWidth: number) {
        const words = text.split(" ");
        const lines: string[] = [];
        let current = "";

        for (const w of words) {
            const attempt = (current ? current + " " : "") + w;
            if (font.widthOfTextAtSize(attempt, fontSize) <= maxWidth) {
                current = attempt;
            } else {
                if (current) lines.push(current);
                current = w;
            }
        }
        if (current) lines.push(current);
        return lines;
    }

    for (const nom of specialNominations) {
        const doc = await PDFDocument.load(templateBytes);
        const [templatePage] = await pdfDoc.copyPages(doc, [0]);
        pdfDoc.addPage(templatePage);

        const page = templatePage;

        page.setFontColor(rgb(0, 0, 0));

        const teamLines = splitText(teamName, mainFont, teamFontSize, teamMaxWidth).slice(0, 3);
        const teamLinesNum = teamLines.length;
        teamLines.forEach((line, i) => {
            const y = teamBaseY - i * (teamFontSize - 6);
            const lineWidth = mainFont.widthOfTextAtSize(line, teamFontSize);
            const x = rightAreaX + Math.max(0, (rightAreaWidth - lineWidth) / 2);
            page.drawText(line, {
                x,
                y: y - (teamLinesNum === 1 ? teamBaseYDelta : 0),
                size: teamFontSize,
                font: mainFont
            });
        });

        members.slice(0, 4).forEach((m, i) => {
            const y = memberStartY - i * (memberFontSize + 4);
            const lineWidth = mainFont.widthOfTextAtSize(m, memberFontSize);
            const x = rightAreaX + Math.max(0, (rightAreaWidth - lineWidth) / 2);
            page.drawText(m, {
                x,
                y,
                size: memberFontSize,
                font: mainFont
            });
        });

        const text = nom.toUpperCase();

        const lines = splitText(text, CorbelFont, nominationFontSizeBase, nominationMaxWidth);
        const linesNum = lines.length;

        lines.forEach((line, i) => {
            const lineWidth = CorbelFont.widthOfTextAtSize(line, nominationFontSizeBase);
            const x = rightAreaX + Math.max(0, (rightAreaWidth - lineWidth) / 2);
            page.drawText(line, {
                x,
                y: nominationY - i * nominationLineSpacing - (linesNum == 1 ? nominationYDelta : 0),
                size: nominationFontSizeBase,
                font: CorbelFont
            });
        });
    }

    return Buffer.from(await pdfDoc.save());
}

const SPECIAL_NOMINATIONS_GENERATORS: Record<number, SpecialNominationsGenerator> = {
    1: ({ teamName, members, specialNominations, year }) =>
        generateSpecialNominationsEvent1(teamName, members, specialNominations, year),
    2: ({ teamName, members, specialNominations, year }) =>
        generateSpecialNominationsEvent2(teamName, members, specialNominations, year),
};

export async function generateSpecialNominations(
    teamName: string,
    members: string[],
    specialNominations: string[],
    eventId: number,
    year: string = new Date().getFullYear().toString()
): Promise<Buffer> {
    const resolvedId = resolveGeneratorId(eventId, AVAILABLE_EVENT_IDS);
    const generator = SPECIAL_NOMINATIONS_GENERATORS[resolvedId];
    return generator({ teamName, members, specialNominations, year });
}
