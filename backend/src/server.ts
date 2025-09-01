import express, { Request, Response } from 'express';
import cors from 'cors';
import { dirname, join } from 'path';

const app = express();
const PORT = Number(process.env.PORT || 3000);
const __dirname = dirname(__filename);

app.use(cors());
app.use(express.json());

app.get('/api/health', (_req: Request, res: Response) => {
    res.json({ ok: true, ts: Date.now() });
});

// раздача собранного фронта (после `npm run build`)
const staticDir = join(__dirname, "..", "public");
app.use(express.static(staticDir));
app.get('*', (_req, res) => res.sendFile(join(staticDir, 'index.html')));

app.listen(PORT, () => console.log(`http://localhost:${PORT}`));
