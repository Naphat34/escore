import React, { useEffect, useState } from 'react';
import { api } from '../api';
import { Users, Shield, User, Eye, X, CheckCircle, Briefcase } from 'lucide-react';
import { Toast, EmptyState, DetailItem } from './AdminShared';

export default function PlayerViewTab({ darkMode }) {
    const [competitions, setCompetitions] = useState([]);
    const [registeredTeams, setRegisteredTeams] = useState([]);
    const [teamPlayers, setTeamPlayers] = useState([]);
    const [teamStaff, setTeamStaff] = useState([]);
    
    // New states for filtering
    const [uniqueBaseNames, setUniqueBaseNames] = useState([]);
    const [selectedBaseName, setSelectedBaseName] = useState('');
    const [filterGender, setFilterGender] = useState('All');
    const [availableGenders, setAvailableGenders] = useState([]);

    const [selectedTeamId, setSelectedTeamId] = useState('');
    const [viewingPlayer, setViewingPlayer] = useState(null);

    // Initial Load
    useEffect(() => {
        const fetchComp = async () => {
            try {
                const res = await api.getAllCompetitions();
                setCompetitions(res.data);
                
                const bases = new Set();
                res.data.forEach(c => {
                    const rawTitle = c.title || c.name || '';
                    if (rawTitle) {
                        const base = rawTitle.replace(/\s\((Male|Female|Mix|Mixed)\)$/i, '').trim();
                        bases.add(base);
                    }
                });
                const sortedBases = Array.from(bases).sort();
                setUniqueBaseNames(sortedBases);

                if (sortedBases.length > 0) {
                    setSelectedBaseName(sortedBases[0]);
                }
            } catch (err) {
                console.error("Error fetching competitions:", err);
            }
        };
        fetchComp();
    }, []);

    // Update available genders when base name changes
    useEffect(() => {
        if (selectedBaseName && competitions.length > 0) {
            const relatedComps = competitions.filter(c => {
                const rawTitle = c.title || c.name || '';
                const cBase = rawTitle.replace(/\s\((Male|Female|Mix|Mixed)\)$/i, '').trim();
                return cBase === selectedBaseName;
            });

            const allGenders = relatedComps.flatMap(c => c.gender ? c.gender.split(',') : []);
            const uniqueGenders = [...new Set(allGenders)].filter(Boolean).sort();
            setAvailableGenders(uniqueGenders);

            if (uniqueGenders.length > 0 && !uniqueGenders.includes(filterGender) && filterGender !== 'All') {
                setFilterGender('All');
            }
        }
    }, [selectedBaseName, competitions]);

    // Load Teams when Competition or Gender filter changes
    useEffect(() => {
        const fetchTeams = async () => {
            if (!selectedBaseName) return;

            setRegisteredTeams([]);
            setSelectedTeamId('');

            try {
                const targetComps = competitions.filter(c => {
                    const rawTitle = c.title || c.name || '';
                    const cBase = rawTitle.replace(/\s\((Male|Female|Mix|Mixed)\)$/i, '').trim();
                    if (cBase !== selectedBaseName) return false;
                    if (filterGender === 'All') return true;
                    return c.gender && c.gender.split(',').includes(filterGender);
                });

                if (targetComps.length === 0) return;

                const teamPromises = targetComps.map(c => api.getTeamsByCompetition(c.id));
                const teamResults = await Promise.all(teamPromises);

                const allTeams = new Map();
                teamResults.forEach(res => {
                    if (res.data) {
                        res.data.forEach(team => {
                            if (!allTeams.has(team.id)) {
                                allTeams.set(team.id, team);
                            }
                        });
                    }
                });

                setRegisteredTeams(Array.from(allTeams.values()));

            } catch (err) {
                console.error("Error fetching teams:", err);
            }
        };

        fetchTeams();
    }, [selectedBaseName, filterGender, competitions]);

    // Load Players when Team Changes
    useEffect(() => {
        if(selectedTeamId) {
            fetchTeamData (selectedTeamId);
        } else {
            setTeamPlayers([]);
            setTeamStaff([]);
        }
    }, [selectedTeamId]);

    const fetchTeamData = async (teamId) => {
        try {
            const [resPlayers, resStaff] = await Promise.all([
                api.getPlayersByTeam(teamId),
                api.getStaffByTeam(teamId)
            ]);
            setTeamPlayers(resPlayers.data);
            setTeamStaff(resStaff.data);
        } catch (err) {
            console.error("Fetch Team Data Error:", err);
            Toast.fire({ icon: 'error', title: 'Could not load team data' });
        }
    };

    return (
        <div className="space-y-6">
            {/* Filters */}
            <div className={`p-6 rounded-xl shadow-sm border ${darkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-100'}`}>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    {/* Competition Dropdown */}
                    <div>
                        <label className={`block text-xs font-bold uppercase mb-2 ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>Competition</label>
                        <select 
                            value={selectedBaseName} 
                            onChange={(e) => setSelectedBaseName(e.target.value)}
                            className={`w-full px-3 py-2.5 border rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none ${darkMode ? 'bg-gray-700 border-gray-600 text-white' : 'bg-white border-gray-300'}`}
                        >
                            <option value="">-- Choose Competition --</option>
                            {uniqueBaseNames.map(name => <option key={name} value={name}>{name}</option>)}
                        </select>
                    </div>

                    {/* Gender Filter */}
                    <div>
                        <label className={`block text-xs font-bold uppercase mb-2 ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>Gender</label>
                        <div className={`flex bg-gray-100 dark:bg-gray-700 rounded-lg p-1 h-[46px] items-center`}>
                            <button 
                                onClick={() => setFilterGender('All')} 
                                className={`px-3 py-1.5 text-xs font-bold rounded-md transition w-full ${filterGender === 'All' ? 'bg-white dark:bg-gray-600 text-indigo-600 dark:text-indigo-400 shadow-sm' : 'text-gray-500 dark:text-gray-400 hover:text-gray-700'}`}
                            >
                                All
                            </button>
                            {availableGenders.map(g => (
                                <button 
                                    key={g} 
                                    onClick={() => setFilterGender(g)} 
                                    className={`px-3 py-1.5 text-xs font-bold rounded-md transition w-full ${filterGender === g ? 'bg-white dark:bg-gray-600 text-indigo-600 dark:text-indigo-400 shadow-sm' : 'text-gray-500 dark:text-gray-400 hover:text-gray-700'}`}
                                >
                                    {g}
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* Team Dropdown */}
                    <div>
                        <label className={`block text-xs font-bold uppercase mb-2 ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>Team</label>
                        <select 
                            value={selectedTeamId} 
                            onChange={(e) => setSelectedTeamId(e.target.value)}
                            disabled={!selectedBaseName || registeredTeams.length === 0}
                            className={`w-full px-3 py-2.5 border rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none ${darkMode ? 'bg-gray-700 border-gray-600 text-white' : 'bg-white border-gray-300'}`}
                        >
                            <option value="">-- Choose Team --</option>
                            {registeredTeams.map(t => <option key={t.id} value={t.id}>{t.name} ({t.code})</option>)}
                        </select>
                    </div>
                </div>
            </div>

            {/* Player List */}
            <div className={`rounded-xl shadow-sm border overflow-hidden mb-6 ${darkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-100'}`}>
                <div className={`px-6 py-4 border-b flex justify-between items-center ${darkMode ? 'bg-gray-700/50 border-gray-700' : 'bg-gray-50/50 border-gray-100'}`}>
                    <h3 className="font-bold flex items-center gap-2"><Users size={18} className="text-gray-400"/> Player List</h3>
                    <span className="text-xs font-bold px-2 py-1 rounded-full bg-indigo-100 text-indigo-700">{teamPlayers.length} Players</span>
                </div>

                {!selectedTeamId ? (
                    <EmptyState text="Please select a team to view roster." darkMode={darkMode} />
                ) : teamPlayers.length === 0 ? (
                    <EmptyState text="No players found in this team." darkMode={darkMode} />
                ) : (
                    <div className="overflow-x-auto">
                        <table className="w-full text-left">
                            <thead className={darkMode ? 'bg-gray-700/50 text-gray-300' : 'bg-gray-50 text-gray-500'}>
                                <tr>
                                    <th className="px-6 py-3 text-xs font-bold uppercase tracking-wider">No.</th>
                                    <th className="px-6 py-3 text-xs font-bold uppercase tracking-wider">Name</th>
                                    <th className="px-6 py-3 text-xs font-bold uppercase tracking-wider">Position</th>
                                    <th className="px-6 py-3 text-right text-xs font-bold uppercase tracking-wider">Actions</th>
                                </tr>
                            </thead>
                            <tbody className={`divide-y ${darkMode ? 'divide-gray-700' : 'divide-gray-100'}`}>
                                {teamPlayers.map(p => (
                                    <tr key={p.id} className={`transition ${darkMode ? 'hover:bg-gray-700' : 'hover:bg-gray-50'}`}>
                                        <td className="px-6 py-4 font-mono font-bold text-indigo-500">{p.number}</td>
                                        <td className="px-6 py-4">
                                            <div className="flex items-center gap-3">
                                                <div className="w-8 h-8 rounded-full bg-gray-200 overflow-hidden">
                                                    {p.photo ? <img src={p.photo} alt="" className="w-full h-full object-cover"/> : <User className="w-full h-full p-1 text-gray-400"/>}
                                                </div>
                                                <div className="font-medium">
                                                    {p.first_name} {p.last_name}
                                                    {p.is_captain && <span className="ml-2 text-[10px] bg-yellow-400 text-yellow-900 px-1.5 py-0.5 rounded-full font-bold">C</span>}
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4"><span className="px-2 py-1 bg-blue-50 text-blue-700 rounded text-xs font-bold border border-blue-100">{p.position}</span></td>
                                        <td className="px-6 py-4 text-right">
                                            <button onClick={() => setViewingPlayer(p)} className="p-2 bg-indigo-50 text-indigo-600 hover:bg-indigo-100 rounded-lg transition" title="View Details">
                                                <Eye size={18} />
                                            </button>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>

            {/* Staff List */}
            {selectedTeamId && (
                <div className={`rounded-xl shadow-sm border overflow-hidden ${darkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-100'}`}>
                    <div className={`px-6 py-4 border-b flex justify-between items-center ${darkMode ? 'bg-gray-700/50 border-gray-700' : 'bg-gray-50/50 border-gray-100'}`}>
                        <h3 className="font-bold flex items-center gap-2"><Briefcase size={18} className="text-gray-400"/> Staff List</h3>
                        <span className="text-xs font-bold px-2 py-1 rounded-full bg-indigo-100 text-indigo-700">{teamStaff.length} Staff</span>
                    </div>

                    {teamStaff.length === 0 ? (
                        <EmptyState text="No staff members found in this team." darkMode={darkMode} />
                    ) : (
                        <div className="overflow-x-auto">
                            <table className="w-full text-left">
                                <thead className={darkMode ? 'bg-gray-700/50 text-gray-300' : 'bg-gray-50 text-gray-500'}>
                                    <tr>
                                        <th className="px-6 py-3 text-xs font-bold uppercase tracking-wider">Name</th>
                                        <th className="px-6 py-3 text-xs font-bold uppercase tracking-wider">Role</th>
                                    </tr>
                                </thead>
                                <tbody className={`divide-y ${darkMode ? 'divide-gray-700' : 'divide-gray-100'}`}>
                                    {teamStaff.map(s => (
                                        <tr key={s.id} className={`transition ${darkMode ? 'hover:bg-gray-700' : 'hover:bg-gray-50'}`}>
                                            <td className="px-6 py-4 font-medium">{s.first_name} {s.last_name}</td>
                                            <td className="px-6 py-4"><span className="px-2 py-1 bg-purple-50 text-purple-700 rounded text-xs font-bold border border-purple-100">{s.role}</span></td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    )}
                </div>
            )}

            {/* Modal: View Player */}
            {viewingPlayer && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-md p-4 animate-in fade-in duration-200">
                    <div className={`relative w-full max-w-md rounded-3xl shadow-2xl overflow-hidden flex flex-col ${darkMode ? 'bg-gray-900 text-gray-100' : 'bg-white text-gray-900'}`}>
                        
                        {/* Header Background with Profile Image */}
                        <div className="relative h-32 bg-gradient-to-r from-indigo-600 to-purple-600">
                            <button 
                                onClick={() => setViewingPlayer(null)} 
                                className="absolute top-4 right-4 text-white/80 hover:text-white hover:bg-white/20 p-2 rounded-full transition z-10"
                            >
                                <X size={20}/>
                            </button>
                            <div className="absolute -bottom-16 left-1/2 -translate-x-1/2">
                                <div className={`w-32 h-32 rounded-full border-4 shadow-xl overflow-hidden flex items-center justify-center ${darkMode ? 'border-gray-900 bg-gray-800' : 'border-white bg-gray-100'}`}>
                                    {viewingPlayer.photo ? (
                                        <img src={viewingPlayer.photo} alt="Player" className="w-full h-full object-cover"/>
                                    ) : (
                                        <User size={64} className="text-gray-400"/>
                                    )}
                                </div>
                            </div>
                        </div>

                        {/* Content */}
                        <div className="pt-20 pb-8 px-8 flex flex-col items-center">
                            
                            {/* Name & Team */}
                            <div className="text-center mb-6">
                                <h2 className="text-2xl font-black tracking-tight mb-1">
                                    {viewingPlayer.first_name} {viewingPlayer.last_name}
                                </h2>
                                <div className="flex items-center justify-center gap-2 text-sm font-medium text-gray-500 dark:text-gray-400">
                                    <Shield size={14} className="text-indigo-500"/>
                                    <span>{registeredTeams.find(t => t.id === selectedTeamId)?.name || 'Unknown Team'}</span>
                                </div>
                            </div>

                            {/* Badges (Captain / Position) */}
                            <div className="flex gap-3 mb-8">
                                <span className="px-3 py-1 rounded-full text-xs font-bold bg-indigo-100 text-indigo-700 dark:bg-indigo-900/50 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-700 uppercase tracking-wider">
                                    {viewingPlayer.position || 'N/A'}
                                </span>
                                <span className="px-3 py-1 rounded-full text-xs font-bold bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300 border border-gray-200 dark:border-gray-700 font-mono">
                                    #{viewingPlayer.number}
                                </span>
                                {viewingPlayer.is_captain && (
                                    <span className="px-3 py-1 rounded-full text-xs font-bold bg-yellow-100 text-yellow-700 dark:bg-yellow-900/50 dark:text-yellow-300 border border-yellow-200 dark:border-yellow-700 flex items-center gap-1">
                                        <CheckCircle size={12}/> Captain
                                    </span>
                                )}
                            </div>

                            {/* Stats Grid */}
                            <div className="w-full grid grid-cols-2 gap-4">
                                <div className={`p-4 rounded-2xl border text-center ${darkMode ? 'bg-gray-800 border-gray-700' : 'bg-gray-50 border-gray-100'}`}>
                                    <div className="text-xs text-gray-500 uppercase font-bold mb-1">Height</div>
                                    <div className="text-xl font-black text-indigo-600 dark:text-indigo-400">
                                        {viewingPlayer.height_cm ? `${viewingPlayer.height_cm}` : '-'} <span className="text-sm text-gray-400 font-normal">cm</span>
                                    </div>
                                </div>
                                <div className={`p-4 rounded-2xl border text-center ${darkMode ? 'bg-gray-800 border-gray-700' : 'bg-gray-50 border-gray-100'}`}>
                                    <div className="text-xs text-gray-500 uppercase font-bold mb-1">Weight</div>
                                    <div className="text-xl font-black text-indigo-600 dark:text-indigo-400">
                                        {viewingPlayer.weight ? `${viewingPlayer.weight}` : '-'} <span className="text-sm text-gray-400 font-normal">kg</span>
                                    </div>
                                </div>
                                <div className={`p-4 rounded-2xl border text-center col-span-2 ${darkMode ? 'bg-gray-800 border-gray-700' : 'bg-gray-50 border-gray-100'}`}>
                                    <div className="text-xs text-gray-500 uppercase font-bold mb-1">Date of Birth</div>
                                    <div className="text-lg font-bold">
                                        {viewingPlayer.birth_date ? new Date(viewingPlayer.birth_date).toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' }) : '-'}
                                    </div>
                                </div>
                            </div>

                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}