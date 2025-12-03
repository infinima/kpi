import { useState, useEffect } from "react";
import { X } from "lucide-react";
import { useUser, useUI, useNotifications } from "@/store";
import { apiPatch } from "@/api";
import { CropModal } from "@/components/services/CropModal";
import { BaseImage } from "@/components/BaseImage";

export function ProfileModal() {
    const { profileModalOpen, closeProfileModal } = useUI();
    const notify = useNotifications((s) => s.addMessage);
    const { user, fetchUser, logout, can } = useUser();

    const [form, setForm] = useState({
        first_name: "",
        last_name: "",
        patronymic: "",
        email: "",
        photo: "",
      tg_id: "",
    });

    const [original, setOriginal] = useState(form);
    const [cropFile, setCropFile] = useState<File | null>(null);

    useEffect(() => {
        if (profileModalOpen && user) {
            // @ts-ignore
          // @ts-ignore
          const base = {
                first_name: user.first_name,
                last_name: user.last_name,
                patronymic: user.patronymic || "",
                email: user.email,
                photo: user.photo || "",
            tg_id: user.tg_id || "",
            };

            setForm(base);
            setOriginal(base);
        }
    }, [profileModalOpen, user]);

    if (!profileModalOpen) return null;

    const canEdit = can("users", "update", user?.id)

    // 🔥 Собираем только изменённые поля
    function getChangedFields() {
        const payload: Record<string, any> = {};

        for (const key of Object.keys(form)) {
            if (form[key as keyof typeof form] !== original[key as keyof typeof original]) {
                payload[key] = form[key as keyof typeof form];
            }
        }

        return payload;
    }

    async function save() {
        const changed = getChangedFields();

        if (Object.keys(changed).length === 0) {
            notify({ type: "warning", text: "Нет изменений" });
            closeProfileModal();
            return;
        }

        try {
            await apiPatch(`users/${user?.id}`, changed);

            await fetchUser();
            closeProfileModal();
        } catch {
        }
    }

    return (
        <>
            {/* BACKDROP */}
            <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">

                <div className="
                    w-full max-w-lg p-6 rounded-xl
                    bg-surface dark:bg-dark-surface
                    border border-border dark:border-dark-border
                    shadow-card space-y-6
                ">
                    {/* HEADER */}
                    <div className="flex justify-between items-center">
                        <h2 className="text-h2 font-semibold">Мой профиль</h2>
                        <button onClick={closeProfileModal}>
                            <X className="text-text-secondary dark:text-dark-text-secondary" />
                        </button>
                    </div>

                    {/* PHOTO */}
                    <div className="flex items-center gap-4">
                        {form.photo ? (
                            <img
                                src={form.photo}
                                alt="new"
                                className="w-20 h-20 rounded-full object-cover border border-border dark:border-dark-border"
                            />
                        ) : (
                            <BaseImage
                                path={`users/${user?.id}/photo`}
                                fallbackLetter={user?.first_name?.[0] ?? "?"}
                                className="w-20 h-20 rounded-full object-cover border border-border dark:border-dark-border"
                            />
                        )}

                      {canEdit && (
                        <label className="px-3 py-2 rounded-lg bg-primary text-white hover:bg-primary-dark cursor-pointer">
                          Сменить фото
                          <input
                            type="file"
                            accept="image/*"
                            className="hidden"
                            onChange={(e) => setCropFile(e.target.files?.[0] ?? null)}
                          />
                        </label>
                      )}
                    </div>

                    {/* INPUTS */}
                    <div className="space-y-3">
                        <input
                          disabled={!canEdit}

                          value={form.last_name}
                            onChange={(e) => setForm({ ...form, last_name: e.target.value })}
                            placeholder="Фамилия"
                            className="w-full px-3 py-2 rounded-lg border border-border dark:border-dark-border bg-surface dark:bg-dark-surface"
                        />

                        <input
                          disabled={!canEdit}

                          value={form.first_name}
                            onChange={(e) => setForm({ ...form, first_name: e.target.value })}
                            placeholder="Имя"
                            className="w-full px-3 py-2 rounded-lg border border-border dark:border-dark-border bg-surface dark:bg-dark-surface"
                        />

                        <input
                          disabled={!canEdit}

                          value={form.patronymic}
                            onChange={(e) => setForm({ ...form, patronymic: e.target.value })}
                            placeholder="Отчество"
                            className="w-full px-3 py-2 rounded-lg border border-border dark:border-dark-border bg-surface dark:bg-dark-surface"
                        />

                        <input
                          disabled={!canEdit}

                          type="email"
                            value={form.email}
                            onChange={(e) => setForm({ ...form, email: e.target.value })}
                            placeholder="Почта"
                            className="w-full px-3 py-2 rounded-lg border border-border dark:border-dark-border bg-surface dark:bg-dark-surface"
                        />

                      <input
                        disabled={!canEdit}

                        value={form.tg_id}
                        onChange={(e) => setForm({ ...form, tg_id: e.target.value })}
                        placeholder="Телеграм ID"
                        className="w-full px-3 py-2 rounded-lg border border-border dark:border-dark-border bg-surface dark:bg-dark-surface"
                      />
                    </div>

                    {/* SAVE */}
                  {canEdit && (
                    <button
                      onClick={save}
                      className="w-full py-2 rounded-lg bg-primary text-white hover:bg-primary-dark"
                    >
                      Сохранить изменения
                    </button>
                  )}

                    {/* LOGOUT */}
                    <button
                        onClick={logout}
                        className="w-full py-2 rounded-lg bg-error text-white hover:bg-error/80"
                    >
                        Выйти
                    </button>
                </div>
            </div>

            {/* CROP MODAL */}
            {cropFile && (
                <CropModal
                    file={cropFile}
                    onClose={() => setCropFile(null)}
                    onCrop={(base64) => {
                        setForm({ ...form, photo: base64 });
                        setCropFile(null);
                        notify({ type: "success", text: "Фото обновлено" });
                    }}
                />
            )}
        </>
    );
}