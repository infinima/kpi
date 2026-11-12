export function fileToBase64(file: File) {
    return new Promise<string>((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => resolve(String(reader.result ?? ""));
        reader.onerror = () => reject(reader.error ?? new Error("FILE_READ_FAILED"));
        reader.readAsDataURL(file);
    });
}

export function pickPdfFile(onSelect: (file: File) => void) {
    const input = document.createElement("input");
    input.type = "file";
    input.accept = "application/pdf,.pdf";
    input.style.position = "fixed";
    input.style.left = "-9999px";
    document.body.appendChild(input);
    input.onchange = () => { const file = input.files?.[0]; input.remove(); if (file) onSelect(file); };
    input.oncancel = () => input.remove();
    input.click();
}
