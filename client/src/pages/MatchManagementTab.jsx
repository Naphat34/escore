import React, { useEffect, useState } from 'react';
import client, { api } from '../api'; 
import {
    Swords, PlusCircle, X, Calendar, MapPin, Edit2, Trash2,
    Printer, ListFilter, Save, Clock, Shield, Trophy
} from 'lucide-react';
import Swal from 'sweetalert2';
import { Toast, Input, Button } from './AdminShared';

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
            setCompetitions(res.data.filter(c => c.status?.toLowerCase() === 'open'));

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

        // FIX: When creating a new match, default to a specific gender, not the 'All' filter.
        // Use the first available gender for the selected competition, or 'Male' as a fallback.
        const defaultGender = availableGenders.length > 0 ? availableGenders[0] : 'Male';

        setMatchForm({ ...initialForm, match_number: nextMatchNum, gender: defaultGender });
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
            set_scores: JSON.stringify(validSets), // ส่งเฉพาะเซตที่กรอก (แปลงเป็น String เพื่อความชัวร์)
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
        <div className={`p-6 min-h-screen ${darkMode ? 'bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 text-white' : 'bg-gradient-to-br from-gray-50 via-white to-gray-100 text-gray-800'}`}>
            
            {/* Header */}
            <div className="flex flex-col md:flex-row justify-between items-center mb-8 gap-4">
                <div className="flex items-center gap-4">
                    <div className="p-3 rounded-xl bg-gradient-to-r from-indigo-500 to-purple-600 shadow-lg">
                        <Swords className="text-white" size={28} />
                    </div>
                    <div>
                        <h2 className="text-3xl font-bold bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent">
                            Match Management
                        </h2>
                        <p className={`text-sm ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>Organize and manage volleyball matches</p>
                    </div>
                </div>
                
                {/* Competition Selector Group */}
                <div className="flex flex-col md:flex-row gap-4 w-full md:w-auto flex-1 justify-end">
                    <div className="w-full md:w-64">
                        <label className={`block text-xs font-bold uppercase mb-2 ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>🏆 Competition</label>
                        <select
                            value={selectedBaseName}
                            onChange={(e) => setSelectedBaseName(e.target.value)}
                            className={`w-full p-3 rounded-xl border-2 transition-all hover:shadow-md ${darkMode ? 'bg-gray-800 border-gray-600 text-white hover:border-gray-500' : 'bg-white border-gray-300 hover:border-indigo-400'}`}
                        >
                            {uniqueBaseNames.map(name => (
                                <option key={name} value={name}>{name}</option>
                            ))}
                        </select>
                    </div>
                    
                    <div>
                        <label className={`block text-xs font-bold uppercase mb-2 ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>👥 Gender</label>
                        <div className={`flex rounded-xl p-1 border-2 ${darkMode ? 'bg-gray-800 border-gray-600' : 'bg-gray-100 border-gray-300'}`}>
                            <button 
                                onClick={() => setFilterGender('All')} 
                                className={`px-4 py-2 text-sm font-bold rounded-lg transition-all ${filterGender === 'All' ? 'bg-gradient-to-r from-indigo-500 to-purple-600 text-white shadow-lg' : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 hover:bg-white/50'}`}
                            >
                                All
                            </button>
                            {availableGenders.map(g => (
                                <button 
                                    key={g} 
                                    onClick={() => setFilterGender(g)} 
                                    className={`px-4 py-2 text-sm font-bold rounded-lg transition-all ${filterGender === g ? 'bg-gradient-to-r from-indigo-500 to-purple-600 text-white shadow-lg' : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 hover:bg-white/50'}`}
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
                        className={`px-6 py-3 rounded-xl flex items-center gap-3 transition-all shadow-lg hover:shadow-xl transform hover:-translate-y-0.5 ${
                            selectedBaseName 
                            ? 'bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 text-white' 
                            : 'bg-gray-300 text-gray-500 cursor-not-allowed'
                        }`}
                    >
                        <PlusCircle size={20} /> Add Match
                    </button>
                </div>
            </div>

            {/* Match List */}
            {loading ? (
                <div className="flex items-center justify-center py-16">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-500"></div>
                    <span className="ml-3 text-lg">Loading matches...</span>
                </div>
            ) : matches.length === 0 ? (
                <div className={`text-center py-16 rounded-2xl border-2 border-dashed ${darkMode ? 'border-gray-600 bg-gray-800/50' : 'border-gray-300 bg-gray-50'} relative overflow-hidden`}>
                    <div className="absolute inset-0 opacity-10">
                        <div className="absolute top-4 left-4 w-16 h-16 bg-indigo-500 rounded-full"></div>
                        <div className="absolute bottom-4 right-4 w-12 h-12 bg-purple-500 rounded-full"></div>
                        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-20 h-20 bg-pink-500 rounded-full"></div>
                    </div>
                    <div className="relative z-10">
                        <Trophy className={`mx-auto mb-4 ${darkMode ? 'text-gray-500' : 'text-gray-400'}`} size={64} />
                        <h3 className="text-xl font-bold mb-2">No matches found</h3>
                        <p className={`${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                            {selectedBaseName ? "Create your first match to get started!" : "Please select a competition to view matches."}
                        </p>
                    </div>
                </div>
            ) : (
                <div className="space-y-6">
                    {matches.map((match) => (
                        <div key={match.id} className={`group relative p-6 rounded-2xl border transition-all hover:shadow-xl hover:scale-[1.02] ${darkMode ? 'bg-gradient-to-r from-gray-800 to-gray-750 border-gray-600 hover:from-gray-750 hover:to-gray-700' : 'bg-gradient-to-r from-white to-gray-50 border-gray-200 shadow-md hover:from-gray-50 hover:to-white'}`}>
                            
                            <div className="flex flex-col md:flex-row items-center gap-6">
                                
                                {/* 1. Left: Match Details (Number, Round, Gender) */}
                                <div className="flex flex-row md:flex-col items-center md:items-start gap-3 md:gap-2 min-w-[140px] border-b md:border-b-0 md:border-r border-gray-200 dark:border-gray-600 pb-4 md:pb-0 md:pr-6 w-full md:w-auto justify-between md:justify-start">
                                    <div className="flex items-center gap-2">
                                        <div className="p-2 rounded-lg bg-indigo-100 dark:bg-indigo-900/30">
                                            <ListFilter className="text-indigo-600 dark:text-indigo-400" size={16} />
                                        </div>
                                        <div>
                                            <span className="text-sm font-bold text-indigo-600 dark:text-indigo-400 uppercase tracking-wider">Match #{match.match_number}</span>
                                            <div className="text-base font-bold text-gray-800 dark:text-gray-200">{match.round_name}</div>
                                        </div>
                                    </div>
                                    <div className={`px-3 py-1.5 rounded-full text-xs font-bold uppercase tracking-wide border-2 ${
                                        match.gender === 'Female' 
                                            ? 'bg-gradient-to-r from-pink-100 to-rose-100 text-pink-700 border-pink-300 dark:from-pink-900/50 dark:to-rose-900/50 dark:text-pink-300 dark:border-pink-700' 
                                            : match.gender === 'Mix'
                                                ? 'bg-gradient-to-r from-purple-100 to-violet-100 text-purple-700 border-purple-300 dark:from-purple-900/50 dark:to-violet-900/50 dark:text-purple-300 dark:border-purple-700'
                                                : 'bg-gradient-to-r from-blue-100 to-indigo-100 text-blue-700 border-blue-300 dark:from-blue-900/50 dark:to-indigo-900/50 dark:text-blue-300 dark:border-blue-700'
                                    }`}>
                                        {match.gender || 'Male'}
                                    </div>
                                </div>

                                {/* 2. Center: Teams (Full Names) */}
                                <div className="flex-1 flex flex-col md:flex-row items-center justify-center gap-6 w-full">
                                    <div className="flex-1 flex flex-col md:flex-row items-center justify-center md:justify-end gap-4 w-full">
                                        <div className="font-bold text-xl md:text-2xl text-gray-900 dark:text-white leading-tight break-words text-center md:text-right order-2 md:order-1">
                                        {registeredTeams.find(t => t.id == match.home_team_id)?.name || match.home_team || 'TBD'}
                                        </div>
                                        <div className="w-16 h-16 rounded-full bg-gradient-to-br from-blue-400 to-blue-600 dark:from-blue-500 dark:to-blue-700 flex items-center justify-center overflow-hidden border-4 border-white dark:border-gray-800 shadow-lg order-1 md:order-2 shrink-0">
                                            {registeredTeams.find(t => t.id == match.home_team_id)?.logo_url ? (
                                                <img src={registeredTeams.find(t => t.id == match.home_team_id).logo_url} alt="Home" className="w-full h-full object-contain p-2" />
                                            ) : (
                                                <Shield size={24} className="text-white" />
                                            )}
                                        </div>
                                    </div>
                                    
                                    <div className="flex flex-col items-center shrink-0 px-6">
                                        {(match.status === 'completed' || match.home_set_score > 0 || match.away_set_score > 0) ? (
                                            <div className="flex flex-col items-center">
                                                <div className="px-6 py-3 rounded-2xl bg-gradient-to-r from-gray-800 to-gray-900 text-white font-mono text-2xl font-bold tracking-widest mb-2 shadow-lg">
                                                    {match.home_set_score} - {match.away_set_score}
                                                </div>
                                                {match.set_scores && (
                                                    <div className="text-sm text-gray-500 dark:text-gray-400 mb-2 max-w-[200px] text-center break-words bg-gray-100 dark:bg-gray-700 px-3 py-1 rounded-lg">
                                                        {typeof match.set_scores === 'string' ? JSON.parse(match.set_scores).join(', ') : Array.isArray(match.set_scores) ? match.set_scores.join(', ') : ''}
                                                    </div>
                                                )}
                                                {match.status === 'completed' && (
                                                    <span className="px-3 py-1 rounded-full bg-gradient-to-r from-green-500 to-emerald-600 text-white text-xs font-bold border border-green-400 shadow-md">
                                                        ✅ จบการแข่งขันเป็นทางการ
                                                    </span>
                                                )}
                                            </div>
                                        ) : (
                                            <div className="px-4 py-2 rounded-xl bg-gradient-to-r from-indigo-500 to-purple-600 text-white font-mono text-lg font-bold shadow-lg">
                                                VS
                                            </div>
                                        )}
                                    </div>
                                    
                                    <div className="flex-1 flex flex-col md:flex-row items-center justify-center md:justify-start gap-4 w-full">
                                        <div className="w-16 h-16 rounded-full bg-gradient-to-br from-red-400 to-red-600 dark:from-red-500 dark:to-red-700 flex items-center justify-center overflow-hidden border-4 border-white dark:border-gray-800 shadow-lg shrink-0">
                                            {registeredTeams.find(t => t.id == match.away_team_id)?.logo_url ? (
                                                <img src={registeredTeams.find(t => t.id == match.away_team_id).logo_url} alt="Away" className="w-full h-full object-contain p-2" />
                                            ) : (
                                                <Shield size={24} className="text-white" />
                                            )}
                                        </div>
                                        <div className="font-bold text-xl md:text-2xl text-gray-900 dark:text-white leading-tight break-words text-center md:text-left">
                                            {registeredTeams.find(t => t.id == match.away_team_id)?.name || match.away_team || 'TBD'}
                                        </div>
                                    </div>
                                </div>

                                {/* 3. Right: Meta Info (Time, Location) */}
                                <div className="flex flex-row md:flex-col gap-4 md:gap-2 text-sm text-gray-600 dark:text-gray-300 min-w-[180px] justify-center md:justify-end text-center md:text-right border-t md:border-t-0 md:border-l border-gray-200 dark:border-gray-600 pt-4 md:pt-0 md:pl-6 w-full md:w-auto">
                                    <div className="flex items-center justify-center md:justify-end gap-2 bg-gray-50 dark:bg-gray-700 px-3 py-2 rounded-lg">
                                        <Calendar size={16} className="text-indigo-500"/> 
                                        <span className="font-medium">{match.start_time ? new Date(match.start_time).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' }) : 'Date TBD'}</span>
                                    </div>
                                    <div className="flex items-center justify-center md:justify-end gap-2 bg-gray-50 dark:bg-gray-700 px-3 py-2 rounded-lg">
                                        <Clock size={16} className="text-indigo-500"/> 
                                        <span className="font-medium">{match.start_time ? new Date(match.start_time).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'}) : 'Time TBD'}</span>
                                    </div>
                                    <div className="flex items-center justify-center md:justify-end gap-2 bg-gray-50 dark:bg-gray-700 px-3 py-2 rounded-lg">
                                        <MapPin size={16} className="text-indigo-500"/> 
                                        <span className="font-medium">{match.location || 'Location TBD'}</span>
                                    </div>
                                </div>

                                {/* 4. Actions */}
                                <div className="flex gap-3 md:flex-col justify-center border-t md:border-t-0 md:border-l border-gray-200 dark:border-gray-600 pt-4 md:pt-0 md:pl-4 w-full md:w-auto">
                                    <button onClick={() => handleEditMatch(match)} className="p-3 text-blue-500 hover:bg-blue-50 dark:hover:bg-blue-900/30 rounded-xl transition-all hover:scale-110 shadow-md" title="Edit Match">
                                        <Edit2 size={20} />
                                    </button>
                                    <button onClick={() => openScoreModal(match)} className="p-3 text-green-500 hover:bg-green-50 dark:hover:bg-green-900/30 rounded-xl transition-all hover:scale-110 shadow-md" title="Update Score">
                                        <Trophy size={20} />
                                    </button>
                                    <button onClick={() => handleDeleteMatch(match.id)} className="p-3 text-red-500 hover:bg-red-50 dark:hover:bg-red-900/30 rounded-xl transition-all hover:scale-110 shadow-md" title="Delete Match">
                                        <Trash2 size={20} />
                                    </button>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            )}

            {/* --- Create/Edit Modal --- */}
            {showModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-md p-4">
                    <div className={`w-full max-w-3xl rounded-3xl shadow-2xl overflow-hidden border ${darkMode ? 'bg-gray-800 border-gray-600' : 'bg-white border-gray-200'}`}>
                        <div className={`p-6 border-b ${darkMode ? 'border-gray-600 bg-gradient-to-r from-gray-800 to-gray-700' : 'border-gray-200 bg-gradient-to-r from-indigo-50 to-purple-50'}`}>
                            <div className="flex justify-between items-center">
                                <div className="flex items-center gap-3">
                                    <div className="p-2 rounded-xl bg-gradient-to-r from-indigo-500 to-purple-600">
                                        {isEditing ? <Edit2 className="text-white" size={24} /> : <PlusCircle className="text-white" size={24} />}
                                    </div>
                                    <div>
                                        <h3 className="text-2xl font-bold text-gray-900 dark:text-white">{isEditing ? 'Edit Match' : 'Create New Match'}</h3>
                                        <p className={`text-sm ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>{isEditing ? 'Update match details' : 'Set up a new volleyball match'}</p>
                                    </div>
                                </div>
                                <button onClick={() => setShowModal(false)} className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-xl text-gray-500 hover:text-gray-700 transition-colors">
                                    <X size={24} />
                                </button>
                            </div>
                        </div>

                        <form onSubmit={handleSubmit} className="p-6 space-y-6">
                            {/* Row 1: Match Info */}
                            <div className="grid grid-cols-2 gap-6">
                                <div className="space-y-2">
                                    <label className={`flex items-center gap-2 text-sm font-bold uppercase ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                                        <ListFilter size={16} className="text-indigo-500" /> Match Number
                                    </label>
                                    <Input 
                                        type="number" 
                                        value={matchForm.match_number}
                                        onChange={e => setMatchForm({...matchForm, match_number: e.target.value})}
                                        darkMode={darkMode}
                                        className="w-full"
                                    />
                                </div>
                                <div className="space-y-2">
                                    <label className={`flex items-center gap-2 text-sm font-bold uppercase ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                                        <Shield size={16} className="text-indigo-500" /> Gender
                                    </label>
                                    <select 
                                        value={matchForm.gender}
                                        onChange={e => setMatchForm({...matchForm, gender: e.target.value})}
                                        className={`w-full px-4 py-3 border-2 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none transition-all ${darkMode ? 'bg-gray-700 border-gray-600 text-white' : 'bg-white border-gray-300'}`}
                                    >
                                        <option value="Male">Male</option>
                                        <option value="Female">Female</option>
                                        <option value="Mix">Mix</option>
                                    </select>
                                </div>
                            </div>

                            <div className="grid grid-cols-2 gap-6">
                                <div className="space-y-2">
                                    <label className={`flex items-center gap-2 text-sm font-bold uppercase ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                                        <Trophy size={16} className="text-indigo-500" /> Round
                                    </label>
                                    <select 
                                        value={matchForm.round_name}
                                        onChange={e => setMatchForm({...matchForm, round_name: e.target.value})}
                                        className={`w-full px-4 py-3 border-2 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none transition-all ${darkMode ? 'bg-gray-700 border-gray-600 text-white' : 'bg-white border-gray-300'}`}
                                    >
                                        <option>Round 1</option>
                                        <option>Round 2</option>
                                        <option>Quarter Final</option>
                                        <option>Semi Final</option>
                                        <option>Final</option>
                                    </select>
                                </div>
                                <div className="space-y-2">
                                    <label className={`flex items-center gap-2 text-sm font-bold uppercase ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                                        <Printer size={16} className="text-indigo-500" /> Pool (Optional)
                                    </label>
                                    <Input 
                                        value={matchForm.pool_name}
                                        onChange={e => setMatchForm({...matchForm, pool_name: e.target.value})}
                                        darkMode={darkMode}
                                        placeholder="e.g. Pool A"
                                        className="w-full"
                                    />
                                </div>
                            </div>

                            {/* Row 2: Teams */}
                            <div className={`p-6 rounded-2xl border-2 ${darkMode ? 'bg-gradient-to-r from-gray-700 to-gray-600 border-gray-500' : 'bg-gradient-to-r from-indigo-50 to-purple-50 border-indigo-200'}`}>
                                <h4 className="text-lg font-bold mb-4 flex items-center gap-2 text-indigo-600 dark:text-indigo-400">
                                    <Shield size={20} /> Teams
                                </h4>
                                <div className="grid grid-cols-2 gap-6">
                                    <div className="space-y-3">
                                        <label className="flex items-center gap-2 text-sm font-bold uppercase text-indigo-600 dark:text-indigo-400">
                                            🏠 Home Team
                                        </label>
                                        <div className="flex items-center gap-3">
                                            <div className="w-12 h-12 rounded-full bg-gradient-to-br from-blue-400 to-blue-600 flex items-center justify-center overflow-hidden border-2 border-white shadow-lg shrink-0">
                                                {registeredTeams.find(t => t.id == matchForm.home_team_id)?.logo_url ? (
                                                    <img src={registeredTeams.find(t => t.id == matchForm.home_team_id).logo_url} alt="" className="w-full h-full object-contain p-1"/>
                                                ) : <Shield size={20} className="text-white"/>}
                                            </div>
                                            <select 
                                                value={matchForm.home_team_id}
                                                onChange={e => setMatchForm({...matchForm, home_team_id: e.target.value})}
                                                className={`flex-1 px-4 py-3 border-2 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none transition-all ${darkMode ? 'bg-gray-700 border-gray-600 text-white' : 'bg-white border-gray-300'}`}
                                            >
                                                <option value="">-- Select Home Team --</option>
                                                {registeredTeams.map(t => (
                                                    <option key={t.id} value={t.id}>{t.name} ({t.code})</option>
                                                ))}
                                            </select>
                                        </div>
                                    </div>

                                    <div className="space-y-3">
                                        <label className="flex items-center gap-2 text-sm font-bold uppercase text-rose-600 dark:text-rose-400">
                                            ✈️ Away Team
                                        </label>
                                        <div className="flex items-center gap-3">
                                            <div className="w-12 h-12 rounded-full bg-gradient-to-br from-red-400 to-red-600 flex items-center justify-center overflow-hidden border-2 border-white shadow-lg shrink-0">
                                                {registeredTeams.find(t => t.id == matchForm.away_team_id)?.logo_url ? (
                                                    <img src={registeredTeams.find(t => t.id == matchForm.away_team_id).logo_url} alt="" className="w-full h-full object-contain p-1"/>
                                                ) : <Shield size={20} className="text-white"/>}
                                            </div>
                                            <select 
                                                value={matchForm.away_team_id}
                                                onChange={e => setMatchForm({...matchForm, away_team_id: e.target.value})}
                                                className={`flex-1 px-4 py-3 border-2 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none transition-all ${darkMode ? 'bg-gray-700 border-gray-600 text-white' : 'bg-white border-gray-300'}`}
                                            >
                                                <option value="">-- Select Away Team --</option>
                                                {registeredTeams.map(t => (
                                                    <option key={t.id} value={t.id}>{t.name} ({t.code})</option>
                                                ))}
                                            </select>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* Row 3: Time & Location */}
                            <div className="grid grid-cols-2 gap-6">
                                <div className="space-y-2">
                                    <label className={`flex items-center gap-2 text-sm font-bold uppercase ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                                        <Clock size={16} className="text-indigo-500" /> Start Time
                                    </label>
                                    <Input 
                                        type="datetime-local" 
                                        value={matchForm.start_time}
                                        onChange={e => setMatchForm({...matchForm, start_time: e.target.value})}
                                        darkMode={darkMode}
                                        className="w-full"
                                    />
                                </div>
                                <div className="space-y-2">
                                    <label className={`flex items-center gap-2 text-sm font-bold uppercase ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                                        <MapPin size={16} className="text-indigo-500" /> Location (Stadium)
                                    </label>
                                    <select 
                                        value={matchForm.location}
                                        onChange={e => setMatchForm({...matchForm, location: e.target.value})}
                                        className={`w-full px-4 py-3 border-2 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none transition-all ${darkMode ? 'bg-gray-700 border-gray-600 text-white' : 'bg-white border-gray-300'}`}
                                    >
                                        <option value="">-- Select Stadium --</option>
                                        {stadiums.map(s => (
                                            <option key={s.id} value={s.name}>{s.name}</option>
                                        ))}
                                    </select>
                                </div>
                            </div>

                            {/* Footer Buttons */}
                            <div className="flex justify-end gap-4 mt-8 pt-6 border-t dark:border-gray-600">
                                <button
                                    type="button"
                                    onClick={() => setShowModal(false)}
                                    className="px-6 py-3 rounded-xl text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700 transition-all font-medium"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    className="px-8 py-3 rounded-xl bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white font-bold shadow-lg hover:shadow-xl transform hover:-translate-y-0.5 transition-all flex items-center gap-2"
                                >
                                    <Save size={20} />
                                    {isEditing ? 'Update Match' : 'Create Match'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* --- Score Modal --- */}
            {scoringMatch && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-md p-4">
                    <div className={`w-full max-w-lg rounded-3xl shadow-2xl border ${darkMode ? 'bg-gray-800 border-gray-600' : 'bg-white border-gray-200'}`}>
                        <div className={`p-6 border-b ${darkMode ? 'border-gray-600 bg-gradient-to-r from-gray-800 to-gray-700' : 'border-gray-200 bg-gradient-to-r from-green-50 to-emerald-50'}`}>
                            <div className="flex justify-between items-center">
                                <div className="flex items-center gap-3">
                                    <div className="p-2 rounded-xl bg-gradient-to-r from-green-500 to-emerald-600">
                                        <Trophy className="text-white" size={24} />
                                    </div>
                                    <div>
                                        <h3 className="text-2xl font-bold text-gray-900 dark:text-white">Update Match Score</h3>
                                        <p className={`text-sm ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>Record the final scores</p>
                                    </div>
                                </div>
                                <button onClick={() => setScoringMatch(null)} className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-xl text-gray-500 hover:text-gray-700 transition-colors">
                                    <X size={24} />
                                </button>
                            </div>
                        </div>
                        <div className="p-6 space-y-6">
                            <div className="text-center bg-gradient-to-r from-indigo-50 to-purple-50 dark:from-gray-700 dark:to-gray-600 p-4 rounded-2xl">
                                <p className="text-sm text-indigo-600 dark:text-indigo-400 font-bold mb-2">Match #{scoringMatch.match_number}</p>
                                <h4 className="font-bold text-lg text-gray-900 dark:text-white flex items-center justify-center gap-2">
                                    <span className="text-blue-600">{registeredTeams.find(t => t.id == scoringMatch.home_team_id)?.name}</span>
                                    <span className="text-gray-400">vs</span>
                                    <span className="text-red-600">{registeredTeams.find(t => t.id == scoringMatch.away_team_id)?.name}</span>
                                </h4>
                            </div>
                            
                            <div>
                                <label className={`flex items-center gap-2 text-sm font-bold uppercase mb-4 ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                                    <Trophy size={16} className="text-green-500" /> Set Scores (Points)
                                </label>
                                <div className={`grid grid-cols-5 gap-3`}>
                                    {scoreForm.set_scores.map((val, idx) => (
                                        <div key={idx} className="text-center">
                                            <input
                                                type="text"
                                                placeholder={`Set ${idx + 1}`}
                                                value={val}
                                                onChange={(e) => {
                                                    const newScores = [...scoreForm.set_scores];
                                                    newScores[idx] = e.target.value;
                                                    setScoreForm({ ...scoreForm, set_scores: newScores });
                                                }}
                                                className={`w-full p-3 text-center border-2 rounded-xl focus:ring-2 focus:ring-green-500 outline-none transition-all font-mono text-lg ${darkMode ? 'bg-gray-700 border-gray-600 text-white' : 'bg-white border-gray-300'}`}
                                            />
                                            <p className="text-xs text-gray-500 mt-1">Set {idx + 1}</p>
                                        </div>
                                    ))}
                                </div>
                                <p className="text-xs text-center mt-4 text-gray-500 dark:text-gray-400 bg-gray-50 dark:bg-gray-700 p-2 rounded-lg">Format: "25-20" (home-away)</p>
                            </div>

                            <div className="flex justify-end gap-4 pt-6 border-t dark:border-gray-600">
                                <button type="button" onClick={() => setScoringMatch(null)} className="px-6 py-3 rounded-xl text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700 transition-all font-medium">
                                    Cancel
                                </button>
                                <button onClick={handleScoreSubmit} className="px-8 py-3 rounded-xl bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 text-white font-bold shadow-lg hover:shadow-xl transform hover:-translate-y-0.5 transition-all flex items-center gap-2">
                                    <Save size={20} />
                                    Update Score
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
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