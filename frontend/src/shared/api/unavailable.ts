import { ApiError } from "./errors.js";
export async function unavailable<T = never>(): Promise<T> {
    throw new ApiError("FEATURE_UNAVAILABLE", "Это действие недоступно в новой API");
}
