import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import client from '../../api';
import { Calendar, Clock, MapPin, Trophy, Filter, Activity, LogIn } from 'lucide-react';
import { formatThaiDate, formatThaiTime } from '../../utils';

export default function PublicMatches() {
    const navigate = useNavigate();
    const [competitions, setCompetitions] = useState([]);
    const [selectedComp, setSelectedComp] = useState('');
    const [matches, setMatches] = useState([]);
    const [loading, setLoading] = useState(false);

    // 1. โหลดรายการแข่งขันใส่ Dropdown
    useEffect(() => {
        const fetchComps = async () => {
            try {
                const res = await client.get('/public/competitions');
                const openComps = res.data.filter(c => c.status?.toLowerCase() === 'open');
                setCompetitions(openComps);
                if (openComps.length > 0) {
                    setSelectedComp(openComps[0].id); // Default เลือกอันแรก
                }
            } catch (err) {
                console.error("Error fetching competitions:", err);
            }
        };
        fetchComps();
    }, []);

    // 2. โหลดแมตช์เมื่อเลือกรายการ
    useEffect(() => {
        if (!selectedComp) return;
        const fetchMatches = async () => {
            setLoading(true);
            try {
                // ส่ง params competitionId ไป
                const res = await client.get(`/public/matches?competitionId=${selectedComp}`);
                setMatches(res.data);
            } catch (err) {
                console.error("Error fetching matches:", err);
            } finally {
                setLoading(false);
            }
        };
        fetchMatches();
    }, [selectedComp]);

    // ฟังก์ชันจัดกลุ่มแมตช์ตามวันที่ (Group by Date)
    const groupMatchesByDate = () => {
        const groups = {};
        matches.forEach(match => {
            // แปลงวันที่เป็น String สวยๆ เช่น "วันพุธที่ 17 มี.ค. 2569"
            const dateStr = formatThaiDate(match.match_date, {
                weekday: 'long', day: 'numeric', month: 'long', year: 'numeric'
            });

            if (!groups[dateStr]) groups[dateStr] = [];
            groups[dateStr].push(match);
        });
        return groups;
    };

    const groupedMatches = groupMatchesByDate();

    // Helper: Badge สถานะ
    const getStatusBadge = (status) => {
        switch (status) {
            case 'Finished': return <span className="bg-gray-100 text-gray-600 text-xs px-2 py-1 rounded-md font-bold">จบการแข่งขัน</span>;
            case 'Live': return <span className="bg-red-100 text-red-600 text-xs px-2 py-1 rounded-md font-bold animate-pulse">● กำลังแข่ง</span>;
            default: return <span className="bg-blue-50 text-blue-600 text-xs px-2 py-1 rounded-md font-bold">ยังไม่เริ่ม</span>;
        }
    };

    return (
        <div className="min-h-screen bg-gray-50 pb-20 font-sans text-gray-800">
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
                            <button onClick={() => navigate('/matches')} className="text-sm font-medium text-indigo-600 transition">ตารางแข่งขัน</button>
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

            {/* Header */}
            <div className="bg-indigo-700 text-white py-12 px-4 shadow-lg">
                <div className="max-w-5xl mx-auto text-center">
                    <h1 className="text-3xl md:text-4xl font-extrabold mb-4 flex items-center justify-center gap-3">
                        <Calendar size={36} /> ตารางและผลการแข่งขัน
                    </h1>
                    <p className="text-indigo-200 text-lg">ติดตามโปรแกรมการแข่งขันและผลคะแนนสด</p>
                </div>
            </div>

            {/* Filter Section */}
            <div className="max-w-5xl mx-auto px-4 -mt-8">
                <div className="bg-white p-6 rounded-xl shadow-md border border-gray-100 flex flex-col md:flex-row items-center gap-4">
                    <div className="flex items-center gap-2 text-indigo-700 font-bold whitespace-nowrap">
                        <Trophy size={20} /> เลือกรายการ:
                    </div>
                    <select
                        className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none text-gray-700 font-medium"
                        value={selectedComp}
                        onChange={(e) => setSelectedComp(e.target.value)}
                    >
                        {competitions.map(c => (
                            <option key={c.id} value={c.id}>{c.title}</option>
                        ))}
                    </select>
                </div>
            </div>

            {/* Content */}
            <div className="max-w-5xl mx-auto px-4 mt-8">
                {loading ? (
                    <div className="text-center py-20 text-gray-500 animate-pulse">กำลังโหลดข้อมูล...</div>
                ) : matches.length === 0 ? (
                    <div className="text-center py-20 bg-white rounded-xl shadow-sm border border-dashed border-gray-300">
                        <Activity size={48} className="mx-auto text-gray-300 mb-4"/>
                        <p className="text-gray-500 text-lg">ยังไม่มีโปรแกรมการแข่งขันในรายการนี้</p>
                    </div>
                ) : (
                    Object.keys(groupedMatches).map((dateKey, index) => (
                        <div key={index} className="mb-10 animate-fade-in-up">
                            {/* Date Header */}
                            <div className="flex items-center gap-3 mb-4">
                                <div className="h-8 w-1 bg-indigo-500 rounded-full"></div>
                                <h3 className="text-xl font-bold text-gray-800">{dateKey}</h3>
                            </div>

                            {/* Match Cards Grid */}
                            <div className="grid grid-cols-1 gap-4">
                                {groupedMatches[dateKey].map((m) => (
                                    <div key={m.id} className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden hover:shadow-md transition-shadow duration-200">
                                        {/* Card Header: Time & Stadium */}
                                        <div className="bg-gray-50 px-4 py-2 flex justify-between items-center text-sm text-gray-500 border-b border-gray-100">
                                            <div className="flex items-center gap-4">
                                                <span className="flex items-center gap-1 font-medium text-gray-700">
                                                    <Clock size={14} className="text-indigo-500"/> 
                                                    {formatThaiTime(m.start_time)} น.
                                                </span>
                                                <span className="hidden sm:flex items-center gap-1">
                                                    <MapPin size={14}/> {m.stadium_name || 'สนามกีฬากลาง'}
                                                </span>
                                            </div>
                                            <div>{m.round_name}</div>
                                        </div>

                                        {/* Card Body: Teams & Score */}
                                        <div className="p-5">
                                            <div className="flex flex-col md:flex-row items-center justify-between gap-6">
                                                
                                                {/* Team A */}
                                                <div className="flex-1 flex flex-col items-center md:items-end gap-2 text-center md:text-right w-full">
                                                    <img src={m.team_a_logo || "https://via.placeholder.com/60"} alt="Team A" className="w-16 h-16 object-contain" />
                                                    <div className="font-bold text-lg leading-tight">{m.team_a_name}</div>
                                                </div>

                                                {/* VS / Score */}
                                                <div className="flex flex-col items-center justify-center w-full md:w-auto min-w-[120px]">
                                                    {m.status === 'Finished' || m.status === 'Live' ? (
                                                        <div className="text-center">
                                                            <div className="text-3xl font-black text-gray-900 tracking-widest flex items-center justify-center gap-3">
                                                                <span className={m.team_a_score > m.team_b_score ? "text-indigo-600" : "text-gray-400"}>{m.team_a_score}</span>
                                                                <span className="text-gray-300 text-xl">:</span>
                                                                <span className={m.team_b_score > m.team_a_score ? "text-indigo-600" : "text-gray-400"}>{m.team_b_score}</span>
                                                            </div>
                                                            <div className="mt-2">{getStatusBadge(m.status)}</div>
                                                        </div>
                                                    ) : (
                                                        <div className="flex flex-col items-center">
                                                            <span className="text-2xl font-black text-gray-300">VS</span>
                                                            <div className="mt-2">{getStatusBadge(m.status)}</div>
                                                        </div>
                                                    )}
                                                </div>

                                                {/* Team B */}
                                                <div className="flex-1 flex flex-col items-center md:items-start gap-2 text-center md:text-left w-full">
                                                    <img src={m.team_b_logo || "https://via.placeholder.com/60"} alt="Team B" className="w-16 h-16 object-contain" />
                                                    <div className="font-bold text-lg leading-tight">{m.team_b_name}</div>
                                                </div>

                                            </div>

                                            {/* Set Scores (ถ้ามีคะแนน) */}
                                            {(m.status === 'Finished' || m.status === 'Live') && m.set_scores && m.set_scores.length > 0 && (
                                                <div className="mt-4 pt-4 border-t border-gray-100 flex justify-center gap-2 text-sm text-gray-500 overflow-x-auto">
                                                    {m.set_scores.map((set) => (
                                                        <div key={set.set_number} className="px-2 py-1 bg-gray-50 rounded border border-gray-200 whitespace-nowrap min-w-[80px] text-center">
                                                            <div className="text-[10px] uppercase text-gray-400">Set {set.set_number}</div>
                                                            <div className="font-bold text-gray-800 text-base">
                                                                {set.team_a} - {set.team_b}
                                                            </div>
                                                        </div>
                                                    ))}
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    ))
                )}
            </div>
        </div>
    );
}