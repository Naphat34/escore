import React, { useState, useEffect } from 'react';
import { ListChecks, Loader, CheckCircle } from 'lucide-react';

const PreMatchSetupModal = ({ isOpen, teamHome, teamAway, homeRoster, awayRoster, onConfirm, isDarkMode }) => {
    const [activeTab, setActiveTab] = useState('settings'); 
    const [setsOption, setSetsOption] = useState(3);
    const [selHome, setSelHome] = useState([]);
    const [selAway, setSelAway] = useState([]);

    useEffect(() => {
        if (isOpen) {
            if (homeRoster && homeRoster.length > 0) {
                setSelHome(prev => {
                    if (prev.length > 0 && prev[0].id === homeRoster[0].id) return prev; 
                    return homeRoster.map(p => ({ ...p, selected: true, isCaptain: p.is_captain || false, isLibero: p.position === 'LIBERO' }));
                });
            }
            if (awayRoster && awayRoster.length > 0) {
                setSelAway(prev => {
                    if (prev.length > 0 && prev[0].id === awayRoster[0].id) return prev;
                    return awayRoster.map(p => ({ ...p, selected: true, isCaptain: p.is_captain || false, isLibero: p.position === 'LIBERO' }));
                });
            }
        }
    }, [isOpen, homeRoster, awayRoster]);

    if (!isOpen) return null;

    const toggleSelect = (team, id) => {
        const setFn = team === 'home' ? setSelHome : setSelAway;
        setFn(prev => prev.map(p => p.id === id ? { ...p, selected: !p.selected } : p));
    };

    const setRole = (team, id, role) => {
        const setFn = team === 'home' ? setSelHome : setSelAway;
        setFn(prev => prev.map(p => {
            if (role === 'isCaptain') return { ...p, isCaptain: p.id === id };
            if (p.id === id && role === 'isLibero') return { ...p, isLibero: !p.isLibero };
            return p;
        }));
    };

    const handleSave = () => {
        const finalHome = selHome.filter(p => p.selected);
        const finalAway = selAway.filter(p => p.selected);
        
        if (finalHome.length < 6 || finalAway.length < 6) {
            alert("กรุณาเลือกนักกีฬาอย่างน้อยทีมละ 6 คน");
            return;
        }

        onConfirm({
            setsToWin: setsOption,
            confirmedHome: finalHome,
            confirmedAway: finalAway
        });
    };

    return (
        <div className="fixed inset-0 z-[80] bg-slate-950/90 backdrop-blur-sm flex items-center justify-center p-4">
            <div className={`w-full max-w-5xl h-[85vh] rounded-3xl flex flex-col shadow-2xl overflow-hidden transition-colors duration-300 ${isDarkMode ? 'bg-slate-900 border border-slate-700' : 'bg-white border border-gray-200'}`}>
                <div className={`p-6 border-b flex justify-between items-center ${isDarkMode ? 'bg-slate-800 border-slate-700' : 'bg-gray-50 border-gray-200'}`}>
                    <div>
                        <h2 className={`text-3xl font-bold flex items-center gap-3 ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                            <ListChecks className="text-blue-400" size={32} /> Match Setup & Roster
                        </h2>
                        <p className={`text-sm mt-1 ${isDarkMode ? 'text-slate-400' : 'text-gray-500'}`}>ตั้งค่ากติกาและตรวจสอบรายชื่อผู้เล่น</p>
                    </div>
                </div>

                <div className={`flex border-b ${isDarkMode ? 'border-slate-700 bg-slate-900' : 'border-gray-200 bg-white'}`}>
                    <button onClick={() => setActiveTab('settings')} className={`flex-1 py-4 font-bold text-lg uppercase transition-all ${activeTab === 'settings' ? `border-b-4 border-blue-500 ${isDarkMode ? 'bg-slate-800 text-white' : 'bg-gray-50 text-blue-600'}` : `${isDarkMode ? 'text-slate-500 hover:bg-slate-800/50' : 'text-gray-500 hover:bg-gray-100'}`}`}>1. Match Rules</button>
                    <button onClick={() => setActiveTab('home')} className={`flex-1 py-4 font-bold text-lg uppercase transition-all ${activeTab === 'home' ? `border-b-4 border-indigo-500 ${isDarkMode ? 'bg-slate-800 text-indigo-400' : 'bg-gray-50 text-indigo-600'}` : `${isDarkMode ? 'text-slate-500 hover:bg-slate-800/50' : 'text-gray-500 hover:bg-gray-100'}`}`}>2. {teamHome}</button>
                    <button onClick={() => setActiveTab('away')} className={`flex-1 py-4 font-bold text-lg uppercase transition-all ${activeTab === 'away' ? `border-b-4 border-rose-500 ${isDarkMode ? 'bg-slate-800 text-rose-400' : 'bg-gray-50 text-rose-600'}` : `${isDarkMode ? 'text-slate-500 hover:bg-slate-800/50' : 'text-gray-500 hover:bg-gray-100'}`}`}>3. {teamAway}</button>
                </div>

                <div className={`flex-1 p-6 overflow-hidden ${isDarkMode ? 'bg-slate-900' : 'bg-white'}`}>
                    {activeTab === 'settings' && (
                        <div className="flex flex-col items-center justify-center h-full gap-8 animate-in fade-in zoom-in duration-300">
                            <h3 className={`text-xl uppercase tracking-widest font-bold ${isDarkMode ? 'text-slate-400' : 'text-gray-600'}`}>เลือกจำนวนเซตตัดสิน</h3>
                            <div className="flex gap-8">
                                <button onClick={() => setSetsOption(2)} className={`w-72 p-10 rounded-3xl border-2 flex flex-col items-center gap-4 transition-all ${setsOption === 2 ? `border-blue-500 shadow-[0_0_40px_rgba(59,130,246,0.3)] scale-105 ${isDarkMode ? 'bg-blue-600/20' : 'bg-blue-50'}` : `opacity-60 hover:opacity-100 ${isDarkMode ? 'bg-slate-800 border-slate-700 hover:border-slate-500' : 'bg-gray-100 border-gray-200 hover:border-gray-400'}`}`}>
                                    <span className={`text-6xl font-black ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>2 : 3</span>
                                    <span className={`text-lg font-bold uppercase ${isDarkMode ? 'text-slate-300' : 'text-gray-700'}`}>Best of 3 Sets</span>
                                </button>
                                <button onClick={() => setSetsOption(3)} className={`w-72 p-10 rounded-3xl border-2 flex flex-col items-center gap-4 transition-all ${setsOption === 3 ? `border-blue-500 shadow-[0_0_40px_rgba(59,130,246,0.3)] scale-105 ${isDarkMode ? 'bg-blue-600/20' : 'bg-blue-50'}` : `opacity-60 hover:opacity-100 ${isDarkMode ? 'bg-slate-800 border-slate-700 hover:border-slate-500' : 'bg-gray-100 border-gray-200 hover:border-gray-400'}`}`}>
                                    <span className={`text-6xl font-black ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>3 : 5</span>
                                    <span className={`text-lg font-bold uppercase ${isDarkMode ? 'text-slate-300' : 'text-gray-700'}`}>Best of 5 Sets</span>
                                </button>
                            </div>
                        </div>
                    )}

                    {activeTab === 'home' && <RosterList list={selHome} team="home" toggleSelect={toggleSelect} setRole={setRole} isDarkMode={isDarkMode} />}
                    {activeTab === 'away' && <RosterList list={selAway} team="away" toggleSelect={toggleSelect} setRole={setRole} isDarkMode={isDarkMode} />}
                </div>

                <div className={`p-6 border-t flex justify-between items-center ${isDarkMode ? 'bg-slate-800 border-slate-700' : 'bg-gray-50 border-gray-200'}`}>
                    <div className={`${isDarkMode ? 'text-slate-400' : 'text-gray-500'} text-sm`}>
                        Selected: <strong className={isDarkMode ? 'text-white' : 'text-gray-800'}>{selHome.filter(p=>p.selected).length}</strong> (Home) / <strong className={isDarkMode ? 'text-white' : 'text-gray-800'}>{selAway.filter(p=>p.selected).length}</strong> (Away)
                    </div>
                    <button onClick={handleSave} className="bg-green-600 hover:bg-green-500 text-white px-10 py-3 rounded-xl font-bold text-lg shadow-lg flex items-center gap-2 active:scale-95 transition-transform">
                        Confirm & Start Match <CheckCircle />
                    </button>
                </div>
            </div>
        </div>
    );
};

const RosterList = ({ list, team, toggleSelect, setRole, isDarkMode }) => {
    if (!list || list.length === 0) {
        return (
            <div className={`flex flex-col items-center justify-center h-full min-h-[300px] ${isDarkMode ? 'text-slate-500' : 'text-gray-500'}`}>
                <Loader className="animate-spin mb-3 text-blue-500" size={32} />
                <p className="font-bold">กำลังโหลดรายชื่อนักกีฬา...</p>
                <p className="text-xs opacity-60 mt-1">(หากรอนาน โปรดตรวจสอบว่าทีมนี้มีนักกีฬาในระบบหรือไม่)</p>
            </div>
        );
    }

    return (
        <div className="flex flex-col h-full">
            <div className={`grid grid-cols-12 gap-2 text-xs font-bold uppercase mb-2 px-4 select-none ${isDarkMode ? 'text-slate-500' : 'text-gray-500'}`}>
                <div className="col-span-1 text-center">ลงแข่ง</div>
                <div className="col-span-1 text-center">เบอร์</div>
                <div className="col-span-6">ชื่อ-นามสกุล</div>
                <div className="col-span-2 text-center">กัปตัน</div>
                <div className="col-span-2 text-center">ลิเบอโร่</div>
            </div>
            <div className="flex-1 overflow-y-auto custom-scrollbar px-2 space-y-2 pb-4">
                {list.map(p => {
                    const fName = p.first_name || p.firstname || '';
                    const lName = p.last_name || p.lastname || '';
                    const nickname = p.nickname ? `(${p.nickname})` : '';
                    const displayName = (fName || lName) ? `${fName} ${lName} ${nickname}`.trim() : (p.name || 'Unknown Player');

                    return (
                        <div key={p.id} className={`grid grid-cols-12 gap-2 items-center p-3 rounded-lg border transition-all duration-200 ${p.selected ? `shadow-md ${isDarkMode ? 'bg-slate-700 border-slate-600' : 'bg-gray-100 border-gray-300'}` : `opacity-60 hover:opacity-80 ${isDarkMode ? 'bg-slate-800/30 border-slate-800' : 'bg-gray-50/30 border-gray-200'}` }`}>
                            <div className="col-span-1 flex justify-center">
                                <input type="checkbox" checked={p.selected} onChange={() => toggleSelect(team, p.id)} className="w-5 h-5 accent-green-500 rounded cursor-pointer transition-transform active:scale-90" />
                            </div>
                            <div className={`col-span-1 font-black text-center text-lg ${p.selected ? (isDarkMode ? 'text-white' : 'text-gray-900') : 'text-slate-500'}`}>{p.number}</div>
                            <div className={`col-span-6 text-sm truncate font-medium ${p.selected ? (isDarkMode ? 'text-slate-200' : 'text-gray-700') : 'text-slate-500'}`} title={displayName}>{displayName}</div>
                            <div className="col-span-2 flex justify-center">
                                <button onClick={() => p.selected && setRole(team, p.id, 'isCaptain')} disabled={!p.selected} className={`w-8 h-8 rounded-full text-xs font-bold transition-all border-2 flex items-center justify-center ${!p.selected ? `opacity-20 cursor-not-allowed ${isDarkMode ? 'border-slate-700 text-slate-700' : 'border-gray-200 text-gray-300'}` : p.isCaptain ? 'bg-yellow-500 text-black border-yellow-400 shadow-[0_0_10px_rgba(234,179,8,0.4)] scale-110' : `bg-transparent ${isDarkMode ? 'text-slate-500 border-slate-600 hover:border-slate-400 hover:text-white' : 'text-gray-500 border-gray-300 hover:border-gray-500 hover:text-gray-800'}` }`}>C</button>
                            </div>
                            <div className="col-span-2 flex justify-center">
                                <button onClick={() => p.selected && setRole(team, p.id, 'isLibero')} disabled={!p.selected} className={`w-8 h-8 rounded-full text-xs font-bold transition-all border-2 flex items-center justify-center ${!p.selected ? `opacity-20 cursor-not-allowed ${isDarkMode ? 'border-slate-700 text-slate-700' : 'border-gray-200 text-gray-300'}` : p.isLibero ? 'bg-blue-600 text-white border-blue-500 shadow-[0_0_10px_rgba(37,99,235,0.4)] scale-110' : `bg-transparent ${isDarkMode ? 'text-slate-500 border-slate-600 hover:border-slate-400 hover:text-white' : 'text-gray-500 border-gray-300 hover:border-gray-500 hover:text-gray-800'}` }`}>L</button>
                            </div>
                        </div>
                    );
                })}
            </div>
        </div>
    );
};

export default PreMatchSetupModal;