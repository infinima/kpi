import fs from "fs";
import os from "os";
import path from "path";
import { fileURLToPath } from "url";

type TeamRow = {
    name: string;
};

type NominationGroup = {
    title: string;
    teams: TeamRow[];
};

type AwardingInput = {
    nominations: NominationGroup[];
    thirdPlace: TeamRow[];
    secondPlace: TeamRow[];
    firstPlace: TeamRow[];
};

type SlideSpec = {
    templateIndex: number;
    nomination?: string;
    teams: TeamRow[];
};

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

function splitIntoSlides(
    teams: TeamRow[],
    templates: Array<{ capacity: number; templateIndex: number }>,
    nomination?: string
): SlideSpec[] {
    const sortedTemplates = [...templates].sort((a, b) => a.capacity - b.capacity);
    const maxTemplate = sortedTemplates[sortedTemplates.length - 1];

    const slides: SlideSpec[] = [];
    let remaining = [...teams];

    while (remaining.length > 0) {
        const count = remaining.length;
        const template =
            sortedTemplates.find(t => t.capacity >= count) ?? maxTemplate;
        const take = Math.min(template.capacity, remaining.length);
        const chunk = remaining.slice(0, take);
        remaining = remaining.slice(take);

        slides.push({
            templateIndex: template.templateIndex,
            nomination,
            teams: chunk,
        });
    }

    if (slides.length === 0) {
        slides.push({
            templateIndex: sortedTemplates[0].templateIndex,
            nomination,
            teams: [],
        });
    }

    return slides;
}

function buildSlides(data: AwardingInput): SlideSpec[] {
    const result: SlideSpec[] = [];

    for (const nomination of data.nominations) {
        result.push(
            ...splitIntoSlides(
                nomination.teams,
                [
                    { capacity: 1, templateIndex: 3 },
                    { capacity: 2, templateIndex: 4 },
                    { capacity: 3, templateIndex: 5 },
                ],
                nomination.title
            )
        );
    }

    result.push(
        ...splitIntoSlides(
            data.thirdPlace,
            [
                { capacity: 3, templateIndex: 6 },
                { capacity: 4, templateIndex: 7 },
            ]
        )
    );

    result.push(
        ...splitIntoSlides(
            data.secondPlace,
            [
                { capacity: 2, templateIndex: 8 },
                { capacity: 3, templateIndex: 9 },
            ]
        )
    );

    result.push(
        ...splitIntoSlides(
            data.firstPlace,
            [
                { capacity: 1, templateIndex: 10 },
                { capacity: 2, templateIndex: 11 },
            ]
        )
    );

    return result;
}

export async function generateAwardingPptx(data: AwardingInput): Promise<Buffer> {
    const { Automizer, modify } = await import("pptx-automizer");

    const templatePath = path.resolve(__dirname, "../static/papers/2/awarding.pptx");
    const outputDir = fs.mkdtempSync(path.join(os.tmpdir(), "awarding-"));
    const outputPath = path.join(outputDir, `awarding_${Date.now()}.pptx`);

    const automizer = new Automizer({
        templateDir: path.dirname(templatePath) + path.sep,
        outputDir: outputDir + path.sep,
        removeExistingSlides: true,
    });

    const templateName = path.basename(templatePath);
    const pres = automizer
        .loadRoot(templateName)
        .load(templateName, "awarding");

    pres.addSlide("awarding", 1);
    pres.addSlide("awarding", 2);

    const slides = buildSlides(data);

    for (const spec of slides) {
        pres.addSlide("awarding", spec.templateIndex, async (slide: any) => {
            const replacements = [
                {
                    replace: "NOMINATION",
                    by: { text: spec.nomination ?? "" },
                },
                {
                    replace: "TEAM_1",
                    by: { text: spec.teams[0]?.name ?? "" },
                },
                {
                    replace: "TEAM_2",
                    by: { text: spec.teams[1]?.name ?? "" },
                },
                {
                    replace: "TEAM_3",
                    by: { text: spec.teams[2]?.name ?? "" },
                },
                {
                    replace: "TEAM_4",
                    by: { text: spec.teams[3]?.name ?? "" },
                },
            ];

            const elementIds = await slide.getAllTextElementIds();

            for (const elementId of elementIds) {
                slide.modifyElement(
                    elementId,
                    modify.replaceText(replacements)
                );
            }
        });
    }

    pres.addSlide("awarding", 12);

    await pres.write(path.basename(outputPath));

    return fs.readFileSync(outputPath);
}
