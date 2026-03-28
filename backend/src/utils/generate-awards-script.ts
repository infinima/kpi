import { PDFDocument, rgb } from "pdf-lib";
import * as fontkit from "fontkit";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

type TeamRow = {
    name: string;
    region: string | null;
    school: string | null;
};

type AwardsSection = {
    title: string;
    teams: TeamRow[];
};

type AwardsScriptInput = {
    header: {
        eventName: string;
        locationName: string;
        leagueName: string;
    };
    nominations: AwardsSection[];
    places: AwardsSection[];
};

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

function wrapText(text: string, font: any, size: number, maxWidth: number): string[] {
    const words = text.split(" ").filter((w) => w.trim());
    if (words.length === 0) return [""];
    const lines: string[] = [];
    let current = "";

    for (const word of words) {
        const attempt = current ? `${current} ${word}` : word;
        if (font.widthOfTextAtSize(attempt, size) <= maxWidth) {
            current = attempt;
        } else {
            if (current) lines.push(current);
            current = word;
        }
    }
    if (current) lines.push(current);
    return lines;
}

function formatTeamLine(team: TeamRow): string {
    const parts = [team.region?.trim(), team.school?.trim()].filter(Boolean) as string[];
    if (parts.length === 0) return team.name;
    return `${team.name} (${parts.join(", ")})`;
}

export async function generateAwardsScript(data: AwardsScriptInput): Promise<Buffer> {
    const pdfDoc = await PDFDocument.create();
    pdfDoc.registerFontkit(fontkit as any);

    const regularFontBytes = fs.readFileSync(
        path.resolve(__dirname, "../static/Arial.ttf")
    );
    const regularFont = await pdfDoc.embedFont(regularFontBytes);

    const boldFontBytes = fs.readFileSync(
        path.resolve(__dirname, "../static/Arial-Bold.ttf")
    );
    const boldFont = await pdfDoc.embedFont(boldFontBytes);

    const pageWidth = 595.28;
    const pageHeight = 841.89;
    const marginX = 48;
    const marginY = 48;
    const maxWidth = pageWidth - marginX * 2;

    const titleSize = 18;
    const bodySize = 14;
    const headerSize = 20;
    const lineGap = 6;
    const footerHeight = 24;
    const footerFontSize = 10;

    let page = pdfDoc.addPage([pageWidth, pageHeight]);
    let cursorY = pageHeight - marginY;

    function newPage() {
        page = pdfDoc.addPage([pageWidth, pageHeight]);
        cursorY = pageHeight - marginY;
    }

    function ensureSpaceHeight(height: number) {
        if (cursorY - height < marginY + footerHeight) {
            newPage();
        }
    }

    function drawLines(lines: string[], font: any, size: number) {
        for (const line of lines) {
            page.drawText(line, {
                x: marginX,
                y: cursorY,
                size,
                font,
                color: rgb(0, 0, 0),
            });
            cursorY -= size + lineGap;
        }
    }

    function drawTitle(title: string) {
        const lines = wrapText(title, boldFont, titleSize, maxWidth);
        ensureSpaceHeight(lines.length * (titleSize + lineGap) + 6);
        drawLines(lines, boldFont, titleSize);
        cursorY -= 6;
    }

    function drawBodyLine(text: string) {
        const lines = wrapText(text, regularFont, bodySize, maxWidth);
        ensureSpaceHeight(lines.length * (bodySize + lineGap));
        drawLines(lines, regularFont, bodySize);
    }

    const sectionGap = 14;
    const blockGap = 30;
    const titleBodyGap = -5;
    const headerGap = 18;

    function titleHeight(text: string) {
        const lines = wrapText(text, boldFont, titleSize, maxWidth).length;
        return lines * (titleSize + lineGap) + 6;
    }

    function bodyLinesHeight(linesCount: number) {
        return linesCount * (bodySize + lineGap);
    }

    function measureBodyLines(text: string) {
        return wrapText(text, regularFont, bodySize, maxWidth).length;
    }

    function measureTeamsHeight(teams: TeamRow[]) {
        let lines = 0;
        for (const team of teams) {
            lines += measureBodyLines(formatTeamLine(team));
        }
        return bodyLinesHeight(lines);
    }

    function measureNominationSection(section: AwardsSection) {
        const titleLines = measureBodyLines(section.title);
        return bodyLinesHeight(titleLines) + measureTeamsHeight(section.teams);
    }

    const headerLines = [
        data.header.eventName,
        data.header.locationName,
        data.header.leagueName
    ].filter((v) => v.trim());

    if (headerLines.length > 0) {
        const headerHeight = headerLines.length * (headerSize + lineGap) + headerGap;
        ensureSpaceHeight(headerHeight);
        headerLines.forEach((line) => {
            const lines = wrapText(line, boldFont, headerSize, maxWidth);
            ensureSpaceHeight(lines.length * (headerSize + lineGap));
            drawLines(lines, boldFont, headerSize);
        });
        cursorY -= headerGap;
    }

    const nominationsTitle = "Специальные номинации";
    const firstNominationHeight = data.nominations.length > 0
        ? measureNominationSection(data.nominations[0])
        : 0;
    const nominationsTitleHeight = titleHeight(nominationsTitle);
    ensureSpaceHeight(nominationsTitleHeight + titleBodyGap + firstNominationHeight);
    drawTitle(nominationsTitle);
    cursorY -= titleBodyGap;

    data.nominations.forEach((section, index) => {
        const sectionHeight = measureNominationSection(section);
        let gap = index > 0 ? sectionGap : 0;
        if (gap > 0 && cursorY - (gap + sectionHeight) < marginY + footerHeight) {
            newPage();
            gap = 0;
        }
        if (gap > 0) cursorY -= gap;
        ensureSpaceHeight(sectionHeight);
        drawBodyLine(section.title);
        for (const team of section.teams) {
            drawBodyLine(formatTeamLine(team));
        }
    });

    const placeTitles = ["3 место", "2 место", "1 место"];
    placeTitles.forEach((placeTitle, index) => {
        const section = data.places.find((p) => p.title === placeTitle);
        const teamsHeight = section ? measureTeamsHeight(section.teams) : 0;
        const neededHeight = titleHeight(placeTitle) + titleBodyGap + teamsHeight;

        let gap = index > 0 ? blockGap : (data.nominations.length > 0 ? blockGap : 0);
        if (gap > 0 && cursorY - (gap + neededHeight) < marginY + footerHeight) {
            newPage();
            gap = 0;
        }
        if (gap > 0) cursorY -= gap;

        ensureSpaceHeight(neededHeight);
        drawTitle(placeTitle);
        cursorY -= titleBodyGap;
        if (section) {
            for (const team of section.teams) {
                drawBodyLine(formatTeamLine(team));
            }
        }
    });

    const pages = pdfDoc.getPages();
    const totalPages = pages.length;
    pages.forEach((p, i) => {
        const label = `Стр. ${i + 1} из ${totalPages}`;
        const textWidth = regularFont.widthOfTextAtSize(label, footerFontSize);
        p.drawText(label, {
            x: pageWidth - marginX - textWidth,
            y: marginY - footerFontSize,
            size: footerFontSize,
            font: regularFont,
            color: rgb(0, 0, 0),
        });
    });

    const pdfBytes = await pdfDoc.save();
    return Buffer.from(pdfBytes);
}
