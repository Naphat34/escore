import React, { useState, useEffect } from 'react';
import { ListChecks, Loader, CheckCircle } from 'lucide-react';

const PreMatchSetupModal = ({ isOpen, teamHome, teamAway, homeRoster, awayRoster, onConfirm }) => {
    const [activeTab, setActiveTab] = useState('settings'); 
    const [setsOption, setSetsOption] = useState(3);
    const [selHome, setSelHome] = useState([]);
    const [selAway, setSelAway] = useState([]);

    const [initialized, setInitialized] = useState(false);

    useEffect(() => {
        if (isOpen && !initialized) {
            if (homeRoster && homeRoster.length > 0) {
                setSelHome(homeRoster.map(p => ({ ...p, selected: true, isCaptain: p.is_captain || false, isLibero: p.position === 'LIBERO' })));
            }
            if (awayRoster && awayRoster.length > 0) {
                setSelAway(awayRoster.map(p => ({ ...p, selected: true, isCaptain: p.is_captain || false, isLibero: p.position === 'LIBERO' })));
            }
            setInitialized(true);
        }
    }, [isOpen, homeRoster, awayRoster, initialized]);

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
        <div className="fixed inset-0 z-[80] bg-slate-900/60 backdrop-blur-md flex items-center justify-center p-4">
            <div className="w-full max-w-5xl h-[85vh] rounded-[2.5rem] bg-white border border-slate-200 flex flex-col shadow-2xl overflow-hidden transition-all duration-500 animate-in fade-in zoom-in slide-in-from-bottom-10">
                {/* Header */}
                <div className="p-8 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
                    <div>
                        <h2 className="text-4xl font-black flex items-center gap-4 text-slate-800 tracking-tight">
                            <div className="bg-indigo-600 p-2.5 rounded-2xl text-white shadow-indigo-200 shadow-xl">
                                <ListChecks size={32} />
                            </div>
                            MATCH PREPARATION
                        </h2>
                        <p className="text-sm mt-2 text-slate-400 font-bold uppercase tracking-widest px-1">Phase 1: Rules & Official Rosters</p>
                    </div>
                </div>

                {/* Tabs */}
                <div className="flex bg-slate-50 p-2 gap-2 mx-8 mt-6 rounded-[2rem] border border-slate-200/60">
                    <button onClick={() => setActiveTab('settings')} className={`flex-1 py-4 font-black text-xs uppercase tracking-[0.2em] rounded-[1.5rem] transition-all ${activeTab === 'settings' ? 'bg-white text-indigo-600 shadow-sm border border-slate-100 scale-[1.02]' : 'text-slate-400 hover:text-slate-600 hover:bg-white/50'}`}>1. Ruleset</button>
                    <button onClick={() => setActiveTab('home')} className={`flex-1 py-4 font-black text-xs uppercase tracking-[0.2em] rounded-[1.5rem] transition-all ${activeTab === 'home' ? 'bg-white text-indigo-600 shadow-sm border border-slate-100 scale-[1.02]' : 'text-slate-400 hover:text-slate-600 hover:bg-white/50'}`}>2. {teamHome}</button>
                    <button onClick={() => setActiveTab('away')} className={`flex-1 py-4 font-black text-xs uppercase tracking-[0.2em] rounded-[1.5rem] transition-all ${activeTab === 'away' ? 'bg-white text-indigo-600 shadow-sm border border-slate-100 scale-[1.02]' : 'text-slate-400 hover:text-slate-600 hover:bg-white/50'}`}>3. {teamAway}</button>
                </div>

                {/* Content */}
                <div className="flex-1 p-8 overflow-hidden bg-white">
                    {activeTab === 'settings' && (
                        <div className="flex flex-col items-center justify-center h-full gap-10 animate-in fade-in zoom-in duration-500">
                            <div className="space-y-2 text-center">
                                <h3 className="text-sm font-black text-slate-400 uppercase tracking-[0.3em]">Scoring Format</h3>
                                <p className="text-slate-300 font-medium">Select match duration rules for this competition</p>
                            </div>
                            <div className="flex gap-10">
                                <button onClick={() => setSetsOption(2)} className={`w-80 p-12 rounded-[3rem] border-2 flex flex-col items-center gap-6 transition-all group active:scale-95 ${setsOption === 2 ? 'border-indigo-500 bg-indigo-50/50 shadow-2xl shadow-indigo-100 ring-4 ring-indigo-50' : 'border-slate-100 bg-slate-50/50 opacity-40 hover:opacity-100 hover:border-slate-200'}`}>
                                    <span className={`text-7xl font-black italic tracking-tighter transition-colors ${setsOption === 2 ? 'text-indigo-600' : 'text-slate-300'}`}>2 : 3</span>
                                    <div className="flex flex-col gap-1 items-center">
                                        <span className={`text-xs font-black uppercase tracking-[0.2em] ${setsOption === 2 ? 'text-indigo-600' : 'text-slate-400'}`}>Standard Match</span>
                                        <span className={`text-[10px] font-bold ${setsOption === 2 ? 'text-indigo-400' : 'text-slate-300'}`}>BEST OF 3 SETS</span>
                                    </div>
                                </button>
                                <button onClick={() => setSetsOption(3)} className={`w-80 p-12 rounded-[3rem] border-2 flex flex-col items-center gap-6 transition-all group active:scale-95 ${setsOption === 3 ? 'border-indigo-500 bg-indigo-50/50 shadow-2xl shadow-indigo-100 ring-4 ring-indigo-50' : 'border-slate-100 bg-slate-50/50 opacity-40 hover:opacity-100 hover:border-slate-200'}`}>
                                    <span className={`text-7xl font-black italic tracking-tighter transition-colors ${setsOption === 3 ? 'text-indigo-600' : 'text-slate-300'}`}>3 : 5</span>
                                    <div className="flex flex-col gap-1 items-center">
                                        <span className={`text-xs font-black uppercase tracking-[0.2em] ${setsOption === 3 ? 'text-indigo-600' : 'text-slate-400'}`}>Official FIVB</span>
                                        <span className={`text-[10px] font-bold ${setsOption === 3 ? 'text-indigo-400' : 'text-slate-300'}`}>BEST OF 5 SETS</span>
                                    </div>
                                </button>
                            </div>
                        </div>
                    )}

                    {activeTab === 'home' && <RosterList list={selHome} team="home" toggleSelect={toggleSelect} setRole={setRole} accentColor="indigo" />}
                    {activeTab === 'away' && <RosterList list={selAway} team="away" toggleSelect={toggleSelect} setRole={setRole} accentColor="rose" />}
                </div>

                {/* Footer */}
                <div className="p-8 border-t border-slate-100 flex justify-between items-center bg-slate-50/50">
                    <div className="flex gap-4">
                        <div className="bg-white px-5 py-2.5 rounded-2xl border border-slate-200 shadow-sm flex items-center gap-3">
                            <span className="text-[10px] font-black text-slate-300 uppercase tracking-widest">Home</span>
                            <span className={`font-mono font-black text-lg ${selHome.filter(p=>p.selected).length <6 ? 'text-rose-500' : 'text-indigo-600'}`}>{selHome.filter(p=>p.selected).length}</span>
                        </div>
                        <div className="bg-white px-5 py-2.5 rounded-2xl border border-slate-200 shadow-sm flex items-center gap-3">
                            <span className="text-[10px] font-black text-slate-300 uppercase tracking-widest">Away</span>
                            <span className={`font-mono font-black text-lg ${selAway.filter(p=>p.selected).length <6 ? 'text-rose-500' : 'text-indigo-600'}`}>{selAway.filter(p=>p.selected).length}</span>
                        </div>
                    </div>
                    
                    <button onClick={handleSave} className="relative group overflow-hidden bg-slate-900 hover:bg-black text-white px-12 py-4 rounded-[1.5rem] font-black uppercase tracking-[0.2em] text-sm shadow-xl transition-all active:scale-95 flex items-center gap-3">
                        <div className="absolute inset-0 bg-gradient-to-r from-indigo-500 to-indigo-700 opacity-0 group-hover:opacity-100 transition-opacity"></div>
                        <span className="relative z-10 flex items-center gap-3">
                            Initialize Console <CheckCircle size={20} />
                        </span>
                    </button>
                </div>
            </div>
        </div>
    );
};

const RosterList = ({ list, team, toggleSelect, setRole, accentColor }) => {
    const accentClass = accentColor === 'indigo' ? 'bg-indigo-600 border-indigo-600' : 'bg-rose-600 border-rose-600';
    const accentText = accentColor === 'indigo' ? 'text-indigo-600' : 'text-rose-600';

    if (!list || list.length === 0) {
        return (
            <div className="flex flex-col items-center justify-center h-full min-h-[300px] text-slate-300">
                <div className={`w-12 h-12 border-4 border-slate-100 ${accentColor === 'indigo' ? 'border-t-indigo-600' : 'border-t-rose-600'} rounded-full animate-spin mb-6`}></div>
                <p className="font-black uppercase tracking-[0.2em] text-xs">Syncing Team Data...</p>
            </div>
        );
    }

    return (
        <div className="flex flex-col h-full animate-in fade-in slide-in-from-right-10 duration-500">
            <div className="grid grid-cols-12 gap-4 text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 mb-4 px-6">
                <div className="col-span-1 text-center">Active</div>
                <div className="col-span-1 text-center">#</div>
                <div className="col-span-6 px-4">Full Roster Name</div>
                <div className="col-span-2 text-center">Captain</div>
                <div className="col-span-2 text-center">Libero</div>
            </div>
            <div className="flex-1 overflow-y-auto custom-scrollbar px-2 space-y-2 pb-4">
                {list.map(p => {
                    const fName = p.first_name || p.firstname || '';
                    const lName = p.last_name || p.lastname || '';
                    const nickname = p.nickname ? `(${p.nickname})` : '';
                    const displayName = (fName || lName) ? `${fName} ${lName} ${nickname}`.trim() : (p.name || 'Unknown Player');

                    return (
                        <div key={p.id} className={`grid grid-cols-12 gap-4 items-center p-4 rounded-2xl border transition-all duration-300 ${p.selected ? `bg-white shadow-xl shadow-slate-200/50 border-slate-100 scale-[1.01]` : `opacity-30 grayscale border-transparent hover:opacity-50` }`}>
                            <div className="col-span-1 flex justify-center">
                                <div onClick={() => toggleSelect(team, p.id)} className={`w-6 h-6 rounded-lg border-2 flex items-center justify-center cursor-pointer transition-all ${p.selected ? `${accentClass} text-white` : `bg-white border-slate-200`}`}>
                                    {p.selected && <CheckCircle size={14} />}
                                </div>
                            </div>
                            <div className="col-span-1 font-mono font-black text-center text-xl text-slate-700">{p.number}</div>
                            <div className="col-span-6 px-4">
                                <div className="text-sm font-black text-slate-800 uppercase tracking-tight truncate" title={displayName}>{displayName}</div>
                                <div className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">{p.position || 'PLAYER'}</div>
                            </div>
                            <div className="col-span-2 flex justify-center">
                                <button onClick={() => p.selected && setRole(team, p.id, 'isCaptain')} disabled={!p.selected} className={`w-10 h-10 rounded-xl text-xs font-black transition-all border flex items-center justify-center ${p.isCaptain ? 'bg-amber-400 text-amber-900 border-amber-300 shadow-lg shadow-amber-100 scale-110' : 'bg-slate-50 text-slate-300 border-slate-100 hover:bg-white hover:border-slate-300 hover:text-slate-600' }`}>C</button>
                            </div>
                            <div className="col-span-2 flex justify-center">
                                <button onClick={() => p.selected && setRole(team, p.id, 'isLibero')} disabled={!p.selected} className={`w-10 h-10 rounded-xl text-xs font-black transition-all border flex items-center justify-center ${p.isLibero ? `${accentClass} text-white shadow-lg shadow-slate-100 scale-110` : 'bg-slate-50 text-slate-300 border-slate-100 hover:bg-white hover:border-slate-300 hover:text-slate-600' }`}>L</button>
                            </div>
                        </div>
                    );
                })}
            </div>
        </div>
    );
};

export default PreMatchSetupModal;