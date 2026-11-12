export type CropRequest = {
    file: File;
    title?: string;
    description?: string;
    aspect?: number;
    confirmLabel?: string;
    onCrop: (base64: string) => Promise<void> | void;
};
