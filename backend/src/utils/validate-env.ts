import { z } from "zod";

const EnvSchema = z.object({
    NODE_ENV: z.enum(["development", "production", "test"]).default("development"),
    PORT: z.coerce.number().default(3000),

    MYSQL_HOST: z.string().min(1),
    MYSQL_PORT: z.coerce.number().default(3306),
    MYSQL_USER: z.string().min(1),
    MYSQL_PASSWORD: z.string().min(1),
    MYSQL_DATABASE: z.string().min(1),

    TG_BOT_TOKEN: z.string().min(1),

    SMTP_HOST: z.string().min(1),
    SMTP_PORT: z.coerce.number().default(465),
    SMTP_USER: z.string().min(1),
    SMTP_PASS: z.string().min(1),
    SMTP_FROM: z.string().min(1),
});

const parsed = EnvSchema.safeParse(process.env);

if (!parsed.success) {
    console.error("❌  Invalid environment variables:");
    for (const issue of parsed.error.issues) {
        console.error(`  • ${issue.path.join(".") || "(root)"}: ${issue.message}`);
    }
    process.exit(1);
}

Object.assign(
    process.env,
    Object.entries(parsed.data).reduce((acc, [k, v]) => {
        acc[k] = String(v);
        return acc;
    }, {} as Record<string, string>)
);
