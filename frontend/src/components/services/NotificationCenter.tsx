import React, {useEffect, useRef, useState} from "react";
import {useNotifications} from "@/store";
import {X} from "lucide-react";

const DEFAULT_DURATION = 5000;

const TITLES = {
    success: "Успешно",
    error: "Ошибка",
    warning: "Предупреждение",
    info: "Информация",
} as const;

const TONE_CLASSES = {
    error: "bg-[var(--color-error)] text-white border-[var(--color-error)]",
    warning: "bg-[var(--color-warning)] text-white border-[var(--color-warning)]",
    success: "bg-[var(--color-success)] text-white border-[var(--color-success)]",
    info: "bg-[var(--color-info)] text-white border-[var(--color-info)]",
} as const;

type NotificationType = keyof typeof TITLES;

function NotificationItem({
                              msg,
                              onRemove,
                          }: {
    msg: {
        id: string;
        type: NotificationType;
        text: string;
        actionText?: string;
        action?: () => void;
        duration?: number;
    };
    onRemove: (id: string) => void;
}) {
    const [leaving, setLeaving] = useState(false);
    const timerRef = useRef<number | null>(null);
    const removedRef = useRef(false);

    const duration = msg.duration ?? DEFAULT_DURATION;

    const handleRemove = () => {
        if (removedRef.current) return;
        removedRef.current = true;
        setLeaving(true);

        if (timerRef.current) {
            window.clearTimeout(timerRef.current);
        }

        window.setTimeout(() => {
            onRemove(msg.id);
        }, 250);
    };

    useEffect(() => {
        timerRef.current = window.setTimeout(() => {
            handleRemove();
        }, duration);

        return () => {
            if (timerRef.current) {
                window.clearTimeout(timerRef.current);
            }
        };
    }, [duration]);

    return (
        <div
            className={`
                relative overflow-hidden
                w-full max-w-full rounded-xl border shadow-card
                pointer-events-auto
                sm:w-[420px]
                ${leaving ? "toast-exit" : "toast-enter"}
                ${TONE_CLASSES[msg.type]}
            `}
        >
            <div className="relative flex items-start gap-3 px-4 py-3">
                <div className="min-w-0 flex-1">
                    <div className="mb-1 font-bold capitalize">
                        {TITLES[msg.type]}
                    </div>

                    <div className="text-sm leading-5 whitespace-pre-line break-words sm:text-[15px]">
                        {msg.text}
                    </div>

                    {msg.actionText && msg.action && (
                        <div className="mt-3 flex flex-wrap gap-2">
                            <button
                                onClick={() => {
                                    msg.action?.();
                                    handleRemove();
                                }}
                                className="
                                    rounded-lg px-3 py-1 text-xs shadow-sm hover:opacity-90 sm:text-sm
                                    bg-[var(--color-surface)] text-[var(--color-text-main)]
                                "
                            >
                                {msg.actionText}
                            </button>

                            {msg.secondaryActionText && msg.secondaryAction ? (
                                <button
                                    onClick={() => {
                                        msg.secondaryAction?.();
                                        handleRemove();
                                    }}
                                    className="
                                        rounded-lg border border-white/40 px-3 py-1 text-xs shadow-sm hover:bg-white/10 sm:text-sm
                                    "
                                >
                                    {msg.secondaryActionText}
                                </button>
                            ) : null}
                        </div>
                    )}
                </div>

                <button
                    onClick={handleRemove}
                    className="shrink-0 opacity-80 transition-opacity hover:opacity-100"
                >
                    <X size={18} />
                </button>
            </div>
        </div>
    );
}

export default function NotificationCenter() {
    const {messages, removeMessage} = useNotifications();

    return (
        <div
            className="
                pointer-events-none
                fixed top-2 right-2 z-[9999]
                flex w-[calc(100vw-16px)] flex-col items-stretch gap-2
                sm:top-4 sm:right-4 sm:w-auto sm:items-end
            "
        >
            {messages.map((msg) => (
                <NotificationItem
                    key={msg.id}
                    msg={msg}
                    onRemove={removeMessage}
                />
            ))}
        </div>
    );
}
