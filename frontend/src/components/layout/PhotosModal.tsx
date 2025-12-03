import { useEffect, useState } from "react";
import {
  X,
  Upload,
  Trash2,
  Download,
  RotateCcw,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import { useUI, useNotifications, useUser } from "@/store";
import { useEventsNav } from "@/store";
import { apiGet, apiPost, apiDelete } from "@/api";

import JSZip from "jszip";
import { saveAs } from "file-saver";

type PhotoItem = {
  id: number;
  location_id: number;
  created_at: string;
};

type Mode = "active" | "deleted";

async function fileToDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

export function PhotosModal() {
  const close = useUI((s) => s.closePhotoModal);
  const open = useUI((s) => s.PhotosModal);

  const { locationId, locationName } = useEventsNav();
  const notify = useNotifications((s) => s.addMessage);
  const { can } = useUser();
  const canEdit = can("locations", "edit_photos", locationId || undefined);

  const [mode, setMode] = useState<Mode>("active");
  const [items, setItems] = useState<PhotoItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [selected, setSelected] = useState<number[]>([]);

  // Viewer (полноэкранный просмотр)
  const [viewerOpen, setViewerOpen] = useState(false);
  const [viewerIndex, setViewerIndex] = useState<number>(0);

  // -------- INITIAL LOAD WHEN LOCATION CHANGES --------
  useEffect(() => {
    if (!locationId) return;
    setMode("active");
    void loadPhotos("active");
  }, [locationId]);

  // -------- RELOAD WHEN MODE / OPEN CHANGES --------
  useEffect(() => {
    if (!locationId) return;
    void loadPhotos(mode);
  }, [mode, open]); // open чтобы при повторном открытии обновлять список

  // -------- KEYBOARD CONTROL FOR VIEWER --------
  useEffect(() => {
    if (!viewerOpen) return;

    function handleKey(e: KeyboardEvent) {
      if (!viewerOpen) return;

      if (e.key === "Escape") {
        setViewerOpen(false);
      } else if (e.key === "ArrowRight") {
        setViewerIndex((i) =>
          items.length === 0 ? 0 : (i + 1) % items.length
        );
      } else if (e.key === "ArrowLeft") {
        setViewerIndex((i) =>
          items.length === 0 ? 0 : (i - 1 + items.length) % items.length
        );
      }
    }

    window.addEventListener("keydown", handleKey);
    return () => window.removeEventListener("keydown", handleKey);
  }, [viewerOpen, items.length]);

  // если модалка закрыта — ничего не рендерим
  if (!open) return null;

  // =================== LOAD LIST ===================
  async function loadPhotos(currentMode: Mode = mode) {
    if (!locationId) return;
    setLoading(true);

    const suffix = currentMode === "deleted" ? "/deleted" : "";
    try {
      const res = await apiGet(`photos/location/${locationId}${suffix}`);
      setItems(res || []);
      setViewerOpen(false);
      setViewerIndex(0);
    } catch (e) {
      console.error(e);
      notify({ type: "error", text: "Не удалось загрузить фотографии" });
      setItems([]);
    } finally {
      setLoading(false);
      setSelected([]);
    }
  }

  // =================== SELECTION ===================

  const toggleSelect = (id: number) => {
    setSelected((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
    );
  };

  const isAnySelected = selected.length > 0;

  // =================== UPLOAD ===================

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files ?? []);
    if (!files.length || !locationId) return;

    setUploading(true);
    try {
      for (const file of files) {
        if (!file.type.startsWith("image/")) {
          notify({
            type: "warning",
            text: `Файл ${file.name} не является изображением`,
          });
          continue;
        }

        const dataUrl = await fileToDataUrl(file);

        await apiPost("photos", {
          location_id: locationId,
          file: dataUrl,
        });
      }

      notify({ type: "success", text: "Фотографии загружены" });
      await loadPhotos();
    } catch (err) {
      console.error(err);
      notify({ type: "error", text: "Ошибка загрузки фотографий" });
    } finally {
      setUploading(false);
      e.target.value = "";
    }
  };

  // =================== BULK ACTIONS ===================

  const bulkDeleteOrRestore = async () => {
    if (!selected.length) return;

    try {
      if (mode === "active") {
        for (const id of selected) {
          await (apiDelete
            ? apiDelete(`photos/${id}`)
            : fetch(`/api/photos/${id}`, { method: "DELETE" }));
        }
        notify({ type: "success", text: "Фотографии удалены" });
      } else {
        for (const id of selected) {
          await apiPost(`photos/${id}/restore`, {});
        }
        notify({ type: "success", text: "Фотографии восстановлены" });
      }

      await loadPhotos();
    } catch (err) {
      console.error(err);
      notify({
        type: "error",
        text:
          mode === "active"
            ? "Не удалось удалить фотографии"
            : "Не удалось восстановить фотографии",
      });
    }
  };

  const bulkDownload = async () => {
    if (!selected.length) return;

    try {
      for (const id of selected) {
        const res = await fetch(`/api/photos/${id}/file`);
        if (!res.ok) continue;
        const blob = await res.blob();
        const type = blob.type.split("/")[1] || "bin";
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = `photo_${id}.${type}`;
        document.body.appendChild(a);
        a.click();
        a.remove();
        URL.revokeObjectURL(url);
      }
    } catch (err) {
      console.error(err);
      notify({ type: "error", text: "Ошибка скачивания" });
    }
  };

  const downloadArchive = async () => {
    if (!selected.length) return;

    try {
      const zip = new JSZip();
      const folder = zip.folder(`photos_${locationId}`);

      const tasks = selected.map(async (id) => {
        const res = await fetch(`/api/photos/${id}/file`);
        if (!res.ok) return null;

        const blob = await res.blob();

        const ext = blob.type.includes("png")
          ? "png"
          : blob.type.includes("jpeg")
            ? "jpg"
            : blob.type.includes("jpg")
              ? "jpg"
              : "bin";

        folder?.file(`${id}.${ext}`, blob);
      });

      await Promise.all(tasks);

      const zipBlob = await zip.generateAsync({ type: "blob" });
      saveAs(zipBlob, `photos_${locationId}.zip`);
    } catch (err) {
      console.error(err);
      notify({ type: "error", text: "Не удалось скачать архив" });
    }
  };

  // =================== VIEWER HELPERS ===================

  const openViewerAt = (index: number) => {
    if (!items.length) return;
    setViewerIndex(index);
    setViewerOpen(true);
  };

  const closeViewer = () => {
    setViewerOpen(false);
  };

  const nextPhoto = () => {
    if (!items.length) return;
    setViewerIndex((i) => (i + 1) % items.length);
  };

  const prevPhoto = () => {
    if (!items.length) return;
    setViewerIndex((i) => (i - 1 + items.length) % items.length);
  };

  const current = items[viewerIndex];

  // =================== RENDER ===================

  return (
    <>
      {/* ОСНОВНАЯ МОДАЛКА СО СПИСКОМ */}
      <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-sm flex items-center justify-center p-4">
        <div
          className="
            w-full max-w-5xl max-h-[90vh]
            rounded-xl border border-border dark:border-dark-border
            bg-surface dark:bg-dark-surface shadow-card
            flex flex-col
          "
        >
          {/* HEADER */}
          <div className="flex items-center justify-between px-4 py-3 border-b border-border dark:border-dark-border">
            <div className="space-y-1">
              <h2 className="text-lg font-semibold">
                Фотографии площадки {locationName ?? ""}
              </h2>

              {canEdit && (
                <div className="flex gap-2 text-xs">
                  <button
                    className={`
                      px-3 py-1 rounded-lg
                      border text-xs
                      ${
                      mode === "active"
                        ? "bg-primary text-white border-primary"
                        : "bg-surface dark:bg-dark-surface border-border dark:border-dark-border"
                    }
                    `}
                    onClick={() => setMode("active")}
                  >
                    Активные
                  </button>
                  <button
                    className={`
                      px-3 py-1 rounded-lg
                      border text-xs
                      ${
                      mode === "deleted"
                        ? "bg-primary text-white border-primary"
                        : "bg-surface dark:bg-dark-surface border-border dark:border-dark-border"
                    }
                    `}
                    onClick={() => setMode("deleted")}
                  >
                    Удалённые
                  </button>
                </div>
              )}
            </div>

            <button
              onClick={close}
              className="p-2 rounded-lg hover:bg-hover dark:hover:bg-dark-hover"
            >
              <X className="w-5 h-5 opacity-70" />
            </button>
          </div>

          {/* TOP ACTION BAR */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 px-4 py-3 border-b border-border dark:border-dark-border">
            <div className="flex items-center gap-3">
              {canEdit && (
                <label className="inline-flex items-center gap-2 px-3 py-2 rounded-lg bg-primary text-white text-sm cursor-pointer hover:bg-primary-dark">
                  <Upload size={16} />
                  {uploading ? "Загрузка..." : "Добавить фото"}
                  <input
                    type="file"
                    accept="image/*"
                    multiple
                    className="hidden"
                    onChange={handleUpload}
                  />
                </label>
              )}

              {loading && (
                <span className="text-xs opacity-70">
                  Обновление списка…
                </span>
              )}
            </div>

            {isAnySelected && (
              <div className="flex flex-wrap gap-2 text-xs">
                {canEdit && (
                  <button
                    onClick={bulkDeleteOrRestore}
                    className={`flex items-center gap-1 px-3 py-2 rounded-lg text-white ${
                      mode === "active"
                        ? "bg-error hover:bg-error/80"
                        : "bg-success hover:bg-success/80"
                    }`}
                  >
                    {mode === "active" ? (
                      <>
                        <Trash2 size={14} /> Удалить выбранные
                      </>
                    ) : (
                      <>
                        <RotateCcw size={14} /> Восстановить выбранные
                      </>
                    )}
                  </button>
                )}

                <button
                  onClick={bulkDownload}
                  className="flex items-center gap-1 px-3 py-2 rounded-lg bg-hover dark:bg-dark-hover border border-border dark:border-dark-border"
                >
                  <Download size={14} /> Скачать выбранные
                </button>

                <button
                  onClick={downloadArchive}
                  className="flex items-center gap-1 px-3 py-2 rounded-lg bg-hover dark:bg-dark-hover border border-border dark:border-dark-border"
                >
                  <Download size={14} /> Скачать архив
                </button>
              </div>
            )}
          </div>

          {/* GRID */}
          <div className="flex-1 overflow-auto p-4">
            {loading && (
              <div className="w-full h-full flex items-center justify-center opacity-70 text-sm">
                Загрузка фотографий…
              </div>
            )}

            {!loading && items.length === 0 && (
              <div className="w-full h-full flex items-center justify-center opacity-70 text-sm">
                Нет фотографий
              </div>
            )}

            {!loading && items.length > 0 && (
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
                {items.map((photo, idx) => {
                  const checked = selected.includes(photo.id);
                  return (
                    <div
                      key={photo.id}
                      className={`
                        relative group rounded-xl overflow-hidden border
                        border-border dark:border-dark-border
                        bg-background dark:bg-dark-bg
                        cursor-pointer
                        focus:outline-none focus:ring-2 focus:ring-primary
                        flex flex-col
                      `}
                      onClick={() => openViewerAt(idx)}
                    >
                      <div className="w-full aspect-video bg-black flex items-center justify-center">
                        <img
                          src={`/api/photos/${photo.id}/file`}
                          alt={`photo ${photo.id}`}
                          className="max-w-full max-h-full object-contain"
                          loading="lazy"
                        />
                      </div>

                      {/* checkbox — отдельный клик, не открывает viewer */}
                      <div
                        className="absolute top-2 left-2"
                        onClick={(e) => {
                          e.stopPropagation();
                          toggleSelect(photo.id);
                        }}
                      >
                        <input
                          type="checkbox"
                          checked={checked}
                          readOnly
                          className="
                            w-4 h-4 rounded border-border dark:border-dark-border
                            text-primary
                          "
                        />
                      </div>

                      {/* footer */}
                      <div className="absolute bottom-0 inset-x-0 bg-black/50 text-[10px] text-white px-2 py-1 flex items-center justify-between">
                        <span>ID: {photo.id}</span>
                        <span className="opacity-70">
                          {new Date(photo.created_at).toLocaleString()}
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* ПОЛНОЭКРАННЫЙ ПРОСМОТРЩИК */}
      {viewerOpen && current && (
        <div className="fixed inset-0 z-[60] bg-black/90 flex flex-col">
          <div className="flex items-center justify-between px-4 py-3 text-white text-sm">
            <div>
              Фото {viewerIndex + 1} из {items.length} · ID: {current.id}
            </div>
            <button
              onClick={closeViewer}
              className="p-2 rounded-lg hover:bg-white/10"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          <div className="flex-1 flex items-center justify-center relative">
            {/* стрелка влево */}
            <button
              onClick={prevPhoto}
              className="absolute left-4 top-1/2 -translate-y-1/2 p-3 rounded-full bg-white/10 text-white hover:bg-white/20"
            >
              <ChevronLeft className="w-6 h-6" />
            </button>

            <img
              src={`/api/photos/${current.id}/file`}
              alt={`photo ${current.id}`}
              className="max-w-[90vw] max-h-[80vh] object-contain"
            />

            {/* стрелка вправо */}
            <button
              onClick={nextPhoto}
              className="absolute right-4 top-1/2 -translate-y-1/2 p-3 rounded-full bg-white/10 text-white hover:bg-white/20"
            >
              <ChevronRight className="w-6 h-6" />
            </button>
          </div>
        </div>
      )}
    </>
  );
}