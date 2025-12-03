import express from "express";
import sharp from "sharp";
import { validate } from "../middlewares/validate.js";
import { query } from "../../utils/database.js";
import { checkParentNotDeleted } from "../middlewares/check-not-deleted.js";
import { checkPermission } from "../middlewares/check-permission.js";
import { saveFile } from "../../utils/save-file.js";
import { resolveFilePath } from "../../utils/resolve-file-path.js";
import { GetPhotosByLocationInput, GetPhotoInput, CreatePhotoInput } from "../schemas/photos.js";

export const photosRouter = express.Router();

// GET /api/photos/location/:location_id
photosRouter.get(
    "/location/:location_id",
    validate(GetPhotosByLocationInput, "params"),
    checkParentNotDeleted("photo", "location_id"),
    async (req, res) => {
        const { location_id } = (req as any).validated.params;

        const rows = await query(
            `SELECT id, location_id, created_at, deleted_at
             FROM photos
             WHERE location_id = ? AND deleted_at IS NULL
             ORDER BY id DESC`,
            [location_id], (req as any).user_id
        );

        res.json(rows);
    }
);

// GET /api/photos/location/:location_id/deleted
photosRouter.get(
    "/location/:location_id",
    validate(GetPhotosByLocationInput, "params"),
    checkParentNotDeleted("photo", "location_id"),
    async (req, res) => {
        const { location_id } = (req as any).validated.params;

        const rows = await query(
            `SELECT id, location_id, created_at, deleted_at
             FROM photos
             WHERE location_id = ? AND deleted_at IS NOT NULL
             ORDER BY id DESC`,
            [location_id], (req as any).user_id
        );

        res.json(rows);
    }
);

// GET /api/photos/:id
photosRouter.get(
    "/:id",
    validate(GetPhotoInput, "params"),
    async (req, res) => {
        const { id } = (req as any).validated.params;

        const [photo] = await query(
            `SELECT id, location_id, created_at, deleted_at
             FROM photos
             WHERE id = ? AND deleted_at IS NULL`,
            [id], (req as any).user_id
        );

        if (!photo) {
            return res.status(404).json({
                error: {
                    code: "PHOTO_NOT_FOUND",
                    message: "The photo does not exist"
                }
            });
        }

        res.json(photo);
    }
);

// GET /api/photos/:id/file
photosRouter.get(
    "/:id/file",
    validate(GetPhotoInput, "params"),
    async (req, res) => {
        const { id } = (req as any).validated.params;

        const [photo] = await query(
            `SELECT file
             FROM photos 
             WHERE id = ? AND deleted_at IS NULL`,
            [id], (req as any).user_id
        );

        if (!photo) {
            return res.status(404).json({
                error: {
                    code: "PHOTO_NOT_FOUND",
                    message: "The photo does not exist"
                }
            });
        }

        try {
            const absolutePath = resolveFilePath(photo.file);

            res.sendFile(absolutePath, err => {
                if (err) {
                    console.error(err);
                    res.status(500).json({
                        error: {
                            code: "FAILED_TO_SEND_FILE",
                            message: "Failed to send file"
                        }
                    });
                }
            });
        } catch (e: any) {
            console.error(e);
            res.status(400).json({
                error: {
                    code: "INVALID_FILE_PATH",
                    message: e.message
                }
            });
        }
    }
);

// POST /api/photos
photosRouter.post(
    "/",
    validate(CreatePhotoInput, "body"),
    checkPermission("locations", "edit_photos"),
    async (req, res) => {
        const { location_id, file } = (req as any).validated.body;

        const match = file.match(/^data:(.+);base64,(.+)$/);
        if (!match) {
            return res.status(400).json({
                error: {
                    code: "INVALID_BASE64",
                    message: "Invalid base64 format"
                }
            });
        }

        const mime = match[1];
        const base64 = match[2];

        let buffer: Buffer;
        try {
            buffer = Buffer.from(base64, "base64");
        } catch {
            return res.status(400).json({
                error: {
                    code: "INVALID_BASE64_DATA",
                    message: "Failed to decode base64"
                }
            });
        }

        const allowed = [
            "image/jpeg",
            "image/png",
            "image/webp",
            "image/heic",
            "image/heif"
        ];

        if (!allowed.includes(mime)) {
            return res.status(400).json({
                error: {
                    code: "INVALID_FORMAT",
                    message: "Allowed formats: jpeg, png, webp, heic"
                }
            });
        }

        try {
            if (mime === "image/heic" || mime === "image/heif") {
                buffer = await sharp(buffer).png().toBuffer();
            }
        } catch (e) {
            console.error(e);
            return res.status(500).json({
                error: {
                    code: "CONVERSION_FAILED",
                    message: "Failed to convert HEIC to PNG"
                }
            });
        }

        let savedPath;
        try {
            savedPath = await saveFile(buffer, "png");
        } catch (e) {
            console.error(e);
            return res.status(500).json({
                error: {
                    code: "SAVE_FAILED",
                    message: "Failed to save file"
                }
            });
        }

        try {
            const result = await query(
                `INSERT INTO photos (location_id, file)
                 VALUES (?, ?)`,
                [location_id, savedPath],
                (req as any).user_id
            );

            return res.json({
                id: result.insertId
            });
        } catch (e: any) {
            console.error(e);
            res.status(500).json({
                error: {
                    code: "DB_INSERT_FAILED",
                    message: e.message
                }
            });
        }
    }
);

// DELETE /api/photos/:id
photosRouter.delete(
    "/:id",
    validate(GetPhotoInput, "params"),
    checkPermission("locations", "update"),
    async (req, res) => {
        const { id } = (req as any).validated.params;

        const result = await query(
            `UPDATE photos
             SET deleted_at = CURRENT_TIMESTAMP
             WHERE id = ? AND deleted_at IS NULL`,
            [id], (req as any).user_id
        );

        if (result.affectedRows === 0) {
            return res.status(404).json({
                error: {
                    code: "PHOTO_NOT_FOUND",
                    message: "The photo does not exist"
                }
            });
        }

        res.json({ success: true });
    }
);

// POST /api/photos/:id/restore
photosRouter.post(
    "/:id/restore",
    validate(GetPhotoInput, "params"),
    checkPermission("locations", "update"),
    async (req, res) => {
        const { id } = (req as any).validated.params;

        const [row] = await query(
            `SELECT deleted_at
             FROM photos
             WHERE id = ?`,
            [id], (req as any).user_id
        );

        if (!row) {
            return res.status(404).json({
                error: {
                    code: "PHOTO_NOT_FOUND",
                    message: "The photo does not exist",
                },
            });
        }

        if (row.deleted_at === null) {
            return res.status(400).json({
                error: {
                    code: "PHOTO_NOT_DELETED",
                    message: "The photo is not deleted",
                },
            });
        }

        await query(
            `UPDATE photos
             SET deleted_at = NULL
             WHERE id = ?`,
            [id], (req as any).user_id
        );

        res.json({ success: true });
    }
);
