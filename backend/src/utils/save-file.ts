import fs from "fs";
import path from "path";
import { v4 as uuidv4 } from "uuid";
import { resolveFilePath } from "./resolve-file-path.js";

export async function saveFile(buffer: Buffer, extension: string): Promise<string> {
    const filename = `${uuidv4()}.${extension}`;
    const relativePath = path.join("files", filename);
    const absolutePath = resolveFilePath(relativePath);

    await fs.promises.mkdir(path.dirname(absolutePath), { recursive: true });

    await fs.promises.writeFile(absolutePath, buffer);
    console.log(relativePath);
    return relativePath;
}
