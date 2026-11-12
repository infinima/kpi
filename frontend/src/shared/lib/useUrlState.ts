import type { SetStateAction } from "react";
import { useSearchParams } from "react-router-dom";
import { readUrlState, writeUrlState } from "./urlState";

export function useUrlState<T extends string>(key: string, fallback: T, allowed?: readonly T[]): [T, (update: SetStateAction<T>) => void] {
    const [params, setParams] = useSearchParams();
    const value = readUrlState(params, key, fallback, allowed);
    function set(update: SetStateAction<T>) {
        setParams((current) => {
            const result = typeof update === "function" ? update(readUrlState(current, key, fallback, allowed)) : update;
            return writeUrlState(current, key, result, fallback);
        }, { replace: true });
    }
    return [value, set];
}
