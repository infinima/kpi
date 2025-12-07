import fs from "fs";
import path from "path";
import { v4 as uuidv4 } from "uuid";
import { resolveFilePath } from "./resolve-file-path.js";

export async function saveFile(
    buffer: Buffer,
    extension?: string | null,
    customRelativePath?: string
): Promise<string> {

    let relativePath: string;

    if (customRelativePath) {
        // Если путь уже указан полностью (files/.../имя.webp)
        relativePath = customRelativePath;
    } else {
        if (!extension) {
            throw new Error("Extension is required when custom path is not provided");
        }
        const filename = `${uuidv4()}.${extension}`;
        relativePath = path.join("files", filename);
    }

    const absolutePath = resolveFilePath(relativePath);

    await fs.promises.mkdir(path.dirname(absolutePath), { recursive: true });
    await fs.promises.writeFile(absolutePath, buffer);

    // console.log(relativePath);
    return relativePath;
}
