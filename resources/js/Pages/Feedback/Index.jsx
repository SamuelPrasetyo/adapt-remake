import { useState } from 'react';
import AppLayout from '@/Layouts/AppLayout';

const inputCls = "w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-500 bg-white disabled:bg-slate-100 disabled:text-slate-400";

export default function FeedbackIndex() {
    const [userType, setUserType]     = useState('');
    const [users, setUsers]           = useState([]);
    const [userId, setUserId]         = useState('');
    const [weeks, setWeeks]           = useState([]);
    const [weekId, setWeekId]         = useState('');
    const [loadingUsers, setLoadingUsers]   = useState(false);
    const [loadingWeeks, setLoadingWeeks]   = useState(false);

    const csrf = document.querySelector('meta[name="csrf-token"]')?.content ?? '';

    const fetchUsers = async (type) => {
        setLoadingUsers(true);
        setUsers([]);
        setUserId('');
        setWeeks([]);
        setWeekId('');
        try {
            const res = await fetch('/api/fetch-users', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json', 'X-CSRF-TOKEN': csrf },
                body: JSON.stringify({ usertype: type }),
            });
            const data = await res.json();
            setUsers(data.users ?? []);
        } finally {
            setLoadingUsers(false);
        }
    };

    const fetchWeeks = async (id) => {
        setLoadingWeeks(true);
        setWeeks([]);
        setWeekId('');
        try {
            const res = await fetch('/api/fetch-weekfeedback', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json', 'X-CSRF-TOKEN': csrf },
                body: JSON.stringify({ id_user: id }),
            });
            const data = await res.json();
            setWeeks(data.weeks ?? []);
        } finally {
            setLoadingWeeks(false);
        }
    };

    const handleUserTypeChange = (e) => {
        const val = e.target.value;
        setUserType(val);
        if (val) fetchUsers(val);
        else { setUsers([]); setUserId(''); setWeeks([]); setWeekId(''); }
    };

    const handleUserChange = (e) => {
        const val = e.target.value;
        setUserId(val);
        if (val) fetchWeeks(val);
        else { setWeeks([]); setWeekId(''); }
    };

    return (
        <AppLayout title="FEEDBACK" breadcrumb="Modul / Feedback">
            <div className="max-w-lg">
                <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6">
                    <h2 className="text-base font-semibold text-slate-800 mb-1">Filter Feedback</h2>
                    <p className="text-sm text-slate-500 mb-5">
                        Pilih tipe user, nama user, dan week untuk melihat detail feedback.
                    </p>

                    <form method="POST" action="/feedbackadmin/store">
                        <input type="hidden" name="_token" value={csrf} />

                        <div className="mb-4">
                            <label className="block text-sm font-medium text-slate-700 mb-1">User Type</label>
                            <select name="usertype" value={userType} onChange={handleUserTypeChange} required className={inputCls}>
                                <option value="">-- Pilih User Type --</option>
                                <option value="Mentor">Mentor</option>
                                <option value="Kader">Kader</option>
                            </select>
                        </div>

                        <div className="mb-4">
                            <label className="block text-sm font-medium text-slate-700 mb-1">User Name</label>
                            <select
                                name="id_user"
                                value={userId}
                                onChange={handleUserChange}
                                disabled={!userType || loadingUsers}
                                className={inputCls}
                            >
                                <option value="">
                                    {loadingUsers ? 'Memuat data...' : '-- Pilih User --'}
                                </option>
                                {users.map((u) => (
                                    <option key={u.id} value={u.id}>
                                        {u.nik ? `${u.nik} - ${u.name}` : u.name}
                                    </option>
                                ))}
                            </select>
                        </div>

                        <div className="mb-6">
                            <label className="block text-sm font-medium text-slate-700 mb-1">Week</label>
                            <select
                                name="id_week"
                                value={weekId}
                                onChange={(e) => setWeekId(e.target.value)}
                                disabled={!userId || loadingWeeks}
                                className={inputCls}
                            >
                                <option value="">
                                    {loadingWeeks ? 'Memuat data...' : '-- Pilih Week --'}
                                </option>
                                {weeks.map((w) => (
                                    <option key={w.id_week} value={w.id_week}>
                                        Week {w.angka_week}
                                    </option>
                                ))}
                            </select>
                        </div>

                        <button
                            type="submit"
                            disabled={!userType}
                            className="w-full px-4 py-2.5 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 disabled:opacity-50 rounded-lg transition"
                        >
                            Submit
                        </button>
                    </form>
                </div>
            </div>
        </AppLayout>
    );
}
