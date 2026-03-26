import {
    PDFDocument,
    rgb,
    pushGraphicsState,
    popGraphicsState,
    concatTransformationMatrix,
} from "pdf-lib";
import { fileURLToPath } from "url";
import * as fontkit from "fontkit";
import fs from "fs";
import path from "path";

export async function generateTeamsNames(
    teams: { name: string; school: string }[]
): Promise<Buffer> {
    const __filename = fileURLToPath(import.meta.url);
    const __dirname = path.dirname(__filename);

    const templatePath = path.resolve(__dirname, "../static/teams_names_template.pdf");
    const templateBytes = fs.readFileSync(templatePath);

    const templatePdf = await PDFDocument.load(templateBytes);

    const pdfDoc = await PDFDocument.create();
    pdfDoc.registerFontkit(fontkit as any);

    const fontBytes = fs.readFileSync(
        path.resolve(__dirname, "../static/Kreadon-Bold.ttf")
    );
    const font = await pdfDoc.embedFont(fontBytes);

    const templatePage = templatePdf.getPage(0);
    const pageWidth = templatePage.getWidth();
    const pageHeight = templatePage.getHeight();

    const sectionHeight = pageHeight / 4;
    const padding = 40;

    const boxHeight = sectionHeight - 2 * padding;
    const boxWidth = pageWidth - 2 * padding;

    function layoutText(
        text: string,
        size: number,
        maxLines: number
    ): { lines: string[]; lineHeight: number; textHeight: number } | null {
        const words = text.split(" ");
        let lines: string[] = [""];
        const lineHeight = size * 1.05;

        for (const w of words) {
            const c = lines[lines.length - 1];
            const candidate = c.length ? `${c} ${w}` : w;

            if (font.widthOfTextAtSize(candidate, size) > boxWidth) {
                if (font.widthOfTextAtSize(w, size) > boxWidth) return null;
                lines.push(w);
                if (lines.length > maxLines) return null;
            } else {
                lines[lines.length - 1] = candidate;
            }
        }

        const textHeight = lines.length * lineHeight;
        if (textHeight > boxHeight) return null;

        return { lines, lineHeight, textHeight };
    }

    function fitText(text: string, maxSize: number, maxLines: number) {
        for (let size = maxSize; size >= 8; size--) {
            const res = layoutText(text, size, maxLines);
            if (res) return { size, ...res };
        }
        return { size: 8, lines: [text], lineHeight: 8 * 1.05, textHeight: 8 * 1.05 };
    }

    // quarterIndex: 0..3 сверху вниз
    function getQuarterBoundsFromTop(quarterIndex: number) {
        const topFromTop = quarterIndex * sectionHeight;
        const bottomFromTop = (quarterIndex + 1) * sectionHeight;

        // pdf-lib: (0,0) внизу слева, Y вверх
        const yBottom = pageHeight - bottomFromTop;
        const yTop = pageHeight - topFromTop;
        const centerY = (yTop + yBottom) / 2;

        return { yBottom, yTop, centerY };
    }

    function drawCenteredTextBlock(
        page: any,
        nameInfo: { lines: string[]; lineHeight: number; textHeight: number; size: number },
        schoolInfo: { lines: string[]; lineHeight: number; textHeight: number; size: number } | null,
        quarterIndexFromTop: number,
        inverted: boolean
    ) {
        const { centerY } = getQuarterBoundsFromTop(quarterIndexFromTop);

        const lines: { text: string; size: number; lineHeight: number }[] = [];
        for (const line of nameInfo.lines) {
            lines.push({ text: line, size: nameInfo.size, lineHeight: nameInfo.lineHeight });
        }
        if (schoolInfo) {
            for (const line of schoolInfo.lines) {
                lines.push({ text: line, size: schoolInfo.size, lineHeight: schoolInfo.lineHeight });
            }
        }

        const gap = schoolInfo ? 8 : 0;
        const totalHeight =
            nameInfo.textHeight + (schoolInfo ? gap + schoolInfo.textHeight : 0);
        const blockShiftY = 10;

        const firstLineHeight = lines.length ? lines[0].lineHeight : 0;
        const topY = centerY + totalHeight / 2 - (firstLineHeight / 3) + blockShiftY;

        const yPositions: number[] = [];
        let yCursor = topY;
        for (let i = 0; i < lines.length; i++) {
            yPositions.push(yCursor);
            yCursor -= lines[i].lineHeight;
            if (schoolInfo && i === nameInfo.lines.length - 1) {
                yCursor -= gap;
            }
        }

        const drawAt = (index: number, y: number) => {
            const line = lines[index];
            const w = font.widthOfTextAtSize(line.text, line.size);
            const x = (pageWidth - w) / 2;
            page.drawText(line.text, {
                x,
                y,
                size: line.size,
                font,
                color: rgb(0, 0, 0),
            });
        };

        if (!inverted) {
            for (let i = 0; i < lines.length; i++) {
                drawAt(i, yPositions[i]);
            }
            return;
        }

        const cx = pageWidth / 2;
        const cy = centerY;

        page.pushOperators(
            pushGraphicsState(),
            concatTransformationMatrix(-1, 0, 0, -1, 2 * cx, 2 * cy)
        );

        for (let i = 0; i < lines.length; i++) {
            const reversedIndex = lines.length - 1 - i;
            drawAt(reversedIndex, yPositions[i]);
        }

        page.pushOperators(popGraphicsState());
    }

    for (const team of teams) {
        const [tplPage] = await pdfDoc.copyPages(templatePdf, [0]);
        const page = pdfDoc.addPage(tplPage);

        const nameFit = fitText(team.name, 150, 2);
        const schoolText = team.school.trim() || " ";
        const schoolFit = fitText(schoolText, 28, 1);

        // 2-я четверть (сверху) — перевёрнутый текст
        drawCenteredTextBlock(page, nameFit, schoolFit, 1, true);
        // 3-я четверть — прямой текст
        drawCenteredTextBlock(page, nameFit, schoolFit, 2, false);
    }

    const pdfBytes = await pdfDoc.save();
    return Buffer.from(pdfBytes);
}
