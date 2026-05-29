# Database Schema Reference

Dokumen ini berisi referensi lengkap struktur tabel database proyek ADAPT Program.

---

## soal_modul

Menyimpan soal untuk Pre-Test dan Post-Test per modul pembelajaran.

| Kolom      | Tipe    | Keterangan                          |
|------------|---------|-------------------------------------|
| id         | bigint  | Primary key, auto increment         |
| modul_id   | bigint  | FK → modul.id                       |
| soal       | text    | Teks soal/pertanyaan                |
| tipe       | varchar | Nilai: `pre` atau `post`            |
| created_at | timestamp |                                   |
| updated_at | timestamp |                                   |

**Relasi:**
- `soal_modul.modul_id` → `modul.id`
- `soal_modul` hasMany `jawaban_modul` (via `jawaban_modul.soal_id`)

---

## jawaban_modul

Menyimpan pilihan jawaban (A–D) untuk setiap soal. Satu soal memiliki tepat 4 jawaban.

| Kolom      | Tipe      | Keterangan                                  |
|------------|-----------|---------------------------------------------|
| id         | bigint    | Primary key, auto increment                 |
| soal_id    | bigint    | FK → soal_modul.id                          |
| jawaban    | text      | Teks pilihan jawaban                        |
| is_benar   | tinyint   | `1` = jawaban benar, `0` = jawaban salah    |
| created_at | timestamp |                                             |
| updated_at | timestamp |                                             |

**Catatan:** Setiap soal harus memiliki tepat 1 jawaban dengan `is_benar = 1`.

---

## modul

Tabel master modul pembelajaran.

| Kolom          | Tipe      | Keterangan                    |
|----------------|-----------|-------------------------------|
| id             | bigint    | Primary key, auto increment   |
| kode_modul     | varchar   | Kode unik modul               |
| nama_modul     | varchar   | Nama modul                    |
| fase           | varchar   | Fase pembelajaran             |
| tag_kompetensi | varchar   | Tag kompetensi (nullable)     |
| file_materi    | varchar   | Nama file PDF materi          |
| created_at     | timestamp |                               |
| updated_at     | timestamp |                               |

---

## modul_test_results

Menyimpan hasil pengerjaan Pre-Test / Post-Test oleh user.

| Kolom        | Tipe      | Keterangan                              |
|--------------|-----------|-----------------------------------------|
| id           | bigint    | Primary key, auto increment             |
| user_id      | bigint    | FK → users.id                           |
| modul_id     | bigint    | FK → modul.id                           |
| tipe         | varchar   | `pre` atau `post`                       |
| score        | decimal   | Nilai hasil test (0–100)                |
| is_completed | tinyint   | `1` = sudah selesai                     |
| created_at   | timestamp |                                         |
| updated_at   | timestamp |                                         |

---

## modul_user_answers

Menyimpan jawaban per soal dari setiap pengerjaan test.

| Kolom           | Tipe    | Keterangan                              |
|-----------------|---------|-----------------------------------------|
| id              | bigint  | Primary key, auto increment             |
| result_id       | bigint  | FK → modul_test_results.id              |
| soal_modul_id   | bigint  | FK → soal_modul.id                      |
| jawaban_modul_id| bigint  | FK → jawaban_modul.id (jawaban dipilih) |
| is_correct      | tinyint | `1` = jawaban benar                     |
| created_at      | timestamp |                                       |
| updated_at      | timestamp |                                       |

---

## pertanyaan

Soal untuk feedback OJT mingguan (Kader dan Mentor). Berbeda dari soal Pre/Post Test.

| Kolom            | Tipe      | Keterangan                              |
|------------------|-----------|-----------------------------------------|
| id_pertanyaan    | bigint    | Primary key, auto increment             |
| nama_pertanyaan  | text      | Teks pertanyaan                         |
| type             | varchar   | `Kader` atau `Mentor`                   |
| status           | varchar   | `Aktif` atau `Tidak Aktif`              |
| created_at       | timestamp |                                         |
| created_by       | bigint    | FK → users.id                           |
| updated_at       | timestamp |                                         |
| updated_by       | bigint    | FK → users.id (nullable)                |

---

## penilaian_ojt

Master Penilaian OJT per (Kader, FMC). DDL ada di `database/sql/penilaian_ojt.sql`.
Struktur indikator hardcoded di `app/Constants/PenilaianOjtStructure.php` (4 aspek OJT, 5 aspek Value, 3 section Presentation). Test (CHC MAI) dihapus per arahan stakeholder.

| Kolom                | Tipe         | Keterangan                                                          |
|----------------------|--------------|---------------------------------------------------------------------|
| id_penilaian_ojt     | char(36)     | Primary key (UUID)                                                  |
| kader_id             | char(36)     | FK → kader.id (ON DELETE CASCADE)                                   |
| fmc_number           | tinyint      | 1, 2, atau 3                                                        |
| ojt_score            | decimal(5,2) | Cached: AVG OJT grand                                               |
| value_score          | decimal(5,2) | Cached: AVG Value grand                                             |
| presentation_score   | decimal(5,2) | Cached: AVG Presentation grand                                      |
| final_score          | decimal(5,2) | Cached: (ojt*0.3)+(value*0.3)+(presentation*0.4), normalized        |
| overview             | text         | Final Report: overview (opsional)                                   |
| strengths            | text         | Final Report: kekuatan Kader                                        |
| weakness             | text         | Final Report: kelemahan Kader                                       |
| mentor_comments      | text         | Final Report: komentar keseluruhan Mentor                           |
| final_recommendation | varchar(20)  | `recommended` / `not_recommended` / NULL                            |
| created_by           | char(36)     | FK → users.id (mentor)                                              |
| created_at           | timestamp    |                                                                     |
| updated_at           | timestamp    |                                                                     |

**Unique key:** `(kader_id, fmc_number)` — memastikan upsert per FMC.

---

## penilaian_ojt_skor

Detail skor per indikator. Item_code mengikuti struktur hardcoded.

| Kolom            | Tipe        | Keterangan                                                            |
|------------------|-------------|-----------------------------------------------------------------------|
| id               | bigint      | Primary key, auto increment                                           |
| id_penilaian_ojt | char(36)    | FK → penilaian_ojt.id_penilaian_ojt (ON DELETE CASCADE)               |
| sheet            | varchar(20) | `ojt` / `value` / `presentation`                                      |
| item_code        | varchar(60) | Format: `ojt.{no}.{sub_code}.{ind_no}`, `value.{no}.{ind_no}`, `pres.{section}.{ind_no}` |
| skor             | tinyint     | 0–100, NULL = belum dinilai                                           |

**Unique key:** `(id_penilaian_ojt, item_code)` — satu skor per indikator.

---

## penilaian_ojt_komentar

Komentar Mentor per sub-aspek (level paling granular: a/b/c untuk OJT; per aspek untuk Value; per section untuk Presentation).

| Kolom            | Tipe        | Keterangan                                                |
|------------------|-------------|-----------------------------------------------------------|
| id               | bigint      | Primary key, auto increment                               |
| id_penilaian_ojt | char(36)    | FK → penilaian_ojt.id_penilaian_ojt (ON DELETE CASCADE)   |
| sheet            | varchar(20) | `ojt` / `value` / `presentation`                          |
| sub_code         | varchar(60) | Format: `ojt.{no}.{sub_code}`, `value.{no}`, `pres.{section}` |
| komentar         | text        | Teks komentar Mentor (nullable)                           |

**Unique key:** `(id_penilaian_ojt, sub_code)` — satu komentar per sub-aspek.

**Rumus skor:**
- Skor Aspek OJT (no 1-4) = AVG semua indikator di sub-aspek (a + b + c) untuk aspek tsb
- OJT Grand = AVG dari 4 aspek scores
- Value Grand = AVG dari 5 aspek scores (tiap aspek = AVG 5 indikator)
- Presentation Grand = AVG dari 3 section scores (tiap section = AVG 5 indikator)
- Final Score = `(OJT * 0.30) + (Value * 0.30) + (Presentation * 0.40)`, dinormalisasi bila ada sheet kosong

**Otorisasi:**
- Write (POST): hanya Mentor pembimbing kader (cek `list_kader_per_mentor`)
- Read (GET via Inertia props): Mentor + Admin021 (read-only untuk Admin021)

---

## dokumen

Menyimpan semua dokumen yang diupload (Post Activity, Form IDP, dll). Satu tabel dipakai berbagai jenis dokumen, dibedakan kolom `jenis`. Collation: `utf8mb4_general_ci`.

| Kolom            | Tipe                                                                   | Keterangan                                                        |
|------------------|------------------------------------------------------------------------|-------------------------------------------------------------------|
| id               | int(11)                                                                | Primary key, auto increment                                       |
| kader_id         | char(36)                                                               | FK → users.id (uploader Kader), nullable                          |
| mentor_id        | char(36)                                                               | FK → users.id (uploader Mentor), nullable                         |
| nama_file        | varchar(255)                                                           | Nama asli file                                                    |
| path_file        | varchar(255)                                                           | Path relatif file di `public/`                                    |
| tipe             | enum('kader','mentor')                                                 | Tipe uploader                                                     |
| status           | enum('pending','approved','rejected')                                  | Status approval, default `pending`                               |
| approved_by      | char(36)                                                               | FK → users.id (Admin MAI yang approve), nullable                  |
| approved_at      | timestamp                                                              | Waktu approve, nullable                                           |
| rejection_reason | text                                                                   | Alasan penolakan, nullable                                        |
| created_at       | timestamp                                                              | default `current_timestamp()`                                     |
| updated_at       | timestamp                                                              | `on update current_timestamp()`                                   |
| jenis            | enum('OJT_REPORT','POST_ACTIVITY','FORM_IDP','PERJANJIAN_KERJA','REFLEKSI') | Jenis dokumen, nullable                                      |
| modul_id         | int(11)                                                                | FK → modul.id (untuk POST_ACTIVITY), nullable                     |
| id_batch         | int(11)                                                                | FK → batch.id_batch (untuk FORM_IDP), nullable                    |

**Catatan jenis `FORM_IDP`:**
- Diupload oleh Kader, satu kali per batch (`tipe='kader'`, `kader_id=users.id`, `id_batch` diisi dari `kader.id_batch`).
- Memerlukan approval Admin MAI (company_code `021`).
- Unique key `uniq_idp_per_batch (kader_id, jenis, id_batch)` mencegah duplikat IDP per batch. Baris jenis lain berisi `id_batch` NULL sehingga tidak terpengaruh.
- DDL perubahan ada di `database/sql/dokumen_form_idp.sql`.
