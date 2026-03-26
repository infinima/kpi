import { useEffect, useMemo, useState } from "react";
import { AlertCircle, QrCode } from "lucide-react";
import { useSearchParams } from "react-router-dom";
import QRCode from "qrcode";

function decodeBase64Value(value: string) {
    try {
        const normalized = value.replace(/-/g, "+").replace(/_/g, "/");
        const padded = normalized.padEnd(Math.ceil(normalized.length / 4) * 4, "=");
        return decodeURIComponent(
            Array.from(atob(padded))
                .map((char) => `%${char.charCodeAt(0).toString(16).padStart(2, "0")}`)
                .join(""),
        );
    } catch {
        return null;
    }
}

export function TeamQrPage() {
    const [searchParams] = useSearchParams();
    const [qrUrl, setQrUrl] = useState<string | null>(null);
    const [error, setError] = useState<string | null>(null);

    const title = useMemo(() => searchParams.get("title")?.trim() ?? "", [searchParams]);
    const payload = useMemo(() => {
        const raw = searchParams.get("data")?.trim() ?? "";
        return raw ? decodeBase64Value(raw) : null;
    }, [searchParams]);

    useEffect(() => {
        let cancelled = false;

        async function generate() {
            if (!payload) {
                setQrUrl(null);
                setError("Укажите обязательный параметр в адресе: /qr?data=base64");
                return;
            }

            try {
                const url = await QRCode.toDataURL(payload, {
                    width: 880,
                    margin: 2,
                    color: {
                        dark: "#0f172a",
                        light: "#ffffff",
                    },
                });

                if (!cancelled) {
                    setQrUrl(url);
                    setError(null);
                }
            } catch {
                if (!cancelled) {
                    setError("Не удалось сгенерировать QR-код.");
                    setQrUrl(null);
                }
            }
        }

        void generate();

        return () => {
            cancelled = true;
        };
    }, [payload, title]);

    return (
        <section className="flex min-h-screen items-center justify-center bg-[radial-gradient(circle_at_top,rgba(14,116,144,0.12),transparent_35%),linear-gradient(180deg,#f8fafc_0%,#eef6ff_100%)] px-6 py-10">
            <div className="w-full max-w-3xl rounded-[36px] border border-[var(--color-border)] bg-[rgba(255,255,255,0.96)] p-8 text-center shadow-[0_24px_80px_rgba(15,23,42,0.10)]">


                {title ? (
                    <h1 className="mt-5 text-4xl font-semibold tracking-tight text-[var(--color-text-main)]">
                        {title}
                    </h1>
                ) : null}

                {error ? (
                    <div className="mx-auto mt-8 flex max-w-xl items-start gap-3 rounded-[24px] border border-[rgba(220,38,38,0.16)] bg-[rgba(254,242,242,0.92)] px-5 py-4 text-left text-sm text-[rgb(153,27,27)]">
                        <AlertCircle size={18} className="mt-0.5 shrink-0" />
                        <span>{error}</span>
                    </div>
                ) : qrUrl ? (
                    <>
                        <div className="mx-auto mt-8 w-full max-w-[560px] overflow-hidden rounded-[32px] border border-[var(--color-border)] bg-white p-6 shadow-[inset_0_1px_0_rgba(255,255,255,0.8)]">
                            <img src={qrUrl} alt={title || "QR код"} className="h-auto w-full" />
                        </div>
                    </>
                ) : null}
            </div>
        </section>
    );
}
