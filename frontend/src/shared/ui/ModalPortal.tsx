import type { ReactNode } from "react";
import { createPortal } from "react-dom";
export function ModalPortal({ children }: { children: ReactNode; }) {
    return typeof document === "undefined" ? null : createPortal(children, document.body);
}
