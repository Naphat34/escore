import React, { useEffect, useState } from 'react';
import client, { api } from '../api';
import { Trophy, Calendar, MapPin, Edit2, Trash2, PlusCircle, X, ToggleLeft, ToggleRight, Users, Shield, Download } from 'lucide-react';
import { Toast, Input, Button, EmptyState } from './AdminShared';
import Swal from 'sweetalert2';


export default function CompetitionsTab({ darkMode }) {
    const [competitions, setCompetitions] = useState([]);
    const [compForm, setCompForm] = useState({ name: '', start_date: '', end_date: '', location: '', sport: '', gender: '', age_group: '', status: 'closed', max_sets: 5, max_players: 14 });
    const [editingCompId, setEditingCompId] = useState(null);
    const [stadiums, setStadiums] = useState([]);
    const [ageGroups, setAgeGroups] = useState([]);

    // State สำหรับ Modal ต่างๆ
    const [viewingTeamsComp, setViewingTeamsComp] = useState(null);

    const [teamsInComp, setTeamsInComp] = useState([]);

    useEffect(() => {
        fetchCompetitions();
        fetchStadiums();
        fetchAgeGroups();
    }, []);

    const fetchCompetitions = async () => {
        try {
            const res = await client.get('/admin/competitions');
            setCompetitions(res.data);
        } catch (err) { console.error(err); }
    };

    const fetchStadiums = async () => {
    try {
        // ✅ ตรวจสอบว่าใช้ชื่อตรงกับใน api.js (เช่น api.getStadiums หรือ api.getAllStadiums)
        const res = await api.getStadiums(); 
        setStadiums(res.data);
    } catch (err) {
        console.error("Error fetching stadiums:", err);
    }
};

    const fetchAgeGroups = async () => {
        try {
            const res = await api.getAllAgeGroups();
            setAgeGroups(res.data);
        } catch (err) { console.error(err); }
    };

    const handleCompSubmit = async (e) => {
        e.preventDefault();
        
        // Validation เบื้องต้น
        if (!compForm.name || !compForm.gender) {
            return Toast.fire({ icon: 'warning', title: 'Please fill in Name and Gender' });
        }

        try {
            // ✅ ส่งค่าไปตรงๆ เลย (เช่น "Male,Female") Backend จะจัดการต่อเอง
            const payload = { 
                ...compForm, 
                title: compForm.name, 
                // ตรวจสอบ age_group ว่าส่งเป็น ID หรือ String (แล้วแต่ Backend รับ)
                age_group_id: compForm.age_group,
                stadium_id: compForm.stadium_id
            };

            if (editingCompId) {
                await api.updateCompetition(editingCompId, payload);
                Toast.fire({ icon: 'success', title: 'Competition updated' });
            } else {
                await api.createCompetition(payload);
                Toast.fire({ icon: 'success', title: 'Competition created' });
            }

            // Reset Form
            setCompForm({ 
                name: '', start_date: '', end_date: '', location: '', stadium_id: '',
                sport: 'Volleyball', gender: '', age_group: '', status: 'open', max_sets: 5, max_players: 14 
            });
            setEditingCompId(null);
            fetchCompetitions(); // Refresh ตาราง

        } catch (err) {
            console.error(err);
            Toast.fire({ icon: 'error', title: err.response?.data?.error || 'Failed to save' });
        }
    };

    const handleEditComp = (c) => {
        setCompForm({
            name: c.title || c.name,
            start_date: c.start_date ? c.start_date.split('T')[0] : '',
            end_date: c.end_date ? c.end_date.split('T')[0] : '',
            location: c.location || '',
            stadium_id: c.stadium_id || '',
            sport: c.sport || 'Volleyball',
            gender: c.gender || '', // ใส่ค่าตรงๆ ไม่ต้องแปลง
            age_group: c.age_group_id || '', // ใช้ ID
            status: c.status || 'open',
            max_sets: c.max_sets || 5,
            max_players: c.max_players || 14
        });
        setEditingCompId(c.id);
        window.scrollTo({ top: 0, behavior: 'smooth' });
    };

    const handleDeleteComp = async (id) => {
        const result = await Swal.fire({
            title: 'Are you sure?',
            text: "You won't be able to revert this!",
            icon: 'warning',
            showCancelButton: true,
            confirmButtonColor: '#d33',
            confirmButtonText: 'Yes, delete it!'
        });

        if (result.isConfirmed) {
            try {
                await api.deleteCompetition(id);
                setCompetitions(prev => prev.filter(c => c.id !== id));
                Toast.fire({ icon: 'success', title: 'Deleted successfully' });
            } catch (err) {
                Toast.fire({ icon: 'error', title: 'Delete failed' });
            }
        }
    };

    const handleToggleStatus = async (comp) => {
        const newStatus = comp.status === 'open' ? 'closed' : 'open';
        try {
            // Optimistic Update
            setCompetitions(prev => prev.map(c => c.id === comp.id ? { ...c, status: newStatus } : c));
            await api.updateCompetitionStatus(comp.id, newStatus);
            Toast.fire({ icon: 'success', title: `Status changed to ${newStatus}` });
        } catch (err) {
            Toast.fire({ icon: 'error', title: 'Failed to update status' });
            fetchCompetitions();
        }
    };

    const handleViewTeams = async (comp) => {
        try {
            const res = await api.getTeamsByCompetition(comp.id); // ต้องแน่ใจว่าใน api.js มีฟังก์ชัน getTeamsByCompetition (หรือใช้ route ตรงๆ)
            // ถ้า api.js ไม่มี wrapper ให้ใช้: const res = await api.get(`/admin/competitions/${comp.id}/teams`);
            setTeamsInComp(res.data);
            setViewingTeamsComp(comp);
        } catch (err) {
            console.error(err);
            Toast.fire({ icon: 'error', title: 'Failed to load teams' });
        }
    };

    const handleExportTeamsCSV = () => {
        if (teamsInComp.length === 0) {
            Toast.fire({ icon: 'info', title: 'No teams to export' });
            return;
        }

        const headers = ["Team Name,Code,Coach"];
        const rows = teamsInComp.map(t => [
            `"${(t.name || '').replace(/"/g, '""')}"`,
            `"${(t.code || '').replace(/"/g, '""')}"`,
            `"${(t.coach || '').replace(/"/g, '""')}"`
        ].join(','));

        const csvContent = "\uFEFF" + [headers, ...rows].join('\n');
        const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
        const url = URL.createObjectURL(blob);

        const link = document.createElement("a");
        link.setAttribute("href", url);
        link.setAttribute("download", `teams_${viewingTeamsComp.name || 'competition'}.csv`);
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

    return (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            <div className="lg:col-span-1">
                <div className={`p-6 rounded-xl shadow-sm border sticky top-24 ${darkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-100'}`}>
                    <div className="flex items-center justify-between mb-6">
                        <h2 className="text-lg font-bold flex items-center gap-2"><Trophy size={20} className="text-indigo-500" /> {editingCompId ? 'Edit Competition' : 'New Competition'}</h2>
                        {editingCompId && <button onClick={() => { setEditingCompId(null); setCompForm({ name: '', start_date: '', end_date: '', location: '', sport: '', gender: '', status: 'closed', max_sets: 5, max_players: 14 }) }}><X size={16} className="text-red-500" /></button>}
                    </div>
                    <form onSubmit={handleCompSubmit} className="space-y-4">
                        <Input label="Name" value={compForm.name} onChange={e => setCompForm({ ...compForm, name: e.target.value })} required darkMode={darkMode} />
                        <div className="grid grid-cols-2 gap-3">
                            <Input label="Start Date" type="date" value={compForm.start_date} onChange={e => setCompForm({ ...compForm, start_date: e.target.value })} required darkMode={darkMode} />
                            <Input label="End Date" type="date" value={compForm.end_date} onChange={e => setCompForm({ ...compForm, end_date: e.target.value })} required darkMode={darkMode} />
                        </div>
                        <div className="space-y-1">
                            <label className={`block text-xs font-bold uppercase ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                                Location / Stadium
                            </label>
                            <div className="relative">
                                <select
                                    value={compForm.stadium_id || ''}
                                    onChange={(e) => {
                                        const selectedStadium = stadiums.find(s => s.id.toString() === e.target.value);
                                        setCompForm({ ...compForm, stadium_id: e.target.value, location: selectedStadium ? selectedStadium.name : '' });
                                    }}
                                    className={`w-full p-2.5 rounded-lg border text-sm transition focus:ring-2 focus:ring-indigo-500 outline-none appearance-none cursor-pointer
                                        ${darkMode 
                                            ? 'bg-gray-700 border-gray-600 text-white placeholder-gray-400' 
                                            : 'bg-white border-gray-300 text-gray-900'
                                        }`}
                                    required
                                >
                                    <option value="">-- Select Stadium --</option>
                                    {stadiums.map((stadium) => (
                                        <option key={stadium.id} value={stadium.id}>
                                            {stadium.name} {stadium.code ? `(${stadium.code})` : ''}
                                        </option>
                                    ))}
                                </select>
                                
                                {/* Icon ลูกศรลง เพื่อความสวยงาม */}
                                <div className="absolute inset-y-0 right-0 flex items-center px-2 pointer-events-none">
                                    <MapPin size={16} className={darkMode ? 'text-gray-400' : 'text-gray-500'} />
                                </div>
                            </div>
                        </div>
                        
                        <div className="grid grid-cols-2 gap-3">
                            <Input label="Sport" placeholder="Volleyball" value={compForm.sport} onChange={e => setCompForm({ ...compForm, sport: e.target.value })} darkMode={darkMode} />
                            <div>
                                <label className={`block text-xs font-bold uppercase mb-1 ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>Age Group</label>
                                <select
                                    value={compForm.age_group}
                                    onChange={e => setCompForm({ ...compForm, age_group: e.target.value })}
                                    className={`w-full p-2 rounded-lg border text-sm transition focus:ring-2 focus:ring-indigo-500 outline-none ${darkMode ? 'bg-gray-700 border-gray-600 text-white' : 'bg-white border-gray-300'}`}
                                >
                                    <option value="">-- Select Age Group --</option>
                                    {ageGroups.map(ag => (
                                        <option key={ag.id} value={ag.id}>{ag.name} ({ag.code})</option>
                                    ))}
                                </select>
                            </div>
                        </div>

                        <div>
                            <label className={`block text-xs font-bold uppercase mb-1 ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                                Gender (Select Categories)
                            </label>
                            <div className="flex gap-2">
                                {['Male', 'Female', 'Mixed'].map((g) => {
                                    // 1. แปลง String เป็น Array และกรองค่าว่างทิ้ง (กันบั๊ก ,Male)
                                    const currentGenders = compForm.gender 
                                        ? compForm.gender.split(',').filter(item => item !== '') 
                                        : [];
                                    
                                    const isSelected = currentGenders.includes(g);

                                    return (
                                        <button
                                            key={g}
                                            type="button"
                                            onClick={() => {
                                                let newGenders;
                                                if (isSelected) {
                                                    // ถ้ามีอยู่แล้ว ให้ลบออก
                                                    newGenders = currentGenders.filter(x => x !== g);
                                                } else {
                                                    // ถ้ายังไม่มี ให้เพิ่มเข้าไป
                                                    newGenders = [...currentGenders, g];
                                                }
                                                // รวมกลับเป็น String คั่นด้วย Comma
                                                setCompForm({ ...compForm, gender: newGenders.join(',') });
                                            }}
                                            className={`flex-1 py-2 text-xs font-bold rounded-lg border transition-all ${
                                                isSelected
                                                    ? 'bg-indigo-600 text-white border-indigo-600 shadow-md transform scale-105'
                                                    : darkMode
                                                        ? 'bg-gray-700 text-gray-300 border-gray-600 hover:bg-gray-600'
                                                        : 'bg-white text-gray-600 border-gray-300 hover:bg-gray-50'
                                            }`}
                                        >
                                            {/* เปลี่ยน Text ให้สื่อความหมายชัดขึ้น */}
                                            {g === 'Mixed' ? 'Mixed (ทีมผสม)' : g}
                                        </button>
                                    );
                                })}
                            </div>
                            {/* แสดงข้อความสรุปด้านล่างให้ Admin มั่นใจ */}
                            <div className="mt-1 text-xs text-gray-400 text-right">
                                {compForm.gender 
                                    ? `Selected: ${compForm.gender.split(',').join(' & ')}` 
                                    : 'Please select at least one'}
                            </div>
                        </div>

                        <div className="grid grid-cols-2 gap-3">
                            <div>
                                <label className={`block text-xs font-bold uppercase mb-1 ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>Sets Rule</label>
                                <select
                                    className={`w-full p-2 rounded-lg border text-sm transition focus:ring-2 focus:ring-indigo-500 outline-none ${darkMode ? 'bg-gray-700 border-gray-600 text-white' : 'bg-white border-gray-300'}`}
                                    value={compForm.max_sets}
                                    onChange={e => setCompForm({ ...compForm, max_sets: parseInt(e.target.value) })}
                                >
                                    <option value={3}>Best of 3 (Win 2)</option>
                                    <option value={5}>Best of 5 (Win 3)</option>
                                </select>
                            </div>
                            <Input
                                label="Max Players"
                                type="number"
                                value={compForm.max_players}
                                onChange={e => setCompForm({ ...compForm, max_players: parseInt(e.target.value) })}
                                darkMode={darkMode}
                            />
                        </div>
                        <div>
                            <label className={`block text-xs font-bold uppercase mb-1 ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>Status</label>
                            <div className="flex gap-2">
                                <button
                                    type="button"
                                    onClick={() => setCompForm({ ...compForm, status: 'open' })}
                                    className={`flex-1 py-2 text-sm font-bold rounded-lg border transition flex items-center justify-center gap-2 ${compForm.status === 'open'
                                        ? 'bg-green-600 text-white border-green-600'
                                        : darkMode
                                            ? 'bg-gray-700 text-gray-300 border-gray-600 hover:bg-gray-600'
                                            : 'bg-white text-gray-600 border-gray-300 hover:bg-gray-50'
                                        }`}
                                >
                                    <ToggleRight size={16} /> Open
                                </button>
                                <button
                                    type="button"
                                    onClick={() => setCompForm({ ...compForm, status: 'closed' })}
                                    className={`flex-1 py-2 text-sm font-bold rounded-lg border transition flex items-center justify-center gap-2 ${compForm.status === 'closed'
                                        ? 'bg-red-500 text-white border-red-500'
                                        : darkMode
                                            ? 'bg-gray-700 text-gray-300 border-gray-600 hover:bg-gray-600'
                                            : 'bg-white text-gray-600 border-gray-300 hover:bg-gray-50'
                                        }`}
                                >
                                    <ToggleLeft size={16} /> Closed
                                </button>
                            </div>
                        </div>
                        <Button type="submit" label={editingCompId ? "Update" : "Create"} icon={editingCompId ? <Edit2 size={18} /> : <PlusCircle size={18} />} full />
                    </form>
                </div>
            </div>
            <div className="lg:col-span-2">
                <div className={`rounded-xl shadow-sm border overflow-hidden ${darkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-100'}`}>
                    <div className={`px-6 py-4 border-b ${darkMode ? 'bg-gray-700/50 border-gray-700' : 'bg-gray-50/50 border-gray-100'}`}>
                        <h3 className="font-bold">All Competitions</h3>
                    </div>
                    {competitions.length === 0 ? <EmptyState text="No competitions created." darkMode={darkMode} /> : (
                        <div className="divide-y divide-gray-100 dark:divide-gray-700">
                            {competitions.map(c => (
                                <div key={c.id} className={`p-6 flex flex-col md:flex-row justify-between items-center transition ${darkMode ? 'hover:bg-gray-700' : 'hover:bg-gray-50'}`}>
                                    <div className="flex-1">
                                        <div className="flex items-center gap-3 mb-1">
                                            <h4 className="font-bold text-lg">{c.name || c.title}</h4>
                                            <button onClick={() => handleToggleStatus(c)} className="focus:outline-none" title="Toggle Status">
                                                {c.status === 'open' ? (
                                                    <div className="flex items-center gap-1 px-2 py-0.5 rounded-full bg-green-100 text-green-700 border border-green-200 text-[10px] font-bold uppercase">
                                                        <ToggleRight size={14} /> Open
                                                    </div>
                                                ) : (
                                                    <div className="flex items-center gap-1 px-2 py-0.5 rounded-full bg-gray-100 text-gray-600 border border-gray-200 text-[10px] font-bold uppercase">
                                                        <ToggleLeft size={14} /> Closed
                                                    </div>
                                                )}
                                            </button>
                                        </div>
                                        <div className="text-sm text-gray-500 flex gap-4">
                                            <span className="flex items-center gap-1"><Calendar size={14} /> {c.start_date ? new Date(c.start_date).toLocaleDateString() : 'TBD'}</span>
                                            <span className="flex items-center gap-1"><MapPin size={14} /> {c.location}</span>
                                            <span className="flex items-center gap-1"><Shield size={14} /> {c.sport} {c.age_group ? `(${c.age_group})` : ''} - {c.gender}</span>
                                            <span className="flex items-center gap-1"><Users size={14} /> Max: {c.max_players}</span>
                                            <span className="flex items-center gap-1"><Trophy size={14} /> Best of {c.max_sets}</span>
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-2 mt-4 md:mt-0">
                                        <button
                                            onClick={() => handleViewTeams(c)}
                                            className={`p-2 rounded-lg transition flex items-center gap-2 text-sm font-medium ${darkMode ? 'text-indigo-400 hover:bg-indigo-900/30' : 'text-indigo-600 hover:bg-indigo-50'}`}
                                        >
                                            <Users size={18} /> Teams
                                        </button>

                                        {/* ปุ่ม Matches */}


                                        <div className={`w-px h-6 mx-1 ${darkMode ? 'bg-gray-700' : 'bg-gray-200'}`}></div>
                                        <button onClick={() => handleEditComp(c)} className="p-2 text-gray-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition"><Edit2 size={18} /></button>
                                        <button onClick={() => handleDeleteComp(c.id)} className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition"><Trash2 size={18} /></button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </div>

            {/* View Teams Modal */}
            {viewingTeamsComp && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4 animate-in fade-in duration-200">
                    <div className={`relative w-full max-w-2xl rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[80vh] ${darkMode ? 'bg-gray-800 text-gray-100' : 'bg-white text-gray-900'}`}>
                        <div className="px-6 py-4 border-b flex justify-between items-center bg-indigo-600 text-white">
                            <div>
                                <h3 className="font-bold text-lg flex items-center gap-2"><Users size={20} /> Participating Teams</h3>
                                <p className="text-xs text-indigo-100">{viewingTeamsComp.name || viewingTeamsComp.title}</p>
                            </div>
                            <button onClick={() => setViewingTeamsComp(null)} className="text-white/80 hover:text-white hover:bg-white/20 p-1 rounded-full transition"><X size={20} /></button>
                        </div>
                        <div className="p-0 overflow-y-auto flex-1">
                            {teamsInComp.length === 0 ? (
                                <EmptyState text="No teams have joined this competition yet." darkMode={darkMode} />
                            ) : (
                                <table className="w-full text-left">
                                    <thead className={darkMode ? 'bg-gray-700/50 text-gray-300' : 'bg-gray-50 text-gray-500'}>
                                        <tr>
                                            <th className="px-6 py-3 text-xs font-bold uppercase tracking-wider">Team Name</th>
                                            <th className="px-6 py-3 text-xs font-bold uppercase tracking-wider">Code</th>
                                            <th className="px-6 py-3 text-xs font-bold uppercase tracking-wider">Coach</th>
                                        </tr>
                                    </thead>
                                    <tbody className={`divide-y ${darkMode ? 'divide-gray-700' : 'divide-gray-100'}`}>
                                        {teamsInComp.map(team => (
                                            <tr key={team.id} className={`transition ${darkMode ? 'hover:bg-gray-700' : 'hover:bg-gray-50'}`}>
                                                <td className="px-6 py-4 font-medium">{team.name}</td>
                                                <td className="px-6 py-4 font-mono text-sm text-gray-500">{team.code}</td>
                                                <td className="px-6 py-4 text-sm">{team.coach || '-'}</td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            )}
                        </div>
                        <div className={`p-4 border-t ${darkMode ? 'border-gray-700 bg-gray-800' : 'border-gray-100 bg-gray-50'} flex justify-end gap-2`}>
                            <span className="text-xs text-gray-500 self-center mr-auto">Total: {teamsInComp.length} Teams</span>
                            <button onClick={handleExportTeamsCSV} className="px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg text-sm font-medium transition flex items-center gap-2">
                                <Download size={16} /> Export CSV
                            </button>
                            <button onClick={() => setViewingTeamsComp(null)} className="px-4 py-2 bg-gray-200 hover:bg-gray-300 text-gray-800 rounded-lg text-sm font-medium transition">Close</button>
                        </div>
                    </div>
                </div>
            )}



        </div>
    );
}