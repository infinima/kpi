import QRCode from "qrcode";
import { useEffect, useMemo, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { apiGet } from "@/shared/api/get";
import { useUser } from "@/entities/session/model/session";
export function useTeamQrModel() {
    const [searchParams] = useSearchParams();

    const [qrUrl, setQrUrl] = useState<string | null>(null);

    const [error, setError] = useState<string | null>(null);

    const title = useMemo(() => searchParams.get("title")?.trim() ?? "", [searchParams]);

    const token = useUser(state => state.token);
    const [payload, setPayload] = useState<string | null>(null);
    useEffect(() => {
        let active = true;
        setPayload(null);
        if (!token) { setError("Войдите в аккаунт, чтобы получить QR-код"); return; }
        void apiGet<{ token: string; url: string }>("auth/me/qr").then(data => { if (active) { setPayload(data.url); setError(null); } }).catch(() => { if (active) setError("Не удалось получить QR-код"); });
        return () => { active = false; };
    }, [token]);

    useEffect(() => {
        let cancelled = false;

        async function generate() {
            if (!payload) {
                setQrUrl(null);
                
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
    return { searchParams, qrUrl, setQrUrl, error, setError, title, payload };
}
