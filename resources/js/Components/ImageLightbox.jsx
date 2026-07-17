import { useEffect } from 'react';
import { createPortal } from 'react-dom';

/**
 * Penampil gambar ukuran penuh. Dipasang lewat portal ke <body> agar tidak terpotong
 * oleh kartu ber-overflow-hidden. Menutup lewat Esc, klik latar, atau tombol ✕.
 */
export default function ImageLightbox({ src, alt = '', onClose }) {
    useEffect(() => {
        const onKey = (e) => { if (e.key === 'Escape') onClose(); };
        document.addEventListener('keydown', onKey);
        // Kunci scroll latar selama gambar terbuka.
        const prevOverflow = document.body.style.overflow;
        document.body.style.overflow = 'hidden';
        return () => {
            document.removeEventListener('keydown', onKey);
            document.body.style.overflow = prevOverflow;
        };
    }, [onClose]);

    return createPortal(
        <div role="dialog" aria-modal="true" aria-label={alt ? `Foto ${alt}` : 'Foto'} onClick={onClose}
            className="fixed inset-0 z-[90] flex items-center justify-center bg-slate-900/85 p-4 sm:p-8">
            {/* stopPropagation: klik pada gambar tidak ikut menutup */}
            <img src={src} alt={alt} onClick={(e) => e.stopPropagation()}
                className="max-w-full max-h-full object-contain rounded-xl shadow-2xl" />
            <button type="button" onClick={onClose} aria-label="Tutup foto"
                className="absolute top-4 right-4 inline-flex items-center justify-center w-10 h-10 rounded-full bg-white/10 text-white hover:bg-white/20 transition">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                </svg>
            </button>
        </div>,
        document.body
    );
}
