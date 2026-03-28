import { PDFDocument, rgb } from "pdf-lib";
import * as fontkit from "fontkit";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

type AppreciationGenerator = (params: {
    teachersNames: string[];
    eventName: string;
    year: string;
}) => Promise<Buffer>;

function resolveGeneratorId(eventId: number, available: number[]): number {
    if (available.includes(eventId)) return eventId;
    return Math.max(...available);
}

const AVAILABLE_EVENT_IDS = [1, 2];

async function generateAppreciationEvent1(
    teachersNames: string[],
    eventName: string,
    year: string = new Date().getFullYear().toString()
): Promise<Buffer> {

    const templatePath = path.resolve(__dirname, "../static/papers/1/appreciation_template.pdf");
    const templateBytes = fs.readFileSync(templatePath);

    const templatePdf = await PDFDocument.load(templateBytes);

    const pdfDoc = await PDFDocument.create();
    // @ts-ignore
    pdfDoc.registerFontkit(fontkit);

    const mainFontBytes = fs.readFileSync(
        path.resolve(__dirname, "../static/Philosopher-Regular.ttf")
    );
    const mainFont = await pdfDoc.embedFont(mainFontBytes);

    const futuraFontBytes = fs.readFileSync(
        path.resolve(__dirname, "../static/AG_Futura-Regular.ttf")
    );
    const futuraFont = await pdfDoc.embedFont(futuraFontBytes);

    const piFontBytes = fs.readFileSync(
        path.resolve(__dirname, "../static/Myriad_Pro.ttf")
    );
    const piFont = await pdfDoc.embedFont(piFontBytes);

    // Константы верстки
    const teacherFontSize = 45;
    const teacherBaseY = 517;
    const teacherX = 43;

    const yearY = 24;

    for (const teacherName of teachersNames) {
        const [templatePage] = await pdfDoc.copyPages(templatePdf, [0]);
        const page = templatePage;
        pdfDoc.addPage(page);

        page.setFontColor(rgb(0, 0, 0));

        // ==== ФИО (до 3 строк) ====
        const words = teacherName.split(" ").filter(w => w.trim());
        const usedNameLines = words.slice(0, 3);

        usedNameLines.forEach((word, i) => {
            const y = teacherBaseY - i * (teacherFontSize + 2);
            page.drawText(word, {
                x: teacherX,
                y,
                size: teacherFontSize,
                font: mainFont
            });
        });

        // ==== Год ====
        const { width } = page.getSize();
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

async function generateAppreciationEvent2(
    teachersNames: string[],
    eventName: string,
    year: string = new Date().getFullYear().toString()
): Promise<Buffer> {

    const templatePath = path.resolve(__dirname, "../static/papers/2/appreciation_template.pdf");
    const templateBytes = fs.readFileSync(templatePath);

    const templatePdf = await PDFDocument.load(templateBytes);

    const pdfDoc = await PDFDocument.create();
    // @ts-ignore
    pdfDoc.registerFontkit(fontkit);

    const mainFontBytes = fs.readFileSync(
        path.resolve(__dirname, "../static/Philosopher-Regular.ttf")
    );
    const mainFont = await pdfDoc.embedFont(mainFontBytes);

    const futuraFontBytes = fs.readFileSync(
        path.resolve(__dirname, "../static/AG_Futura-Regular.ttf")
    );
    const futuraFont = await pdfDoc.embedFont(futuraFontBytes);

    const piFontBytes = fs.readFileSync(
        path.resolve(__dirname, "../static/Myriad_Pro.ttf")
    );
    const piFont = await pdfDoc.embedFont(piFontBytes);

    const teacherFontSize = 45;
    const teacherBaseY = 517;
    const teacherX = 43;

    const yearY = 24;

    for (const teacherName of teachersNames) {
        const [templatePage] = await pdfDoc.copyPages(templatePdf, [0]);
        const page = templatePage;
        pdfDoc.addPage(page);

        page.setFontColor(rgb(0, 0, 0));

        const words = teacherName.split(" ").filter(w => w.trim());
        const usedNameLines = words.slice(0, 3);

        usedNameLines.forEach((word, i) => {
            const y = teacherBaseY - i * (teacherFontSize + 2);
            page.drawText(word, {
                x: teacherX,
                y,
                size: teacherFontSize,
                font: mainFont
            });
        });

        const { width } = page.getSize();
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

const APPRECIATION_GENERATORS: Record<number, AppreciationGenerator> = {
    1: ({ teachersNames, eventName, year }) => generateAppreciationEvent1(teachersNames, eventName, year),
    2: ({ teachersNames, eventName, year }) => generateAppreciationEvent2(teachersNames, eventName, year),
};

export async function generateAppreciation(
    teachersNames: string[],
    eventName: string,
    eventId: number,
    year: string = new Date().getFullYear().toString()
): Promise<Buffer> {
    const resolvedId = resolveGeneratorId(eventId, AVAILABLE_EVENT_IDS);
    const generator = APPRECIATION_GENERATORS[resolvedId];
    return generator({ teachersNames, eventName, year });
}
