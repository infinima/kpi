import express from "express";
import { validate } from "../utils/validate.js";
import { CreateEventInput, UpdateEventInput, GetOneEventInput } from "../schemas/events.js";
import { query } from "../utils/database.js";
import { resolveFilePath } from "../utils/resolve-file-path.js";
import { savePhoto } from "../utils/save-photo.js";

export const eventsRouter = express.Router();

// GET /api/events
eventsRouter.get("/", async (req, res) => {
    const events = await query("SELECT id, name, date, created_at, updated_at, deleted_at FROM events WHERE deleted_at IS NULL");
    res.json(events);
});

// GET /api/events/:id
eventsRouter.get("/:id", validate(GetOneEventInput, "params"), async (req, res) => {
    const { id } = (req as any).validated;
    const [event] = await query("SELECT id, name, date, created_at, updated_at, deleted_at FROM events WHERE id = ? AND deleted_at IS NULL", [id]);
    if (!event) return res.status(404).json({ error: "Event not found" });
    res.json(event);
});

// GET /api/events/:id/photo
eventsRouter.get("/:id/photo", validate(GetOneEventInput, "params"), async (req, res) => {
    const { id } = (req as any).validated;

    const [event] = await query("SELECT photo FROM events WHERE id = ? AND deleted_at IS NULL", [id]);
    if (!event) return res.status(404).json({ error: "Event not found" });

    try {
        const absolutePath = resolveFilePath(event.photo);
        res.sendFile(absolutePath, (err) => {
            if (err) {
                console.error(err);
                res.status(500).json({ error: "Failed to send file" });
            }
        });
    } catch (e: any) {
        res.status(400).json({ error: e.message });
    }
});

// POST /api/events
eventsRouter.post("/", validate(CreateEventInput), async (req, res) => {
    const data = (req as any).validated;

    try {
        const photoPath = await savePhoto(data.photo);

        const result = await query(
            "INSERT INTO events (name, date, photo) VALUES (?, ?, ?)",
            [data.name, data.date, photoPath]
        );

        res.json({ id: result.insertId });
    } catch (e: any) {
        console.error(e);
        res.status(400).json({ error: e.message });
    }
});

// PUT /api/events/:id
eventsRouter.put("/:id", validate(UpdateEventInput), async (req, res) => {
    const data = (req as any).validated;
    const { id, ...rest } = data as any;
    const fields = Object.fromEntries(Object.entries(rest).filter(([_, v]) => v !== undefined));

    if (Object.keys(fields).length === 0) {
        return res.status(400).json({ error: "No fields provided for update" });
    }

    const [exists] = await query("SELECT id FROM events WHERE id = ? AND deleted_at IS NULL", [id]);
    if (!exists) {
        return res.status(404).json({ error: "Event not found" });
    }

    try {
        if (fields.photo) {
            fields.photo = await savePhoto(String(fields.photo));
        }

        await query("UPDATE events SET ? WHERE id = ?", [fields, id]);
        res.json({ success: true });
    } catch (e: any) {
        console.error(e);
        res.status(400).json({ error: e.message });
    }
});

// DELETE /api/events/:id
eventsRouter.delete("/:id", validate(GetOneEventInput, "params"), async (req, res) => {
    const { id } = (req as any).validated;

    const [exists] = await query("SELECT id FROM events WHERE id = ? AND deleted_at IS NULL", [id]);
    if (!exists) {
        return res.status(404).json({ error: "Event not found" });
    }

    await query("UPDATE events SET deleted_at = CURRENT_TIMESTAMP WHERE id = ?", [id]);
    res.json({ success: true });
});
