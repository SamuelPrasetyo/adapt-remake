export const FASE_LABELS = {
    '1': 'Foundation',
    '2': 'Self Learning',
    '3': 'Monthly Training',
    '4': 'Administration',
};

export function getFaseLabel(fase) {
    const key = String(fase).replace(/^Fase\s+/i, '');
    return FASE_LABELS[key] ?? `Fase ${key}`;
}

export function getFaseNum(fase) {
    const m = String(fase).match(/\d+/);
    return m ? m[0] : String(fase);
}
