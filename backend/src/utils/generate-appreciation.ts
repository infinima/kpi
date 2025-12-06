import { PDFDocument, rgb } from "pdf-lib";
import * as fontkit from "fontkit";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export async function generateAppreciation(
    teacherName: string,
    eventName: string,
    year: string = new Date().getFullYear().toString()
): Promise<Buffer> {

    const templatePath = path.resolve(__dirname, "../static/appreciation_template.pdf");
    const templateBytes = fs.readFileSync(templatePath);

    const pdfDoc = await PDFDocument.load(templateBytes);
    // @ts-ignore
    pdfDoc.registerFontkit(fontkit);

    const page = pdfDoc.getPages()[0];
    const { width } = page.getSize();

    const mainFontBytes = fs.readFileSync(
        path.resolve(__dirname, "../static/Philosopher-Regular.ttf")
    );
    const mainFont = await pdfDoc.embedFont(mainFontBytes);

    const futuraFontBytes = fs.readFileSync(
        path.resolve(__dirname, "../static/AG_Futura-Regular.ttf")
    );
    const futuraFont = await pdfDoc.embedFont(futuraFontBytes);

    page.setFontColor(rgb(0, 0, 0));

    // === Layout constants ===
    const teacherFontSize = 45;
    const teacherBaseY = 517;
    const teacherX = 43;

    const eventFontSize = 22;
    const maxEventWidth = 300;
    const eventY = 350;
    const eventX = 40;

    const yearY = 24;


    // ===== Utility: split long text to multiple lines by width =====
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

// ================== Draw TEACHER NAME ==================
    const words = teacherName.split(" ").filter(w => w.trim());
    const usedNameLines = words.slice(0, 3); // не больше 3 строк

    usedNameLines.forEach((word, i) => {
        const y = teacherBaseY - i * (teacherFontSize + 2);

        page.drawText(word, {
            x: teacherX,
            y,
            size: teacherFontSize,
            font: mainFont
        });
    });

    // === Load π font ===
    const piFontBytes = fs.readFileSync(
        path.resolve(__dirname, "../static/Myriad_Pro.ttf")
    );
    const piFont = await pdfDoc.embedFont(piFontBytes);


// Helper to draw event line with π support
    function drawEventLine(
        line: string,
        y: number,
        fontSize: number,
        maxWidth: number,
        justify: boolean
    ) {
        const pieces = line.split("π");
        let x = eventX;

        // if justify — precalculate total width without spaces
        let extraSpace = 0;
        if (justify && pieces.length > 1) {
            const noPi = line.replace(/π/g, "");
            const widthNoPi = futuraFont.widthOfTextAtSize(noPi, fontSize);
            const widthPi = piFont.widthOfTextAtSize("π", fontSize) * (pieces.length - 1);
            const gaps = line.split(" ").length - 1 || 1;
            extraSpace = (maxWidth - widthNoPi - widthPi) / gaps;
        }

        for (let i = 0; i < pieces.length; i++) {
            const text = pieces[i];

            // draw words inside piece
            const words = text.split(" ");
            for (let j = 0; j < words.length; j++) {
                const w = words[j];
                if (!w) continue;
                page.drawText(w, { x, y, size: fontSize, font: futuraFont });
                x += futuraFont.widthOfTextAtSize(w, fontSize);
                if (justify) x += extraSpace;
                if (j < words.length - 1) {
                    x += futuraFont.widthOfTextAtSize(" ", fontSize);
                }
            }

            if (i < pieces.length - 1) {
                // draw π using MyriadPro
                page.drawText("π", { x, y, size: fontSize, font: piFont });
                x += piFont.widthOfTextAtSize("π", fontSize);
            }
        }
    }

    // // ================== Draw EVENT TEXT ==================
    // const eventFullText = `за отличную математическую подготовку к мероприятию «${eventName}»`;
    // const eventLines = splitTextIntoLines(eventFullText, futuraFont, eventFontSize, maxEventWidth);
    //
    // eventLines.forEach((line, i) => {
    //     const y = eventY - i * (eventFontSize + 3);
    //     const isLast = i === eventLines.length - 1;
    //     const w = futuraFont.widthOfTextAtSize(line.replace(/π/g, ""), eventFontSize);
    //
    //     drawEventLine(
    //         line,
    //         y,
    //         eventFontSize,
    //         maxEventWidth,
    //         !isLast && w < maxEventWidth * 0.99
    //     );
    // });


    // ================== Draw YEAR ==================
    const yearWidth = futuraFont.widthOfTextAtSize(year, 20);
    page.drawText(year, {
        x: width - yearWidth - 25,
        y: yearY,
        size: 20,
        font: futuraFont
    });


    return Buffer.from(await pdfDoc.save());
}
