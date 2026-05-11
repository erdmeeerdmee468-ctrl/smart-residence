"use client";

import { Bell, X } from "lucide-react";

type Announcement = {
  id: string;
  title: string;
  content: string;
  type: string;
  imageUrl?: string | null;
  createdAt: string;
};

export function NotificationsModal({
  open,
  announcements,
  onClose,
  title = "Мэдэгдэл",
}: {
  open: boolean;
  announcements: Announcement[];
  onClose: () => void;
  title?: string;
}) {
  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[85] grid place-items-end bg-slate-900/45 p-0 backdrop-blur-sm sm:place-items-center sm:p-4">
      <div className="flex max-h-[92vh] w-full max-w-lg flex-col overflow-hidden rounded-t-2xl border border-gray-200 bg-white shadow-2xl dark:border-slate-600 dark:bg-slate-900 sm:rounded-2xl">
        <div className="flex items-center justify-between border-b border-gray-100 px-4 py-3 dark:border-slate-800">
          <div className="flex items-center gap-2">
            <span className="grid h-9 w-9 place-items-center rounded-xl bg-emerald-50 text-emerald-600 dark:bg-emerald-950/50 dark:text-emerald-300">
              <Bell size={18} />
            </span>
            <div>
              <p className="text-sm font-black text-gray-900 dark:text-slate-50">{title}</p>
              <p className="text-[11px] font-medium text-gray-400 dark:text-slate-500">
                {announcements.length > 0 ? `${announcements.length} мэдэгдэл` : "Мэдэгдэл алга"}
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg p-2 text-gray-500 transition hover:bg-gray-100 dark:text-slate-400 dark:hover:bg-slate-800"
            aria-label="Хаах"
          >
            <X size={18} />
          </button>
        </div>

        <div className="min-h-0 flex-1 overflow-y-auto bg-white dark:bg-slate-900">
          {announcements.length === 0 ? (
            <div className="px-5 py-10 text-center text-sm text-gray-400 dark:text-slate-500">
              Одоогоор мэдэгдэл байхгүй байна.
            </div>
          ) : (
            <div className="divide-y divide-gray-50 dark:divide-slate-800">
              {announcements.map((a) => (
                <div key={a.id} className="px-5 py-4">
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <p className="truncate text-sm font-black text-gray-900 dark:text-slate-100">{a.title}</p>
                      <p className="mt-1 text-[11px] font-semibold text-gray-400 dark:text-slate-500">
                        {new Date(a.createdAt).toLocaleDateString("mn-MN")}
                        {a.type ? ` · ${a.type}` : ""}
                      </p>
                    </div>
                  </div>
                  <p className="mt-2 whitespace-pre-wrap break-words text-sm leading-6 text-gray-600 dark:text-slate-300">
                    {a.content}
                  </p>
                  {a.imageUrl ? <img src={a.imageUrl} alt="" className="mt-3 h-44 w-full rounded-xl object-cover" /> : null}
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="flex justify-end gap-2 border-t border-gray-100 p-4 dark:border-slate-800">
          <button
            type="button"
            onClick={onClose}
            className="rounded-xl border border-gray-200 px-5 py-2.5 text-sm font-bold text-gray-600 transition hover:bg-gray-50 dark:border-slate-600 dark:text-slate-300 dark:hover:bg-slate-800"
          >
            Хаах
          </button>
        </div>
      </div>
    </div>
  );
}
