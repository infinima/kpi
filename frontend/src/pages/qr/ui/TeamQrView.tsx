import { AlertCircle } from "lucide-react";
import type { useTeamQrModel } from '../model/useTeamQrModel';
export function TeamQrView(props: ReturnType<typeof useTeamQrModel>) {
    const { qrUrl, error, title } = props;
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
