export function pickImageFile(onSelect: (file: File) => void) {
    const input = document.createElement("input");
    input.type = "file";
    input.accept = "image/png,image/jpeg,image/webp,image/heic,image/heif";
    input.style.position = "fixed";
    input.style.left = "-9999px";
    document.body.appendChild(input);

    input.onchange = () => {
        const file = input.files?.[0];
        document.body.removeChild(input);
        if (file) {
            onSelect(file);
        }
    };

    input.oncancel = () => {
        if (document.body.contains(input)) {
            document.body.removeChild(input);
        }
    };

    input.click();
}
