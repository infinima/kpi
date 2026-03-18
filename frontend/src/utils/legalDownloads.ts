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
    downloadPublicFile("Договор-оферта.pdf");
}

export function downloadPersonalDataFile() {
    downloadPublicFile("ОПД_регистрация.pdf");
}

export function downloadMedicalInterventionFile() {
    downloadPublicFile("Мед.pdf");
}

export function downloadPhotoVideoConsentFile() {
    downloadPublicFile("ОПД.pdf");
}
