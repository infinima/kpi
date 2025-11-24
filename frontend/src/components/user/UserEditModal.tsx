import {useEffect, useState} from "react";
import {X} from "lucide-react";
import {useUI, useNotifications} from "@/store";
import {apiPatch, apiPost} from "@/api";
import {CropModal} from "@/components/services/CropModal";
import {UserImage} from "@/components/user/UserImage";

interface UserForm {
    email: string;
    first_name: string;
    last_name: string;
    patronymic: string;
    tg_username: string;
    password: string;
    photo: string;
}

interface UserEditModalProps {
    onUpdated: () => void;
}

export function UserEditModal({onUpdated}: UserEditModalProps) {
    const {editUser, closeEditUserModal} = useUI();
    const notify = useNotifications((s) => s.addMessage);

    const isNew = !editUser?.id;

    const [form, setForm] = useState<UserForm>({
        email: "",
        first_name: "",
        last_name: "",
        patronymic: "",
        tg_username: "",
        password: "",
        photo: "",
    });

    const [original, setOriginal] = useState<UserForm | null>(null);
    const [cropFile, setCropFile] = useState<File | null>(null);

    function updateField<K extends keyof UserForm>(field: K, value: UserForm[K]) {
        setForm((prev) => ({...prev, [field]: value}));
    }

    function handlePhotoSelect(e: React.ChangeEvent<HTMLInputElement>) {
        if (e.target.files?.[0]) {
            setCropFile(e.target.files[0]);
        }
    }

    useEffect(() => {
        if (!editUser) {
            setForm({
                email: "",
                first_name: "",
                last_name: "",
                patronymic: "",
                tg_username: "",
                password: "",
                photo: "",
            });
            setOriginal(null);
            return;
        }

        const base: UserForm = {
            email: editUser.email ?? "",
            first_name: editUser.first_name ?? "",
            last_name: editUser.last_name ?? "",
            patronymic: editUser.patronymic ?? "",
            tg_username: editUser.tg_username ?? "",
            password: "",
            photo: editUser.photo ?? "",
        };

        setForm(base);
        setOriginal(base);
    }, [editUser]);

    if (!editUser) return null;

    function getChangedFields(): Partial<UserForm> {
        const changes: Partial<UserForm> = {};

        const keys = Object.keys(form) as (keyof UserForm)[];

        for (const key of keys) {
            if (key === "password") {
                if (isNew && form.password.trim()) {
                    changes.password = form.password;
                }
                continue;
            }

            if (!original) {
                // @ts-ignore
                if (key !== "password") {
                    changes[key] = form[key];
                }
                continue;
            }

            if (form[key] !== original[key]) {
                changes[key] = form[key];
            }
        }

        return changes;
    }

    async function handleSave() {
        try {
            const payload = getChangedFields();

            if (Object.keys(payload).length === 0) {
                notify({type: "info", text: "Нет изменений"});
                closeEditUserModal();
                return;
            }

            if (isNew) {
                await apiPost("users", payload);
                notify({type: "success", text: "Пользователь создан"});
            } else {
                await apiPatch(`users/${editUser.id}`, payload);
                notify({type: "success", text: "Изменения сохранены"});
            }

            closeEditUserModal();
            onUpdated();
        } catch {
        }
    }

    const title = isNew ? "Создать пользователя" : "Редактирование пользователя";
    const buttonText = isNew ? "Создать пользователя" : "Сохранить изменения";


    return (
        <>
            {/* затемнённый фон */}
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
                        <h2 className="text-h2 font-semibold">{title}</h2>
                        <button onClick={closeEditUserModal}>
                            <X className="text-text-secondary dark:text-dark-text-secondary"/>
                        </button>
                    </div>

                    {/* Фото пользователя */}
                    <div className="space-y-2">
                        <label className="text-sm text-text-secondary dark:text-dark-text-secondary">
                            Фото
                        </label>

                        <div className="flex items-center gap-4">
                            {/* Если есть новое фото — показываем его */}
                            {form.photo ? (
                                <img
                                    src={form.photo}
                                    alt="avatar"
                                    className="w-24 h-24 rounded-lg object-cover border border-border dark:border-dark-border"
                                />
                            ) : (
                                <UserImage
                                    path={`users/${editUser.id}/photo`}
                                    alt="avatar"
                                    className="
                    w-24 h-24 rounded-lg object-cover
                    border border-border dark:border-dark-border
                "
                                    fallbackLetter={editUser.first_name?.[0] ?? "?"}
                                />
                            )}

                            {/* Кнопка загрузки */}
                            <div>
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
                                        onChange={handlePhotoSelect}   // 👉 выбор файла → выставили cropFile
                                    />
                                </label>
                            </div>
                        </div>
                    </div>

                    {/* ОСНОВНЫЕ ПОЛЯ */}
                    <div className="grid grid-cols-1 gap-4">
                        <div className="space-y-2">
                            <label className="text-sm text-text-secondary dark:text-dark-text-secondary">
                                Почта
                            </label>
                            <input
                                type="email"
                                value={form.email}
                                onChange={(e) => updateField("email", e.target.value)}
                                className="
                                    w-full px-3 py-2 rounded-lg
                                    bg-surface dark:bg-dark-surface
                                    border border-border dark:border-dark-border
                                "
                            />
                        </div>

                        <div className="space-y-2">
                            <label className="text-sm text-text-secondary dark:text-dark-text-secondary">
                                Фамилия
                            </label>
                            <input
                                value={form.last_name}
                                onChange={(e) => updateField("last_name", e.target.value)}
                                className="
                                    w-full px-3 py-2 rounded-lg
                                    bg-surface dark:bg-dark-surface
                                    border border-border dark:border-dark-border
                                "
                            />
                        </div>

                        <div className="space-y-2">
                            <label className="text-sm text-text-secondary dark:text-dark-text-secondary">
                                Имя
                            </label>
                            <input
                                value={form.first_name}
                                onChange={(e) => updateField("first_name", e.target.value)}
                                className="
                                    w-full px-3 py-2 rounded-lg
                                    bg-surface dark:bg-dark-surface
                                    border border-border dark:border-dark-border
                                "
                            />
                        </div>

                        <div className="space-y-2">
                            <label className="text-sm text-text-secondary dark:text-dark-text-secondary">
                                Отчество
                            </label>
                            <input
                                value={form.patronymic}
                                onChange={(e) => updateField("patronymic", e.target.value)}
                                className="
                                    w-full px-3 py-2 rounded-lg
                                    bg-surface dark:bg-dark-surface
                                    border border-border dark:border-dark-border
                                "
                            />
                        </div>

                        <div className="space-y-2">
                            <label className="text-sm text-text-secondary dark:text-dark-text-secondary">
                                Telegram (username)
                            </label>
                            <input
                                value={form.tg_username}
                                onChange={(e) => updateField("tg_username", e.target.value)}
                                className="
                                    w-full px-3 py-2 rounded-lg
                                    bg-surface dark:bg-dark-surface
                                    border border-border dark:border-dark-border
                                "
                            />
                        </div>

                        {/* Пароль только при создании */}
                        {isNew && (
                            <div className="space-y-2">
                                <label className="text-sm text-text-secondary dark:text-dark-text-secondary">
                                    Пароль
                                </label>
                                <input
                                    type="password"
                                    value={form.password}
                                    onChange={(e) => updateField("password", e.target.value)}
                                    className="
                                        w-full px-3 py-2 rounded-lg
                                        bg-surface dark:bg-dark-surface
                                        border border-border dark:border-dark-border
                                    "
                                />
                            </div>
                        )}
                    </div>

                    {/* КНОПКА СОХРАНЕНИЯ */}
                    <button
                        onClick={handleSave}
                        className="
                            w-full py-2 rounded-lg
                            bg-primary text-white font-medium
                            hover:bg-primary-dark
                        "
                    >
                        {buttonText}
                    </button>
                </div>
            </div>

            {/* модалка обрезки фото */}
            {cropFile && (
                <CropModal
                    file={cropFile}
                    onClose={() => setCropFile(null)}
                    onCrop={(base64: string) => {
                        setForm((prev) => ({...prev, photo: base64}));
                        setCropFile(null);
                        notify({type: "success", text: "Фото обновлено"});
                    }}
                />
            )}
            {cropFile && (
                <CropModal
                    file={cropFile}
                    onClose={() => setCropFile(null)}
                    onCrop={(base64: string) => {
                        setForm(prev => ({ ...prev, photo: base64 })); // кладём обрезанную фотку в форму
                        setCropFile(null);                             // закрываем кроп
                    }}
                />
            )}
        </>
    );
}