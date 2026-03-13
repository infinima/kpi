function downloadPublicFile(fileName: string) {
    const url = `/${encodeURIComponent(fileName)}`;
    const link = document.createElement("a");
    link.href = url;
    link.download = fileName;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
}

export function downloadContractFile() {
    downloadPublicFile("Д.docx");
}

export function downloadPersonalDataFile() {
    downloadPublicFile("ПД.doc");
}

export function downloadMedicalInterventionFile() {
    downloadPublicFile("Мед.rtf");
}

export function downloadPhotoVideoConsentFile() {
    downloadPublicFile("ФотоИВидео.docx");
}
