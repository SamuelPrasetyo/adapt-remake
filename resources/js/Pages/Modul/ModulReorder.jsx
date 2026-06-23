import { useState } from 'react';
import { router } from '@inertiajs/react';
import {
    DndContext,
    closestCenter,
    PointerSensor,
    KeyboardSensor,
    useSensor,
    useSensors,
} from '@dnd-kit/core';
import {
    SortableContext,
    sortableKeyboardCoordinates,
    verticalListSortingStrategy,
    arrayMove,
    useSortable,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { FASE_LABELS } from '@/constants/fase';

// Satu baris modul yang bisa diseret (drag handle di kiri).
function SortableRow({ modul, index }) {
    const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: modul.id });
    const style = {
        transform: CSS.Transform.toString(transform),
        transition,
        opacity: isDragging ? 0.4 : 1,
        zIndex: isDragging ? 10 : undefined,
    };
    // Seluruh kartu jadi area drag (attributes/listeners di kontainer), bukan hanya ikon titik.
    return (
        <div ref={setNodeRef} style={style} {...attributes} {...listeners} title="Seret untuk mengurutkan"
            className="flex items-center gap-3 px-3 py-2.5 bg-white border border-slate-200 rounded-lg shadow-sm cursor-grab active:cursor-grabbing select-none touch-none hover:border-blue-300">
            <span className="text-slate-300 shrink-0">
                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                    <path d="M7 4a1 1 0 100 2 1 1 0 000-2zM7 9a1 1 0 100 2 1 1 0 000-2zM7 14a1 1 0 100 2 1 1 0 000-2zM13 4a1 1 0 100 2 1 1 0 000-2zM13 9a1 1 0 100 2 1 1 0 000-2zM13 14a1 1 0 100 2 1 1 0 000-2z" />
                </svg>
            </span>
            <span className="w-7 h-7 rounded-lg bg-blue-100 text-blue-700 flex items-center justify-center text-xs font-bold shrink-0">
                {index + 1}
            </span>
            <span className="text-xs font-mono text-slate-500 w-20 shrink-0 truncate">{modul.kode_modul}</span>
            <span className="text-sm text-slate-800 flex-1 min-w-0 truncate">{modul.nama_modul}</span>
        </div>
    );
}

// Satu fase = satu konteks drag-drop terpisah; urutan disimpan otomatis tiap selesai seret.
function FaseGroup({ fase, items: initialItems }) {
    const [items, setItems] = useState(initialItems);
    const [status, setStatus] = useState('idle'); // idle | saving | saved
    const sensors = useSensors(
        useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
        useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }),
    );

    const onDragEnd = ({ active, over }) => {
        if (!over || active.id === over.id) return;
        const oldIndex = items.findIndex((i) => i.id === active.id);
        const newIndex = items.findIndex((i) => i.id === over.id);
        const next = arrayMove(items, oldIndex, newIndex);
        setItems(next);
        setStatus('saving');
        router.post('/modul/reorder', { ids: next.map((i) => i.id) }, {
            preserveScroll: true,
            preserveState: true,
            onSuccess: () => setStatus('saved'),
            onError: () => setStatus('idle'),
        });
    };

    const label = fase == null ? 'Mentor / Tanpa Fase' : (FASE_LABELS[fase] ?? `Fase ${fase}`);

    return (
        <div className="bg-slate-50 rounded-xl border border-slate-200 p-4">
            <div className="flex items-center justify-between mb-3">
                <h3 className="text-sm font-semibold text-slate-700">
                    {label} <span className="text-slate-400 font-normal">· {items.length} modul</span>
                </h3>
                {status === 'saving' && <span className="text-xs text-slate-400">Menyimpan…</span>}
                {status === 'saved' && (
                    <span className="text-xs text-emerald-600 flex items-center gap-1">
                        <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
                        </svg>
                        Tersimpan
                    </span>
                )}
            </div>
            <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={onDragEnd}>
                <SortableContext items={items.map((i) => i.id)} strategy={verticalListSortingStrategy}>
                    <div className="space-y-2">
                        {items.map((m, i) => <SortableRow key={m.id} modul={m} index={i} />)}
                    </div>
                </SortableContext>
            </DndContext>
        </div>
    );
}

export default function ModulReorder({ moduls }) {
    // Kelompokkan per fase; urutan awal mengikuti props (sudah di-order fase→urutan dari server).
    const groups = {};
    for (const m of moduls) {
        const key = m.fase ?? 'null';
        (groups[key] ||= []).push(m);
    }
    const keys = Object.keys(groups).sort((a, b) => {
        if (a === 'null') return 1;
        if (b === 'null') return -1;
        return Number(a) - Number(b);
    });

    return (
        <div className="space-y-4">
            <p className="text-xs text-slate-600 bg-blue-50 border border-blue-100 rounded-lg px-3 py-2">
                Seret modul (ikon titik-titik) untuk mengubah urutan tampilnya di sisi kader. Urutan
                di-scope per fase dan <b>tersimpan otomatis</b> setiap selesai diseret.
            </p>
            {keys.map((k) => (
                <FaseGroup key={k} fase={k === 'null' ? null : k} items={groups[k]} />
            ))}
        </div>
    );
}
