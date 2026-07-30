// Mengingat kondisi sebuah halaman daftar — posisi scroll, halaman pagination, filter —
// saat pengguna membuka salah satu barisnya, lalu mengembalikannya ketika pengguna
// menekan tombol "Kembali ke ..." di halaman detail.
//
// Kenapa tidak history.back()? Halaman detail menulis window.location.hash saat tab
// berpindah, dan itu menambah entri history — jadi satu langkah "back" belum tentu
// kembali ke daftar.
//
// Kondisi hanya dipulihkan bila tombol kembali yang menandainya (markReturning), supaya
// membuka menu daftar dari sidebar tetap mulai dari kondisi awal. Penanda & datanya
// dibersihkan begitu dibaca, jadi sekali pakai.
//
// Catatan: consume() mengubah sessionStorage, jadi panggil sekali saja per kunjungan —
// lewat lazy initializer useState atau useEffect mount, bukan langsung di body render.

/**
 * @param  {string} namespace  pembeda antar daftar, mis. "kaderSaya" / "allMentor".
 * @return {{ remember: (state: object) => void, markReturning: () => void, consume: () => object|null }}
 */
export function createListState(namespace) {
    const STATE_KEY = `${namespace}:listState`;
    const BACK_KEY  = `${namespace}:returning`;

    const store = () => (typeof window === "undefined" ? null : window.sessionStorage);

    return {
        /** Dipanggil saat sebuah baris/kartu daftar diklik. */
        remember(state) {
            const s = store();
            if (!s) return;

            try {
                // search = query URL halaman daftar, dipakai memverifikasi saat dipulihkan.
                s.setItem(STATE_KEY, JSON.stringify({ ...state, search: window.location.search }));
            } catch {
                // sessionStorage penuh atau diblokir — fitur ini sekadar kenyamanan.
            }
        },

        /** Dipanggil tombol kembali di halaman detail, sebelum berpindah halaman. */
        markReturning() {
            const s = store();
            if (!s) return;

            try {
                s.setItem(BACK_KEY, "1");
            } catch {
                // idem
            }
        },

        /** Kondisi tersimpan bila memang baru kembali dari detail; null bila tidak ada. */
        consume() {
            const s = store();
            if (!s) return null;

            let raw = null;
            try {
                if (s.getItem(BACK_KEY)) raw = s.getItem(STATE_KEY);
                s.removeItem(BACK_KEY);
                s.removeItem(STATE_KEY);
            } catch {
                return null;
            }

            if (!raw) return null;

            try {
                const saved = JSON.parse(raw);
                // Query URL berbeda = isi daftarnya berbeda, kondisi lama tidak lagi bermakna.
                return saved.search === window.location.search ? saved : null;
            } catch {
                return null;   // data rusak, mulai dari kondisi awal.
            }
        },
    };
}
