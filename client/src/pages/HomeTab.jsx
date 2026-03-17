import React, { useEffect, useState } from 'react';
import client from '../api';
import { Calendar, MapPin, Clock, Shield, Filter } from 'lucide-react';
import { EmptyState } from './AdminShared';
import { formatThaiDate, formatThaiTime } from '../utils';

export default function HomeTab({ darkMode }) {
    const [competitions, setCompetitions] = useState([]);
    const [selectedCompetition, setSelectedCompetition] = useState(null);
    const [matches, setMatches] = useState([]);
    const [teams, setTeams] = useState([]);
    const [loading, setLoading] = useState(false);
    const [filterStatus, setFilterStatus] = useState('all');


    const fetchCompetitions = async () => {
        try {
            const res = await client.get('/admin/competitions');
            const openComps = res.data.filter(c => c.status?.toLowerCase() === 'open');
            setCompetitions(openComps);
            if (openComps.length > 0) {
                setSelectedCompetition(openComps[0]);
            }
        } catch (err) { console.error(err); }
    };

    const fetchMatches = async (compId) => {
        setLoading(true);
        try {
            const res = await client.get(`/competitions/${compId}/matches`);
            // Optional: Sort matches (default by match_number)
            const sorted = res.data.sort((a, b) => {
                return (parseInt(a.match_number) || 0) - (parseInt(b.match_number) || 0);
            });
            setMatches(sorted);
        } catch (err) {
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    const fetchTeams = async (compId) => {
        try {
            const res = await client.get(`/admin/competitions/${compId}/teams`);
            setTeams(res.data);
        } catch (err) { console.error(err); }
    };

    useEffect(() => {
        fetchCompetitions();
    }, []);

    useEffect(() => {
        if (selectedCompetition) {
            fetchMatches(selectedCompetition.id);
            fetchTeams(selectedCompetition.id);
        } else {
            setMatches([]);
            setTeams([]);
        }
    }, [selectedCompetition]);

    const filteredMatches = matches.filter(m => {
        if (filterStatus === 'all') return true;
        if (filterStatus === 'completed') return m.status === 'completed';
        if (filterStatus === 'scheduled') return m.status !== 'completed';
        return true;
    });

    const completedCount = matches.filter(m => m.status === 'completed').length;
    const scheduledCount = matches.filter(m => m.status !== 'completed').length;

    return (
        <div className="space-y-6">
            <div className={`p-6 rounded-xl shadow-sm border ${darkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-100'}`}>
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-4">
                    <div>
                        <h2 className="text-xl font-bold flex items-center gap-2">
                            <Calendar className="text-indigo-500" /> Match Schedule
                        </h2>
                        <p className={`text-sm ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                            Select a competition to view matches.
                        </p>
                    </div>
                    <div>
                        <select
                            className={`p-2 rounded-lg border text-sm transition focus:ring-2 focus:ring-indigo-500 outline-none ${darkMode ? 'bg-gray-700 border-gray-600 text-white' : 'bg-white border-gray-300'}`}
                            value={selectedCompetition?.id || ''}
                            onChange={(e) => {
                                const comp = competitions.find(c => c.id === parseInt(e.target.value));
                                setSelectedCompetition(comp);
                            }}
                        >
                            <option value="">-- Select Competition --</option>
                            {competitions.map(c => (
                                <option key={c.id} value={c.id}>
                                    {c.name || c.title} ({c.status})
                                </option>
                            ))}
                        </select>
                    </div>
                </div>
                
                {/* Filter Buttons */}
                <div className="flex items-center gap-2 mt-4 pt-4 border-t border-gray-100 dark:border-gray-700">
                    <Filter size={16} className="text-gray-400" />
                    <span className="text-sm text-gray-500 dark:text-gray-400 mr-2">Filter:</span>
                    <button 
                        onClick={() => setFilterStatus('all')} 
                        className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-colors ${filterStatus === 'all' ? 'bg-indigo-600 text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200 dark:bg-gray-700 dark:text-gray-300 dark:hover:bg-gray-600'}`}
                    >
                        All Matches ({matches.length})
                    </button>
                    <button 
                        onClick={() => setFilterStatus('completed')} 
                        className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-colors ${filterStatus === 'completed' ? 'bg-green-600 text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200 dark:bg-gray-700 dark:text-gray-300 dark:hover:bg-gray-600'}`}
                    >
                        Finished ({completedCount})
                    </button>
                    <button 
                        onClick={() => setFilterStatus('scheduled')} 
                        className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-colors ${filterStatus === 'scheduled' ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200 dark:bg-gray-700 dark:text-gray-300 dark:hover:bg-gray-600'}`}
                    >
                        Scheduled ({scheduledCount})
                    </button>
                </div>
            </div>

            {selectedCompetition ? (
                loading ? (
                    <div className="text-center py-10">Loading matches...</div>
                ) : (
                    <div className="space-y-4">
                        {filteredMatches.map((match) => (
                            <div key={match.id} className={`group relative p-5 rounded-xl border transition-all hover:shadow-md ${darkMode ? 'bg-gray-800 border-gray-700 hover:bg-gray-750' : 'bg-white border-gray-200 shadow-sm hover:bg-gray-50'}`}>
                                <div className="flex flex-col md:flex-row items-center gap-6">
                                    {/* Left: Match Info */}
                                    <div className="flex flex-row md:flex-col items-center md:items-start gap-3 md:gap-1 min-w-[120px] border-b md:border-b-0 md:border-r border-gray-200 dark:border-gray-700 pb-3 md:pb-0 md:pr-6 w-full md:w-auto justify-between md:justify-start">
                                        <div>
                                            <span className="text-xs font-bold text-indigo-500 uppercase tracking-wider">Match #{match.match_number}</span>
                                            <div className="text-sm font-bold text-gray-700 dark:text-gray-200">{match.round_name}</div>
                                        </div>
                                        <div className={`px-2 py-1 rounded text-[10px] font-bold uppercase tracking-wide border ${
                                            match.gender === 'Female' 
                                                ? 'bg-pink-50 text-pink-600 border-pink-200 dark:bg-pink-900/30 dark:text-pink-300 dark:border-pink-800' 
                                                : match.gender === 'Mix'
                                                    ? 'bg-purple-50 text-purple-600 border-purple-200 dark:bg-purple-900/30 dark:text-purple-300 dark:border-purple-800'
                                                    : 'bg-blue-50 text-blue-600 border-blue-200 dark:bg-blue-900/30 dark:text-blue-300 dark:border-blue-800'
                                        }`}>
                                            {match.gender || 'Male'}
                                        </div>
                                    </div>

                                    {/* Center: Teams */}
                                    <div className="flex-1 flex flex-col md:flex-row items-center justify-center gap-4 w-full">
                                        <div className="flex-1 flex flex-col md:flex-row items-center justify-center md:justify-end gap-3 w-full">
                                            <div className={`font-bold text-lg md:text-xl leading-tight break-words text-center md:text-right order-2 md:order-1 ${match.status === 'completed' && Number(match.home_set_score) > Number(match.away_set_score) ? 'text-green-600 dark:text-green-400' : 'text-gray-900 dark:text-white'}`}>
                                            {teams.find(t => t.id == match.home_team_id)?.name || match.home_team || 'TBD'}
                                            </div>
                                            <div className="w-12 h-12 rounded-full bg-white dark:bg-gray-700 flex items-center justify-center overflow-hidden border border-gray-200 dark:border-gray-600 shadow-sm order-1 md:order-2 shrink-0">
                                                {teams.find(t => t.id == match.home_team_id)?.logo_url ? (
                                                    <img src={teams.find(t => t.id == match.home_team_id).logo_url} alt="Home" className="w-full h-full object-contain p-1" />
                                                ) : <Shield size={20} className="text-gray-300 dark:text-gray-500" />}
                                            </div>
                                        </div>
                                        
                                        <div className="flex flex-col items-center shrink-0">
                                            {(match.status === 'completed' || (match.home_set_score || 0) > 0 || (match.away_set_score || 0) > 0) ? (
                                                <div className="flex flex-col items-center">
                                                    <div className="px-4 py-1 rounded-lg bg-gray-800 text-white font-mono text-xl font-bold tracking-widest mb-1">
                                                        {match.home_set_score || 0} - {match.away_set_score || 0}
                                                    </div>
                                                    {match.set_scores && (
                                                        <div className="text-xs text-gray-500 dark:text-gray-400 mb-1 max-w-[150px] text-center break-words">
                                                            {(() => {
                                                                try {
                                                                    const sets = typeof match.set_scores === 'string' ? JSON.parse(match.set_scores) : (Array.isArray(match.set_scores) ? match.set_scores : null);
                                                                    return sets ? sets.join(', ') : null;
                                                                } catch { return match.set_scores; }
                                                            })()}
                                                        </div>
                                                    )}
                                                    {match.status === 'completed' && (
                                                        <span className="px-2 py-0.5 rounded bg-green-100 text-green-700 text-[10px] font-bold border border-green-200 whitespace-nowrap dark:bg-green-900 dark:text-green-300 dark:border-green-800">
                                                            จบการแข่งขัน
                                                        </span>
                                                    )}
                                                </div>
                                            ) : (
                                                <div className="px-3 py-1 rounded-lg bg-gray-100 dark:bg-gray-700 font-mono text-sm font-bold text-gray-500 dark:text-gray-400">VS</div>
                                            )}
                                        </div>
                                        
                                        <div className="flex-1 flex flex-col md:flex-row items-center justify-center md:justify-start gap-3 w-full">
                                            <div className="w-12 h-12 rounded-full bg-white dark:bg-gray-700 flex items-center justify-center overflow-hidden border border-gray-200 dark:border-gray-600 shadow-sm shrink-0">
                                                {teams.find(t => t.id == match.away_team_id)?.logo_url ? (
                                                    <img src={teams.find(t => t.id == match.away_team_id).logo_url} alt="Away" className="w-full h-full object-contain p-1" />
                                                ) : <Shield size={20} className="text-gray-300 dark:text-gray-500" />}
                                            </div>
                                            <div className={`font-bold text-lg md:text-xl leading-tight break-words text-center md:text-left ${match.status === 'completed' && Number(match.away_set_score) > Number(match.home_set_score) ? 'text-green-600 dark:text-green-400' : 'text-gray-900 dark:text-white'}`}>
                                                {teams.find(t => t.id == match.away_team_id)?.name || match.away_team || 'TBD'}
                                            </div>
                                        </div>
                                    </div>

                                    {/* Right: Meta */}
                                    <div className="flex flex-row md:flex-col gap-4 md:gap-1 text-sm text-gray-500 dark:text-gray-400 min-w-[160px] justify-center md:justify-end text-center md:text-right border-t md:border-t-0 md:border-l border-gray-200 dark:border-gray-700 pt-3 md:pt-0 md:pl-6 w-full md:w-auto">
                                        <div className="flex items-center justify-center md:justify-end gap-2"><Calendar size={14} className="text-indigo-400"/> {match.start_time ? formatThaiDate(match.start_time) : 'Date TBD'}</div>
                                        <div className="flex items-center justify-center md:justify-end gap-2"><Clock size={14} className="text-indigo-400"/> {match.start_time ? formatThaiTime(match.start_time) : 'Time TBD'}</div>
                                        <div className="flex items-center justify-center md:justify-end gap-2"><MapPin size={14} className="text-indigo-400"/> {match.location || 'Location TBD'}</div>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                )
            ) : (
                <EmptyState text="Please select a competition to view matches." darkMode={darkMode} />
            )}
        </div>
    );
}
