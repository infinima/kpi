import React, {useEffect, useState} from "react";
import {useNotifications} from "@/store";
import {X} from "lucide-react";

export function NotificationCenter() {
    const {messages, removeMessage} = useNotifications();
    const [leaving, setLeaving] = useState<Record<string, boolean>>({});

    const handleRemove = (id: string) => {
        // включаем анимацию ухода
        setLeaving((prev) => ({...prev, [id]: true}));

        // удаляем после анимации
        setTimeout(() => removeMessage(id), 250);
    };

    return (
        <div className="fixed top-0 left-0 w-full z-9999 flex flex-col items-center gap-2 p-2 sm:p-4 pointer-events-none" >            {messages.map((msg) => {
                const animClass = leaving[msg.id] ? "toast-exit" : "toast-enter";

                return (
                    <div
                        key={msg.id}
                        className={`
        ${animClass}
        w-full max-w-[420px] sm:w-[420px]
        px-4 py-3 sm:px-4 sm:py-3
        rounded-lg shadow-card flex items-start gap-3 border
        pointer-events-auto

        text-sm sm:text-base

        ${
                            msg.type === "error"
                                ? "bg-error text-white border-error"
                                : msg.type === "warning"
                                    ? "bg-warning text-white border-warning"
                                    : msg.type === "success"
                                        ? "bg-success text-white border-success"
                                        : "bg-info text-white border-info"
                        }
    `}
                    >
                        <div className="flex-1">
                            <div className="font-bold capitalize mb-1">
                                {{
                                    success: "Успешно",
                                    error: "Ошибка",
                                    warning: "Предупреждение",
                                    info: "Информация"
                                }[msg.type]}
                            </div>

                            <div className="text-sm whitespace-pre-line">
                                {msg.text}
                            </div>

                            {msg.actionText && msg.action && (
                                <button
                                    onClick={msg.action}
                                    className="
            mt-3 px-3 py-1
            bg-surface text-text-main
            rounded-lg shadow-sm hover:opacity-90

            text-xs sm:text-sm
        "
                                >
                                    {msg.actionText}
                                </button>
                            )}
                        </div>

                        <button
                            onClick={() => handleRemove(msg.id)}
                            className="opacity-80 hover:opacity-100"
                        >
                            <X size={18}/>
                        </button>
                    </div>
                );
            })}
        </div>
    );
}