import { useEffect, useMemo, useState } from "react"

type AnimatedTextProps = {
    text: string
    className?: string
    speed?: number
    delay?: number
    showCursor?: boolean
    as?: "span" | "p" | "div" | "h1" | "h2" | "h3"
}

export default function AnimatedText({
                                         text,
                                         className = "",
                                         speed = 35,
                                         delay = 0,
                                         showCursor = true,
                                         as = "span",
                                     }: AnimatedTextProps) {
    const [displayedText, setDisplayedText] = useState("")
    const [started, setStarted] = useState(delay === 0)

    useEffect(() => {
        setDisplayedText("")
        setStarted(delay === 0)

        if (delay === 0) return

        const delayTimer = window.setTimeout(() => {
            setStarted(true)
        }, delay)

        return () => window.clearTimeout(delayTimer)
    }, [text, delay])

    useEffect(() => {
        if (!started) return
        if (!text.length) return

        let index = 0

        const interval = window.setInterval(() => {
            index += 1
            setDisplayedText(text.slice(0, index))

            if (index >= text.length) {
                window.clearInterval(interval)
            }
        }, speed)

        return () => window.clearInterval(interval)
    }, [started, text, speed])

    const isFinished = displayedText.length === text.length
    const Component = useMemo(() => as, [as])

    return (
        <Component className={className}>
            {displayedText}
            {showCursor && !isFinished ? (
                <span className="ml-[2px] inline-block animate-pulse">|</span>
            ) : null}
        </Component>
    )
}