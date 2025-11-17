import fs from "fs";
import path from "path";
import sharp from "sharp";
import { v4 as uuidv4 } from "uuid";
import { resolveFilePath } from "./resolve-file-path.js";

export async function savePhoto(base64: string): Promise<string> {
    if (!base64) {
        throw new Error("Invalid photo data");
    }

    const match = base64.match(/^data:image\/(png|jpe?g|webp);base64,(.+)$/i);
    if (!match) {
        throw new Error("Unsupported image format (allowed: png, jpg, jpeg, webp)");
    }

    const data = match[2];
    const buffer = Buffer.from(data, "base64");

    const meta = await sharp(buffer).metadata();
    if (!meta.width || !meta.height) {
        throw new Error("Failed to read image metadata");
    }
    if (meta.width !== meta.height) {
        throw new Error("Image must be square");
    }

    const filename = `${uuidv4()}.webp`;
    const relativePath = path.join("files", filename);
    const absolutePath = resolveFilePath(relativePath);

    await fs.promises.mkdir(path.dirname(absolutePath), { recursive: true });

    await sharp(buffer)
        .webp({ quality: 90 })
        .toFile(absolutePath);

    return relativePath;
}
