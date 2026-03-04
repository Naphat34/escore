import React, { useEffect, useState } from 'react';
import { api } from '../api';
import { Shield, Plus, Edit2, Trash2, Search, X, Save, Users } from 'lucide-react';
import Swal from 'sweetalert2';

const Toast = Swal.mixin({
  toast: true,
  position: 'top-end',
  showConfirmButton: false,
  timer: 3000,
  timerProgressBar: true,
  didOpen: (toast) => {
    toast.addEventListener('mouseenter', Swal.stopTimer)
    toast.addEventListener('mouseleave', Swal.resumeTimer)
  }
});

export default function ClubsTab({ darkMode }) {
    const [teams, setTeams] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingTeam, setEditingTeam] = useState(null);
    const [formData, setFormData] = useState({ name: '', code: '', logo_url: '' });

    useEffect(() => {
        fetchTeams();
    }, []);

    const fetchTeams = async () => {
        setLoading(true);
        try {
            const res = await api.getAllTeams();
            setTeams(res.data);
        } catch (error) {
            console.error(error);
            Toast.fire({ icon: 'error', title: 'Failed to fetch teams' });
        } finally {
            setLoading(false);
        }
    };

    const handleSearch = (e) => setSearchTerm(e.target.value);

    const filteredTeams = teams.filter(team => 
        team.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        team.code.toLowerCase().includes(searchTerm.toLowerCase())
    );

    const handleAdd = () => {
        setEditingTeam(null);
        setFormData({ name: '', code: '', logo_url: '' });
        setIsModalOpen(true);
    };

    const handleEdit = (team) => {
        setEditingTeam(team);
        setFormData({ name: team.name, code: team.code, logo_url: team.logo_url || '' });
        setIsModalOpen(true);
    };

    const handleDelete = async (id) => {
        const result = await Swal.fire({
            title: 'Are you sure?',
            text: "You won't be able to revert this!",
            icon: 'warning',
            showCancelButton: true,
            confirmButtonColor: '#d33',
            cancelButtonColor: '#3085d6',
            confirmButtonText: 'Yes, delete it!'
        });

        if (result.isConfirmed) {
            try {
                await api.deleteTeam(id);
                setTeams(teams.filter(t => t.id !== id));
                Toast.fire({ icon: 'success', title: 'Team deleted' });
            } catch  {
                Toast.fire({ icon: 'error', title: 'Failed to delete team' });
            }
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            if (editingTeam) {
                const res = await api.updateTeam(editingTeam.id, formData);
                setTeams(teams.map(t => t.id === editingTeam.id ? res.data : t));
                Toast.fire({ icon: 'success', title: 'Team updated' });
            } else {
                const res = await api.createTeam(formData);
                setTeams([...teams, res.data]);
                Toast.fire({ icon: 'success', title: 'Team created' });
            }
            setIsModalOpen(false);
        } catch (error) {
            console.error(error);
            Toast.fire({ icon: 'error', title: 'Operation failed' });
        }
    };

    return (
        <div className={`space-y-6 ${darkMode ? 'text-gray-100' : 'text-gray-800'}`}>
            {/* Header & Actions */}
            <div className="flex flex-col sm:flex-row justify-between items-center gap-4">
                <div className="relative w-full sm:w-72">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                    <input 
                        type="text" 
                        placeholder="Search clubs..." 
                        value={searchTerm}
                        onChange={handleSearch}
                        className={`w-full pl-10 pr-4 py-2 rounded-lg border focus:ring-2 focus:ring-indigo-500 outline-none transition ${
                            darkMode 
                            ? 'bg-gray-800 border-gray-700 text-white placeholder-gray-500' 
                            : 'bg-white border-gray-200 text-gray-900 placeholder-gray-400'
                        }`}
                    />
                </div>
                <button 
                    onClick={handleAdd}
                    className="flex items-center gap-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg font-medium transition shadow-sm"
                >
                    <Plus size={20} /> Add Club
                </button>
            </div>

            {/* Content */}
            <div className={`rounded-xl border overflow-hidden shadow-sm ${darkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'}`}>
                <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                        <thead className={darkMode ? 'bg-gray-700/50 text-gray-300' : 'bg-gray-50 text-gray-500'}>
                            <tr>
                                <th className="px-6 py-4 text-xs font-bold uppercase tracking-wider">Club Info</th>
                                <th className="px-6 py-4 text-xs font-bold uppercase tracking-wider">Code</th>
                                <th className="px-6 py-4 text-xs font-bold uppercase tracking-wider">Members</th>
                                <th className="px-6 py-4 text-right text-xs font-bold uppercase tracking-wider">Actions</th>
                            </tr>
                        </thead>
                        <tbody className={`divide-y ${darkMode ? 'divide-gray-700' : 'divide-gray-100'}`}>
                            {loading ? (
                                <tr><td colSpan="4" className="px-6 py-8 text-center text-gray-500">Loading...</td></tr>
                            ) : filteredTeams.length === 0 ? (
                                <tr><td colSpan="4" className="px-6 py-8 text-center text-gray-500">No clubs found.</td></tr>
                            ) : (
                                filteredTeams.map(team => (
                                    <tr key={team.id} className={`transition ${darkMode ? 'hover:bg-gray-700/50' : 'hover:bg-gray-50'}`}>
                                        <td className="px-6 py-4">
                                            <div className="flex items-center gap-3">
                                                <div className={`w-10 h-10 rounded-lg flex items-center justify-center overflow-hidden border flex-shrink-0 ${darkMode ? 'bg-gray-700 border-gray-600' : 'bg-gray-100 border-gray-200'}`}>
                                                    {team.logo_url ? (
                                                        <img src={team.logo_url} alt={team.name} className="w-full h-full object-contain" />
                                                    ) : (
                                                        <Shield size={20} className="text-gray-400" />
                                                    )}
                                                </div>
                                                <span className="font-medium">{team.name}</span>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 font-mono text-sm">{team.code}</td>
                                        <td className="px-6 py-4 text-sm text-gray-500 dark:text-gray-400">
                                            <div className="flex items-center gap-1">
                                                <Users size={14} /> {team.player_count || 0}
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 text-right">
                                            <div className="flex justify-end gap-2">
                                                <button onClick={() => handleEdit(team)} className="p-2 text-indigo-600 hover:bg-indigo-50 dark:hover:bg-indigo-900/30 rounded-lg transition">
                                                    <Edit2 size={18} />
                                                </button>
                                                <button onClick={() => handleDelete(team.id)} className="p-2 text-red-500 hover:bg-red-50 dark:hover:bg-red-900/30 rounded-lg transition">
                                                    <Trash2 size={18} />
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Modal */}
            {isModalOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4 animate-in fade-in duration-200">
                    <div className={`w-full max-w-md rounded-2xl shadow-2xl overflow-hidden ${darkMode ? 'bg-gray-800' : 'bg-white'}`}>
                        <div className={`px-6 py-4 border-b flex justify-between items-center ${darkMode ? 'border-gray-700' : 'border-gray-100'}`}>
                            <h3 className="font-bold text-lg text-gray-900 dark:text-white">{editingTeam ? 'Edit Club' : 'New Club'}</h3>
                            <button onClick={() => setIsModalOpen(false)} className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 transition">
                                <X size={20} />
                            </button>
                        </div>
                        <form onSubmit={handleSubmit} className="p-6 space-y-4">
                            <div>
                                <label className={`block text-xs font-bold uppercase mb-1 ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>Club Name</label>
                                <input 
                                    type="text" 
                                    required
                                    value={formData.name}
                                    onChange={e => setFormData({...formData, name: e.target.value})}
                                    className={`w-full px-3 py-2 rounded-lg border focus:ring-2 focus:ring-indigo-500 outline-none transition ${
                                        darkMode ? 'bg-gray-700 border-gray-600 text-white' : 'bg-white border-gray-300 text-gray-900'
                                    }`}
                                />
                            </div>
                            <div>
                                <label className={`block text-xs font-bold uppercase mb-1 ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>Code (Abbreviation)</label>
                                <input 
                                    type="text" 
                                    required
                                    value={formData.code}
                                    onChange={e => setFormData({...formData, code: e.target.value})}
                                    className={`w-full px-3 py-2 rounded-lg border focus:ring-2 focus:ring-indigo-500 outline-none transition ${
                                        darkMode ? 'bg-gray-700 border-gray-600 text-white' : 'bg-white border-gray-300 text-gray-900'
                                    }`}
                                />
                            </div>
                            <div>
                                <label className={`block text-xs font-bold uppercase mb-1 ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>Logo URL</label>
                                <input 
                                    type="url" 
                                    value={formData.logo_url}
                                    onChange={e => setFormData({...formData, logo_url: e.target.value})}
                                    placeholder="https://example.com/logo.png"
                                    className={`w-full px-3 py-2 rounded-lg border focus:ring-2 focus:ring-indigo-500 outline-none transition ${
                                        darkMode ? 'bg-gray-700 border-gray-600 text-white' : 'bg-white border-gray-300 text-gray-900'
                                    }`}
                                />
                            </div>
                            <div className="pt-2">
                                <button 
                                    type="submit" 
                                    className="w-full py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-lg shadow-md transition flex items-center justify-center gap-2"
                                >
                                    <Save size={18} /> {editingTeam ? 'Save Changes' : 'Create Club'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}
