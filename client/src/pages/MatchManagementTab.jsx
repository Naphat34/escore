import React, { useEffect, useState } from 'react';
import client, { api } from '../api'; // ✅ Import api ให้ถูกต้อง
import {
    Swords, PlusCircle, X, Calendar, MapPin, Edit2, Trash2,
    Printer, ListFilter, Save, Clock, Shield, Trophy
} from 'lucide-react';
import Swal from 'sweetalert2';
import { Toast, Input, Button } from './AdminShared'; // ตรวจสอบ path ว่าถูกต้องไหม

export default function MatchManagementTab({ darkMode }) {
    // --- State Management ---
    const [competitions, setCompetitions] = useState([]);
    const [matches, setMatches] = useState([]);
    const [registeredTeams, setRegisteredTeams] = useState([]); // ทีมที่สมัครในรายการนี้
    const [stadiums, setStadiums] = useState([]); // สนามแข่ง
    const [uniqueBaseNames, setUniqueBaseNames] = useState([]);
    const [selectedBaseName, setSelectedBaseName] = useState('');
    const [filterGender, setFilterGender] = useState('');
    const [availableGenders, setAvailableGenders] = useState([]);
    const [selectedCompId, setSelectedCompId] = useState('');

    const [loading, setLoading] = useState(false);
    const [showModal, setShowModal] = useState(false);
    const [isEditing, setIsEditing] = useState(false);

    // Form Data
    const initialForm = {
        id: null,
        home_team_id: '',
        away_team_id: '',
        start_time: '',
        location: '', // เก็บชื่อสนาม หรือ ID
        match_number: '',
        round_name: 'Round 1',
        pool_name: '',
        gender: 'Male' // Default
    };
    const [matchForm, setMatchForm] = useState(initialForm);

    // State สำหรับ Modal บันทึกคะแนน
    const [scoringMatch, setScoringMatch] = useState(null);
    const [scoreForm, setScoreForm] = useState({
        home_set_score: 0,
        away_set_score: 0,
        set_scores: [], // e.g., ["25-20", "25-18", "25-22"]
    });

    // --- 1. Load Initial Data (Competitions & Stadiums) ---
    useEffect(() => {
        fetchCompetitions();
        fetchStadiums();
    }, []);

    // --- 2. Load Matches & Teams when BaseName or FilterGender Changes ---
    useEffect(() => {
        fetchMatchData();
    }, [selectedBaseName, filterGender, competitions]);

    // --- API Functions ---
    const fetchCompetitions = async () => {
        try {
            const res = await api.getAllCompetitions();
            setCompetitions(res.data);

            // Extract unique base names
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

    // Effect: Update available genders when base name changes
    useEffect(() => {
        if (selectedBaseName && competitions.length > 0) {
            const relatedComps = competitions.filter(c => {
                const rawTitle = c.title || c.name || '';
                const cBase = rawTitle.replace(/\s\((Male|Female|Mix|Mixed)\)$/i, '').trim();
                return cBase === selectedBaseName;
            });

            const genders = [...new Set(relatedComps.map(c => c.gender))].filter(Boolean).sort();
            setAvailableGenders(genders);

            // Default select 'All' if current selection is invalid
            if (filterGender !== 'All' && !genders.includes(filterGender)) {
                setFilterGender('All');
            }
        }
    }, [selectedBaseName, competitions]);

    // Effect: Update selectedCompId based on base name + gender
    useEffect(() => {
        if (selectedBaseName && filterGender) {
            const targetComp = competitions.find(c => {
                const rawTitle = c.title || c.name || '';
                const cBase = rawTitle.replace(/\s\((Male|Female|Mix|Mixed)\)$/i, '').trim();
                return cBase === selectedBaseName && c.gender === filterGender;
            });

            if (targetComp) {
                setSelectedCompId(targetComp.id);
            } else {
                setSelectedCompId('');
            }
        } else {
            setSelectedCompId('');
        }
    }, [selectedBaseName, filterGender, competitions]);

    const fetchStadiums = async () => {
        try {
            const res = await api.getStadiums();
            setStadiums(res.data);
        } catch (err) {
            console.error("Error fetching stadiums:", err);
        }
    };

    const fetchMatchData = async () => {
        if (!selectedBaseName) return;

        setLoading(true);
        setMatches([]);
        setRegisteredTeams([]);

        try {
            // 1. หา Competition IDs ที่เกี่ยวข้องตาม Filter
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

            if (targetComps.length === 0) {
                setLoading(false);
                return;
            }

            // 2. ดึง Matches และ Teams จากทุก Comp ที่หาได้
            const matchPromises = targetComps.map(c => api.getMatchesByCompetition(c.id));
            const teamPromises = targetComps.map(c => api.getTeamsByCompetition(c.id));

            const [matchResults, teamResults] = await Promise.all([
                Promise.all(matchPromises),
                Promise.all(teamPromises)
            ]);

            // 3. รวมข้อมูล Matches
            let allMatches = [];
            matchResults.forEach(res => { if (res.data) allMatches = [...allMatches, ...res.data]; });
            // เรียงตาม Match Number
            allMatches.sort((a, b) => (parseInt(a.match_number) || 0) - (parseInt(b.match_number) || 0));
            setMatches(allMatches);

            // 4. รวมข้อมูล Teams (ตัดตัวซ้ำ)
            let allTeams = [];
            const teamIds = new Set();
            teamResults.forEach(res => {
                if (res.data) {
                    res.data.forEach(t => {
                        if (!teamIds.has(t.id)) {
                            teamIds.add(t.id);
                            allTeams.push(t);
                        }
                    });
                }
            });
            setRegisteredTeams(allTeams);

        } catch (err) {
            console.error("Fetch matches error:", err);
            Toast.fire({ icon: 'error', title: 'Failed to load matches' });
        } finally {
            setLoading(false);
        }
    };

    // --- Handlers ---
    const handleOpenCreate = () => {
        if (!selectedBaseName) {
            return Swal.fire('Warning', 'Please select a competition first', 'warning');
        }
        // หาแมตช์ล่าสุดเพื่อ Auto Run Number
        const nextMatchNum = matches.length > 0 
            ? Math.max(...matches.map(m => parseInt(m.match_number) || 0)) + 1 
            : 1;

        setMatchForm({ ...initialForm, match_number: nextMatchNum, gender: filterGender || 'Male' });
        setIsEditing(false);
        setShowModal(true);
    };

    const handleEditMatch = (match) => {
        setMatchForm({
            id: match.id,
            home_team_id: match.home_team_id || '',
            away_team_id: match.away_team_id || '',
            start_time: match.start_time ? match.start_time.slice(0, 16) : '', // Format for datetime-local
            location: match.location || '',
            match_number: match.match_number,
            round_name: match.round_name || 'Round 1',
            pool_name: match.pool_name || '',
            gender: match.gender || 'Male'
        });
        setIsEditing(true);
        setShowModal(true);
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        
        // Validation
        if (!matchForm.home_team_id || !matchForm.away_team_id) {
            return Toast.fire({ icon: 'warning', title: 'Please select both teams' });
        }
        if (matchForm.home_team_id === matchForm.away_team_id) {
            return Toast.fire({ icon: 'warning', title: 'Teams must be different' });
        }

        // หา Competition ID ที่ถูกต้อง (กรณีเลือก All ต้องหาจาก Gender ในฟอร์ม)
        let targetCompId = selectedCompId;
        if (!targetCompId) {
            const foundComp = competitions.find(c => {
                const rawTitle = c.title || c.name || '';
                const cBase = rawTitle.replace(/\s\((Male|Female|Mix|Mixed)\)$/i, '').trim();
                return cBase === selectedBaseName && c.gender === matchForm.gender;
            });
            if (foundComp) targetCompId = foundComp.id;
            else {
                return Toast.fire({ icon: 'error', title: `No competition found for gender: ${matchForm.gender}` });
            }
        }

        const payload = {
            ...matchForm,
            competition_id: targetCompId
        };

        try {
            if (isEditing) {
                await api.updateMatch(matchForm.id, payload);
                Toast.fire({ icon: 'success', title: 'Match updated' });
            } else {
                await api.createMatch(payload);
                Toast.fire({ icon: 'success', title: 'Match created' });
            }
            setShowModal(false);
            fetchMatchData(); // Refresh Data
        } catch (err) {
            console.error(err);
            Toast.fire({ icon: 'error', title: 'Failed to save match' });
        }
    };

    const handleDeleteMatch = async (id) => {
        const result = await Swal.fire({
            title: 'Delete Match?',
            text: "You won't be able to revert this!",
            icon: 'warning',
            showCancelButton: true,
            confirmButtonColor: '#d33',
            confirmButtonText: 'Yes, delete it!'
        });

        if (result.isConfirmed) {
            try {
                await api.deleteMatch(id);
                setMatches(prev => prev.filter(m => m.id !== id));
                Toast.fire({ icon: 'success', title: 'Deleted successfully' });
            } catch (err) {
                Toast.fire({ icon: 'error', title: 'Delete failed' });
            }
        }
    };

    const openScoreModal = (match) => {
        const comp = competitions.find(c => c.id == selectedCompId);
        const maxSets = comp?.max_sets || 5;

        let currentScores = Array.from({ length: maxSets }, () => "");
        if (match.set_scores) {
            // set_scores from DB might be a JSON string
            const parsed = typeof match.set_scores === 'string' ? JSON.parse(match.set_scores) : match.set_scores;
            if (Array.isArray(parsed)) {
                parsed.forEach((val, idx) => {
                    if (idx < maxSets) currentScores[idx] = val;
                });
            }
        }

        setScoreForm({
            home_set_score: match.home_set_score || 0,
            away_set_score: match.away_set_score || 0,
            set_scores: currentScores,
        });
        setScoringMatch(match);
    };

    const handleSaveScore = async () => {
        if (!scoringMatch) return;

        const comp = competitions.find(c => c.id == selectedCompId);
        const maxSets = comp?.max_sets || 5;
        const setsToWin = Math.ceil(maxSets / 2);

        const validSets = scoreForm.set_scores.filter(s => s && s.trim() !== "");

        let homeSetsWon = 0;
        let awaySetsWon = 0;
        validSets.forEach(s => {
            const [h, a] = s.split('-').map(v => parseInt(v, 10));
            if (!isNaN(h) && !isNaN(a)) {
                if (h > a) homeSetsWon++;
                else if (a > h) awaySetsWon++;
            }
        });

        const isCompleted = homeSetsWon >= setsToWin || awaySetsWon >= setsToWin;

        const payload = {
            home_set_score: homeSetsWon,
            away_set_score: awaySetsWon,
            set_scores: validSets, // ส่งเฉพาะเซตที่กรอก
            status: isCompleted ? 'completed' : 'scheduled',
        };

        try {
            await client.put(`/matches/${scoringMatch.id}/result`, payload);
            Toast.fire({ icon: 'success', title: 'Score saved!' });
            setScoringMatch(null);
            fetchMatchData(); // Refresh list
        } catch (err) {
            console.error(err);
            const errorMsg = err.response?.data?.error || 'Failed to save score';
            Toast.fire({ icon: 'error', title: errorMsg });
        }
    };

    // --- Render ---
    return (
        <div className={`p-6 min-h-screen ${darkMode ? 'bg-gray-900 text-white' : 'bg-gray-50 text-gray-800'}`}>
            
            {/* Header */}
            <div className="flex flex-col md:flex-row justify-between items-center mb-6 gap-4">
                <h2 className="text-2xl font-bold flex items-center gap-2">
                    <Swords className="text-indigo-500" /> Match Management
                </h2>
                
                {/* Competition Selector Group */}
                <div className="flex flex-col md:flex-row gap-3 w-full md:w-auto flex-1 justify-end">
                    <div className="w-full md:w-64">
                        <label className={`block text-xs font-bold uppercase mb-1 ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>Competition</label>
                        <select
                            value={selectedBaseName}
                            onChange={(e) => setSelectedBaseName(e.target.value)}
                            className={`w-full p-2.5 rounded-lg border ${darkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-300'}`}
                        >
                            {uniqueBaseNames.map(name => (
                                <option key={name} value={name}>{name}</option>
                            ))}
                        </select>
                    </div>
                    
                    <div>
                        <label className={`block text-xs font-bold uppercase mb-1 ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>Gender</label>
                        <div className="flex bg-gray-100 dark:bg-gray-700 rounded-lg p-1">
                            <button 
                                onClick={() => setFilterGender('All')} 
                                className={`px-3 py-1.5 text-xs font-bold rounded-md transition ${filterGender === 'All' ? 'bg-white dark:bg-gray-600 text-indigo-600 dark:text-indigo-400 shadow-sm' : 'text-gray-500 dark:text-gray-400 hover:text-gray-700'}`}
                            >
                                All
                            </button>
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

                {/* Create Button */}
                <div className="flex items-end">
                    <button
                        onClick={handleOpenCreate}
                        disabled={!selectedBaseName}
                        className={`px-4 py-2.5 rounded-lg flex items-center gap-2 transition-all h-[42px] ${
                            selectedBaseName 
                            ? 'bg-indigo-600 hover:bg-indigo-700 text-white shadow-lg' 
                            : 'bg-gray-300 text-gray-500 cursor-not-allowed'
                        }`}
                    >
                        <PlusCircle size={18} /> Add Match
                    </button>
                </div>
            </div>

            {/* Match List */}
            {loading ? (
                <div className="text-center py-10">Loading matches...</div>
            ) : matches.length === 0 ? (
                <div className={`text-center py-12 rounded-xl border-2 border-dashed ${darkMode ? 'border-gray-700 text-gray-500' : 'border-gray-300 text-gray-400'}`}>
                    {selectedBaseName ? "No matches found. Create one!" : "Please select a competition to view matches."}
                </div>
            ) : (
                <div className="space-y-4">
                    {matches.map((match) => (
                        <div key={match.id} className={`group relative p-5 rounded-xl border transition-all hover:shadow-md ${darkMode ? 'bg-gray-800 border-gray-700 hover:bg-gray-750' : 'bg-white border-gray-200 shadow-sm hover:bg-gray-50'}`}>
                            
                            <div className="flex flex-col md:flex-row items-center gap-6">
                                
                                {/* 1. Left: Match Details (Number, Round, Gender) */}
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

                                {/* 2. Center: Teams (Full Names) */}
                                <div className="flex-1 flex flex-col md:flex-row items-center justify-center gap-4 w-full">
                                    <div className="flex-1 flex flex-col md:flex-row items-center justify-center md:justify-end gap-3 w-full">
                                        <div className="font-bold text-lg md:text-xl text-gray-900 dark:text-white leading-tight break-words text-center md:text-right order-2 md:order-1">
                                        {registeredTeams.find(t => t.id == match.home_team_id)?.name || match.home_team || 'TBD'}
                                        </div>
                                        <div className="w-12 h-12 rounded-full bg-white dark:bg-gray-700 flex items-center justify-center overflow-hidden border border-gray-200 dark:border-gray-600 shadow-sm order-1 md:order-2 shrink-0">
                                            {registeredTeams.find(t => t.id == match.home_team_id)?.logo_url ? (
                                                <img src={registeredTeams.find(t => t.id == match.home_team_id).logo_url} alt="Home" className="w-full h-full object-contain p-1" />
                                            ) : (
                                                <Shield size={20} className="text-gray-300 dark:text-gray-500" />
                                            )}
                                        </div>
                                    </div>
                                    
                                    <div className="flex flex-col items-center shrink-0">
                                        {(match.status === 'completed' || match.home_set_score > 0 || match.away_set_score > 0) ? (
                                            <div className="flex flex-col items-center">
                                                <div className="px-4 py-1 rounded-lg bg-gray-800 text-white font-mono text-xl font-bold tracking-widest mb-1">
                                                    {match.home_set_score} - {match.away_set_score}
                                                </div>
                                                {match.set_scores && (
                                                    <div className="text-xs text-gray-500 dark:text-gray-400 mb-1 max-w-[150px] text-center break-words">
                                                        {typeof match.set_scores === 'string' ? JSON.parse(match.set_scores).join(', ') : Array.isArray(match.set_scores) ? match.set_scores.join(', ') : ''}
                                                    </div>
                                                )}
                                                {match.status === 'completed' && (
                                                    <span className="px-2 py-0.5 rounded bg-green-100 text-green-700 text-[10px] font-bold border border-green-200 whitespace-nowrap">
                                                        จบการแข่งขันเป็นทางการ
                                                    </span>
                                                )}
                                            </div>
                                        ) : (
                                            <div className="px-3 py-1 rounded-lg bg-gray-100 dark:bg-gray-700 font-mono text-sm font-bold text-gray-500 dark:text-gray-400">
                                                VS
                                            </div>
                                        )}
                                    </div>
                                    
                                    <div className="flex-1 flex flex-col md:flex-row items-center justify-center md:justify-start gap-3 w-full">
                                        <div className="w-12 h-12 rounded-full bg-white dark:bg-gray-700 flex items-center justify-center overflow-hidden border border-gray-200 dark:border-gray-600 shadow-sm shrink-0">
                                            {registeredTeams.find(t => t.id == match.away_team_id)?.logo_url ? (
                                                <img src={registeredTeams.find(t => t.id == match.away_team_id).logo_url} alt="Away" className="w-full h-full object-contain p-1" />
                                            ) : (
                                                <Shield size={20} className="text-gray-300 dark:text-gray-500" />
                                            )}
                                        </div>
                                        <div className="font-bold text-lg md:text-xl text-gray-900 dark:text-white leading-tight break-words text-center md:text-left">
                                            {registeredTeams.find(t => t.id == match.away_team_id)?.name || match.away_team || 'TBD'}
                                        </div>
                                    </div>
                                </div>

                                {/* 3. Right: Meta Info (Time, Location) */}
                                <div className="flex flex-row md:flex-col gap-4 md:gap-1 text-sm text-gray-500 dark:text-gray-400 min-w-[160px] justify-center md:justify-end text-center md:text-right border-t md:border-t-0 md:border-l border-gray-200 dark:border-gray-700 pt-3 md:pt-0 md:pl-6 w-full md:w-auto">
                                    <div className="flex items-center justify-center md:justify-end gap-2">
                                        <Calendar size={14} className="text-indigo-400"/> 
                                        {match.start_time ? new Date(match.start_time).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' }) : 'Date TBD'}
                                    </div>
                                    <div className="flex items-center justify-center md:justify-end gap-2">
                                        <Clock size={14} className="text-indigo-400"/> 
                                        {match.start_time ? new Date(match.start_time).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'}) : 'Time TBD'}
                                    </div>
                                    <div className="flex items-center justify-center md:justify-end gap-2">
                                        <MapPin size={14} className="text-indigo-400"/> 
                                        {match.location || 'Location TBD'}
                                    </div>
                                </div>

                                {/* 4. Actions */}
                                <div className="flex gap-2 md:flex-col justify-center border-t md:border-t-0 md:border-l border-gray-200 dark:border-gray-700 pt-3 md:pt-0 md:pl-4 w-full md:w-auto">
                                    <button onClick={() => handleEditMatch(match)} className="p-2 text-blue-500 hover:bg-blue-50 rounded-lg dark:hover:bg-gray-700 transition-colors" title="Edit">
                                        <Edit2 size={18} />
                                    </button>
                                    <button onClick={() => openScoreModal(match)} className="p-2 text-green-500 hover:bg-green-50 rounded-lg dark:hover:bg-gray-700 transition-colors" title="Update Score">
                                        <Trophy size={18} />
                                    </button>
                                    <button onClick={() => handleDeleteMatch(match.id)} className="p-2 text-red-500 hover:bg-red-50 rounded-lg dark:hover:bg-gray-700 transition-colors" title="Delete">
                                        <Trash2 size={18} />
                                    </button>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            )}

            {/* --- Create/Edit Modal --- */}
            {showModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
                    <div className={`w-full max-w-2xl rounded-xl shadow-2xl overflow-hidden ${darkMode ? 'bg-gray-800' : 'bg-white'}`}>
                        <div className="p-6 border-b border-gray-200 dark:border-gray-700 flex justify-between items-center">
                            <h3 className="text-xl font-bold">{isEditing ? 'Edit Match' : 'New Match'}</h3>
                            <button onClick={() => setShowModal(false)} className="text-gray-500 hover:text-gray-700">
                                <X size={24} />
                            </button>
                        </div>

                        <form onSubmit={handleSubmit} className="p-6 space-y-4">
                            {/* Row 1: Match Info */}
                            <div className="grid grid-cols-2 gap-4">
                                <Input 
                                    label="Match Number" 
                                    type="number" 
                                    value={matchForm.match_number}
                                    onChange={e => setMatchForm({...matchForm, match_number: e.target.value})}
                                    darkMode={darkMode}
                                />
                                <div className="flex flex-col gap-1">
                                    <label className={`text-xs font-bold uppercase mb-1 ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>Gender</label>
                                    <select 
                                        value={matchForm.gender}
                                        onChange={e => setMatchForm({...matchForm, gender: e.target.value})}
                                        className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none transition ${darkMode ? 'bg-gray-700 border-gray-600 text-white' : 'bg-white border-gray-300'}`}
                                    >
                                        <option value="Male">Male</option>
                                        <option value="Female">Female</option>
                                        <option value="Mix">Mix</option>
                                    </select>
                                </div>
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div className="flex flex-col gap-1">
                                    <label className={`text-xs font-bold uppercase mb-1 ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>Round</label>
                                    <select 
                                        value={matchForm.round_name}
                                        onChange={e => setMatchForm({...matchForm, round_name: e.target.value})}
                                        className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none transition ${darkMode ? 'bg-gray-700 border-gray-600 text-white' : 'bg-white border-gray-300'}`}
                                    >
                                        <option>Round 1</option>
                                        <option>Round 2</option>
                                        <option>Quarter Final</option>
                                        <option>Semi Final</option>
                                        <option>Final</option>
                                    </select>
                                </div>
                                <Input 
                                    label="Pool (Optional)" 
                                    value={matchForm.pool_name}
                                    onChange={e => setMatchForm({...matchForm, pool_name: e.target.value})}
                                    darkMode={darkMode}
                                    placeholder="e.g. Pool A"
                                />
                            </div>

                            {/* Row 2: Teams */}
                            <div className="grid grid-cols-2 gap-4 p-4 bg-gray-50 dark:bg-gray-700/30 rounded-xl border border-gray-100 dark:border-gray-600">
                                <div className="flex flex-col gap-1">
                                    <label className="text-xs font-bold uppercase text-indigo-500 mb-1">Home Team</label>
                                    <div className="flex items-center gap-2">
                                        <div className="w-10 h-10 rounded-full bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-600 flex items-center justify-center overflow-hidden shrink-0">
                                            {registeredTeams.find(t => t.id == matchForm.home_team_id)?.logo_url ? (
                                                <img src={registeredTeams.find(t => t.id == matchForm.home_team_id).logo_url} alt="" className="w-full h-full object-contain p-1"/>
                                            ) : <Shield size={16} className="text-gray-300 dark:text-gray-600"/>}
                                        </div>
                                        <select 
                                            value={matchForm.home_team_id}
                                            onChange={e => setMatchForm({...matchForm, home_team_id: e.target.value})}
                                            className={`flex-1 px-3 py-2 border rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none transition ${darkMode ? 'bg-gray-700 border-gray-600 text-white' : 'bg-white border-gray-300'}`}
                                        >
                                            <option value="">-- Select Home Team --</option>
                                            {registeredTeams.map(t => (
                                                <option key={t.id} value={t.id}>{t.name} ({t.code})</option>
                                            ))}
                                        </select>
                                    </div>
                                </div>

                                <div className="flex flex-col gap-1">
                                    <label className="text-xs font-bold uppercase text-rose-500 mb-1">Away Team</label>
                                    <div className="flex items-center gap-2">
                                        <div className="w-10 h-10 rounded-full bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-600 flex items-center justify-center overflow-hidden shrink-0">
                                            {registeredTeams.find(t => t.id == matchForm.away_team_id)?.logo_url ? (
                                                <img src={registeredTeams.find(t => t.id == matchForm.away_team_id).logo_url} alt="" className="w-full h-full object-contain p-1"/>
                                            ) : <Shield size={16} className="text-gray-300 dark:text-gray-600"/>}
                                        </div>
                                        <select 
                                            value={matchForm.away_team_id}
                                            onChange={e => setMatchForm({...matchForm, away_team_id: e.target.value})}
                                            className={`flex-1 px-3 py-2 border rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none transition ${darkMode ? 'bg-gray-700 border-gray-600 text-white' : 'bg-white border-gray-300'}`}
                                        >
                                            <option value="">-- Select Away Team --</option>
                                            {registeredTeams.map(t => (
                                                <option key={t.id} value={t.id}>{t.name} ({t.code})</option>
                                            ))}
                                        </select>
                                    </div>
                                </div>
                            </div>

                            {/* Row 3: Time & Location */}
                            <div className="grid grid-cols-2 gap-4">
                                <Input 
                                    label="Start Time" 
                                    type="datetime-local" 
                                    value={matchForm.start_time}
                                    onChange={e => setMatchForm({...matchForm, start_time: e.target.value})}
                                    darkMode={darkMode}
                                />
                                <div className="flex flex-col gap-1">
                                    <label className={`text-xs font-bold uppercase mb-1 ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>Location (Stadium)</label>
                                    <select 
                                        value={matchForm.location}
                                        onChange={e => setMatchForm({...matchForm, location: e.target.value})}
                                        className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none transition ${darkMode ? 'bg-gray-700 border-gray-600 text-white' : 'bg-white border-gray-300'}`}
                                    >
                                        <option value="">-- Select Stadium --</option>
                                        {stadiums.map(s => (
                                            <option key={s.id} value={s.name}>{s.name}</option>
                                        ))}
                                    </select>
                                </div>
                            </div>

                            {/* Footer Buttons */}
                            <div className="flex justify-end gap-3 mt-4 pt-4 border-t dark:border-gray-700">
                                <button
                                    type="button"
                                    onClick={() => setShowModal(false)}
                                    className="px-4 py-2 rounded-lg text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-700"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    className="px-6 py-2 rounded-lg bg-indigo-600 text-white font-medium hover:bg-indigo-700 shadow-lg"
                                >
                                    <Save size={18} className="inline mr-2" />
                                    {isEditing ? 'Update Match' : 'Create Match'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* --- Score Modal --- */}
            {scoringMatch && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
                    <div className={`w-full max-w-md rounded-xl shadow-2xl ${darkMode ? 'bg-gray-800' : 'bg-white'}`}>
                        <div className="p-6 border-b dark:border-gray-700 flex justify-between items-center">
                            <h3 className="text-xl font-bold">Update Score</h3>
                            <button onClick={() => setScoringMatch(null)}><X size={24} /></button>
                        </div>
                        <div className="p-6 space-y-6">
                            <div className="text-center">
                                <p className="text-sm text-gray-500">Match #{scoringMatch.match_number}</p>
                                <h4 className="font-bold">{registeredTeams.find(t => t.id == scoringMatch.home_team_id)?.name} vs {registeredTeams.find(t => t.id == scoringMatch.away_team_id)?.name}</h4>
                            </div>
                            
                            <div>
                                <label className="block text-xs font-bold uppercase mb-2">Set Scores (Points)</label>
                                <div className={`grid grid-cols-5 gap-2`}>
                                    {scoreForm.set_scores.map((val, idx) => (
                                        <input
                                            key={idx}
                                            type="text"
                                            placeholder={`Set ${idx + 1}`}
                                            value={val}
                                            onChange={(e) => {
                                                const newScores = [...scoreForm.set_scores];
                                                newScores[idx] = e.target.value;
                                                setScoreForm({ ...scoreForm, set_scores: newScores });
                                            }}
                                            className={`w-full p-2 text-center border rounded-lg ${darkMode ? 'bg-gray-700 border-gray-600' : 'bg-white border-gray-300'}`}
                                        />
                                    ))}
                                </div>
                                <p className="text-xs text-center mt-2 text-gray-400">Format: "25-20"</p>
                            </div>

                            <div className="flex justify-end gap-3 pt-4 border-t dark:border-gray-700">
                                <button type="button" onClick={() => setScoringMatch(null)} className="px-4 py-2 rounded-lg text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-700">Cancel</button>
                                <button onClick={handleSaveScore} className="px-6 py-2 rounded-lg bg-green-600 text-white font-medium hover:bg-green-700 shadow-lg">
                                    <Save size={18} className="inline mr-2" /> Save Score
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}