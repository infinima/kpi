import { useEffect, useState } from "react";
import { X } from "lucide-react";
import { apiPost, apiPatch } from "@/api";
import { useNotifications } from "@/store";
import { CropModal } from "@/components/services/CropModal";
import { UserImage } from "@/components/user/UserImage";

import type { FormConfig, FormField } from "@/config/forms";

interface FormModalProps {
    config: FormConfig;
    initialData: Record<string, any> | null;
    onClose: () => void;
    onUpdated: () => void;
}

export function FormModal({
                              config,
                              initialData,
                              onClose,
                              onUpdated,
                          }: FormModalProps) {
    const notify = useNotifications((s) => s.addMessage);
    const isEdit = !!initialData?.id;

    const [form, setForm] = useState<Record<string, any>>({});
    const [original, setOriginal] = useState<Record<string, any> | null>(null);
    const [cropFile, setCropFile] = useState<File | null>(null);

    /** ▌ Инициализация данных */
    useEffect(() => {
        const base = initialData || {};
        setForm(base);
        setOriginal(base);
    }, [initialData]);

    function updateField(name: string, value: any) {
        setForm((prev) => ({ ...prev, [name]: value }));
    }

    /** ▌ Определим изменённые поля */
    function getChangedFields() {
        const payload: Record<string, any> = {};

        for (const field of config.fields) {
            const key = field.name;

            if (isEdit && field.hiddenWhenEditing) continue;
            if (!isEdit && field.hiddenWhenCreating) continue;

            if (!original || form[key] !== original[key]) {
                payload[key] = form[key];
            }
        }

        return payload;
    }

    function isEmailValid(email: string) {
        return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
    }

    function isPasswordValid(pass: string) {
        return pass.length >= 6;
    }


    async function save() {
        for (const field of config.fields) {
            if (isEdit && field.hiddenWhenEditing) continue;
            if (!isEdit && field.hiddenWhenCreating) continue;

            if (field.required) {
                const v = form[field.name];

                const empty =
                    v === undefined ||
                    v === null ||
                    (typeof v === "string" && v.trim() === "");

                if (field.name === "email" && !isEmailValid(form.email)) {
                    notify({ type: "warning", text: "Некорректный email" });
                    return;
                }

                if (field.name === "password" && !isEdit && !isPasswordValid(form.password)) {
                    notify({ type: "warning", text: "Пароль должен быть не короче 6 символов" });
                    return;
                }


                if (empty) {
                    notify({
                        type: "warning",
                        text: `Поле «${field.label}» обязательно для заполнения`,
                    });
                    return;
                }
            }
        }

        const payload = getChangedFields();

        try {
            if (isEdit) {
                await apiPatch(`${config.endpoint}/${initialData!.id}`, payload);
                notify({ type: "success", text: "Изменения сохранены" });
            } else {
                await apiPost(config.endpoint, payload);
                notify({ type: "success", text: "Создано успешно" });
            }

            onUpdated();
            onClose();
        } catch (e) {}
    }

    function renderField(field: FormField) {
        if (isEdit && field.hiddenWhenEditing) return null;
        if (!isEdit && field.hiddenWhenCreating) return null;

        if (field.type === "image") {
            const imageSrc =
                form[field.name] ||
                (isEdit && initialData?.id
                    ? `/${config.endpoint}/${initialData.id}/photo`
                    : null);

            return (
                <div key={field.name} className="space-y-2">
                    <label className="text-sm text-text-secondary dark:text-dark-text-secondary">
                        {field.label}
                    </label>

                    <div className="flex items-center gap-4">

                        {/* Превью фото */}
                        {form[field.name] ? (
                            <img
                                src={form[field.name]}
                                alt="photo"
                                className="w-24 h-24 rounded-lg object-cover border border-border dark:border-dark-border"
                            />
                        ) : imageSrc ? (
                            <UserImage
                                path={`${config.endpoint}/${initialData?.id}/photo`}
                                alt="photo"
                                className="w-24 h-24 rounded-lg object-cover border"
                                fallbackLetter="?"
                            />
                        ) : (
                            <div className="w-24 h-24 rounded-lg bg-hover dark:bg-dark-hover border flex items-center justify-center text-text-muted">
                                нет фото
                            </div>
                        )}

                        {/* Кнопка загрузки */}
                        <label
                            className="
                                px-3 py-2 rounded-lg cursor-pointer
                                bg-primary text-white hover:bg-primary-dark
                            "
                        >
                            Загрузить фото
                            <input
                                type="file"
                                accept="image/*"
                                className="hidden"
                                onChange={(e) => setCropFile(e.target.files?.[0] ?? null)}
                            />
                        </label>
                    </div>
                </div>
            );
        }

        return (
            <div key={field.name} className="space-y-2">
                <label className="text-sm text-text-secondary dark:text-dark-text-secondary">
                    {field.label}
                </label>
                <input
                    type={field.type}
                    value={form[field.name] ?? ""}
                    placeholder={field.placeholder}
                    onChange={(e) => updateField(field.name, e.target.value)}
                    className="
                        w-full px-3 py-2 rounded-lg
                        bg-surface dark:bg-dark-surface
                        border border-border dark:border-dark-border
                    "
                />
            </div>
        );
    }

    return (
        <>
            {/* ТЁМНЫЙ ФОН */}
            <div className="fixed inset-0 p-4 bg-black/40 backdrop-blur-sm z-50 flex items-center justify-center">

                <div
                    className="
                        w-full max-w-lg p-6 rounded-xl
                        bg-surface dark:bg-dark-surface
                        border border-border dark:border-dark-border
                        shadow-card space-y-6
                    "
                >
                    {/* HEADER */}
                    <div className="flex justify-between items-center">
                        <h2 className="text-h2 font-semibold">
                            {isEdit ? config.titleEdit : config.titleCreate}
                        </h2>
                        <button onClick={onClose}>
                            <X className="text-text-secondary dark:text-dark-text-secondary" />
                        </button>
                    </div>

                    {/* FIELDS */}
                    <div className="grid grid-cols-1 gap-4">
                        {config.fields.map((field) => renderField(field))}
                    </div>

                    {/* SAVE */}
                    <button
                        onClick={save}
                        className="w-full py-2 rounded-lg bg-primary text-white hover:bg-primary-dark"
                    >
                        {isEdit ? "Сохранить изменения" : "Создать"}
                    </button>
                </div>
            </div>

            {/* КРОП МОДАЛКА */}
            {cropFile && (
                <CropModal
                    file={cropFile}
                    onClose={() => setCropFile(null)}
                    onCrop={(base64) => {
                        updateField("photo", base64);
                        setCropFile(null);
                        notify({ type: "success", text: "Фото обновлено" });
                    }}
                />
            )}
        </>
    );
}