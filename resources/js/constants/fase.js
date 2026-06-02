export const FASE_LABELS = {
    '1': 'Foundation',
    '2': 'Sub Function Rotation',
    '3': 'Monthly Training (Leadership)',
    '4': 'Administrasi',
};

export function getFaseLabel(fase) {
    const key = String(fase).replace(/^Fase\s+/i, '');
    return FASE_LABELS[key] ?? `Fase ${key}`;
}

export function getFaseNum(fase) {
    const m = String(fase).match(/\d+/);
    return m ? m[0] : String(fase);
}
