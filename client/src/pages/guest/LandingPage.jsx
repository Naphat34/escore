import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import client from '../../api'; // Axios instance ของคุณ
import { Trophy, Calendar, MapPin, Users, ArrowRight, LogIn } from 'lucide-react';
import { formatThaiDate } from '../../utils';

export default function LandingPage() {
    const navigate = useNavigate();
    const [competitions, setCompetitions] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchPublicData();
    }, []);

    const fetchPublicData = async () => {
        try {
            // เรียก API Public ที่เราเพิ่งเปิด
            const res = await client.get('/public/competitions');
            setCompetitions(res.data.filter(c => c.status?.toLowerCase() === 'open'));
        } catch (err) {
            console.error("Error fetching public data:", err);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-gray-50 text-gray-800 font-sans">
            
            {/* --- Navbar --- */}
            <nav className="bg-white shadow-sm sticky top-0 z-50">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="flex justify-between h-16 items-center">
                        <div className="flex items-center gap-2">
                            <div className="w-8 h-8 bg-indigo-600 rounded-lg flex items-center justify-center text-white font-bold">V</div>
                            <span className="font-bold text-xl tracking-tight text-indigo-900">VolleySystem</span>
                        </div>
                        <div className="hidden md:flex items-center gap-8">
                            <button onClick={() => navigate('/')} className="text-sm font-medium text-gray-700 hover:text-indigo-600 transition">หน้าแรก</button>
                            <button onClick={() => navigate('/teams')} className="text-sm font-medium text-gray-700 hover:text-indigo-600 transition">ทีม</button>
                            <button onClick={() => navigate('/matches')} className="text-sm font-medium text-gray-700 hover:text-indigo-600 transition">ตารางแข่งขัน</button>
                            <button onClick={() => navigate('/standings')} className="text-sm font-medium text-gray-700 hover:text-indigo-600 transition">อันดับทีม</button>
                            <button onClick={() => navigate('/statistics')} className="text-sm font-medium text-gray-700 hover:text-indigo-600 transition">Statistics</button>
                        </div>
                        <div className="flex gap-4">
                            <button 
                                onClick={() => navigate('/login')} 
                                className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-lg text-sm font-medium hover:bg-indigo-700 transition shadow-sm"
                            >
                                <LogIn size={18} /> เข้าสู่ระบบ
                            </button>
                        </div>
                    </div>
                </div>
            </nav>

            {/* --- Hero Section --- */}
            <div className="bg-indigo-900 text-white py-20 px-4 relative overflow-hidden">
                <div className="absolute top-0 left-0 w-full h-full opacity-10 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')]"></div>
                <div className="max-w-4xl mx-auto text-center relative z-10">
                    <h1 className="text-4xl md:text-6xl font-extrabold mb-6 tracking-tight">
                        Experience the Thrill of <br/> <span className="text-yellow-400">Volleyball</span>
                    </h1>
                    <p className="text-lg md:text-xl text-indigo-200 mb-8 max-w-2xl mx-auto">
                        ติดตามผลการแข่งขัน ตารางแข่ง และอันดับทีมได้แบบ Real-time พร้อมระบบจัดการทีมที่ครบวงจร
                    </p>
                    <button 
                        onClick={() => navigate('/register')}
                        className="px-8 py-4 bg-yellow-500 hover:bg-yellow-400 text-indigo-900 font-bold rounded-full shadow-lg transform hover:scale-105 transition-all flex items-center gap-2 mx-auto"
                    >
                        สร้างทีมของคุณเลย <ArrowRight size={20} />
                    </button>
                </div>
            </div>

            {/* --- Competitions Section --- */}
            <div className="max-w-7xl mx-auto px-4 py-16">
                <div className="flex items-center justify-between mb-8">
                    <h2 className="text-2xl font-bold flex items-center gap-2 text-gray-900">
                        <Trophy className="text-yellow-500" /> รายการแข่งขันที่เปิดรับสมัคร
                    </h2>
                </div>

                {loading ? (
                    <div className="text-center py-10 text-gray-400">Loading tournaments...</div>
                ) : competitions.length === 0 ? (
                    <div className="text-center py-20 bg-white rounded-xl shadow-sm border border-gray-100">
                        <Trophy size={48} className="mx-auto text-gray-300 mb-4" />
                        <h3 className="text-lg font-medium text-gray-500">ยังไม่มีรายการแข่งขันในขณะนี้</h3>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {competitions.map((comp) => (
                            <div key={comp.id} className="bg-white rounded-xl shadow-sm hover:shadow-md transition border border-gray-100 overflow-hidden group">
                                <div className="h-3 bg-indigo-500 w-full"></div>
                                <div className="p-6">
                                    <div className="flex justify-between items-start mb-4">
                                        <h3 className="font-bold text-lg text-gray-900 group-hover:text-indigo-600 transition">
                                            {comp.title}
                                        </h3>
                                        {comp.status === 'open' && (
                                            <span className="px-2 py-1 bg-green-100 text-green-700 text-xs font-bold rounded-full uppercase">
                                                Open
                                            </span>
                                        )}
                                    </div>
                                    
                                    <div className="space-y-2 text-sm text-gray-600 mb-6">
                                        <div className="flex items-center gap-2">
                                            <Calendar size={16} className="text-gray-400" />
                                            {formatThaiDate(comp.start_date)}
                                        </div>
                                        <div className="flex items-center gap-2">
                                            <MapPin size={16} className="text-gray-400" />
                                            {comp.location}
                                        </div>
                                        <div className="flex items-center gap-2">
                                            <Users size={16} className="text-gray-400" />
                                            {comp.gender} / {comp.age_group_name || 'General'}
                                        </div>
                                    </div>

                                    <button 
                                        onClick={() => navigate('/login')} // หรือลิงก์ไปหน้าดูรายละเอียด
                                        className="w-full py-2.5 rounded-lg border border-indigo-100 text-indigo-600 font-medium hover:bg-indigo-50 transition"
                                    >
                                        ดูรายละเอียด / สมัคร
                                    </button>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>

            {/* --- Footer --- */}
            <footer className="bg-gray-900 text-gray-400 py-8 text-center text-sm">
                <p>&copy; {new Date().getFullYear()} Volleyball Tournament System. All rights reserved.</p>
            </footer>

        </div>
    );
}