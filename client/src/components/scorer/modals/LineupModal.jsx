import React from 'react';
import { Users, CheckCircle } from 'lucide-react';

const LineupModal = ({ isOpen,  teamHome, teamAway, homeLineup, awayLineup, homeLiberos, awayLiberos, onSlotClick, onConfirm }) => {
    if (!isOpen) return null;

    // ฟังก์ชันดึงเบอร์เสื้อ (เผื่อ API ใช้ชื่อ key อื่น)
    const getPlayerNumber = (player) => player.number || player.jersey_number || player.shirt_number || '?';
    // ฟังก์ชันดึงชื่อ (เผื่อ API ใช้ชื่อ key อื่น)
    const getPlayerName = (player) => {
        if (player.name) return player.name;
        if (player.firstname) return `${player.firstname} ${player.lastname || ''}`.trim();
        if (player.first_name) return `${player.first_name} ${player.last_name || ''}`.trim();
        return 'Unknown';
    };

    const renderTeamSlots = (teamName, teamCode, lineup, liberos) => {
        const safeLineup = lineup || [];
        const safeLiberos = liberos || {};
        return (
        <div className="flex-1 bg-slate-800/50 p-4 rounded-2xl border border-slate-700">
            <h3 className={`font-bold text-center mb-4 text-lg ${teamCode === 'home' ? 'text-indigo-400' : 'text-rose-400'}`}>{teamName}</h3>
            
            <div className="mb-4">
                <label className="text-xs font-bold text-slate-500 uppercase block mb-2 text-center">Starting 6</label>
                <div className="grid grid-cols-3 gap-3">
                    {/* Position mapping: 4-3-2 (Front), 5-6-1 (Back) */}
                    {[3, 2, 1, 4, 5, 0].map((posIndex, i) => {
                         const uiPos = [4, 3, 2, 5, 6, 1][i]; // ตำแหน่งที่แสดงบน UI (P1-P6)
                         const player = safeLineup[posIndex]; // ใช้ posIndex ที่ถูกต้อง (0-5)
                         
                         return (
                            <button key={uiPos} onClick={() => onSlotClick(teamCode, posIndex)} className={`aspect-square rounded-xl border-2 flex flex-col items-center justify-center relative hover:bg-slate-700 transition ${player ? 'border-green-500/50 bg-green-500/10' : 'border-slate-600 bg-slate-800'}`}>
                                <span className="absolute top-1 left-2 text-[10px] text-slate-500 font-bold">P{uiPos}</span>
                                {player ? (
                                    <div className="flex flex-col items-center justify-center w-full px-1 mt-2">
                                        <span className="text-3xl font-black text-white leading-none">
                                            {getPlayerNumber(player)}
                                        </span>
                                        <span className="text-[11px] text-slate-300 truncate w-full text-center mt-1">
                                            {getPlayerName(player)}
                                        </span>
                                    </div>
                                ) : (
                                    <div className="flex flex-col items-center text-slate-500 mt-2">
                                        <Users size={24} className="mb-1" />
                                        <span className="text-[10px]">Select</span>
                                    </div>
                                )}
                            </button>
                         );
                    })}
                </div>
            </div>

            <div>
                <label className="text-xs font-bold text-slate-500 uppercase block mb-2 text-center">Liberos</label>
                <div className="flex justify-center gap-3">
                    {['l1', 'l2'].map(role => {
                        const player = safeLiberos[role];
                        return (
                            <button key={role} onClick={() => onSlotClick(teamCode, role)} className={`w-20 h-20 rounded-xl border-2 flex flex-col items-center justify-center relative hover:bg-slate-700 transition ${player ? 'border-blue-500/50 bg-blue-500/10' : 'border-slate-600 border-dashed bg-slate-800'}`}>
                                <span className="absolute top-1 left-2 text-[10px] text-blue-400 font-bold">{role.toUpperCase()}</span>
                                {player ? (
                                    <span className="text-2xl font-black text-white mt-2">#{getPlayerNumber(player)}</span>
                                ) : <span className="text-xs text-slate-600 mt-2">Empty</span>}
                            </button>
                        );
                    })}
                </div>
            </div>
        </div>
        );
    };

    return (
        <div className="fixed inset-0 z-[80] bg-slate-950/95 backdrop-blur-sm flex items-center justify-center p-4">
            <div className="bg-slate-900 w-full max-w-5xl rounded-3xl border border-slate-700 shadow-2xl flex flex-col max-h-[90vh]">
                <div className="p-6 border-b border-slate-700 flex justify-between items-center bg-slate-800 rounded-t-3xl">
                    <h2 className="text-2xl font-bold text-white flex items-center gap-3"><Users className="text-green-500"/> Starting Line-ups</h2>
                    <div className="text-sm text-slate-400">Select players for each position</div>
                </div>
                <div className="flex-1 overflow-y-auto p-6">
                    <div className="flex gap-8 min-w-[800px]">
                        {renderTeamSlots(teamHome, 'home', homeLineup, homeLiberos)}
                        <div className="w-px bg-slate-700 self-stretch mx-2"></div>
                        {renderTeamSlots(teamAway, 'away', awayLineup, awayLiberos)}
                    </div>
                </div>
                <div className="p-6 border-t border-slate-700 bg-slate-800 rounded-b-3xl flex justify-end">
                     <button onClick={onConfirm} className="bg-green-600 hover:bg-green-500 text-white px-8 py-3 rounded-xl font-bold flex items-center gap-2 shadow-lg">
                        Confirm Lineups <CheckCircle />
                     </button>
                </div>
            </div>
        </div>
    );
};
export default LineupModal;