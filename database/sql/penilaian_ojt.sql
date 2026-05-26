-- =====================================================================
-- Fitur Penilaian OJT (On Job Training)
-- 3 tabel: penilaian_ojt (master), penilaian_ojt_skor, penilaian_ojt_komentar
-- Eksekusi manual via MySQL client (tidak via php artisan migrate)
-- Collation: utf8mb4_general_ci
-- =====================================================================

-- 1) MASTER: 1 record per (kader, fmc_number)
CREATE TABLE penilaian_ojt (
    id_penilaian_ojt CHAR(36) NOT NULL PRIMARY KEY,
    kader_id CHAR(36) NOT NULL,
    fmc_number TINYINT UNSIGNED NOT NULL COMMENT '1, 2, 3',

    ojt_score DECIMAL(5,2) NULL COMMENT 'Cached: AVG OJT grand score',
    value_score DECIMAL(5,2) NULL COMMENT 'Cached: AVG Value grand score',
    presentation_score DECIMAL(5,2) NULL COMMENT 'Cached: AVG Presentation grand score',
    final_score DECIMAL(5,2) NULL COMMENT 'Cached: (ojt*0.3)+(value*0.3)+(presentation*0.4)',

    overview TEXT NULL,
    strengths TEXT NULL,
    weakness TEXT NULL,
    mentor_comments TEXT NULL,
    final_recommendation VARCHAR(20) NULL COMMENT 'recommended | not_recommended | NULL',

    created_by CHAR(36) NULL COMMENT 'users.id (mentor)',
    created_at TIMESTAMP NULL,
    updated_at TIMESTAMP NULL,

    UNIQUE KEY uniq_kader_fmc (kader_id, fmc_number),
    INDEX idx_kader (kader_id),
    CONSTRAINT fk_po_kader FOREIGN KEY (kader_id) REFERENCES kader(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- 2) DETAIL SKOR per indikator
CREATE TABLE penilaian_ojt_skor (
    id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT PRIMARY KEY,
    id_penilaian_ojt CHAR(36) NOT NULL,
    sheet VARCHAR(20) NOT NULL COMMENT 'ojt | value | presentation',
    item_code VARCHAR(60) NOT NULL COMMENT 'e.g. ojt.1.a.1, value.1.3, pres.II.2',
    skor TINYINT UNSIGNED NULL COMMENT '0-100, NULL = belum dinilai',

    UNIQUE KEY uniq_item (id_penilaian_ojt, item_code),
    INDEX idx_penilaian_sheet (id_penilaian_ojt, sheet),
    CONSTRAINT fk_pos_penilaian FOREIGN KEY (id_penilaian_ojt) REFERENCES penilaian_ojt(id_penilaian_ojt) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- 3) KOMENTAR per sub-aspek
CREATE TABLE penilaian_ojt_komentar (
    id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT PRIMARY KEY,
    id_penilaian_ojt CHAR(36) NOT NULL,
    sheet VARCHAR(20) NOT NULL COMMENT 'ojt | value | presentation',
    sub_code VARCHAR(60) NOT NULL COMMENT 'e.g. ojt.1.a, value.1, pres.I',
    komentar TEXT NULL,

    UNIQUE KEY uniq_sub (id_penilaian_ojt, sub_code),
    INDEX idx_penilaian (id_penilaian_ojt),
    CONSTRAINT fk_pok_penilaian FOREIGN KEY (id_penilaian_ojt) REFERENCES penilaian_ojt(id_penilaian_ojt) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;
