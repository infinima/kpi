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

export async function generateTeamsNames(commands: string[]): Promise<Buffer> {
    const __filename = fileURLToPath(import.meta.url);
    const __dirname = path.dirname(__filename);

    const templatePath = path.resolve(__dirname, "../static/teams_names_template.pdf");
    const templateBytes = fs.readFileSync(templatePath);

    // Отдельный doc с шаблоном (чтобы не копировать уже размалёванные страницы)
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
    const padding = 20;

    const boxHeight = sectionHeight - 2 * padding;
    const boxWidth = pageWidth - 2 * padding;

    function layoutText(
        text: string,
        size: number
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
                if (lines.length > 2) return null;
            } else {
                lines[lines.length - 1] = candidate;
            }
        }

        const textHeight = lines.length * lineHeight;
        if (textHeight > boxHeight) return null;

        return { lines, lineHeight, textHeight };
    }

    function fitText(text: string) {
        for (let size = 200; size >= 8; size--) {
            const res = layoutText(text, size);
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
        textInfo: { lines: string[]; lineHeight: number; textHeight: number; size: number },
        quarterIndexFromTop: number,
        inverted: boolean
    ) {
        const { centerY } = getQuarterBoundsFromTop(quarterIndexFromTop);

        const { lines, lineHeight, size } = textInfo;
        const n = lines.length;

        // базовая линия первой (верхней визуально) строки до поворота
        let y = centerY + (n - 1) * lineHeight / 2 - (lineHeight / 3);

        if (!inverted) {
            // прямой текст
            for (const line of lines) {
                const w = font.widthOfTextAtSize(line, size);
                const x = (pageWidth - w) / 2;
                page.drawText(line, {
                    x,
                    y,
                    size,
                    font,
                    color: rgb(0, 0, 0),
                });
                y -= lineHeight;
            }
        } else {
            // перевёрнутый текст вокруг центра своей четверти
            const cx = pageWidth / 2;
            const cy = centerY;

            page.pushOperators(
                pushGraphicsState(),
                // поворот на 180° вокруг (cx, cy)
                concatTransformationMatrix(-1, 0, 0, -1, 2 * cx, 2 * cy)
            );

            // Рисуем строки в ОБРАТНОМ порядке,
            // чтобы после поворота первая строка осталась первой сверху.
            const reversed = [...lines].reverse();

            y -= (n === 1 ? 0 : lineHeight);
            for (const line of reversed) {
                const w = font.widthOfTextAtSize(line, size);
                const x = (pageWidth - w) / 2;
                page.drawText(line, {
                    x,
                    y,
                    size,
                    font,
                    color: rgb(0, 0, 0),
                });
                y += lineHeight;
            }

            page.pushOperators(popGraphicsState());
        }
    }

    for (const name of commands) {
        const [tplPage] = await pdfDoc.copyPages(templatePdf, [0]);
        const page = pdfDoc.addPage(tplPage);

        const fit = fitText(name);

        // 2-я четверть (сверху) — перевёрнутый текст
        drawCenteredTextBlock(page, fit, 1, true);
        // 3-я четверть — прямой текст
        drawCenteredTextBlock(page, fit, 2, false);
    }

    const pdfBytes = await pdfDoc.save();
    return Buffer.from(pdfBytes);
}
