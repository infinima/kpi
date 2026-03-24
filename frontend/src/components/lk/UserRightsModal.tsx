import { useEffect, useState } from "react";
import { Plus, X } from "lucide-react";
import { apiGet } from "@/api";
import { PermissionsCard, type PermissionRow } from "@/components/PermissionsCard";
import PrimaryButton from "@/components/ui/PrimaryButton";
import OutlineButton from "@/components/ui/OutlineButton";
import { useModalStore } from "@/store";

export function UserRightsModal() {
  const activeModal = useModalStore((state) => state.activeModal);
  const closeModal = useModalStore((state) => state.closeModal);
  const payload = activeModal?.type === "rights" ? activeModal.payload : null;
  const [rows, setRows] = useState<PermissionRow[]>([]);
  const [loading, setLoading] = useState(true);

  async function loadRows() {
    if (!payload) {
      return;
    }

    setLoading(true);
    try {
      const data = await apiGet<PermissionRow[]>(`permissions/user/${payload.userId}`);
      setRows(data.map((row) => ({
        ...row,
        permission: Array.isArray(row.permission) ? row.permission : [],
      })));
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    if (payload) {
      void loadRows();
    }
  }, [payload?.userId]);

  if (!payload) {
    return null;
  }

  function addEmptyPermission() {
    setRows((prev) => [
      ...prev,
      {
        id: null,
        user_id: payload.userId,
        object: "",
        permission: [],
        object_id: null,
        scope_object: null,
        scope_object_id: null,
      },
    ]);
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/45 px-4 backdrop-blur-sm">
      <div className="flex max-h-[88vh] w-full max-w-5xl flex-col overflow-hidden rounded-[32px] border border-[var(--color-border)] bg-[rgba(255,255,255,0.96)] shadow-[0_30px_90px_rgba(15,23,42,0.22)]">
        <div className="flex items-center justify-between border-b border-[var(--color-border)] px-6 py-5">
          <div>
            <div className="text-2xl font-semibold text-[var(--color-text-main)]">Права пользователя</div>
            <div className="mt-1 text-sm text-[var(--color-text-secondary)]">{payload.userName}</div>
          </div>
          <button
            type="button"
            onClick={closeModal}
            className="rounded-xl border border-[var(--color-border)] bg-white p-2 text-[var(--color-text-secondary)] transition hover:text-[var(--color-text-main)]"
          >
            <X size={18} />
          </button>
        </div>

        <div className="flex items-center justify-between border-b border-[var(--color-border)] px-6 py-4">
          <div className="text-sm text-[var(--color-text-secondary)]">
            {loading ? "Загружаем права..." : `Записей прав: ${rows.length}`}
          </div>
          <PrimaryButton active onClick={addEmptyPermission} leftIcon={<Plus size={16} />} className="px-4 py-2 text-sm shadow-none">
            Добавить право
          </PrimaryButton>
        </div>

        <div className="overflow-auto px-6 py-5">
          {loading ? (
            <div className="rounded-[24px] border border-[var(--color-border)] bg-[rgba(248,250,252,0.88)] px-5 py-8 text-sm text-[var(--color-text-secondary)]">
              Загрузка...
            </div>
          ) : rows.length === 0 ? (
            <div className="rounded-[24px] border border-[var(--color-border)] bg-[rgba(248,250,252,0.88)] px-5 py-8 text-sm text-[var(--color-text-secondary)]">
              Прав пока нет.
            </div>
          ) : (
            <div className="space-y-4">
              {rows.map((row, index) => (
                <PermissionsCard
                  key={row.id ?? `new-${index}`}
                  row={row}
                  onChangedOutside={loadRows}
                />
              ))}
            </div>
          )}
        </div>

        <div className="flex justify-end border-t border-[var(--color-border)] px-6 py-4">
          <OutlineButton active onClick={closeModal} className="px-4 py-2 text-sm">
            Закрыть
          </OutlineButton>
        </div>
      </div>
    </div>
  );
}
