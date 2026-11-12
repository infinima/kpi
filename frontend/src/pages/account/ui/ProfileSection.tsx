import PrimaryButton from "@/shared/ui/PrimaryButton";
import {
    Check
} from "lucide-react";
import type { useCabinetModel } from '../model/useCabinetModel';
import { inputClassName, readOnlyClassName } from './cabinetPresentation';
export function ProfileSection(props: ReturnType<typeof useCabinetModel>) {
    const {
        profileForm,
        profileLoading,
        profileSaving,
        handleProfileFieldChange,
        handleProfileSave,
    } = props;
    return (
        <div>
            <a className="underline" href="/qr">Мой QR-код</a>
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <div>
                    <h2 className="text-2xl font-semibold text-[var(--color-text-main)]">
                        Личные данные
                    </h2>
                </div>
            </div>

            <div className="mt-8 grid gap-5 sm:grid-cols-2">
                <label className="block space-y-2">
                    <span className="text-sm text-[var(--color-text-secondary)]">Имя</span>
                    <input
                        value={profileForm.first_name}
                        onChange={(event) => handleProfileFieldChange("first_name", event.target.value)}
                        className={inputClassName}
                    />
                </label>

                <label className="block space-y-2">
                    <span className="text-sm text-[var(--color-text-secondary)]">Фамилия</span>
                    <input
                        value={profileForm.last_name}
                        onChange={(event) => handleProfileFieldChange("last_name", event.target.value)}
                        className={inputClassName}
                    />
                </label>

                <label className="block space-y-2">
                    <span className="text-sm text-[var(--color-text-secondary)]">Отчество</span>
                    <input
                        value={profileForm.patronymic}
                        onChange={(event) => handleProfileFieldChange("patronymic", event.target.value)}
                        placeholder="Необязательно"
                        className={inputClassName}
                    />
                </label>

                <label className="block space-y-2">
                    <span className="text-sm text-[var(--color-text-secondary)]">Телефон</span>
                    <input
                        value={profileForm.phone_number}
                        onChange={(event) => handleProfileFieldChange("phone_number", event.target.value)}
                        placeholder="+7 999 123-45-67"
                        className={inputClassName}
                    />
                </label>

                <label className="block space-y-2 sm:col-span-2">
                    <span className="text-sm text-[var(--color-text-secondary)]">Email</span>
                    <input
                        value={profileForm.email}
                        readOnly
                        className={readOnlyClassName}
                    />
                </label>
            </div>

            <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <p className="text-sm text-[var(--color-text-secondary)]">
                    {profileLoading ? "Профиль загружается..." : ""}
                </p>

                <PrimaryButton
                    active
                    loading={profileSaving}
                    loadingText="Сохраняем..."
                    leftIcon={<Check size={18} />}
                    onClick={handleProfileSave}
                >
                    Сохранить
                </PrimaryButton>
            </div>
        </div>
    );
}
