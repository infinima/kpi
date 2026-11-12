export type ImageProps = { src: string | null; alt?: string; className?: string; fallbackLetter?: string; };
export function Image({ src, alt = "", className = "", fallbackLetter = "?" }: ImageProps) {
    return src ? <img src={src} alt={alt} className={className} /> : <div className={`flex items-center justify-center bg-hover dark:bg-dark-hover text-xl rounded-full ${className}`}>{fallbackLetter}</div>;
}
