import PDFDocument from "pdfkit";

export function generatePDFBuffer(commands: string[]): Promise<Buffer> {
    return new Promise((resolve, reject) => {
        const doc = new PDFDocument({
            size: "A4",
            margin: 0
        });

        const chunks: Buffer[] = [];

        doc.on("data", chunk => chunks.push(chunk));
        doc.on("end", () => resolve(Buffer.concat(chunks)));
        doc.on("error", reject);

        const fontPath = "./src/static/Kreadon-Bold.ttf";
        doc.registerFont("Main", fontPath);
        doc.font("Main");

        function drawDashedLine(doc: PDFKit.PDFDocument, y: number) {
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
            doc: PDFKit.PDFDocument,
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
            doc: PDFKit.PDFDocument,
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
                const lines = layoutTextToTwoLines(doc, text, boxWidth);
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
            for (let i = 1; i <= 3; i++) drawDashedLine(doc, sectionHeight * i);

            const padding = 20;
            const boxHeight = sectionHeight - 2 * padding;
            const boxWidth = pageWidth - 2 * padding;

            {
                const sectionIndex = 2;
                const sectionTop = sectionIndex * sectionHeight;

                const { fontSize, lines, textHeight } =
                    fitFontSize(doc, name, boxWidth, boxHeight);
                doc.fontSize(fontSize);

                let currentY = sectionTop + (sectionHeight - textHeight) / 2;

                for (const line of lines) {
                    const w = doc.widthOfString(line);
                    const x = (pageWidth - w) / 2;
                    doc.text(line, x, currentY);
                    currentY += doc.currentLineHeight(true);
                }
            }

            {
                const sectionTop = sectionHeight;
                const sectionBottom = sectionHeight * 2;
                const sectionMidY = (sectionTop + sectionBottom) / 2;

                const { fontSize, lines, textHeight } =
                    fitFontSize(doc, name, boxWidth, boxHeight);
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
        });

        doc.end();
    });
}
