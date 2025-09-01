import React from "react";

type ButtonProps = {
    label: string;
    hoverLabel?: string;
    variant?: "primary" | "neutral";
    size?: "sm" | "md" | "lg";
    loading?: boolean;
    loadingKind?: "saving" | "creating" | "deleting";
    loadingText?: string;
    disabled?: boolean;
    as?: "button" | "a";
    href?: string;
    leftIcon?: React.ReactNode;
    className?: string;
    onClick?: React.MouseEventHandler<HTMLElement>;
};

const kindText: Record<NonNullable<ButtonProps["loadingKind"]>, string> = {
    saving: "Сохраняется…",
    creating: "Создается…",
    deleting: "Удаляется…",
};

export function Button({
                           label,
                           hoverLabel,
                           variant = "primary",
                           size = "md",
                           loading = false,
                           loadingKind,
                           loadingText,
                           disabled,
                           as = "button",
                           href,
                           leftIcon,
                           className = "",
                           onClick,
                       }: ButtonProps) {
    const Comp: any = as;
    const isDisabled = disabled || loading;

    const classes = [
        "btn",
        "inline-flex items-center gap-2",
        "group",
        variant === "primary" ? "btn-primary" : "btn-neutral",
        size === "sm" ? "btn-sm" : size === "lg" ? "btn-lg" : "",
        className,
    ].filter(Boolean).join(" ");

    return (
        <Comp
            href={as === "a" ? href : undefined}
            onClick={isDisabled ? undefined : onClick}
            aria-busy={loading || undefined}
            aria-disabled={isDisabled || undefined}
            className={classes}
            disabled={as === "button" ? isDisabled : undefined}
        >
            {/* Левый icon */}
            {leftIcon && <span className="flex-none shrink-0">{leftIcon}</span>}

            {/* Текстовый блок */}
            <span className="flex-1 min-w-0 relative text-center">
    {!loading && (
        <>
        <span
            className={
                "block whitespace-nowrap overflow-hidden text-ellipsis " +
                (hoverLabel ? "group-hover:hidden" : "")
            }
            title={label}
        >
          {label}
        </span>
            {hoverLabel && (
                <span
                    className="hidden group-hover:block whitespace-nowrap overflow-hidden text-ellipsis pointer-events-none"
                    aria-hidden="true"
                    title={hoverLabel}
                >
            {hoverLabel}
          </span>
            )}
        </>
    )}

                {loading && (
                    <span className="inline-flex items-center gap-2 whitespace-nowrap">
        <span
            className="h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent"
            aria-hidden="true"
        />
        <span>
          {loadingText ?? (loadingKind ? kindText[loadingKind] : "Загружается…")}
        </span>
      </span>
                )}
  </span>
        </Comp>
    );
}