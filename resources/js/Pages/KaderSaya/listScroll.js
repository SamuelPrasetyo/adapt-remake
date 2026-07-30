import { createListState } from "@/utils/listState";

// Posisi scroll daftar "Kader Saya" diingat saat sebuah kader dibuka, lalu dipulihkan
// ketika pengguna menekan "Kembali ke Daftar Kader". Daftarnya panjang (puluhan kartu),
// jadi tanpa ini pembaca selalu terlempar ke atas.
//
// Aturan kapan dipulihkan & alasan tidak memakai history.back() ada di utils/listState.
const state = createListState("kaderSaya");

/** Dipanggil saat kartu kader diklik — catat sampai mana daftar sudah di-scroll. */
export const rememberListScroll = () => state.remember({ y: window.scrollY });

/** Dipanggil tombol "Kembali ke Daftar Kader" sebelum berpindah halaman. */
export const markReturningToList = () => state.markReturning();

/** Pulihkan posisi scroll bila memang baru kembali dari halaman detail kader. */
export function restoreListScroll() {
    const saved = state.consume();
    if (!saved || typeof saved.y !== "number") return;

    window.scrollTo({ top: saved.y, behavior: "auto" });
}
