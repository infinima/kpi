import { useEffect, useRef } from "react"

type Point = {
    x: number
    y: number
    ox: number
    oy: number
    vx: number
    vy: number
    phaseX: number
    phaseY: number
    speedX: number
    speedY: number
}

type BackgroundProps = {
    active?: boolean
}

export default function Background({ active = false }: BackgroundProps) {
    const canvasRef = useRef<HTMLCanvasElement>(null)

    useEffect(() => {
        const canvasElement = canvasRef.current
        if (!canvasElement) return

        const canvas: HTMLCanvasElement = canvasElement

        const context = canvas.getContext("2d")
        if (!context) return

        const ctx: CanvasRenderingContext2D = context

        let width = 0
        let height = 0
        let animationId = 0

        const mouse = {
            x: 0,
            y: 0,
            active: false,
        }

        let points: Point[] = []
        let cols = 0
        let rows = 0

        const getDpr = () => Math.min(window.devicePixelRatio || 1, 2)
        const getSpacing = () => (window.innerWidth < 640 ? 52 : 40)

        const driftAmplitude = 3
        const magnetRadius = window.innerWidth < 640 ? 110 : 160

        function getStrokeColor() {
            const isDark = document.documentElement.classList.contains("dark")
            return isDark ? "rgba(148, 163, 184, 0.16)" : "rgba(71, 85, 105, 0.16)"
        }

        function resizeCanvas() {
            width = window.innerWidth
            height = window.innerHeight

            const dpr = getDpr()

            canvas.width = Math.floor(width * dpr)
            canvas.height = Math.floor(height * dpr)
            canvas.style.width = `${width}px`
            canvas.style.height = `${height}px`

            ctx.setTransform(dpr, 0, 0, dpr, 0, 0)

            buildGrid()
            drawGrid()
        }

        function buildGrid() {
            points = []

            const spacing = getSpacing()
            const padding = spacing

            cols = Math.ceil((width + padding * 2) / spacing)
            rows = Math.ceil((height + padding * 2) / spacing)

            for (let row = 0; row < rows; row++) {
                for (let col = 0; col < cols; col++) {
                    const x = col * spacing - padding
                    const y = row * spacing - padding

                    points.push({
                        x,
                        y,
                        ox: x,
                        oy: y,
                        vx: 0,
                        vy: 0,
                        phaseX: Math.random() * Math.PI * 2,
                        phaseY: Math.random() * Math.PI * 2,
                        speedX: 0.35 + Math.random() * 0.35,
                        speedY: 0.35 + Math.random() * 0.35,
                    })
                }
            }
        }

        function handleMouseMove(e: MouseEvent) {
            if (!active) return
            mouse.x = e.clientX
            mouse.y = e.clientY
            mouse.active = true
        }

        function handleTouchStart(e: TouchEvent) {
            if (!active || !e.touches[0]) return
            mouse.x = e.touches[0].clientX
            mouse.y = e.touches[0].clientY
            mouse.active = true
        }

        function handleTouchMove(e: TouchEvent) {
            if (!active || !e.touches[0]) return
            mouse.x = e.touches[0].clientX
            mouse.y = e.touches[0].clientY
            mouse.active = true
        }

        function handleLeave() {
            mouse.active = false
        }

        function updatePoints(time: number) {
            if (!active) return

            const t = time * 0.001

            for (const p of points) {
                const driftX = Math.sin(t * p.speedX + p.phaseX) * driftAmplitude
                const driftY = Math.cos(t * p.speedY + p.phaseY) * driftAmplitude

                const targetX = p.ox + driftX
                const targetY = p.oy + driftY

                if (mouse.active) {
                    const dx = mouse.x - p.x
                    const dy = mouse.y - p.y
                    const dist = Math.sqrt(dx * dx + dy * dy)

                    if (dist < magnetRadius && dist > 0.001) {
                        const strength = (1 - dist / magnetRadius) ** 2
                        p.vx += (dx / dist) * strength * 0.45
                        p.vy += (dy / dist) * strength * 0.45
                    }
                }

                p.vx += (targetX - p.x) * 0.035
                p.vy += (targetY - p.y) * 0.035

                p.vx *= 0.9
                p.vy *= 0.9

                p.x += p.vx
                p.y += p.vy
            }
        }

        function drawGrid() {
            ctx.clearRect(0, 0, width, height)
            ctx.strokeStyle = getStrokeColor()
            ctx.lineWidth = 1

            for (let row = 0; row < rows; row++) {
                for (let col = 0; col < cols; col++) {
                    const index = row * cols + col
                    const p = points[index]
                    if (!p) continue

                    if (col < cols - 1) {
                        const right = points[index + 1]
                        if (right) {
                            ctx.beginPath()
                            ctx.moveTo(p.x, p.y)
                            ctx.lineTo(right.x, right.y)
                            ctx.stroke()
                        }
                    }

                    if (row < rows - 1) {
                        const bottom = points[index + cols]
                        if (bottom) {
                            ctx.beginPath()
                            ctx.moveTo(p.x, p.y)
                            ctx.lineTo(bottom.x, bottom.y)
                            ctx.stroke()
                        }
                    }
                }
            }
        }

        function animate(time: number) {
            if (active) {
                updatePoints(time)
            }
            drawGrid()
            animationId = requestAnimationFrame(animate)
        }

        resizeCanvas()
        animationId = requestAnimationFrame(animate)

        window.addEventListener("resize", resizeCanvas)
        window.addEventListener("mousemove", handleMouseMove)
        window.addEventListener("mouseleave", handleLeave)
        window.addEventListener("touchstart", handleTouchStart, { passive: true })
        window.addEventListener("touchmove", handleTouchMove, { passive: true })
        window.addEventListener("touchend", handleLeave)

        return () => {
            cancelAnimationFrame(animationId)
            window.removeEventListener("resize", resizeCanvas)
            window.removeEventListener("mousemove", handleMouseMove)
            window.removeEventListener("mouseleave", handleLeave)
            window.removeEventListener("touchstart", handleTouchStart)
            window.removeEventListener("touchmove", handleTouchMove)
            window.removeEventListener("touchend", handleLeave)
        }
    }, [active])

    return (
        <canvas
            ref={canvasRef}
            className="pointer-events-none fixed inset-0 -z-10 h-full w-full"
            aria-hidden="true"
        />
    )
}