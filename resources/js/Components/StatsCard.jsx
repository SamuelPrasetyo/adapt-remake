// StatsCard: kartu metrik untuk dashboard.
// Props: { title, value, subtitle?, color?: 'blue'|'green'|'amber'|'red'|'violet', icon?, trend?, onClick? }
// onClick membuat kartu bisa diklik (mis. membuka detail angkanya).
import React from 'react';

const VARIANTS = {
    blue:   { gradient: 'from-blue-500 to-indigo-500',     text: 'text-blue-600',    bg: 'bg-blue-50' },
    green:  { gradient: 'from-emerald-500 to-green-500',   text: 'text-emerald-600', bg: 'bg-emerald-50' },
    amber:  { gradient: 'from-amber-500 to-orange-500',    text: 'text-amber-600',   bg: 'bg-amber-50' },
    red:    { gradient: 'from-rose-500 to-red-500',        text: 'text-red-600',     bg: 'bg-red-50' },
    violet: { gradient: 'from-violet-500 to-purple-500',   text: 'text-violet-600',  bg: 'bg-violet-50' },
};

export default function StatsCard({ title, value, subtitle, color = 'blue', icon, trend, onClick }) {
    const v = VARIANTS[color] || VARIANTS.blue;
    const clickable = typeof onClick === 'function';

    return (
        <div
            className={`relative bg-white rounded-2xl p-5 shadow-[var(--shadow-card)] hover:shadow-[var(--shadow-card-hover)] transition overflow-hidden group ${
                clickable ? 'cursor-pointer text-left w-full hover:-translate-y-0.5 focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500/40' : ''
            }`}
            {...(clickable
                ? {
                      role: 'button',
                      tabIndex: 0,
                      onClick,
                      onKeyDown: (e) => {
                          if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); onClick(e); }
                      },
                  }
                : {})}
        >
            <div className={`absolute top-0 left-0 right-0 h-1 bg-gradient-to-r ${v.gradient}`} />
            {clickable && (
                <div
                    className={`absolute top-3.5 right-3.5 w-5 h-5 rounded-full ${v.bg} ${v.text} flex items-center justify-center transition group-hover:scale-110`}
                    aria-hidden="true"
                >
                    <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M9 5l7 7-7 7" />
                    </svg>
                </div>
            )}
            <div className="flex items-start justify-between">
                <div>
                    <div className="text-xs uppercase tracking-wider text-slate-500 font-medium">{title}</div>
                    <div className={`mt-2 text-3xl font-bold bg-gradient-to-r ${v.gradient} bg-clip-text text-transparent`}>
                        {value}
                    </div>
                    {subtitle && (
                        <div className="mt-1 text-xs text-slate-500 flex items-center gap-1">
                            {subtitle}
                            {clickable && (
                                <span className={`inline-flex items-center gap-0.5 font-medium ${v.text} opacity-0 group-hover:opacity-100 transition`}>
                                    · Lihat detail
                                    <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7" />
                                    </svg>
                                </span>
                            )}
                        </div>
                    )}
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
