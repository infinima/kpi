import express, { Request, Response } from 'express';
import cors from 'cors';
import { fileURLToPath } from "url";
import { dirname, join } from 'path';

const app = express();
const PORT = Number(process.env.PORT || 3000);
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

app.use(cors());
app.use(express.json());

const staticDir = join(__dirname, "..", "public");
app.use(express.static(staticDir));

app.get('/api/health', (_req: Request, res: Response) => {
    res.json({ ok: true, ts: Date.now() });
});

app.get('*', (_req, res) => res.sendFile(join(staticDir, 'index.html')));

app.listen(PORT, () => console.log(`Server is running on port ${PORT}`));
