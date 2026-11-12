export const inputClassName = `
    w-full rounded-2xl border border-[var(--color-border)]
    bg-[rgba(255,255,255,0.92)] px-4 py-3
    text-[var(--color-text-main)] outline-none
    transition focus:border-[var(--color-primary-light)]
`;

export { isValidEmail } from "../../../shared/lib/authValidation.js";
