export function QueryError({ message, onRetry }: { message: string; onRetry: () => void; }) {
    return <div role="alert" className="rounded-2xl border border-[var(--color-error)] p-4 text-sm text-[var(--color-text-main)]">
        {message} <button type="button" onClick={onRetry} className="ml-2 underline">Повторить</button>
    </div>;
}
