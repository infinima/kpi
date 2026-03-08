import type { ReactNode, MouseEvent } from "react"

type OutlineButtonProps = {
    active?: boolean
    loading?: boolean
    disabled?: boolean
    children: ReactNode
    loadingText?: string
    leftIcon?: ReactNode
    rightIcon?: ReactNode
    onClick?: (event: MouseEvent<HTMLButtonElement>) => void
    type?: "button" | "submit" | "reset"
    className?: string
}

function Spinner() {
    return (
        <span
            className="
        inline-block h-4 w-4 rounded-full
        border-2 border-[var(--color-text-secondary)]/30
        border-t-[var(--color-primary)]
        animate-spin
      "
            aria-hidden="true"
        />
    )
}

export default function OutlineButton({
                                          active = true,
                                          loading = false,
                                          disabled = false,
                                          children,
                                          loadingText = "Загрузка...",
                                          leftIcon,
                                          rightIcon,
                                          onClick,
                                          type = "button",
                                          className = "",
                                      }: OutlineButtonProps) {
    if (!active) return null

    const isDisabled = disabled || loading

    return (
        <button
            type={type}
            onClick={onClick}
            disabled={isDisabled}
            className={`
        inline-flex items-center justify-center gap-2
        px-6 py-3
        rounded-[var(--radius-xl)]
        border border-[var(--color-border)]
        bg-[var(--color-surface)]
        text-[var(--color-text-main)]
        font-medium
        transition
        hover:bg-[var(--color-hover)]
        hover:border-[var(--color-primary-light)]
        hover:scale-[1.02]
        active:scale-[0.98]
        disabled:cursor-not-allowed
        disabled:opacity-60
        ${className}
      `}
        >
            {loading ? (
                <>
                    <Spinner />
                    <span>{loadingText}</span>
                </>
            ) : (
                <>
                    {leftIcon ? <span className="shrink-0">{leftIcon}</span> : null}
                    <span>{children}</span>
                    {rightIcon ? <span className="shrink-0">{rightIcon}</span> : null}
                </>
            )}
        </button>
    )
}