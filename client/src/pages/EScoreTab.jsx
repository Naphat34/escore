import React, { useEffect, useState } from 'react';
import api from '../api';
import { Swords, Calendar, MapPin, PlayCircle, Trophy } from 'lucide-react';
import LiveMatchScorer from './LiveMatchScorer';
import { EmptyState } from './AdminShared';

export default function EScoreTab({ darkMode }) {
    const [competitions, setCompetitions] = useState([]);
    const [matches, setMatches] = useState([]);
    const [activeMatch, setActiveMatch] = useState(null);

    // Grouping State
    const [uniqueBaseNames, setUniqueBaseNames] = useState([]);
    const [selectedBaseName, setSelectedBaseName] = useState('');
    const [filterGender, setFilterGender] = useState('');
    const [availableGenders, setAvailableGenders] = useState([]);

    useEffect(() => {
        fetchCompetitions();
    }, []);

    useEffect(() => {
        if (selectedBaseName && competitions.length > 0) {
            const relatedComps = competitions.filter(c => {
                const rawTitle = c.title || c.name || '';
                const cBase = rawTitle.replace(/\s\((Male|Female|Mix|Mixed)\)$/i, '').trim();
                return cBase === selectedBaseName;
            });

            const genders = [...new Set(relatedComps.map(c => c.gender))].filter(Boolean).sort();
            setAvailableGenders(['All', ...genders]);

            if (!filterGender || (filterGender !== 'All' && !genders.includes(filterGender))) {
                setFilterGender('All');
            }
        }
    }, [selectedBaseName, competitions]);

    useEffect(() => {
        fetchMatches();
    }, [selectedBaseName, filterGender, competitions]);

    const fetchCompetitions = async () => {
        try {
            const res = await api.get('/admin/competitions');
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
            console.error("Fetch competitions error:", err);
        }
    };

    const fetchMatches = async () => {
        if (!selectedBaseName) return;
        setMatches([]);

        try {
            let targetComps = [];
            if (filterGender === 'All') {
                targetComps = competitions.filter(c => {
                    const rawTitle = c.title || c.name || '';
                    const cBase = rawTitle.replace(/\s\((Male|Female|Mix|Mixed)\)$/i, '').trim();
                    return cBase === selectedBaseName;
                });
            } else {
                const targetComp = competitions.find(c => {
                    const rawTitle = c.title || c.name || '';
                    const cBase = rawTitle.replace(/\s\((Male|Female|Mix|Mixed)\)$/i, '').trim();
                    return cBase === selectedBaseName && c.gender === filterGender;
                });
                if (targetComp) targetComps = [targetComp];
            }

            if (targetComps.length === 0) return;

            const promises = targetComps.map(c => api.get(`/competitions/${c.id}/matches`));
            const results = await Promise.all(promises);
            
            let allMatches = [];
            results.forEach((res, index) => {
                if (res.data) {
                    const comp = targetComps[index];
                    const matchesWithInfo = res.data.map(m => ({
                        ...m,
                        competition_name: comp.title || comp.name,
                        gender: comp.gender
                    }));
                    allMatches = [...allMatches, ...matchesWithInfo];
                }
            });

            allMatches.sort((a, b) => (parseInt(a.match_number) || 0) - (parseInt(b.match_number) || 0));
            setMatches(allMatches);
        } catch (err) {
            console.error("Fetch matches error:", err);
        }
    };

    // ถ้ามีการเลือกแมตช์ ให้แสดงหน้าจอ Live Scorer (แบบ Full Screen Overlay)
    if (activeMatch) {
        return (
            <LiveMatchScorer 
                match={activeMatch} 
                onClose={() => { setActiveMatch(null); fetchMatches(); }}
                isReadOnly={activeMatch.status === 'completed'} // ส่ง prop isReadOnly ถ้าแมตช์จบแล้ว
            />
        );
    }

    return (
        <div className={`min-h-screen p-6 transition-colors duration-200 ${darkMode ? 'bg-gray-900 text-gray-100' : 'bg-gray-50 text-gray-800'}`}>
            <div className="flex justify-between items-center mb-6">
                <h1 className="text-2xl font-bold flex items-center gap-2">
                    <Swords className="text-indigo-600" /> E-Score Console
                </h1>
                
                <div className="flex flex-col md:flex-row gap-3 w-full md:w-auto">
                    <div className="w-full md:w-64">
                        <label className={`block text-xs font-bold uppercase mb-1 ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>Competition</label>
                        <select 
                            className={`w-full p-2 rounded-lg border shadow-sm focus:ring-2 focus:ring-indigo-500 ${darkMode ? 'bg-gray-800 border-gray-700 text-white' : 'bg-white border-gray-300'}`}
                            value={selectedBaseName}
                            onChange={(e) => setSelectedBaseName(e.target.value)}
                        >
                            {uniqueBaseNames.length === 0 && <option value="">Loading...</option>}
                            {uniqueBaseNames.map(name => (
                                <option key={name} value={name}>{name}</option>
                            ))}
                        </select>
                    </div>

                    <div>
                        <label className={`block text-xs font-bold uppercase mb-1 ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>Gender</label>
                        <div className="flex bg-gray-100 dark:bg-gray-700 rounded-lg p-1">
                            {availableGenders.map(g => (
                                <button 
                                    key={g} 
                                    onClick={() => setFilterGender(g)} 
                                    className={`px-3 py-1.5 text-xs font-bold rounded-md transition ${filterGender === g ? 'bg-white dark:bg-gray-600 text-indigo-600 dark:text-indigo-400 shadow-sm' : 'text-gray-500 dark:text-gray-400 hover:text-gray-700'}`}
                                >
                                    {g}
                                </button>
                            ))}
                        </div>
                    </div>
                </div>
            </div>

            <div className={`p-6 rounded-xl shadow-sm border ${darkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'}`}>
                <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                    <Trophy size={20} className="text-yellow-500"/> Select Match to Record
                </h3>
                
                <div className="space-y-3">
                    {matches.length === 0 ? (
                        <EmptyState text="No matches found in this competition." darkMode={darkMode} />
                    ) : (
                        matches.map(m => {
                            const isCompleted = m.status === 'completed';
                            return (
                                <div key={m.id} className={`p-4 rounded-xl border flex flex-col md:flex-row justify-between items-center gap-4 transition-all hover:shadow-md ${darkMode ? 'bg-gray-700/30 border-gray-600 hover:bg-gray-700' : 'bg-white border-gray-200 hover:bg-gray-50'}`}>
                                    <div className="flex-1">
                                        <div className="flex items-center gap-2 mb-1">
                                            <span className="text-xs font-bold px-2 py-0.5 rounded bg-indigo-100 text-indigo-700 dark:bg-indigo-900 dark:text-indigo-300">#{m.match_number || '-'}</span>
                                            <span className={`text-xs font-bold px-2 py-0.5 rounded ${
                                                m.gender === 'Female' 
                                                ? 'bg-pink-100 text-pink-700 dark:bg-pink-900 dark:text-pink-300' 
                                                : m.gender === 'Male' ? 'bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300' 
                                                : 'bg-purple-100 text-purple-700 dark:bg-purple-900 dark:text-purple-300'
                                            }`}>{m.gender}</span>
                                            <span className={`text-xs font-bold px-2 py-0.5 rounded ${isCompleted ? 'bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300' : 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900 dark:text-yellow-300'}`}>{isCompleted ? 'Finished' : 'Scheduled'}</span>
                                        </div>
                                        <div className="text-lg font-bold flex items-center gap-3"><span className={m.home_set_score > m.away_set_score ? 'text-green-600 dark:text-green-400' : ''}>{m.home_team}</span><span className="text-gray-400 text-sm">VS</span><span className={m.away_set_score > m.home_set_score ? 'text-green-600 dark:text-green-400' : ''}>{m.away_team}</span></div>
                                        <div className="text-sm text-gray-500 dark:text-gray-400 flex items-center gap-4 mt-1"><span className="flex items-center gap-1"><Calendar size={14}/> {m.start_time ? new Date(m.start_time).toLocaleString() : 'TBD'}</span><span className="flex items-center gap-1"><MapPin size={14}/> {m.location || '-'}</span></div>
                                    </div>
                                    <button 
                                        onClick={() => setActiveMatch(m)}
                                        className={`px-6 py-3 rounded-xl font-bold flex items-center gap-2 shadow-lg transition-all transform active:scale-95 ${isCompleted ? 'bg-gray-200 text-gray-600 dark:bg-gray-600 dark:text-gray-400' : 'bg-gradient-to-r from-rose-500 to-pink-600 text-white hover:from-rose-600 hover:to-pink-700 shadow-rose-500/30'}`}
                                    >
                                        <PlayCircle size={20} /> {isCompleted ? 'View Record' : 'Start Recording'}
                                    </button>
                                </div>
                            );
                        })
                    )}
                </div>
            </div>
        </div>
    );
}