"use client";

type SheetPickerProps = {
  fileName: string;
  sheets: string[];
  onCancel: () => void;
  onConfirm: (sheet: string) => void;
};

export function SheetPicker({ fileName, sheets, onCancel, onConfirm }: SheetPickerProps) {
  const defaultSheet = sheets[0] ?? "";

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 p-4">
      <div className="w-full max-w-md rounded-2xl border border-slate-200 bg-white p-6 shadow-xl">
        <div className="text-sm font-semibold text-slate-900">Choose worksheet</div>
        <p className="mt-2 text-sm text-slate-600">
          <span className="font-medium text-slate-900">{fileName}</span> has {sheets.length} sheets. Which one
          contains your product catalog?
        </p>
        <form
          className="mt-4 space-y-4"
          onSubmit={(e) => {
            e.preventDefault();
            const fd = new FormData(e.currentTarget);
            const sheet = String(fd.get("sheet") ?? defaultSheet);
            onConfirm(sheet);
          }}
        >
          <select
            name="sheet"
            defaultValue={defaultSheet}
            className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 outline-none focus:ring-2 focus:ring-teal-600/30"
          >
            {sheets.map((s) => (
              <option key={s} value={s}>
                {s}
              </option>
            ))}
          </select>
          <div className="flex flex-wrap justify-end gap-2">
            <button
              type="button"
              onClick={onCancel}
              className="rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-900 hover:bg-slate-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="rounded-xl bg-teal-600 px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-teal-700"
            >
              Process sheet
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
