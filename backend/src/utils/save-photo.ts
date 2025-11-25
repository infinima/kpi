import sharp from "sharp";
import { saveFile } from "./save-file.js";

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
        throw new Error("BaseImage must be square");
    }

    const processed = await sharp(buffer)
        .webp({ quality: 90 })
        .toBuffer();

    return await saveFile(processed, "webp");
}
