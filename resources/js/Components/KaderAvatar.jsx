import { useState } from 'react';
import ImageLightbox from '@/Components/ImageLightbox';

const isUrl = (v) => typeof v === 'string' && /^https?:\/\//i.test(v);

/**
 * Avatar kader: foto kandidat Career MAI bila kader sudah ditautkan (kader.nik_ktp),
 * selain itu avatar inisial berwarna.
 *
 * Fallback ke inisial juga terjadi saat gambar GAGAL dimuat — sebagian berkas record
 * lama tidak ada lagi di server portal, dan tanpa ini akan tampil ikon broken image.
 *
 * @param {string}  src           URL foto (nilai non-URL diabaikan → inisial)
 * @param {string}  initials      inisial nama, mis. "AD"
 * @param {string}  className     ukuran & bentuk, mis. "w-9 h-9 rounded-full"
 * @param {string}  fallbackClass kelas latar avatar inisial (gradien warna)
 * @param {string}  alt           teks alternatif (nama kader)
 * @param {boolean} zoomable      klik untuk lihat foto penuh. JANGAN aktifkan bila avatar
 *                                berada di dalam <Link>/baris yang bisa diklik — tombol
 *                                bersarang dalam <a> tidak valid dan kliknya akan bentrok
 *                                dengan navigasi.
 */
export default function KaderAvatar({
    src,
    initials,
    className = '',
    fallbackClass = '',
    alt = '',
    zoomable = false,
}) {
    const [failed, setFailed] = useState(false);
    const [zoom, setZoom] = useState(false);

    if (isUrl(src) && !failed) {
        const img = (
            <img
                src={src}
                alt={alt || initials}
                title={zoomable ? 'Lihat foto ukuran penuh' : (alt || undefined)}
                onError={() => setFailed(true)}
                className={`${className} object-cover bg-slate-100 shrink-0 ${zoomable ? 'cursor-zoom-in hover:brightness-95 transition' : ''}`}
            />
        );

        if (!zoomable) return img;

        return (
            <>
                <button type="button" onClick={() => setZoom(true)} aria-label="Lihat foto ukuran penuh"
                    className="block shrink-0 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2">
                    {img}
                </button>
                {zoom && <ImageLightbox src={src} alt={alt || initials} onClose={() => setZoom(false)} />}
            </>
        );
    }

    // Avatar inisial tidak pernah bisa dizoom — tidak ada yang perlu diperbesar.
    return (
        <div className={`${className} ${fallbackClass} flex items-center justify-center font-bold text-white shrink-0`}>
            {initials || '?'}
        </div>
    );
}
