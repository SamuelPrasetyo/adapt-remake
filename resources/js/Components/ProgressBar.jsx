// ProgressBar: bar progress dengan label.
// Props: { label, value, max?=100, color?, showPercent?=true, suffix? }
import React from 'react';

const COLORS = {
    blue:    'bg-blue-500',
    green:   'bg-emerald-500',
    amber:   'bg-amber-500',
    red:     'bg-red-500',
    cyan:    'bg-cyan-500',
    slate:   'bg-slate-500',
    violet:  'bg-violet-500',
};

export default function ProgressBar({
    label,
    value,
    max = 100,
    color = 'blue',
    showPercent = true,
    suffix,
}) {
    const pct = max > 0 ? Math.min(100, Math.round((value / max) * 100)) : 0;
    const display = suffix ?? (showPercent ? `${pct}%` : `${value}/${max}`);

    return (
        <div>
            <div className="flex items-center justify-between text-sm mb-1.5">
                <span className="text-slate-900 font-medium">{label}</span>
                <span className="text-slate-500 tabular-nums">{display}</span>
            </div>
            <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
                <div
                    className={`h-full ${COLORS[color] || COLORS.blue} rounded-full transition-all duration-500`}
                    style={{ width: `${pct}%` }}
                />
            </div>
        </div>
    );
}
