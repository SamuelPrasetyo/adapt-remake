import { createListState } from "@/utils/listState";

// Kondisi tabel All Mentor — halaman pagination, tab filter status, dan kata pencarian —
// diingat saat salah satu mentor dibuka, lalu dipulihkan ketika pengguna menekan
// "Kembali ke All Mentor". Tanpa ini pembaca selalu kembali ke halaman 1.
//
// Aturan kapan dipulihkan & alasan tidak memakai history.back() ada di utils/listState.
const state = createListState("allMentor");

/** Dipanggil saat baris mentor diklik. @param {{page:number,q:string,filter:string}} view */
export const rememberMentorList = (view) => state.remember(view);

/** Dipanggil tombol "Kembali ke All Mentor" sebelum berpindah halaman. */
export const markReturningToMentorList = () => state.markReturning();

/** Kondisi tabel yang tersimpan bila baru kembali dari detail mentor; null bila tidak. */
export const consumeMentorList = () => state.consume();
