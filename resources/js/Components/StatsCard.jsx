// StatsCard: kartu metrik untuk dashboard.
// Props: { title, value, subtitle?, color?: 'blue'|'green'|'amber'|'red'|'violet', icon?, trend? }
import React from 'react';

const VARIANTS = {
    blue:   { gradient: 'from-blue-500 to-indigo-500',     text: 'text-blue-600',    bg: 'bg-blue-50' },
    green:  { gradient: 'from-emerald-500 to-green-500',   text: 'text-emerald-600', bg: 'bg-emerald-50' },
    amber:  { gradient: 'from-amber-500 to-orange-500',    text: 'text-amber-600',   bg: 'bg-amber-50' },
    red:    { gradient: 'from-rose-500 to-red-500',        text: 'text-red-600',     bg: 'bg-red-50' },
    violet: { gradient: 'from-violet-500 to-purple-500',   text: 'text-violet-600',  bg: 'bg-violet-50' },
};

export default function StatsCard({ title, value, subtitle, color = 'blue', icon, trend }) {
    const v = VARIANTS[color] || VARIANTS.blue;

    return (
        <div className="relative bg-white rounded-2xl p-5 shadow-[var(--shadow-card)] hover:shadow-[var(--shadow-card-hover)] transition overflow-hidden group">
            <div className={`absolute top-0 left-0 right-0 h-1 bg-gradient-to-r ${v.gradient}`} />
            <div className="flex items-start justify-between">
                <div>
                    <div className="text-xs uppercase tracking-wider text-slate-500 font-medium">{title}</div>
                    <div className={`mt-2 text-3xl font-bold bg-gradient-to-r ${v.gradient} bg-clip-text text-transparent`}>
                        {value}
                    </div>
                    {subtitle && <div className="mt-1 text-xs text-slate-500">{subtitle}</div>}
                </div>
                {icon && (
                    <div className={`w-10 h-10 rounded-xl ${v.bg} ${v.text} flex items-center justify-center`}>
                        {icon}
                    </div>
                )}
            </div>
            {trend && (
                <div
                    className={`mt-3 inline-flex items-center gap-1 text-xs font-medium ${
                        trend.direction === 'up' ? 'text-emerald-600' : 'text-red-600'
                    }`}
                >
                    <span>{trend.direction === 'up' ? '▲' : '▼'}</span>
                    <span>{trend.value}</span>
                </div>
            )}
        </div>
    );
}
