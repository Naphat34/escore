import React, { useEffect, useState } from 'react';
import { api } from '../api';
import { useNavigate, Link } from 'react-router-dom';
import { Swords, Calendar, MapPin, PlayCircle, Trophy, X, Save, User, CheckCircle, Flag, FileText, Monitor } from 'lucide-react';
import { EmptyState } from './AdminShared';

export default function LiveScorerTab({ darkMode }) {
    const [competitions, setCompetitions] = useState([]);
    const [matches, setMatches] = useState([]);

    // Grouping State
    const [uniqueBaseNames, setUniqueBaseNames] = useState([]);
    const [selectedBaseName, setSelectedBaseName] = useState('');
    const [filterGender, setFilterGender] = useState('');
    const [availableGenders, setAvailableGenders] = useState([]);

    // Officials
    const [referees, setReferees] = useState([]);
    const [scorers, setScorers] = useState([]);
    const [lineJudges, setLineJudges] = useState([]);

    // --- Modal State ---
    const [showModal, setShowModal] = useState(false);
    const [selectedMatch, setSelectedMatch] = useState(null);

    const [formData, setFormData] = useState({});

    const navigate = useNavigate();

    useEffect(() => {
        fetchCompetitions();
        fetchMasterData();
    }, []);

    // Effect: Update available genders when base name changes
    useEffect(() => {
        if (selectedBaseName && competitions.length > 0) {
            const relatedComps = competitions.filter(c => {
                const rawTitle = c.title || c.name || '';
                const cBase = rawTitle.replace(/\s\((Male|Female|Mix|Mixed)\)$/i, '').trim();
                return cBase === selectedBaseName;
            });

            const genders = [...new Set(relatedComps.map(c => c.gender))].filter(Boolean).sort();
            setAvailableGenders(['All', ...genders]);

            // Default select first gender if current selection is invalid
            if (!filterGender || (filterGender !== 'All' && !genders.includes(filterGender))) {
                setFilterGender('All');
            }
        }
    }, [selectedBaseName, competitions]);

    // Effect: Fetch matches when selection changes
    useEffect(() => {
        if (selectedBaseName && filterGender) {
            fetchMatches();
        }
    }, [selectedBaseName, filterGender, competitions]);

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

            const promises = targetComps.map(c => api.getMatchesByCompetition(c.id));
            const results = await Promise.all(promises);
            
            let allMatches = [];
            results.forEach((res, index) => {
                const comp = targetComps[index];
                if (res.data) {
                    const compMatches = res.data.map(m => ({
                        ...m,
                        gender: comp.gender,
                        competition_id: comp.id
                    }));
                    allMatches = [...allMatches, ...compMatches];
                }
            });

            allMatches.sort((a, b) => (parseInt(a.match_number) || 0) - (parseInt(b.match_number) || 0));
            setMatches(allMatches);
        } catch (err) {
            console.error("Fetch matches error:", err);
        }
    };

    const fetchMasterData = async () => {
        try {
            const [refs, scrs, ljs] = await Promise.all([
                api.getAllReferees(),
                api.getAllScorers(),
                api.getAllLineJudges()
            ]);
            setReferees(refs.data || []);
            setScorers(scrs.data || []);
            setLineJudges(ljs.data || []);
        } catch (err) {
            console.warn("Could not fetch officials data.");
        }
    };

    // --- Modal Logic ---
    const handleOpenConsoleClick = (match) => {
        const comp = competitions.find(c => c.id === match.competition_id) || {};

        // Prepare initial data based on match and competition
        const initialData = {
            // Read-only / Pre-filled
            title: comp.title || 'Unknown Competition', // 1. Title
            city: '', // 2. City (Textbox)
            stadium: match.location || '', // 3. Stadium
            countryCode: 'THA', // 4. Country Code (Default)
            phase: match.round || 'Preliminary', // 5. Phase
            pool: match.pool_name || '-', // 6. Pool
            matchNumber: match.match_number || '-', // 7. Match Number
            division: comp.gender || '-', // 8. Division (Men/Women)
            category: comp.category || 'Open', // 9. Category
            dateTime: match.start_time ? new Date(match.start_time).toLocaleString() : '-', // 10. Date Time
            teamHome: match.home_team || match.home_team_name, // 11. Team Home
            teamAway: match.away_team || match.away_team_name, // 12. Team Away
            teamHomeId: match.home_team_id,
            teamAwayId: match.away_team_id,

            // Officials (Textboxes - using IDs for value but they are text inputs for names, 
            // BUT api expects IDs if we are selecting from dropdowns. 
            // Reviewing the UI, they seem to be TextInputs in a real app, but here we might want dropdowns later.
            // For now, let's map what we have from DB match object.

            // Stat 1 Officials
            referee1: match.referee_1_id || '',
            referee2: match.referee_2_id || '',

            rrName: match.rr_name || '',
            rrCountry: match.rr_country || '',
            rrCode: match.rr_code || '',

            rcName: match.rc_name || '',
            rcCountry: match.rc_country || '',
            rcCode: match.rc_code || '',

            // Stat 2 Scores
            scorer: match.scorer_id || '',
            assistantScorerName: match.assistant_scorer_name || '',
            assistantScorerCountry: match.assistant_scorer_country || '',
            assistantScorerCode: match.assistant_scorer_code || '',

            // Stat 3 Line Judges
            lineJudge1: match.line_judge_1_id || '',
            lineJudge2: match.line_judge_2_id || '',
            lineJudge3: match.line_judge_3_id || '',
            lineJudge4: match.line_judge_4_id || '',

            // Stat 4 Committees
            tdName: match.td_name || '',
            tdCountry: match.td_country || '', 
            tdCode: match.td_code || '',

            rdName: match.rd_name || '',
            rdCountry: match.rd_country || '',
            rdCode: match.rd_code || ''
        };

        setSelectedMatch(match);
        setFormData(initialData);
        setShowModal(true);
    };

    const handleFormChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const handleEnterScorer = async () => {
        try {
            const payload = {
                referee_1_id: formData.referee1,
                referee_2_id: formData.referee2,
                scorer_id: formData.scorer,
                line_judge_1_id: formData.lineJudge1,
                line_judge_2_id: formData.lineJudge2,
                line_judge_3_id: formData.lineJudge3,
                line_judge_4_id: formData.lineJudge4,

                rr_name: formData.rrName,
                rr_country: formData.rrCountry,
                rr_code: formData.rrCode,

                rc_name: formData.rcName,
                rc_country: formData.rcCountry,
                rc_code: formData.rcCode,

                assistant_scorer_name: formData.assistantScorerName,
                assistant_scorer_country: formData.assistantScorerCountry,
                assistant_scorer_code: formData.assistantScorerCode,

                td_name: formData.tdName,
                td_country: formData.tdCountry,
                td_code: formData.tdCode,

                rd_name: formData.rdName,
                rd_country: formData.rdCountry,
                rd_code: formData.rdCode
            };

            // 2. Save to Backend
            await api.updateMatchOfficials(selectedMatch.id, payload);

            // 3. Navigate
            navigate(`/scorer/${selectedMatch.id}`, {
                state: { matchData: formData }
            });
            setShowModal(false);
        } catch (error) {
            console.error("Failed to save match officials:", error);
            alert("Failed to save officials data. Please try again.");
        }
    };

    return (
        <div className={`min-h-screen p-6 transition-colors duration-200 ${darkMode ? 'bg-gray-900 text-gray-100' : 'bg-gray-50 text-gray-800'}`}>
            <div className="flex flex-col md:flex-row justify-between items-center mb-6 gap-4">
                <h1 className="text-2xl font-bold flex items-center gap-2">
                    <Swords className="text-indigo-600" /> Live Scorer Console
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
                    <Trophy size={20} className="text-yellow-500" /> Select Match to Score
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
                                        <div className="text-sm text-gray-500 dark:text-gray-400 flex items-center gap-4 mt-1"><span className="flex items-center gap-1"><Calendar size={14} /> {m.start_time ? new Date(m.start_time).toLocaleString() : 'TBD'}</span><span className="flex items-center gap-1"><MapPin size={14} /> {m.location || '-'}</span></div>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <Link
                                            to={`/match/${m.id}/referee`}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            className={`px-4 py-3 rounded-xl font-bold flex items-center gap-2 shadow-lg transition-all transform active:scale-95 bg-gray-200 text-gray-600 dark:bg-gray-600 dark:text-gray-400 hover:bg-gray-300 dark:hover:bg-gray-500`}
                                        >
                                            <Monitor size={20} />
                                        </Link>
                                        <button
                                            onClick={() => handleOpenConsoleClick(m)}
                                            className={`px-6 py-3 rounded-xl font-bold flex items-center gap-2 shadow-lg transition-all transform active:scale-95 ${isCompleted ? 'bg-gray-200 text-gray-600 dark:bg-gray-600 dark:text-gray-400' : 'bg-gradient-to-r from-orange-500 to-red-600 text-white hover:from-orange-600 hover:to-red-700 shadow-orange-500/30'}`}
                                        >
                                            <PlayCircle size={20} /> {isCompleted ? 'View Console' : 'Open Console'}
                                        </button>
                                    </div>
                                </div>
                            );
                        })
                    )}
                </div>
            </div>

            {/* --- MATCH DATA MODAL --- */}
            {showModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 overflow-y-auto">
                    <div className={`w-full max-w-4xl rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh] ${darkMode ? 'bg-gray-800 text-white' : 'bg-white text-gray-900'}`}>

                        {/* Header */}
                        <div className="px-6 py-4 bg-gradient-to-r from-indigo-600 to-blue-600 text-white flex justify-between items-center shrink-0">
                            <h2 className="text-xl font-bold flex items-center gap-2">
                                <Save size={20} /> Match Data Setup
                            </h2>
                            <button onClick={() => setShowModal(false)} className="hover:bg-white/20 p-2 rounded-full transition"><X size={20} /></button>
                        </div>

                        {/* Scrollable Form Body */}
                        <div className="p-6 overflow-y-auto custom-scrollbar grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">

                            {/* Section 1: Match Info (Read Only / Pre-filled) */}
                            <div className={`col-span-full p-3 rounded-lg border mb-2 ${darkMode ? 'bg-gray-700/50 border-gray-600' : 'bg-blue-50 border-blue-100'}`}>
                                <h3 className="text-sm font-bold text-indigo-500 mb-3 uppercase tracking-wider">Competition Info</h3>
                                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                    <InputGroup label="Competition" name="title" val={formData.title} readOnly darkMode={darkMode} />
                                    <InputGroup label="Division" name="division" val={formData.division} readOnly darkMode={darkMode} />
                                    <InputGroup label="Category" name="category" val={formData.category} readOnly darkMode={darkMode} />
                                    <InputGroup label="Date/Time" name="dateTime" val={formData.dateTime} readOnly darkMode={darkMode} />
                                    <InputGroup label="Home Team" name="teamHome" val={formData.teamHome} readOnly darkMode={darkMode} />
                                    <InputGroup label="Away Team" name="teamAway" val={formData.teamAway} readOnly darkMode={darkMode} />
                                </div>
                            </div>

                            {/* Section 2: Match Details (Editable) */}
                            <div className="col-span-full mb-2">
                                <h3 className="text-sm font-bold text-indigo-500 mb-3 uppercase tracking-wider">Match Specifics</h3>
                                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                                    <InputGroup label="Match No." name="matchNumber" val={formData.matchNumber} onChange={handleFormChange} darkMode={darkMode} />
                                    <InputGroup label="Phase" name="phase" val={formData.phase} onChange={handleFormChange} darkMode={darkMode} />
                                    <InputGroup label="Pool" name="pool" val={formData.pool} onChange={handleFormChange} darkMode={darkMode} />
                                    <InputGroup label="City" name="city" val={formData.city} onChange={handleFormChange} darkMode={darkMode} />
                                    <InputGroup label="Stadium" name="stadium" val={formData.stadium} onChange={handleFormChange} darkMode={darkMode} />
                                    <InputGroup label="Country Code" name="countryCode" val={formData.countryCode} onChange={handleFormChange} darkMode={darkMode} />
                                </div>
                            </div>

                            {/* Section 3: Officials (Editable) */}
                            <div className="col-span-full">
                                <h3 className="text-sm font-bold text-indigo-500 mb-3 uppercase tracking-wider">Officials</h3>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 p-4 bg-gray-50 dark:bg-gray-800/50 rounded-lg border border-gray-200 dark:border-gray-700">
                                    {/* 1st Referee */}
                                    <div className="space-y-2">
                                        <div className="font-semibold text-sm mb-1">1st Referee</div>
                                        <SelectGroup label="Name - Surname" name="referee1" val={formData.referee1} onChange={handleFormChange} options={referees} icon={<User size={14} />} darkMode={darkMode} />
                                        <div className="grid grid-cols-2 gap-2">
                                            <InputGroup label="Country" name="referee1Country" val={referees.find(r => r.id == formData.referee1)?.country || ''} readOnly darkMode={darkMode} />
                                            <InputGroup label="Code" name="referee1Code" val="" readOnly darkMode={darkMode} /> {/* Assuming Code is not in DB yet for Ref? */}
                                        </div>
                                    </div>

                                    {/* 2nd Referee */}
                                    <div className="space-y-2">
                                        <div className="font-semibold text-sm mb-1">2nd Referee</div>
                                        <SelectGroup label="Name - Surname" name="referee2" val={formData.referee2} onChange={handleFormChange} options={referees} icon={<User size={14} />} darkMode={darkMode} />
                                        <div className="grid grid-cols-2 gap-2">
                                            <InputGroup label="Country" name="referee2Country" val={referees.find(r => r.id == formData.referee2)?.country || ''} readOnly darkMode={darkMode} />
                                            <InputGroup label="Code" name="referee2Code" val="" readOnly darkMode={darkMode} />
                                        </div>
                                    </div>

                                    {/* RR */}
                                    <div className="space-y-2">
                                        <div className="font-semibold text-sm mb-1">Reserve Referee (RR)</div>
                                        <InputGroup label="Name - Surname" name="rrName" val={formData.rrName} onChange={handleFormChange} darkMode={darkMode} />
                                        <div className="grid grid-cols-2 gap-2">
                                            <InputGroup label="Country" name="rrCountry" val={formData.rrCountry} onChange={handleFormChange} darkMode={darkMode} />
                                            <InputGroup label="Code" name="rrCode" val={formData.rrCode} onChange={handleFormChange} darkMode={darkMode} />
                                        </div>
                                    </div>

                                    {/* RC - Wait, user asked for "RC" text box. Is RC = Reserve Controller? Or Referee Coach? Assuming RC is the label. */}
                                    <div className="space-y-2">
                                        <div className="font-semibold text-sm mb-1">RC</div>
                                        <InputGroup label="Name - Surname" name="rcName" val={formData.rcName} onChange={handleFormChange} darkMode={darkMode} />
                                        <div className="grid grid-cols-2 gap-2">
                                            <InputGroup label="Country" name="rcCountry" val={formData.rcCountry} onChange={handleFormChange} darkMode={darkMode} />
                                            <InputGroup label="Code" name="rcCode" val={formData.rcCode} onChange={handleFormChange} darkMode={darkMode} />
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* Stat 2: Scores */}
                            <div className="col-span-full mt-2">
                                <h3 className="text-sm font-bold text-indigo-500 mb-3 uppercase tracking-wider">Scores</h3>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 p-4 bg-gray-50 dark:bg-gray-800/50 rounded-lg border border-gray-200 dark:border-gray-700">
                                    <div className="space-y-2">
                                        <div className="font-semibold text-sm mb-1">Scorer</div>
                                        <SelectGroup label="Name - Surname" name="scorer" val={formData.scorer} onChange={handleFormChange} options={scorers} icon={<User size={14} />} darkMode={darkMode} />
                                        <InputGroup label="Country" name="scorerCountry" val={scorers.find(s => s.id == formData.scorer)?.country || ''} readOnly darkMode={darkMode} />
                                    </div>
                                    <div className="space-y-2">
                                        <div className="font-semibold text-sm mb-1">Assistant Scorer</div>
                                        <InputGroup label="Name - Surname" name="assistantScorerName" val={formData.assistantScorerName} onChange={handleFormChange} darkMode={darkMode} />
                                        <InputGroup label="Country" name="assistantScorerCountry" val={formData.assistantScorerCountry} onChange={handleFormChange} darkMode={darkMode} />
                                    </div>
                                </div>
                            </div>

                            {/* Stat 3: Line Judges */}
                            <div className="col-span-full mt-2">
                                <h3 className="text-sm font-bold text-indigo-500 mb-3 uppercase tracking-wider">Line Judges</h3>
                                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 p-4 bg-gray-50 dark:bg-gray-800/50 rounded-lg border border-gray-200 dark:border-gray-700">
                                    <SelectGroup label="1. Name - Surname" name="lineJudge1" val={formData.lineJudge1} onChange={handleFormChange} options={lineJudges} darkMode={darkMode} />
                                    <SelectGroup label="2. Name - Surname" name="lineJudge2" val={formData.lineJudge2} onChange={handleFormChange} options={lineJudges} darkMode={darkMode} />
                                    <SelectGroup label="3. Name - Surname" name="lineJudge3" val={formData.lineJudge3} onChange={handleFormChange} options={lineJudges} darkMode={darkMode} />
                                    <SelectGroup label="4. Name - Surname" name="lineJudge4" val={formData.lineJudge4} onChange={handleFormChange} options={lineJudges} darkMode={darkMode} />
                                </div>
                            </div>

                            {/* Stat 4: Committees */}
                            <div className="col-span-full mt-2">
                                <h3 className="text-sm font-bold text-indigo-500 mb-3 uppercase tracking-wider">Committees</h3>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 p-4 bg-gray-50 dark:bg-gray-800/50 rounded-lg border border-gray-200 dark:border-gray-700">
                                    <div className="space-y-2">
                                        <div className="font-semibold text-sm mb-1">Technical Delegate (TD)</div>
                                        <InputGroup label="Name - Surname" name="tdName" val={formData.tdName} onChange={handleFormChange} darkMode={darkMode} />
                                        {/* Added Country/Code for TD just in case, or hide if not needed. User only said "1. TD 2. RD". I will assume just Name for now? 
                                            Wait, "RR > Text box, Country, Code". "RC > Text box, Country, Code".
                                            But for Stat 4, user just listed "1. TD 2. RD". 
                                            I'll keep it simple: Just Name for TD and RD as requested. 
                                        */}
                                    </div>
                                    <div className="space-y-2">
                                        <div className="font-semibold text-sm mb-1">Referee Delegate (RD)</div>
                                        <InputGroup label="Name - Surname" name="rdName" val={formData.rdName} onChange={handleFormChange} darkMode={darkMode} />
                                    </div>
                                </div>
                            </div>

                        </div>

                        {/* Footer */}
                        <div className={`p-4 border-t flex justify-end gap-3 shrink-0 ${darkMode ? 'border-gray-700 bg-gray-800' : 'border-gray-200 bg-gray-50'}`}>
                            <button
                                onClick={() => setShowModal(false)}
                                className="px-5 py-2.5 rounded-lg font-semibold text-gray-500 hover:bg-gray-200/50 transition"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={handleEnterScorer}
                                className="px-6 py-2.5 rounded-lg font-bold bg-indigo-600 text-white shadow-lg hover:bg-indigo-700 active:scale-95 transition flex items-center gap-2"
                            >
                                Enter Console <CheckCircle size={18} />
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}

// Helper Component for Inputs
const InputGroup = ({ label, name, val, onChange, readOnly = false, icon, darkMode }) => (
    <div className="flex flex-col gap-1">
        <label className={`text-xs font-bold uppercase ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>{label}</label>
        <div className="relative">
            {icon && <div className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">{icon}</div>}
            <input
                type="text"
                name={name}
                value={val || ''}
                onChange={onChange}
                readOnly={readOnly}
                className={`w-full rounded-lg border px-3 py-2 text-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all
                    ${readOnly
                        ? (darkMode ? 'bg-gray-700 text-gray-300 border-gray-600 cursor-not-allowed' : 'bg-gray-100 text-gray-500 border-gray-200 cursor-not-allowed')
                        : (darkMode ? 'bg-gray-900 text-white border-gray-600' : 'bg-white text-gray-800 border-gray-300')
                    }
                    ${icon ? 'pl-9' : ''}
                `}
            />
        </div>
    </div>
);

const SelectGroup = ({ label, name, val, onChange, options = [], icon, darkMode }) => (
    <div className="flex flex-col gap-1">
        <label className={`text-xs font-bold uppercase ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>{label}</label>
        <div className="relative">
            {icon && <div className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">{icon}</div>}
            <select
                name={name}
                value={val || ''}
                onChange={onChange}
                className={`w-full rounded-lg border px-3 py-2 text-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all appearance-none
                    ${darkMode ? 'bg-gray-900 text-white border-gray-600' : 'bg-white text-gray-800 border-gray-300'}
                    ${icon ? 'pl-9' : ''}
                `}
            >
                <option value="">-- Select --</option>
                {options.map(opt => (
                    <option key={opt.id} value={opt.id}>
                        {opt.firstname} {opt.lastname} ({opt.country || '-'})
                    </option>
                ))}
            </select>
            <div className={`absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7"></path></svg>
            </div>
        </div>
    </div>
);