import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import client from '../../api';
import { Trophy, Filter, LogIn, X } from 'lucide-react';

export default function PublicStandings() {
    const navigate = useNavigate();
    const [competitions, setCompetitions] = useState([]);
    const [selectedCompId, setSelectedCompId] = useState('');
    const [standings, setStandings] = useState([]);
    const [loading, setLoading] = useState(false);
    const [allMatches, setAllMatches] = useState([]);
    const [selectedTeam, setSelectedTeam] = useState(null);

    // 1. ดึงรายการแข่งขัน
    useEffect(() => {
        const fetchComps = async () => {
            try {
                const res = await client.get('/public/competitions');
                setCompetitions(res.data);
                if (res.data.length > 0) {
                    setSelectedCompId(res.data[0].id);
                }
            } catch (err) {
                console.error("Error fetching competitions:", err);
            }
        };
        fetchComps();
    }, []);

    // 2. คำนวณตารางคะแนนเมื่อเลือกรายการแข่งขัน
    useEffect(() => {
        if (!selectedCompId) return;
        calculateStandings(selectedCompId);
    }, [selectedCompId]);

    const calculateStandings = async (compId) => {
        setLoading(true);
        try {
            // ดึงข้อมูลแมตช์และทีมแบบ Public
            const [matchesRes, teamsRes] = await Promise.all([
                client.get(`/public/matches?competitionId=${compId}`),
                client.get(`/public/competitions/${compId}/teams`)
            ]);

            const matches = matchesRes.data;
            setAllMatches(matches);
            const teams = teamsRes.data;

            // เตรียม Object เก็บสถิติ
            const stats = {};
            teams.forEach(team => {
                stats[team.id] = {
                    id: team.id,
                    name: team.name,
                    logo_url: team.logo_url,
                    played: 0, won: 0, lost: 0, points: 0,
                    sets_won: 0, sets_lost: 0,
                    points_won: 0, points_lost: 0
                };
            });

            // คำนวณคะแนน
            matches.forEach(m => {
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

                        // Logic คะแนน (3-0, 3-1 ได้ 3 แต้ม / 3-2 ได้ 2 แต้ม)
                        if (homeSets > awaySets) {
                            stats[homeId].won++;
                            stats[awayId].lost++;
                            if (awaySets < 2) { stats[homeId].points += 3; } 
                            else { stats[homeId].points += 2; stats[awayId].points += 1; }
                        } else {
                            stats[awayId].won++;
                            stats[homeId].lost++;
                            if (homeSets < 2) { stats[awayId].points += 3; } 
                            else { stats[awayId].points += 2; stats[homeId].points += 1; }
                        }

                        // Small Points (ถ้ามีข้อมูล set_scores)
                        if (m.set_scores) {
                             let scores = [];
                             try { scores = typeof m.set_scores === 'string' ? JSON.parse(m.set_scores) : m.set_scores; } catch (e) { scores = []; }
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
                const setRatio = t.sets_lost === 0 ? (t.sets_won > 0 ? 999 : 0) : t.sets_won / t.sets_lost;
                const pointRatio = t.points_lost === 0 ? (t.points_won > 0 ? 999 : 0) : t.points_won / t.points_lost;
                return { 
                    ...t, 
                    setRatioVal: setRatio, 
                    pointRatioVal: pointRatio,
                    setRatioStr: t.sets_lost === 0 ? (t.sets_won > 0 ? 'MAX' : '0.00') : setRatio.toFixed(3),
                    pointRatioStr: t.points_lost === 0 ? (t.points_won > 0 ? 'MAX' : '0.00') : pointRatio.toFixed(3)
                };
            });

            // เรียงลำดับ: Points > Won > Set Ratio > Point Ratio
            standingsArray.sort((a, b) => {
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

    const getTeamName = (id) => {
        const t = standings.find(s => s.id === id);
        return t ? t.name : 'Unknown Team';
    };

    return (
        <div className="min-h-screen bg-gray-50 text-gray-800 font-sans pb-20">
            {/* Navbar */}
            <nav className="bg-white shadow-sm sticky top-0 z-50">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="flex justify-between h-16 items-center">
                        <div className="flex items-center gap-2 cursor-pointer" onClick={() => navigate('/')}>
                            <div className="w-8 h-8 bg-indigo-600 rounded-lg flex items-center justify-center text-white font-bold">V</div>
                            <span className="font-bold text-xl tracking-tight text-indigo-900">VolleySystem</span>
                        </div>
                        <div className="hidden md:flex items-center gap-8">
                            <button onClick={() => navigate('/')} className="text-sm font-medium text-gray-700 hover:text-indigo-600 transition">หน้าแรก</button>
                            <button onClick={() => navigate('/teams')} className="text-sm font-medium text-gray-700 hover:text-indigo-600 transition">ทีม</button>
                            <button onClick={() => navigate('/matches')} className="text-sm font-medium text-gray-700 hover:text-indigo-600 transition">ตารางแข่งขัน</button>
                            <button onClick={() => navigate('/standings')} className="text-sm font-medium text-indigo-600 transition">อันดับทีม</button>
                            <button onClick={() => navigate('/statistics')} className="text-sm font-medium text-gray-700 hover:text-indigo-600 transition">Statistics</button>
                        </div>
                        <div className="flex gap-4">
                            <button onClick={() => navigate('/login')} className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-lg text-sm font-medium hover:bg-indigo-700 transition shadow-sm">
                                <LogIn size={18} /> เข้าสู่ระบบ
                            </button>
                        </div>
                    </div>
                </div>
            </nav>

            {/* Header */}
            <div className="bg-indigo-900 text-white py-12 px-4 shadow-lg mb-8">
                <div className="max-w-7xl mx-auto text-center">
                    <h1 className="text-4xl font-extrabold flex items-center justify-center gap-3 mb-2">
                        <Trophy className="text-yellow-400" size={40} /> Team Standings
                    </h1>
                    <p className="text-indigo-200">ตารางคะแนนและอันดับทีมล่าสุด</p>
                </div>
            </div>

            {/* Filter */}
            <div className="max-w-7xl mx-auto px-4 mb-8">
                <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-200 flex flex-col md:flex-row items-center justify-between gap-4">
                    <label className="font-bold text-gray-700 flex items-center gap-2">
                        <Filter size={18} className="text-indigo-500"/> เลือกรายการแข่งขัน:
                    </label>
                    <select
                        value={selectedCompId}
                        onChange={(e) => setSelectedCompId(e.target.value)}
                        className="w-full md:w-1/2 p-2 rounded-lg border border-gray-300 focus:ring-2 focus:ring-indigo-500 outline-none"
                    >
                        {competitions.map((c) => (
                            <option key={c.id} value={c.id}>
                                {c.title} ({c.gender})
                            </option>
                        ))}
                    </select>
                </div>
            </div>

            {/* Match History Modal */}
            {selectedTeam && (
                <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-[60] p-4" onClick={() => setSelectedTeam(null)}>
                    <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[80vh] flex flex-col overflow-hidden animate-fade-in-up" onClick={e => e.stopPropagation()}>
                        
                        {/* Modal Header */}
                        <div className="p-5 border-b border-gray-100 flex justify-between items-center bg-gray-50">
                            <div className="flex items-center gap-3">
                                {selectedTeam.logo_url ? (
                                    <img src={selectedTeam.logo_url} alt="" className="w-10 h-10 object-contain bg-white rounded-full p-1 shadow-sm"/>
                                ) : (
                                    <div className="w-10 h-10 bg-indigo-100 rounded-full flex items-center justify-center text-indigo-600 font-bold">
                                        {selectedTeam.name.charAt(0)}
                                    </div>
                                )}
                                <div>
                                    <h3 className="text-xl font-bold text-gray-900">{selectedTeam.name}</h3>
                                    <p className="text-xs text-gray-500">Match History</p>
                                </div>
                            </div>
                            <button onClick={() => setSelectedTeam(null)} className="p-2 hover:bg-gray-200 rounded-full transition text-gray-500">
                                <X size={20} />
                            </button>
                        </div>

                        {/* Modal Body */}
                        <div className="p-0 overflow-y-auto">
                            {allMatches.filter(m => m.home_team_id === selectedTeam.id || m.away_team_id === selectedTeam.id).length === 0 ? (
                                <div className="p-10 text-center text-gray-400">
                                    <p>ยังไม่มีประวัติการแข่งขัน</p>
                                </div>
                            ) : (
                                <div className="divide-y divide-gray-100">
                                    {allMatches
                                        .filter(m => m.home_team_id === selectedTeam.id || m.away_team_id === selectedTeam.id)
                                        .sort((a, b) => (b.id - a.id)) // เรียงตาม ID ล่าสุด (หรือใช้วันที่ถ้ามี)
                                        .map((match, idx) => {
                                            const isHome = match.home_team_id === selectedTeam.id;
                                            const opponentId = isHome ? match.away_team_id : match.home_team_id;
                                            const opponentName = getTeamName(opponentId);
                                            const myScore = isHome ? match.home_set_score : match.away_set_score;
                                            const opScore = isHome ? match.away_set_score : match.home_set_score;
                                            const isWin = parseInt(myScore) > parseInt(opScore);
                                            
                                            return (
                                                <div key={idx} className="p-4 hover:bg-gray-50 transition flex items-center justify-between">
                                                    <div className="flex items-center gap-4 flex-1">
                                                        <div className={`w-1.5 h-12 rounded-full ${isWin ? 'bg-green-500' : 'bg-red-500'}`}></div>
                                                        <div>
                                                            <p className="text-xs text-gray-400 mb-1">VS</p>
                                                            <p className="font-bold text-gray-800 text-lg">{opponentName}</p>
                                                        </div>
                                                    </div>
                                                    <div className="flex items-center gap-3">
                                                        <div className={`text-2xl font-black ${isWin ? 'text-green-600' : 'text-red-500'}`}>
                                                            {myScore} - {opScore}
                                                        </div>
                                                        <div className={`px-2 py-1 rounded text-xs font-bold uppercase ${isWin ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                                                            {isWin ? 'W' : 'L'}
                                                        </div>
                                                    </div>
                                                </div>
                                            );
                                        })}
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            )}

            {/* Table */}
            <div className="max-w-7xl mx-auto px-4">
                {loading ? (
                    <div className="text-center py-20">
                        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-900 mx-auto"></div>
                        <p className="mt-4 text-gray-500">Loading standings...</p>
                    </div>
                ) : standings.length === 0 ? (
                    <div className="text-center py-20 bg-white rounded-xl shadow-sm border border-gray-200">
                        <p className="text-gray-400">ยังไม่มีข้อมูลการแข่งขันสำหรับรายการนี้</p>
                    </div>
                ) : (
                    <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
                        <div className="overflow-x-auto">
                            <table className="w-full text-left border-collapse">
                                <thead className="bg-gray-50 text-gray-500 text-xs uppercase font-bold">
                                    <tr>
                                        <th className="px-4 py-3 text-center w-16">Rank</th>
                                        <th className="px-4 py-3">Team</th>
                                        <th className="px-2 py-3 text-center">Played</th>
                                        <th className="px-2 py-3 text-center text-green-600">Won</th>
                                        <th className="px-2 py-3 text-center text-red-500">Lost</th>
                                        <th className="px-4 py-3 text-center bg-indigo-50 text-indigo-700 text-base">Points</th>
                                        <th className="px-2 py-3 text-center border-l">Sets W</th>
                                        <th className="px-2 py-3 text-center">Sets L</th>
                                        <th className="px-2 py-3 text-center text-[10px]">Ratio</th>
                                        <th className="px-2 py-3 text-center border-l">Pts W</th>
                                        <th className="px-2 py-3 text-center">Pts L</th>
                                        <th className="px-2 py-3 text-center text-[10px]">Ratio</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-100">
                                    {standings.map((team, index) => (
                                        <tr key={team.id} className="hover:bg-gray-50 transition">
                                            <td className="px-4 py-3 text-center font-bold text-gray-700">
                                                {index + 1}
                                            </td>
                                            <td className="px-4 py-3 cursor-pointer group" onClick={() => setSelectedTeam(team)}>
                                                <div className="flex items-center gap-3">
                                                    {team.logo_url && <img src={team.logo_url} alt="" className="w-8 h-8 object-contain" />}
                                                    <span className="font-bold text-gray-800 group-hover:text-indigo-600 group-hover:underline decoration-indigo-600 underline-offset-2 transition-colors">
                                                        {team.name}
                                                    </span>
                                                </div>
                                            </td>
                                            <td className="px-2 py-3 text-center">{team.played}</td>
                                            <td className="px-2 py-3 text-center font-bold text-green-600">{team.won}</td>
                                            <td className="px-2 py-3 text-center text-red-500">{team.lost}</td>
                                            <td className="px-4 py-3 text-center font-black text-lg bg-indigo-50 text-indigo-700">{team.points}</td>
                                            <td className="px-2 py-3 text-center border-l">{team.sets_won}</td>
                                            <td className="px-2 py-3 text-center">{team.sets_lost}</td>
                                            <td className="px-2 py-3 text-center text-xs text-gray-500 font-mono">{team.setRatioStr}</td>
                                            <td className="px-2 py-3 text-center border-l">{team.points_won}</td>
                                            <td className="px-2 py-3 text-center">{team.points_lost}</td>
                                            <td className="px-2 py-3 text-center text-xs text-gray-500 font-mono">{team.pointRatioStr}</td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}
