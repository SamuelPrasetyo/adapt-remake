export const ADMIN_NAV = [
    { type: "section", label: "Overview" },
    {
        type: "item",
        label: "Dashboard",
        icon: "home",
        href: "/dashboard",
        match: "/dashboard",
        preserveMentor: true,
    },
    {
        type: "item",
        label: "Kader Saya",
        icon: "people",
        href: "/kader-saya",
        match: "/kader-saya",
        requires: "mentor_or_admin021",
        preserveMentor: true,
    },
    { type: "section", label: "Master" },
    {
        type: "group",
        label: "Master",
        icon: "grid",
        children: [
            { label: "User", href: "/user", match: "/user", requires: "admin" },
            {
                label: "Divisi",
                href: "/divisi",
                match: "/divisi",
                requires: "admin",
            },
            {
                label: "Departemen",
                href: "/departemen",
                match: "/departemen",
                requires: "admin",
            },
            {
                label: "Batch",
                href: "/batch",
                match: "/batch",
                requires: "admin",
            },
            {
                label: "Nilai",
                href: "/nilai",
                match: "/nilai",
                requires: "admin",
            },
            {
                label: "Pertanyaan",
                href: "/pertanyaan",
                match: "/pertanyaan",
                requires: "admin",
            },
            { label: "Week", href: "/week", match: "/week", requires: "admin" },
            {
                label: "Kader",
                href: "/kader",
                match: "/kader",
                requires: "admin",
            },
            {
                label: "Mentor",
                href: "/mentor",
                match: "/mentor",
                requires: "admin021",
            },
        ],
    },
    { type: "section", label: "Modul" },
    {
        type: "group",
        label: "Modul",
        icon: "layers",
        children: [
            {
                label: "Activity Log",
                href: "/activity-log",
                match: "/activity-log",
                external: true,
                requires: "admin",
            },
            {
                label: "Feedback",
                href: "/feedbackadmin/index",
                match: "/feedbackadmin",
                external: true,
                requires: "admin",
            },
            {
                label: "Modul Pembelajaran",
                href: "/modul",
                match: "/modul",
                requires: "admin",
                exact: true,
            },
            {
                label: "Soal Pre/Post Test",
                href: "/soal-modul",
                match: "/soal-modul",
                requires: "admin",
            },
            {
                label: "Dokumen",
                href: "/dokumen",
                match: "/dokumen",
                requires: "admin",
            },
            {
                label: "Peserta Kader",
                href: "/modul/peserta",
                match: "/modul/peserta",
                requires: "admin",
            },
        ],
    },
    { type: "section", label: "Report" },
    {
        type: "group",
        label: "Report",
        icon: "file",
        children: [
            {
                label: "Learning Growth",
                href: "/learning-index",
                match: "/learning-index",
            },
            {
                label: "OJT Monitoring",
                href: "/ojt-index",
                match: "/ojt-index",
            },
            {
                label: "Feedback",
                href: "/reportfeedback-index",
                match: "/reportfeedback-index",
            },
        ],
    },
];

export const KADER_NAV = [
    { type: "section", label: "Overview" },
    {
        type: "item",
        label: "Dashboard",
        icon: "home",
        href: "/dashboard-kader",
        match: "/dashboard-kader",
    },
    { type: "section", label: "Modul" },
    {
        type: "group",
        label: "Modul",
        icon: "layers",
        children: [
            { label: "My Modul", href: "/my-learning", match: "/my-learning" },
        ],
    },
];
