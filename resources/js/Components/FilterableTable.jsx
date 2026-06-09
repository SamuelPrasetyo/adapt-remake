import { useMemo, useState } from "react";
import DataTable from "@/Components/DataTable";
import FilterDropdown from "@/Components/FilterDropdown";

// FilterableTable: DataTable (search + sort + pagination client-side) + satu/lebih
// dropdown Filter terstruktur. Filter di-pre-filter sebelum diserahkan ke DataTable.
//
// Props tambahan dari DataTable:
//   filters: [{ key, label, options?, labelFormat?(value), allLabel? }]
//     - options eksplisit: [{ value, label }] (mis. Status). Cocok jika row[key] === value.
//     - tanpa options: opsi diturunkan otomatis dari nilai distinct row[key]
//       (label = labelFormat(value) bila ada, selain itu String(value)).
export default function FilterableTable({ columns, data = [], actions, filters = [], perPage = 10, emptyMessage, headerActions }) {
    const [values, setValues] = useState({});

    const resolvedFilters = useMemo(() => {
        return filters.map((f) => {
            if (f.options) return f;
            const seen = new Map();
            data.forEach((r) => {
                const v = r[f.key];
                if (v != null && v !== "" && !seen.has(String(v))) seen.set(String(v), v);
            });
            const options = [...seen.values()]
                .sort((a, b) => String(a).localeCompare(String(b), undefined, { numeric: true }))
                .map((v) => ({ value: v, label: f.labelFormat ? f.labelFormat(v) : String(v) }));
            return { ...f, options };
        });
    }, [data, filters]);

    const filtered = useMemo(() => {
        return data.filter((r) =>
            resolvedFilters.every((f) => {
                const val = values[f.key];
                if (val == null || val === "") return true;
                return String(r[f.key] ?? "") === String(val);
            })
        );
    }, [data, values, resolvedFilters]);

    const searchPrefix = resolvedFilters.length > 0 ? (
        <div className="flex items-center gap-2 flex-wrap">
            {resolvedFilters.map((f) => (
                <FilterDropdown
                    key={f.key}
                    label={f.label}
                    allLabel={f.allLabel}
                    value={values[f.key] ?? ""}
                    options={f.options}
                    onChange={(v) => setValues((s) => ({ ...s, [f.key]: v }))}
                />
            ))}
        </div>
    ) : null;

    return (
        <DataTable
            columns={columns}
            data={filtered}
            actions={actions}
            searchPrefix={searchPrefix}
            headerActions={headerActions}
            perPage={perPage}
            emptyMessage={emptyMessage}
        />
    );
}
