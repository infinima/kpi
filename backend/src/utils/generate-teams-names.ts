import PDFDocument from "pdfkit";
import { fileURLToPath } from "url";
import path from "path";

export function generatePDFBuffer(commands: string[]): Promise<Buffer> {
    const __filename = fileURLToPath(import.meta.url);
    const __dirname = path.dirname(__filename);

    return new Promise((resolve, reject) => {
        const doc = new PDFDocument({
            size: "A4",
            margin: 0
        });

        const chunks: Buffer[] = [];

        doc.on("data", chunk => chunks.push(chunk));
        doc.on("end", () => resolve(Buffer.concat(chunks)));
        doc.on("error", reject);

        const fontPath = path.resolve(__dirname, "../static/Kreadon-Bold.ttf");
        doc.registerFont("Main", fontPath);
        doc.font("Main");

        function drawDashedLine(y: number) {
            const margin = 0;
            doc.save();
            doc.moveTo(margin, y)
                .lineTo(doc.page.width - margin, y)
                .dash(5, { space: 5 })
                .stroke();
            doc.undash();
            doc.restore();
        }

        function layoutTextToTwoLines(
            text: string,
            boxWidth: number
        ): string[] | null {
            const words = text.split(" ");
            const lines: string[] = [""];

            for (const word of words) {
                const current = lines[lines.length - 1];
                const candidate = current.length ? current + " " + word : word;

                if (doc.widthOfString(candidate) > boxWidth) {
                    if (doc.widthOfString(word) > boxWidth) return null;
                    lines.push(word);
                    if (lines.length > 2) return null;
                } else {
                    lines[lines.length - 1] = candidate;
                }
            }

            return lines;
        }

        function fitFontSize(
            text: string,
            boxWidth: number,
            boxHeight: number
        ) {
            const maxFontSize = 200;
            const minFontSize = 8;

            let bestFontSize = minFontSize;
            let bestLines = [text];
            let bestHeight = boxHeight;

            for (let size = maxFontSize; size >= minFontSize; size--) {
                doc.fontSize(size);
                const lines = layoutTextToTwoLines(text, boxWidth);
                if (!lines) continue;

                const lineHeight = doc.currentLineHeight(true);
                const textHeight = lineHeight * lines.length;

                if (textHeight <= boxHeight) {
                    bestFontSize = size;
                    bestLines = lines;
                    bestHeight = textHeight;
                    break;
                }
            }

            return { fontSize: bestFontSize, lines: bestLines, textHeight: bestHeight };
        }

        commands.forEach((name, index) => {
            if (index > 0) doc.addPage();

            const pageHeight = doc.page.height;
            const pageWidth = doc.page.width;

            const sectionHeight = pageHeight / 4;
            for (let i = 1; i <= 3; i++) drawDashedLine(sectionHeight * i);

            const padding = 20;
            const boxHeight = sectionHeight - 2 * padding;
            const boxWidth = pageWidth - 2 * padding;

            // Центральный текст (3-я четверть)
            {
                const sectionIndex = 2;
                const sectionTop = sectionIndex * sectionHeight;

                const { fontSize, lines, textHeight } =
                    fitFontSize(name, boxWidth, boxHeight);
                doc.fontSize(fontSize);

                let currentY = sectionTop + (sectionHeight - textHeight) / 2;

                for (const line of lines) {
                    const w = doc.widthOfString(line);
                    const x = (pageWidth - w) / 2;
                    doc.text(line, x, currentY);
                    currentY += doc.currentLineHeight(true);
                }
            }

            // Перевёрнутая версия (2-я четверть)
            {
                const sectionTop = sectionHeight;
                const sectionBottom = sectionHeight * 2;
                const sectionMidY = (sectionTop + sectionBottom) / 2;

                const { fontSize, lines, textHeight } =
                    fitFontSize(name, boxWidth, boxHeight);
                doc.fontSize(fontSize);

                doc.save();
                doc.rotate(180, {
                    origin: [pageWidth / 2, sectionMidY]
                });

                let currentY = sectionMidY - textHeight / 2;

                for (const line of lines) {
                    const w = doc.widthOfString(line);
                    const x = (pageWidth - w) / 2;
                    doc.text(line, x, currentY);
                    currentY += doc.currentLineHeight(true);
                }

                doc.restore();
            }

            // --- Логотип PNG в 3-й четверти ---
            {
                const logoPath = path.resolve(__dirname, "../static/logo_black.png");
                const thirdTop = 2 * sectionHeight;
                const thirdHeight = sectionHeight;
                const logoWidth = 56;
                const logoHeight = 40;

                // Левый верхний угол 3-й четверти
                doc.image(
                    logoPath,
                    10,
                    thirdTop + 10,
                    { width: logoWidth, height: logoHeight }
                );

                // Правый нижний угол 3-й четверти
                doc.image(
                    logoPath,
                    pageWidth - 10 - logoWidth,
                    thirdTop + thirdHeight - 5 - logoHeight,
                    { width: logoWidth, height: logoHeight }
                );
            }

            // --- Перевёрнутый логотип PNG во 2-й четверти ---
            {
                const logoPath = path.resolve(__dirname, "../static/logo_black.png");

                const secondTop = sectionHeight;
                const secondHeight = sectionHeight;

                const logoWidth = 56;
                const logoHeight = 40;

                // Координаты как в 3-й четверти
                const xLeft = 10;
                const yLeftTop = secondTop + 10;

                const xRight = pageWidth - 10 - logoWidth;
                const yRightBottom = secondTop + secondHeight - 5 - logoHeight;

                // Левый верхний угол 2-й части (перевёрнут)
                doc.save();
                doc.rotate(180, {
                    origin: [xLeft + logoWidth / 2, yLeftTop + logoHeight / 2]
                });
                doc.image(logoPath, xLeft, yLeftTop, {
                    width: logoWidth,
                    height: logoHeight
                });
                doc.restore();

                // Правый нижний угол 2-й части (перевёрнут)
                doc.save();
                doc.rotate(180, {
                    origin: [xRight + logoWidth / 2, yRightBottom + logoHeight / 2]
                });
                doc.image(logoPath, xRight, yRightBottom, {
                    width: logoWidth,
                    height: logoHeight
                });
                doc.restore();
            }
        });

        doc.end();
    });
}
