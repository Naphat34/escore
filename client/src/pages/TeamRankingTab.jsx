import React, { useEffect, useState } from 'react';
import { api } from '../api';
import { Trophy, Filter, X, Calendar } from 'lucide-react';
import { EmptyState } from './AdminShared';

export default function TeamRankingTab({ darkMode }) {
    const [competitions, setCompetitions] = useState([]);
    const [uniqueBaseNames, setUniqueBaseNames] = useState([]);
    const [selectedBaseName, setSelectedBaseName] = useState('');
    const [standings, setStandings] = useState([]);
    const [loading, setLoading] = useState(false);
    const [genderFilter, setGenderFilter] = useState('Female'); // Default Gender
    const [allMatches, setAllMatches] = useState([]); // เก็บข้อมูลแมตช์ทั้งหมดไว้ใช้แสดง History
    const [viewingHistoryTeam, setViewingHistoryTeam] = useState(null); // ทีมที่กำลังดูประวัติ
    const [resultCols, setResultCols] = useState([]); // เก็บชื่อคอลัมน์ผลการแข่งขัน (เช่น 3-0, 3-1)
    const [availableGenders, setAvailableGenders] = useState([]); // เก็บเพศที่มีในรายการนั้นๆ
    const [pools, setPools] = useState([]); // รายชื่อ Pool ทั้งหมดในรายการนี้
    const [selectedPool, setSelectedPool] = useState(''); // Pool ที่เลือกใช้งาน

    useEffect(() => {
        fetchCompetitions();
    }, []);

    useEffect(() => {
        if (selectedBaseName && genderFilter) {
            // ค้นหา Competition ID ที่ตรงกับ ชื่อรายการ + เพศ
            const targetComp = competitions.find(c => {
                const rawTitle = c.title || c.name || '';
                const cBase = rawTitle.replace(/\s\((Male|Female|Mix|Mixed)\)$/i, '').trim();
                return cBase === selectedBaseName && c.gender === genderFilter;
            });

            if (targetComp) {
                calculateStandings(targetComp.id);
            } else {
                setStandings([]); // ไม่พบรายการสำหรับเพศนี้
            }
        } else {
            setStandings([]);
        }
    }, [selectedBaseName, genderFilter, competitions, selectedPool]);

    // เมื่อเลือกรายการแข่งขัน (Base Name) ให้หาว่ามีเพศอะไรบ้าง
    useEffect(() => {
        if (selectedBaseName && competitions.length > 0) {
            const relatedComps = competitions.filter(c => {
                const rawTitle = c.title || c.name || '';
                const cBase = rawTitle.replace(/\s\((Male|Female|Mix|Mixed)\)$/i, '').trim();
                return cBase === selectedBaseName;
            });

            const genders = [...new Set(relatedComps.map(c => c.gender))].filter(Boolean).sort();
            setAvailableGenders(genders);

            // ถ้าเพศที่เลือกอยู่ ไม่มีในรายการนี้ ให้เลือกเพศแรกที่เจอแทน
            if (genders.length > 0 && !genders.includes(genderFilter)) {
                setGenderFilter(genders[0]);
            }
        }
    }, [selectedBaseName, competitions]);

    const fetchCompetitions = async () => {
        try {
            const res = await api.getAllCompetitions();
            setCompetitions(res.data.filter(c => c.status?.toLowerCase() === 'open'));
            
            // จัดกลุ่มชื่อรายการ (ตัดวงเล็บเพศออก)
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

    const calculateStandings = async (compId) => {
        setLoading(true);
        try {
            // ดึงข้อมูลแมตช์และทีมของรายการนั้นๆ
            const [matchesRes, teamsRes] = await Promise.all([
                api.getMatchesByCompetition(compId),
                api.getTeamsByCompetition(compId)
            ]);

            const matches = matchesRes.data;
            setAllMatches(matches); // เก็บแมตช์ดิบไว้ใช้งาน
            let teams = teamsRes.data;

            // --- [NEW] จัดการ Pool Filtering ---
            // 1. หา Pool ทั้งหมดที่มีในรายการนี้ (จาก matches)
            const uniquePools = [...new Set(matches.map(m => m.pool_name).filter(Boolean))].sort();
            setPools(uniquePools);

            // 2. ถ้ามี Pool และมีการเลือก Pool ให้กรองข้อมูล
            let filteredMatches = matches;
            if (selectedPool) {
                filteredMatches = matches.filter(m => m.pool_name === selectedPool);
                
                // กรองเฉพาะทีมที่มีแข่งใน Pool นี้
                const teamIdsInPool = new Set();
                filteredMatches.forEach(m => {
                    if (m.home_team_id) teamIdsInPool.add(m.home_team_id);
                    if (m.away_team_id) teamIdsInPool.add(m.away_team_id);
                });
                teams = teams.filter(t => teamIdsInPool.has(t.id));
            }

            // 1. หา max_sets ของรายการนี้เพื่อสร้างคอลัมน์ Result Details
            const selectedComp = competitions.find(c => c.id == compId);
            const maxSets = selectedComp?.max_sets || 5;
            const setsToWin = Math.ceil(maxSets / 2);

            const cols = [];
            for (let i = 0; i < setsToWin; i++) cols.push(`${setsToWin}-${i}`); // Wins (e.g. 3-0, 3-1, 3-2)
            for (let i = setsToWin - 1; i >= 0; i--) cols.push(`${i}-${setsToWin}`); // Losses (e.g. 2-3, 1-3, 0-3)
            setResultCols(cols);

            // เตรียม Object สำหรับเก็บสถิติ
            const stats = {};
            teams.forEach(team => {
                stats[team.id] = {
                    id: team.id,
                    name: team.name,
                    code: team.code, // เพิ่มชื่อย่อ
                    logo_url: team.logo_url,
                    played: 0,
                    won: 0,
                    lost: 0,
                    points: 0,
                    sets_won: 0,
                    sets_lost: 0,
                    points_won: 0,
                    points_lost: 0,
                    // Result Details
                    results: {} // เก็บแบบ Dynamic
                };
                cols.forEach(k => stats[team.id].results[k] = 0);
            });

            // คำนวณคะแนนจากแมตช์ที่แข่งจบแล้ว (completed)
            filteredMatches.forEach(m => {
                // ไม่ต้องกรองเพศซ้ำซ้อน เพราะเราเลือก Competition ID ตามเพศมาแล้ว
                if (m.status === 'completed') {
                    const homeId = m.home_team_id;
                    const awayId = m.away_team_id;
                    
                    if (stats[homeId] && stats[awayId]) {
                        stats[homeId].played++;
                        stats[awayId].played++;

                        const homeSets = parseInt(m.home_set_score) || 0;
                        const awaySets = parseInt(m.away_set_score) || 0;

                        stats[homeId].sets_won += homeSets;
                        stats[homeId].sets_lost += awaySets;
                        stats[awayId].sets_won += awaySets;
                        stats[awayId].sets_lost += homeSets;

                        // นับสถิติผลการแข่งขัน (Result Details)
                        const scoreKey = `${homeSets}-${awaySets}`;
                        const reverseScoreKey = `${awaySets}-${homeSets}`;
                        if (stats[homeId].results[scoreKey] !== undefined) stats[homeId].results[scoreKey]++;
                        if (stats[awayId].results[reverseScoreKey] !== undefined) stats[awayId].results[reverseScoreKey]++;

                        // --- Logic การนับคะแนนและสถิติผลการแข่ง ---
                        if (homeSets > awaySets) {
                            // Home Wins
                            stats[homeId].won++;
                            stats[awayId].lost++;

                            // Points & Result Details
                            if (awaySets === 0) { // 3-0 or 2-0
                                stats[homeId].points += 3;
                            } else if (awaySets === 1) { // 3-1 or 2-1
                                // ตามโจทย์: ชนะ 3-1 หรือ 2-1 ได้ 2 คะแนน ?? (ปกติ FIVB 3-1 ได้ 3 แต้ม, 2-1 ได้ 2 แต้ม)
                                // ขอใช้มาตรฐานสากล: ถ้าชนะขาด (3-0, 3-1) ได้ 3 แต้ม, ถ้าชนะสูสี (3-2, 2-1) ได้ 2 แต้ม
                                // แต่ถ้าจะเอาตามโจทย์เป๊ะๆ "ชนะ 3-1 หรือ 2-1 ได้ 2 คะแนน" สามารถแก้ตรงนี้ได้
                                // *สมมติใช้มาตรฐาน FIVB สำหรับ 3-1 (3แต้ม) และ 2-1 (2แต้ม)*
                                const points = (homeSets === 3 && awaySets === 1) ? 3 : 2; 
                                stats[homeId].points += points;
                            } else { // 3-2
                                stats[homeId].points += 2;
                                stats[awayId].points += 1;
                            }
                        } else {
                            // Away Wins
                            stats[awayId].won++;
                            stats[homeId].lost++;

                            if (homeSets === 0) { // 0-3 or 0-2
                                stats[awayId].points += 3;
                            } else if (homeSets === 1) { // 1-3 or 1-2
                                // ตามโจทย์: แพ้ 1-3 หรือ 1-2 ได้ 2 คะแนน ?? (ปกติได้ 0)
                                // *สมมติใช้มาตรฐาน FIVB: 1-3 (0แต้ม), 1-2 (1แต้ม)*
                                const points = (awaySets === 3 && homeSets === 1) ? 3 : 2;
                                stats[awayId].points += points;
                            } else { // 2-3
                                stats[awayId].points += 2;
                                stats[homeId].points += 1;
                            }
                        }

                        // คำนวณแต้มดิบ (Small Points)
                        if (m.set_scores) {
                             let scores = [];
                             try {
                                 scores = typeof m.set_scores === 'string' ? JSON.parse(m.set_scores) : m.set_scores;
                             } catch (e) { scores = []; }
                             
                             if (Array.isArray(scores)) {
                                 scores.forEach(setScore => {
                                     const [h, a] = setScore.split('-').map(v => parseInt(v));
                                     if (!isNaN(h) && !isNaN(a)) {
                                         stats[homeId].points_won += h;
                                         stats[homeId].points_lost += a;
                                         stats[awayId].points_won += a;
                                         stats[awayId].points_lost += h;
                                     }
                                 });
                             }
                        }
                    }
                }
            });

            // แปลงเป็น Array และคำนวณ Ratio
            const standingsArray = Object.values(stats).map(t => {
                // ถ้ายังไม่ได้แข่ง ให้ Ratio เป็น 0
                const setRatio = t.sets_lost === 0 ? (t.sets_won > 0 ? 'MAX' : 0.000) : (t.sets_won / t.sets_lost).toFixed(3);
                const pointRatio = t.points_lost === 0 ? (t.points_won > 0 ? 'MAX' : 0.000) : (t.points_won / t.points_lost).toFixed(3);
                
                return { ...t, setRatio, pointRatio, setRatioVal: t.sets_lost === 0 ? 9999 : t.sets_won / t.sets_lost, pointRatioVal: t.points_lost === 0 ? 9999 : t.points_won / t.points_lost };
            });

            // เรียงลำดับ: แมตช์ชนะ > คะแนน > Set Ratio > Point Ratio
            standingsArray.sort((a, b) => {
                // FIVB Standard: Won Matches first, then Points
                // แต่บางลีกใช้ Points ก่อน Won Matches (ตามโจทย์ข้อ 1: Rank เลื่อนขึ้นลงตาม Points)
                if (b.points !== a.points) return b.points - a.points;
                if (b.won !== a.won) return b.won - a.won;
                if (b.setRatioVal !== a.setRatioVal) return b.setRatioVal - a.setRatioVal;
                return b.pointRatioVal - a.pointRatioVal;
            });

            setStandings(standingsArray);

        } catch (err) {
            console.error("Error calculating standings:", err);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="space-y-6">
            {/* Filter Section */}
            <div className={`p-6 rounded-xl shadow-sm border ${darkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-100'}`}>
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div>
                        <h2 className="text-xl font-bold flex items-center gap-2">
                            <Trophy className="text-yellow-500" /> Team Rankings
                        </h2>
                        <p className={`text-sm ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                            View standings and statistics for each competition.
                        </p>
                    </div>
                    <div className="flex gap-4 w-full md:w-auto">
                        <div>
                        <label className={`block text-xs font-bold uppercase mb-1 ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                            Select Competition
                        </label>
                        <div className="relative">
                            <Filter className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
                            <select
                                className={`w-full pl-10 pr-4 py-2 rounded-lg border text-sm transition focus:ring-2 focus:ring-indigo-500 outline-none ${darkMode ? 'bg-gray-700 border-gray-600 text-white' : 'bg-white border-gray-300'}`}
                                value={selectedBaseName}
                                onChange={(e) => setSelectedBaseName(e.target.value)}
                            >
                                {uniqueBaseNames.map(name => (
                                    <option key={name} value={name}>
                                        {name}
                                    </option>
                                ))}
                            </select>
                        </div>
                        </div>
                        <div>
                            <label className={`block text-xs font-bold uppercase mb-1 ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                                Gender
                            </label>
                            <div className="flex bg-gray-100 dark:bg-gray-700 rounded-lg p-1">
                                {availableGenders.map(g => (
                                    <button key={g} onClick={() => setGenderFilter(g)} className={`px-3 py-1.5 text-xs font-bold rounded-md transition ${genderFilter === g ? 'bg-white dark:bg-gray-600 text-indigo-600 dark:text-indigo-400 shadow-sm' : 'text-gray-500 dark:text-gray-400 hover:text-gray-700'}`}>
                                        {g}
                                    </button>
                                ))}
                            </div>
                        </div>
                        {pools.length > 0 && (
                            <div>
                                <label className={`block text-xs font-bold uppercase mb-1 ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                                    Pool
                                </label>
                                <select
                                    className={`w-full px-3 py-1.5 rounded-lg border text-sm transition focus:ring-2 focus:ring-indigo-500 outline-none ${darkMode ? 'bg-gray-700 border-gray-600 text-white' : 'bg-white border-gray-300'}`}
                                    value={selectedPool}
                                    onChange={(e) => setSelectedPool(e.target.value)}
                                >
                                    <option value="">All Pools</option>
                                    {pools.map(p => (
                                        <option key={p} value={p}>{p}</option>
                                    ))}
                                </select>
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {/* Table Section */}
            <div className={`rounded-xl shadow-sm border overflow-hidden ${darkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-100'}`}>
                {loading ? (
                    <div className="p-12 text-center text-gray-500">Loading standings...</div>
                ) : standings.length === 0 ? (
                    <EmptyState text="No teams or matches found for this competition." darkMode={darkMode} />
                ) : (
                    <div className="overflow-x-auto">
                        <table className="w-full text-left border-collapse">
                            <thead className={`text-xs uppercase font-bold ${darkMode ? 'bg-gray-700/50 text-gray-300' : 'bg-gray-50 text-gray-500'}`}>
                                {/* Header Grouping */}
                                <tr className="border-b border-gray-200 dark:border-gray-700">
                                    <th colSpan="2" className="text-center py-2 border-r border-gray-200 dark:border-gray-700">Ranking</th>
                                    <th colSpan="3" className="text-center py-2 border-r border-gray-200 dark:border-gray-700 bg-gray-100/50 dark:bg-gray-800/50">Matches</th>
                                    <th colSpan={resultCols.length} className="text-center py-2 border-r border-gray-200 dark:border-gray-700 bg-indigo-50/30 dark:bg-indigo-900/10 text-indigo-600 dark:text-indigo-400">Result Details</th>
                                    <th colSpan="1" className="text-center py-2 border-r border-gray-200 dark:border-gray-700 font-bold text-indigo-600 dark:text-indigo-400">Total</th>
                                    <th colSpan="3" className="text-center py-2 border-r border-gray-200 dark:border-gray-700">Sets</th>
                                    <th colSpan="3" className="text-center py-2">Points</th>
                                </tr>
                                <tr>
                                    <th className="px-4 py-3 text-center w-16">Rank</th>
                                    <th className="px-4 py-3">Team</th>
                                    <th className="px-2 py-3 text-center bg-gray-100/50 dark:bg-gray-700/30" title="Total Matches">Total</th>
                                    <th className="px-2 py-3 text-center bg-gray-100/50 dark:bg-gray-700/30" title="Won">W</th>
                                    <th className="px-2 py-3 text-center bg-gray-100/50 dark:bg-gray-700/30" title="Lost">L</th>
                                    
                                    {/* Result Details */}
                                    {resultCols.map((col, i) => (
                                        <th key={col} className={`px-2 py-3 text-center text-[10px] text-gray-500 dark:text-gray-400 ${i === 0 ? 'border-l border-gray-200 dark:border-gray-700' : ''}`} title={`Result ${col}`}>{col}</th>
                                    ))}

                                    <th className="px-4 py-3 text-center border-l border-gray-200 dark:border-gray-700 font-black text-indigo-600 dark:text-indigo-400 text-lg" title="Points">POINTS</th>
                                    
                                    <th className="px-2 py-3 text-center border-l border-gray-200 dark:border-gray-700" title="Sets Won">SW</th>
                                    <th className="px-2 py-3 text-center" title="Sets Lost">SL</th>
                                    <th className="px-2 py-3 text-center text-xs" title="Set Ratio">Ratio</th>
                                    
                                    <th className="px-2 py-3 text-center border-l border-gray-200 dark:border-gray-700" title="Points Won">PW</th>
                                    <th className="px-2 py-3 text-center" title="Points Lost">PL</th>
                                    <th className="px-2 py-3 text-center text-xs" title="Point Ratio">Ratio</th>
                                </tr>
                            </thead>
                            <tbody className={`divide-y ${darkMode ? 'divide-gray-700' : 'divide-gray-100'}`}>
                                {standings.map((team, index) => (
                                    <tr key={team.id} className={`transition ${
                                        index === 0 ? (darkMode ? 'bg-yellow-900/20 hover:bg-yellow-900/30' : 'bg-yellow-50 hover:bg-yellow-100') :
                                        index === 1 ? (darkMode ? 'bg-gray-800/60 hover:bg-gray-800' : 'bg-gray-100 hover:bg-gray-200') :
                                        index === 2 ? (darkMode ? 'bg-orange-900/20 hover:bg-orange-900/30' : 'bg-orange-50 hover:bg-orange-100') :
                                        (darkMode ? 'hover:bg-gray-700' : 'hover:bg-gray-50')
                                    }`}>
                                        <td className="px-4 py-3 text-center font-bold">
                                            <div className={`w-8 h-8 rounded-full flex items-center justify-center mx-auto ${
                                                index === 0 ? 'bg-yellow-100 text-yellow-700' : 
                                                index === 1 ? 'bg-gray-100 text-gray-700' : 
                                                index === 2 ? 'bg-orange-100 text-orange-700' : ''
                                            }`}>
                                                {index + 1}
                                            </div>
                                        </td>
                                        <td className="px-4 py-3">
                                            <div 
                                                className="flex items-center gap-3 cursor-pointer hover:opacity-75 transition-opacity group"
                                                onClick={() => setViewingHistoryTeam(team)}
                                                title="Click to view match history"
                                            >
                                                {team.logo_url && <img src={team.logo_url} alt="" className="w-8 h-8 object-contain" />}
                                                <div>
                                                    <div className="font-bold text-sm group-hover:text-indigo-600 dark:group-hover:text-indigo-400 group-hover:underline underline-offset-2 decoration-indigo-500/30">{team.name}</div>
                                                    {team.code && <div className="text-xs text-gray-400 font-mono">{team.code}</div>}
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-2 py-3 text-center bg-gray-50/50 dark:bg-gray-800/30 font-medium">{team.played}</td>
                                        <td className="px-2 py-3 text-center bg-gray-50/50 dark:bg-gray-800/30 text-green-600 font-bold">{team.won}</td>
                                        <td className="px-2 py-3 text-center bg-gray-50/50 dark:bg-gray-800/30 text-red-500">{team.lost}</td>
                                        
                                        {/* Result Details */}
                                        {resultCols.map((col, i) => (
                                            <td key={col} className={`px-2 py-3 text-center text-xs text-gray-500 dark:text-gray-400 ${i === 0 ? 'border-l border-gray-200 dark:border-gray-700' : ''}`}>{team.results[col] || 0}</td>
                                        ))}

                                        <td className="px-4 py-3 text-center border-l border-gray-200 dark:border-gray-700 font-black text-lg">{team.points}</td>
                                        
                                        <td className="px-2 py-3 text-center border-l border-gray-200 dark:border-gray-700">{team.sets_won}</td>
                                        <td className="px-2 py-3 text-center">{team.sets_lost}</td>
                                        <td className="px-2 py-3 text-center text-xs text-gray-500 font-mono">{team.setRatio}</td>
                                        
                                        <td className="px-2 py-3 text-center border-l border-gray-200 dark:border-gray-700">{team.points_won}</td>
                                        <td className="px-2 py-3 text-center">{team.points_lost}</td>
                                        <td className="px-2 py-3 text-center text-xs text-gray-500 font-mono">{team.pointRatio}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>

            {/* Match History Modal */}
            {viewingHistoryTeam && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4 animate-in fade-in duration-200">
                    <div className={`relative w-full max-w-3xl rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[85vh] ${darkMode ? 'bg-gray-800 text-gray-100' : 'bg-white text-gray-900'}`}>
                        <div className="px-6 py-4 border-b flex justify-between items-center bg-indigo-600 text-white shrink-0">
                            <div>
                                <h3 className="font-bold text-lg flex items-center gap-2"><Calendar size={20}/> Match History</h3>
                                <p className="text-xs text-indigo-100 opacity-90">{viewingHistoryTeam.name}</p>
                            </div>
                            <button onClick={() => setViewingHistoryTeam(null)} className="text-white/80 hover:text-white hover:bg-white/20 p-1.5 rounded-full transition"><X size={20} /></button>
                        </div>
                        
                        <div className="p-0 overflow-y-auto flex-1">
                            {(() => {
                                // กรองแมตช์ของทีมนี้
                                const teamMatches = allMatches.filter(m => 
                                    (m.home_team_id === viewingHistoryTeam.id || m.away_team_id === viewingHistoryTeam.id) &&
                                    m.status === 'completed'
                                ).sort((a, b) => new Date(b.start_time) - new Date(a.start_time));

                                if (teamMatches.length === 0) return <div className="p-12 text-center text-gray-500">No completed matches found for this team.</div>;

                                return (
                                    <table className="w-full text-left border-collapse">
                                        <thead className={`sticky top-0 z-10 ${darkMode ? 'bg-gray-700/90 text-gray-300' : 'bg-gray-50/90 text-gray-500'} backdrop-blur-sm`}>
                                            <tr>
                                                <th className="px-6 py-3 text-xs font-bold uppercase">Date / Round</th>
                                                <th className="px-6 py-3 text-xs font-bold uppercase">Opponent</th>
                                                <th className="px-6 py-3 text-center text-xs font-bold uppercase">Result</th>
                                                <th className="px-6 py-3 text-center text-xs font-bold uppercase">Score</th>
                                            </tr>
                                        </thead>
                                        <tbody className={`divide-y ${darkMode ? 'divide-gray-700' : 'divide-gray-100'}`}>
                                            {teamMatches.map(m => {
                                                const isHome = m.home_team_id === viewingHistoryTeam.id;
                                                const opponentName = isHome ? (m.away_team || 'Unknown') : (m.home_team || 'Unknown');
                                                const myScore = isHome ? m.home_set_score : m.away_set_score;
                                                const oppScore = isHome ? m.away_set_score : m.home_set_score;
                                                const isWin = myScore > oppScore;
                                                
                                                return (
                                                    <tr key={m.id} className={darkMode ? 'hover:bg-gray-700/50' : 'hover:bg-gray-50'}>
                                                        <td className="px-6 py-4">
                                                            <div className="font-bold text-sm">{new Date(m.start_time).toLocaleDateString()}</div>
                                                            <div className="text-xs text-gray-500">{m.round_name}</div>
                                                        </td>
                                                        <td className="px-6 py-4 font-medium">{opponentName}</td>
                                                        <td className="px-6 py-4 text-center">
                                                            <span className={`px-2.5 py-1 rounded-md text-xs font-bold border ${isWin ? 'bg-green-100 text-green-700 border-green-200 dark:bg-green-900/30 dark:text-green-400 dark:border-green-800' : 'bg-red-100 text-red-700 border-red-200 dark:bg-red-900/30 dark:text-red-400 dark:border-red-800'}`}>
                                                                {isWin ? 'WIN' : 'LOSS'}
                                                            </span>
                                                        </td>
                                                        <td className="px-6 py-4 text-center">
                                                            <div className="text-lg font-black font-mono">{myScore} - {oppScore}</div>
                                                            <div className="text-xs text-gray-400 mt-1 font-mono">
                                                                {(() => {
                                                                    try {
                                                                        const sets = typeof m.set_scores === 'string' ? JSON.parse(m.set_scores) : m.set_scores;
                                                                        return Array.isArray(sets) ? sets.join(', ') : sets;
                                                                    } catch { return m.set_scores; }
                                                                })()}
                                                            </div>
                                                        </td>
                                                    </tr>
                                                );
                                            })}
                                        </tbody>
                                    </table>
                                );
                            })()}
                        </div>
                        <div className={`p-4 border-t ${darkMode ? 'border-gray-700 bg-gray-800' : 'border-gray-100 bg-gray-50'} flex justify-end`}>
                            <button onClick={() => setViewingHistoryTeam(null)} className="px-5 py-2 bg-gray-200 hover:bg-gray-300 text-gray-800 rounded-lg text-sm font-bold transition">Close</button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}