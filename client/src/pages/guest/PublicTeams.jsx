import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import client from '../../api';
import { Users, ArrowLeft, Ruler, Weight, Calendar, Filter, Trophy, LogIn, X, BarChart2, Activity, Shield, Swords } from 'lucide-react';

export default function PublicTeams() {
    const navigate = useNavigate();
    // --- State ---
    const [groupedComps, setGroupedComps] = useState({}); // เก็บข้อมูลที่จัดกลุ่มแล้ว { "ชื่อรายการ": { Men: id, Women: id } }
    const [compTitles, setCompTitles] = useState([]);     // รายชื่อรายการ (Unique)
    
    const [selectedTitle, setSelectedTitle] = useState(''); // ชื่อรายการที่เลือก
    const [selectedGender, setSelectedGender] = useState('All'); // เพศที่เลือก (Men/Women/All)
    
    const [teams, setTeams] = useState([]);
    const [selectedTeam, setSelectedTeam] = useState(null);
    const [players, setPlayers] = useState([]);
    
    const [viewingPlayer, setViewingPlayer] = useState(null);
    const [playerStats, setPlayerStats] = useState(null);
    
    const [loading, setLoading] = useState(false);
    const [loadingPlayers, setLoadingPlayers] = useState(false);

    // 1. โหลดรายการแข่งขัน และ จัดกลุ่ม (Grouping)
    useEffect(() => {
        const fetchComps = async () => {
            try {
                const res = await client.get('/public/competitions');
                const rawData = res.data;

                // Logic การจัดกลุ่มตามชื่อ
                const groups = {};
                
                rawData.forEach(comp => {
                    // ตัดคำต่อท้ายเช่น (Men), (Women), (Male), (Female) ออกเพื่อให้เหลือแค่ชื่อรายการ
                    // Regex นี้จะลบวงเล็บและคำระบุเพศข้างใน
                    const baseTitle = comp.title.replace(/\s*\(?(Men|Women|Male|Female|ชาย|หญิง)\)?$/i, '').trim();
                    
                    if (!groups[baseTitle]) {
                        groups[baseTitle] = {};
                    }
                    
                    // map gender ของ API ให้เป็น Key มาตรฐาน
                    let genderKey = 'Men';
                    if (['Women', 'Female', 'หญิง'].includes(comp.gender)) genderKey = 'Women';
                    
                    groups[baseTitle][genderKey] = comp.id;
                });

                setGroupedComps(groups);
                const titles = Object.keys(groups);
                setCompTitles(titles);

                // Default เลือกรายการแรก
                if (titles.length > 0) {
                    setSelectedTitle(titles[0]);
                }

            } catch (err) {
                console.error("Error fetching competitions:", err);
            }
        };
        fetchComps();
    }, []);

    // 2. ตรวจสอบว่า ID ของการแข่งขันคืออะไร (ตาม Title และ Gender ที่เลือก)
    useEffect(() => {
        if (!selectedTitle || !groupedComps[selectedTitle]) return;

        // หา ID จากกลุ่มข้อมูล
        const compIdsMap = groupedComps[selectedTitle];
        let targetIds = [];

        if (selectedGender === 'All') {
            targetIds = Object.values(compIdsMap);
        } else if (compIdsMap[selectedGender]) {
            targetIds = [compIdsMap[selectedGender]];
        }

        if (targetIds.length > 0) {
            fetchTeams(targetIds);
        } else {
            // ถ้าเลือกเพศนี้แล้วไม่มีรายการ (เช่น รายการนี้มีแค่ทีมหญิง)
            setTeams([]); 
        }
        
        // รีเซ็ตทีมที่เลือกค้างไว้
        setSelectedTeam(null); 

    }, [selectedTitle, selectedGender, groupedComps]);


    // ฟังก์ชันดึงทีม
    const fetchTeams = async (compIds) => {
        setLoading(true);
        try {
            const ids = Array.isArray(compIds) ? compIds : [compIds];
            const promises = ids.map(id => client.get(`/public/competitions/${id}/teams`));
            const results = await Promise.all(promises);
            const allTeams = results.flatMap(res => res.data);
            setTeams(allTeams);
        } catch (err) {
            console.error("Error fetching teams:", err);
            setTeams([]);
        } finally {
            setLoading(false);
        }
    };

    // 3. โหลดนักกีฬา เมื่อเลือกทีม
    useEffect(() => {
        if (!selectedTeam) return;

        const fetchPlayers = async () => {
            setLoadingPlayers(true);
            try {
                const res = await client.get(`/public/teams/${selectedTeam.id}/players`);
                setPlayers(res.data);
            } catch (err) {
                console.error("Error fetching players:", err);
            } finally {
                setLoadingPlayers(false);
            }
        };
        fetchPlayers();
    }, [selectedTeam]);

    const handleViewPlayerStats = async (player) => {
        setViewingPlayer(player);
        setPlayerStats(null);
        try {
            const res = await client.get(`/public/players/${player.id}/stats`);
            setPlayerStats(res.data);
        } catch (err) {
            console.error("Error fetching player stats:", err);
        }
    };

    // ฟังก์ชันคำนวณอายุ
    const calculateAge = (birthDate) => {
        if (!birthDate) return '-';
        const birth = new Date(birthDate);
        const today = new Date();
        let age = today.getFullYear() - birth.getFullYear();
        if (today < new Date(today.getFullYear(), birth.getMonth(), birth.getDate())) {
            age--;
        }
        return age;
    };

    // ตรวจสอบว่ารายการที่เลือก มีเพศไหนให้เลือกบ้าง (เพื่อ Disable ปุ่ม)
    const availableGenders = selectedTitle && groupedComps[selectedTitle] ? Object.keys(groupedComps[selectedTitle]) : [];

    return (
        <div className="min-h-screen bg-gray-50 text-gray-800 pb-20 font-sans">
            {/* Navbar (คงเดิมไว้) */}
            <nav className="bg-white shadow-sm sticky top-0 z-50">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="flex justify-between h-16 items-center">
                        <div className="flex items-center gap-2 cursor-pointer" onClick={() => navigate('/')}>
                            <div className="w-8 h-8 bg-indigo-600 rounded-lg flex items-center justify-center text-white font-bold">V</div>
                            <span className="font-bold text-xl tracking-tight text-indigo-900">VolleySystem</span>
                        </div>
                        <div className="hidden md:flex items-center gap-8">
                            <button onClick={() => navigate('/')} className="text-sm font-medium text-gray-700 hover:text-indigo-600 transition">หน้าแรก</button>
                            <button onClick={() => navigate('/teams')} className="text-sm font-medium text-indigo-600 transition">ทีม</button>
                            <button onClick={() => navigate('/matches')} className="text-sm font-medium text-gray-700 hover:text-indigo-600 transition">ตารางแข่งขัน</button>
                            <button onClick={() => navigate('/standings')} className="text-sm font-medium text-gray-700 hover:text-indigo-600 transition">อันดับทีม</button>
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

            {/* ✅ LOGIC: ถ้ายังไม่เลือกทีม ให้แสดง Header + Grid */}
            {!selectedTeam ? (
                <>
                    {/* --- Header Section (แสดงเฉพาะตอนเลือกรายการ) --- */}
                    <div className="bg-indigo-900 text-white py-10 px-4 shadow-lg mb-6">
                        <div className="max-w-7xl mx-auto">
                            <h1 className="text-3xl font-extrabold flex items-center gap-3 mb-6">
                                <Users className="text-yellow-400" size={32} /> Participating Teams
                            </h1>
                            
                            <div className="bg-white/10 p-6 rounded-2xl backdrop-blur-sm border border-white/10 shadow-inner">
                                <div className="flex flex-col md:flex-row gap-6 items-end">
                                    {/* 1. Competition Dropdown */}
                                    <div className="flex-1 w-full">
                                        <label className="text-sm font-bold text-indigo-200 mb-2 flex items-center gap-2">
                                            <Trophy size={16}/> Select Tournament
                                        </label>
                                        <select 
                                            value={selectedTitle}
                                            onChange={(e) => {
                                                setSelectedTitle(e.target.value);
                                                const nextComps = groupedComps[e.target.value];
                                                if (selectedGender !== 'All' && nextComps && !nextComps[selectedGender]) {
                                                    setSelectedGender('All');
                                                }
                                            }}
                                            className="w-full bg-white text-gray-900 border-none rounded-xl py-3 px-4 focus:ring-4 focus:ring-yellow-400/50 shadow-lg font-medium text-lg"
                                        >
                                            {compTitles.length === 0 ? (
                                                <option>No competitions found</option>
                                            ) : (
                                                compTitles.map((title, index) => (
                                                    <option key={index} value={title}>{title}</option>
                                                ))
                                            )}
                                        </select>
                                    </div>

                                    {/* 2. Gender Selection */}
                                    <div className="w-full md:w-auto">
                                        <label className="text-sm font-bold text-indigo-200 mb-2 flex items-center gap-2">
                                            <Filter size={16}/> Category
                                        </label>
                                        <div className="bg-indigo-800 p-1 rounded-xl flex shadow-inner">
                                            {['All', 'Men', 'Women'].map((gender) => {
                                                const isActive = selectedGender === gender;
                                                const isDisabled = gender !== 'All' && !availableGenders.includes(gender);
                                                
                                                let label = gender;
                                                if (gender === 'All') label = 'All (ทั้งหมด)';
                                                else if (gender === 'Male') label = 'Male (ชาย)';
                                                else if (gender === 'Female') label = 'Female (หญิง)';

                                                return (
                                                    <button
                                                        key={gender}
                                                        onClick={() => !isDisabled && setSelectedGender(gender)}
                                                        disabled={isDisabled}
                                                        className={`
                                                            px-4 py-2 rounded-lg text-sm font-bold transition-all flex items-center gap-2
                                                            ${isActive 
                                                                ? 'bg-yellow-400 text-indigo-900 shadow-md transform scale-105' 
                                                                : 'text-indigo-300 hover:bg-white/5'
                                                            }
                                                            ${isDisabled ? 'opacity-30 cursor-not-allowed' : 'cursor-pointer'}
                                                        `}
                                                    >
                                                        {label}
                                                    </button>
                                                );
                                            })}
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className="max-w-7xl mx-auto px-4">
                        {/* --- ส่วนแสดงรายชื่อทีม (Grid) --- */}
                        {loading ? (
                            <div className="text-center py-20 flex flex-col items-center">
                                <div className="animate-spin rounded-full h-12 w-12 border-b-4 border-indigo-900 mb-4"></div>
                                <p className="text-gray-500 font-medium">Loading teams...</p>
                            </div>
                        ) : teams.length === 0 ? (
                            <div className="text-center py-20 bg-white rounded-xl border border-gray-200 shadow-sm">
                                <Users size={48} className="mx-auto text-gray-300 mb-3" />
                                <p className="text-gray-500 text-lg">
                                    No {selectedGender} teams found in this tournament.
                                </p>
                            </div>
                        ) : (
                            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 animate-fade-in-up">
                                {teams.map((team) => (
                                    <button 
                                        key={team.id} 
                                        onClick={() => setSelectedTeam(team)}
                                        className="bg-white rounded-2xl shadow-sm hover:shadow-xl hover:-translate-y-1 cursor-pointer transition-all duration-300 border border-gray-100 overflow-hidden group flex flex-col h-full text-left"
                                    >
                                        <div className={`h-2 w-full transition-colors ${selectedGender === 'Men' ? 'bg-blue-500' : 'bg-pink-500'}`}></div>
                                        <div className="p-6 flex flex-col items-center text-center flex-1">
                                            <div className="w-24 h-24 mb-4 bg-gray-50 rounded-full flex items-center justify-center overflow-hidden border-4 border-white shadow-md group-hover:scale-110 transition-transform">
                                                {team.logo_url ? (
                                                    <img src={team.logo_url} alt={team.name} className="w-full h-full object-cover" />
                                                ) : (
                                                    <Users size={40} className="text-gray-300" />
                                                )}
                                            </div>
                                            <h3 className="text-lg font-bold text-gray-800 group-hover:text-indigo-700 mb-1 leading-tight">
                                                {team.name}
                                            </h3>
                                            <span className="inline-block px-2 py-1 bg-gray-100 text-gray-500 text-xs rounded-md font-mono mb-2">
                                                {team.code || '-'}
                                            </span>
                                        </div>
                                        <div className="py-3 bg-gray-50 border-t border-gray-100 text-center text-sm font-bold text-indigo-600 group-hover:bg-indigo-50 transition-colors">
                                            View Players
                                        </div>
                                    </button>
                                ))}
                            </div>
                        )}
                    </div>
                </>
            ) : (
                /* --- ส่วนแสดงรายละเอียดทีม & นักกีฬา (เมื่อกดเลือกทีมแล้ว) --- */
                <div className="max-w-7xl mx-auto px-4 mt-8 animate-fade-in-up">
                    <button 
                        onClick={() => setSelectedTeam(null)}
                        className="mb-6 flex items-center gap-2 px-4 py-2 bg-white rounded-full shadow-sm text-indigo-600 font-bold hover:bg-indigo-50 hover:pr-6 transition-all"
                    >
                        <ArrowLeft size={20} /> Back to Teams
                    </button>

                    {/* Team Header */}
                    <div className="bg-white rounded-3xl shadow-lg border border-gray-100 p-8 mb-8 relative overflow-hidden">
                        <div className={`absolute top-0 right-0 w-64 h-64 rounded-full -mr-16 -mt-16 blur-3xl opacity-20 ${selectedGender === 'Men' ? 'bg-blue-500' : 'bg-pink-500'}`}></div>
                        
                        <div className="flex flex-col md:flex-row items-center gap-8 relative z-10">
                            <div className="w-32 h-32 md:w-48 md:h-48 bg-white rounded-full border-4 border-indigo-50 shadow-xl overflow-hidden flex-shrink-0 flex items-center justify-center">
                                {selectedTeam.logo_url ? (
                                    <img src={selectedTeam.logo_url} alt={selectedTeam.name} className="w-full h-full object-cover" />
                                ) : (
                                    <Users size={64} className="text-gray-300" />
                                )}
                            </div>
                            <div className="text-center md:text-left flex-1">
                                <h2 className="text-3xl md:text-5xl font-extrabold text-gray-900 mb-3 tracking-tight">{selectedTeam.name}</h2>
                                <div className="flex flex-wrap gap-3 justify-center md:justify-start items-center text-gray-600">
                                    <span className="bg-indigo-100 text-indigo-800 px-3 py-1 rounded-lg text-sm font-bold border border-indigo-200">
                                        CODE: {selectedTeam.code}
                                    </span>
                                    {/* ส่วนชื่อโค้ชที่เราเพิ่มไป */}
                                    <span className="flex items-center gap-2 text-lg ml-4">
                                        Head Coach: <span className="font-bold text-gray-900">{selectedTeam.coach || '-'}</span>
                                    </span>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Player Table (คงเดิม) */}
                    <div className="bg-white rounded-2xl shadow-lg border border-gray-200 overflow-hidden">
                        <div className="bg-gradient-to-r from-gray-50 to-white px-6 py-5 border-b border-gray-200 flex items-center gap-3">
                            <div className="bg-indigo-600 text-white p-2 rounded-lg shadow-sm">
                                <Users size={20} />
                            </div>
                            <h3 className="font-bold text-gray-800 text-xl">Team Roster</h3>
                            <span className="ml-auto bg-gray-100 text-gray-500 px-3 py-1 rounded-full text-xs font-bold">
                                Total: {players.length} Players
                            </span>
                        </div>

                        <div className="overflow-x-auto">
                            <table className="w-full text-left border-collapse">
                                <thead>
                                    <tr className="bg-gray-100/50 text-gray-500 text-xs font-bold uppercase tracking-wider">
                                        <th className="px-6 py-4 text-center w-24">Photo</th>
                                        <th className="px-6 py-4 text-center w-20">Number</th>
                                        <th className="px-6 py-4">Name</th>
                                        <th className="px-6 py-4">Position</th>
                                        <th className="px-6 py-4 text-center">Height (cm)</th>
                                        <th className="px-6 py-4 text-center">Weight (kg)</th>
                                        <th className="px-6 py-4 text-center">Age</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-100">
                                    {loadingPlayers ? (
                                        <tr>
                                            <td colSpan="7" className="px-6 py-12 text-center text-gray-400">
                                                Loading players data...
                                            </td>
                                        </tr>
                                    ) : players.length === 0 ? (
                                        <tr>
                                            <td colSpan="7" className="px-6 py-12 text-center text-gray-400 flex flex-col items-center">
                                                <Users size={32} className="mb-2 opacity-50"/>
                                                No players registered in this team.
                                            </td>
                                        </tr>
                                    ) : (
                                        players.map((p) => (
                                            <tr key={p.id} onClick={() => handleViewPlayerStats(p)} className="hover:bg-indigo-50/40 transition duration-200 group cursor-pointer">
                                                <td className="px-6 py-3 text-center">
                                                    <div className="w-12 h-12 mx-auto bg-gray-200 rounded-full overflow-hidden border-2 border-white shadow-sm group-hover:border-indigo-200 transition">
                                                        {p.photo ? (
                                                            <img src={p.photo} alt={p.first_name} className="w-full h-full object-cover" />
                                                        ) : (
                                                            <Users size={20} className="w-full h-full p-2.5 text-gray-400" />
                                                        )}
                                                    </div>
                                                </td>
                                                <td className="px-6 py-3 text-center">
                                                    <span className="text-xl font-black text-indigo-900 bg-indigo-50 w-10 h-10 flex items-center justify-center rounded-lg mx-auto">
                                                        {p.number}
                                                    </span>
                                                </td>
                                                <td className="px-6 py-3">
                                                    <div className="font-bold text-gray-800">{p.first_name} {p.last_name}</div>
                                                </td>
                                                <td className="px-6 py-3">
                                                    <span className="inline-block px-2.5 py-1 rounded-md text-xs font-bold uppercase tracking-wide bg-gray-100 text-gray-600 border border-gray-200">
                                                        {p.position || '-'}
                                                    </span>
                                                </td>
                                                <td className="px-6 py-3 text-center text-gray-600 font-medium">
                                                    {p.height_cm ? p.height_cm : '-'}
                                                </td>
                                                <td className="px-6 py-3 text-center text-gray-600 font-medium">
                                                    {p.weight ? p.weight : '-'}
                                                </td>
                                                <td className="px-6 py-3 text-center text-gray-600">
                                                    {p.birth_date ? (
                                                        <span className="inline-flex items-center gap-1 bg-green-50 text-green-700 px-2 py-1 rounded text-xs font-bold">
                                                            {calculateAge(p.birth_date)}
                                                        </span>
                                                    ) : '-'}
                                                </td>
                                            </tr>
                                        ))
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </div>
                </div>
            )}

            {/* Player Stats Modal */}
            {viewingPlayer && (
                <div className="fixed inset-0 bg-black/60 z-[60] flex items-center justify-center p-4 backdrop-blur-sm animate-fade-in">
                    <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl overflow-hidden flex flex-col max-h-[90vh]">
                        {/* Header */}
                        <div className="px-6 py-4 border-b border-gray-100 flex justify-between items-center bg-gradient-to-r from-indigo-600 to-violet-600 text-white">
                            <div className="flex items-center gap-3">
                                <div className="bg-white/20 p-2 rounded-lg backdrop-blur-sm">
                                    <BarChart2 size={24} className="text-white"/>
                                </div>
                                <div>
                                    <h3 className="font-bold text-lg">{viewingPlayer.first_name} {viewingPlayer.last_name}</h3>
                                    <p className="text-xs text-indigo-100 opacity-90">#{viewingPlayer.number} • {viewingPlayer.position}</p>
                                </div>
                            </div>
                            <button onClick={() => setViewingPlayer(null)} className="text-white/80 hover:text-white hover:bg-white/20 p-1.5 rounded-full transition">
                                <X size={20}/>
                            </button>
                        </div>
                        
                        <div className="p-6 overflow-y-auto">
                            {!playerStats ? (
                                <div className="flex justify-center py-10">
                                    <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-indigo-600"></div>
                                </div>
                            ) : (
                                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                                    {/* Attack */}
                                    <div className="col-span-2 bg-rose-50 p-4 rounded-xl border border-rose-100">
                                        <h4 className="text-rose-600 font-bold text-sm uppercase mb-3 flex items-center gap-2">
                                            <Swords size={16}/> Attack
                                        </h4>
                                        <div className="grid grid-cols-3 gap-2 text-center">
                                            <div><div className="text-2xl font-black text-gray-800">{playerStats.attack_kills ?? 0}</div><div className="text-xs text-gray-500">Kills</div></div>
                                            <div><div className="text-2xl font-black text-gray-800">{playerStats.attack_errors ?? 0}</div><div className="text-xs text-gray-500">Errors</div></div>
                                            <div><div className={`text-2xl font-black ${parseFloat(playerStats.attack_efficiency ?? 0) >= 25 ? 'text-green-600' : 'text-gray-800'}`}>{playerStats.attack_efficiency ?? 0}%</div><div className="text-xs text-gray-500">Eff</div></div>
                                        </div>
                                    </div>
                                    {/* Block */}
                                    <div className="bg-emerald-50 p-4 rounded-xl border border-emerald-100">
                                        <h4 className="text-emerald-600 font-bold text-sm uppercase mb-3 flex items-center gap-2">
                                            <Shield size={16}/> Block
                                        </h4>
                                        <div className="text-center">
                                            <div className="text-3xl font-black text-gray-800">{playerStats.block_points ?? 0}</div>
                                            <div className="text-xs text-gray-500">Kill Blocks</div>
                                        </div>
                                    </div>
                                    {/* Serve */}
                                    <div className="bg-blue-50 p-4 rounded-xl border border-blue-100">
                                        <h4 className="text-blue-600 font-bold text-sm uppercase mb-3 flex items-center gap-2">
                                            <Activity size={16}/> Serve
                                        </h4>
                                        <div className="flex justify-around text-center">
                                            <div><div className="text-xl font-black text-gray-800">{playerStats.serve_aces ?? 0}</div><div className="text-[10px] text-gray-500">Aces</div></div>
                                            <div><div className="text-xl font-black text-gray-800">{playerStats.serve_errors ?? 0}</div><div className="text-[10px] text-gray-500">Err</div></div>
                                        </div>
                                    </div>
                                    {/* Defense */}
                                    <div className="col-span-2 md:col-span-4 bg-gray-50 p-4 rounded-xl border border-gray-100 flex justify-around items-center">
                                        <div className="text-center">
                                            <div className="text-2xl font-black text-gray-800">{playerStats.digs ?? 0}</div>
                                            <div className="text-xs text-gray-500 uppercase font-bold">Digs</div>
                                        </div>
                                        <div className="w-px h-8 bg-gray-200"></div>
                                        <div className="text-center">
                                            <div className="text-2xl font-black text-gray-800">{playerStats.receptions ?? 0}</div>
                                            <div className="text-xs text-gray-500 uppercase font-bold">Receptions</div>
                                        </div>
                                        <div className="w-px h-8 bg-gray-200"></div>
                                        <div className="text-center">
                                            <div className="text-2xl font-black text-gray-800">{playerStats.total_actions ?? 0}</div>
                                            <div className="text-xs text-gray-500 uppercase font-bold">Total Actions</div>
                                        </div>
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}