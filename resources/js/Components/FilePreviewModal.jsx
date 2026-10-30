import { useEffect, useRef, useState } from "react";

// Penampil file di dalam web (tanpa unduh) untuk PDF, DOCX, dan XLSX.
// Props: { open, onClose, file: { nama_file, path_file } }
//  - PDF  → viewer bawaan browser (iframe).
//  - DOCX → docx-preview, dirender ke HTML di browser.
//  - XLSX → SheetJS, tiap sheet ditampilkan sebagai tabel.
// Library DOCX/XLSX di-import dinamis supaya tidak membebani bundle halaman.

const extOf = (name) => (name ?? "").split(".").pop().toLowerCase();

export default function FilePreviewModal({ open, onClose, file }) {
    const docxRef = useRef(null);
    const [loading, setLoading] = useState(false);
    const [error, setError]     = useState(null);
    const [sheets, setSheets]   = useState([]); // [{ name, html }]
    const [sheetIdx, setSheetIdx] = useState(0);

    const url = file?.path_file ? encodeURI(`/${file.path_file}`) : null;
    const ext = extOf(file?.path_file || file?.nama_file);

    useEffect(() => {
        if (!open) return;
        // Capture di window + stopPropagation → Esc hanya menutup penampil ini,
        // bukan Modal di belakangnya (yang mendengarkan keydown di document).
        const onKey = (e) => {
            if (e.key !== "Escape") return;
            e.stopPropagation();
            onClose?.();
        };
        const prevOverflow = document.body.style.overflow;
        window.addEventListener("keydown", onKey, true);
        document.body.style.overflow = "hidden";
        return () => {
            window.removeEventListener("keydown", onKey, true);
            document.body.style.overflow = prevOverflow;
        };
    }, [open, onClose]);

    useEffect(() => {
        if (!open || !url || ext === "pdf") return;
        let cancelled = false;
        setLoading(true);
        setError(null);
        setSheets([]);
        setSheetIdx(0);

        (async () => {
            try {
                const res = await fetch(url);
                if (!res.ok) throw new Error("File tidak ditemukan.");
                const buf = await res.arrayBuffer();
                if (cancelled) return;

                if (ext === "docx") {
                    const { renderAsync } = await import("docx-preview");
                    if (cancelled || !docxRef.current) return;
                    docxRef.current.innerHTML = "";
                    await renderAsync(buf, docxRef.current, undefined, {
                        className: "docx",
                        inWrapper: true,
                        ignoreLastRenderedPageBreak: true,
                    });
                } else if (ext === "xlsx") {
                    const XLSX = await import("xlsx");
                    const wb = XLSX.read(buf, { type: "array" });
                    const list = wb.SheetNames.map((name) => ({
                        name,
                        html: XLSX.utils.sheet_to_html(wb.Sheets[name], { header: "", footer: "" }),
                    }));
                    if (!cancelled) setSheets(list);
                } else {
                    throw new Error("Format file ini belum bisa ditampilkan. Silakan unduh file.");
                }
                if (!cancelled) setLoading(false);
            } catch (e) {
                if (!cancelled) { setError(e.message || "Gagal memuat file."); setLoading(false); }
            }
        })();

        return () => { cancelled = true; };
    }, [open, url, ext]);

    if (!open || !file) return null;

    return (
        <div className="fixed inset-0 z-[60] flex flex-col bg-white">
            {/* Toolbar */}
            <div className="shrink-0 flex items-center gap-3 px-4 py-3 border-b border-slate-200 bg-white">
                <span className="shrink-0 px-2 py-0.5 rounded-md bg-slate-700 text-white text-[11px] font-bold uppercase">{ext}</span>
                <h3 className="text-sm font-semibold text-slate-800 truncate flex-1 min-w-0" title={file.nama_file}>
                    {file.nama_file}
                </h3>
                <a href={url} download={file.nama_file}
                    className="shrink-0 inline-flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium rounded-lg bg-emerald-600 text-white hover:bg-emerald-700 transition">
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                    </svg>
                    Unduh
                </a>
                <button type="button" onClick={onClose} aria-label="Tutup"
                    className="w-8 h-8 inline-flex items-center justify-center rounded-lg text-slate-500 hover:bg-slate-100 transition shrink-0">
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                    </svg>
                </button>
            </div>

            {/* Tab sheet (XLSX) */}
            {ext === "xlsx" && sheets.length > 1 && (
                <div className="shrink-0 flex gap-1 px-4 py-2 border-b border-slate-200 bg-slate-50 overflow-x-auto">
                    {sheets.map((s, i) => (
                        <button key={s.name} type="button" onClick={() => setSheetIdx(i)}
                            className={`px-3 py-1 text-xs font-semibold rounded-md whitespace-nowrap transition ${
                                i === sheetIdx ? "bg-emerald-600 text-white" : "text-slate-600 hover:bg-slate-200"
                            }`}>
                            {s.name}
                        </button>
                    ))}
                </div>
            )}

            {/* Konten */}
            <div className="flex-1 min-h-0 overflow-auto bg-slate-100 relative">
                {loading && <p className="text-sm text-slate-400 text-center py-12">Memuat file...</p>}
                {error && <p className="text-sm text-red-500 text-center py-12">{error}</p>}

                {ext === "pdf" && (
                    <iframe src={url} title={file.nama_file} className="w-full h-full border-0" />
                )}

                {ext === "docx" && (
                    <div ref={docxRef} className={`docx-preview-host ${loading || error ? "hidden" : ""}`} />
                )}

                {ext === "xlsx" && !loading && !error && sheets[sheetIdx] && (
                    <div className="p-4">
                        <div className="xlsx-preview inline-block bg-white shadow-sm rounded-lg overflow-auto max-w-full"
                            dangerouslySetInnerHTML={{ __html: sheets[sheetIdx].html }} />
                    </div>
                )}
            </div>
        </div>
    );
}
