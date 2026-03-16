import React, { useState, useEffect } from 'react';
import { X, ArrowRightLeft, AlertCircle, ShieldAlert } from 'lucide-react';

export default function SubstitutionModal({ 
    isOpen, onClose, teamName, roster, currentLineup, playerOut, posIndex, subTracker, disqualifiedPlayers = [], onConfirm
}) {
    const [selectedPlayerIn, setSelectedPlayerIn] = useState(null);
    const [isExceptional, setIsExceptional] = useState(false); // สถานะกรณีพิเศษ

    useEffect(() => {
        if (isOpen) {
            setSelectedPlayerIn(null);
            setIsExceptional(false);
        }
    }, [isOpen]);

    if (!isOpen) return null;

    const courtIds = currentLineup.filter(p => p).map(p => p?.id || p?.player_id || p);
    
    // กรองคนที่โดนแบนตลอดแมตช์ออกไปจากม้านั่งสำรอง
    const availableBench = roster.filter(p => {
        const pId = p.id || p.player_id;
        return !courtIds.some(cId => cId == pId) && 
               !p.isLibero && 
               !disqualifiedPlayers.some(dId => dId == pId);
    });
    
    // --- 🚨 FIVB SUBSTITUTION LOGIC 🚨 ---
    let eligibleBenchPlayers = [];
    let ruleMessage = "";
    let isError = false;

    if (isExceptional) {
        // กติกา 15.7: กรณีพิเศษ เลือกใครก็ได้ในม้านั่งสำรอง (ที่ไม่ใช่ลิเบอโร่)
        eligibleBenchPlayers = availableBench;
        ruleMessage = "กรณีพิเศษ: ไม่นับโควต้า 6 ครั้ง และผู้เล่นที่ออกจะไม่สามารถกลับมาเล่นได้อีกในแมตช์นี้";
    } else {
        // กติกา 15.6: เปลี่ยนตัวปกติ
        if (subTracker && playerOut) {
            const posData = subTracker.positions[posIndex];
            
            if (subTracker.count >= 6) {
                isError = true;
                ruleMessage = "หมดโควต้าเปลี่ยนตัวปกติ 6 ครั้งแล้วในเซตนี้ ";
            } else if (posData) {
                if (posData.returned) {
                    isError = true;
                    ruleMessage = "ตำแหน่งนี้ไม่สามารถเปลี่ยนตัวได้อีกในเซตนี้";
                    eligibleBenchPlayers = [];
                } else {
                    // เปลี่ยนตัวกลับ: ต้องเป็นผู้เล่นตัวจริงคนเดิมเท่านั้น
                    eligibleBenchPlayers = availableBench.filter(p => {
                        const pId = p.id || p.player_id;
                        return pId == posData.starterId;
                    });
                    
                    if (eligibleBenchPlayers.length > 0) {
                        ruleMessage = `เปลี่ยนตัวกลับ: ต้องเปลี่ยนตัวจริงเบอร์ ${eligibleBenchPlayers[0].number} กลับเข้าสนามเท่านั้น`;
                    } else {
                        ruleMessage = "ไม่พบผู้เล่นตัวจริงในม้านั่งสำรอง";
                        isError = true;
                    }
                }
            } else {
                // เปลี่ยนตัวครั้งแรกของตำแหน่งนี้: ห้ามซ้ำกับคนที่เคยเปลี่ยนลงไปแล้ว
                const usedIds = subTracker.usedPlayers || [];
                eligibleBenchPlayers = availableBench.filter(p => {
                    const pId = p.id || p.player_id;
                    return !usedIds.some(uId => uId == pId);
                });
                ruleMessage = "กรุณาเลือกนักกีฬา";
            }
        }
    }

    const handleConfirm = () => {
        if (selectedPlayerIn) {
            // ส่งค่า isExceptional กลับไปที่หน้าหลักด้วย
            onConfirm(selectedPlayerIn, isExceptional);
            onClose();
        }
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm animate-in fade-in">
            <div className="bg-slate-900 border border-slate-700 rounded-2xl shadow-2xl w-full max-w-3xl overflow-hidden flex flex-col">
                
                <div className="bg-slate-800 p-4 border-b border-slate-700 flex justify-between items-center">
                    <h2 className="text-xl font-bold text-white flex items-center gap-2">
                        <ArrowRightLeft className="text-blue-400" />
                        Substitution - {teamName}
                    </h2>
                    <button onClick={onClose} className="p-2 hover:bg-slate-700 rounded-full text-slate-400 hover:text-white transition">
                        <X size={24} />
                    </button>
                </div>

                <div className="p-6 flex gap-6 h-[450px]">
                    {/* ด้านซ้าย: Player OUT */}
                    <div className="w-1/3 flex flex-col items-center justify-center bg-slate-800 border border-slate-700 rounded-xl p-4 relative">
                        <span className="text-red-400 font-bold uppercase mb-2 tracking-widest text-sm">Player Out</span>
                        <div className="w-24 h-24 rounded-full bg-red-600 flex items-center justify-center text-4xl font-black text-white shadow-lg mb-4">
                            {playerOut?.number || '?'}
                        </div>
                        <div className="text-center mb-6">
                            <p className="text-white font-bold text-lg">{playerOut?.first_name || playerOut?.firstname || 'Unknown'}</p>
                            <p className="text-slate-400 text-sm">Position {posIndex + 1}</p>
                        </div>

                        {/* Toggle กรณีพิเศษ */}
                        <div className="absolute bottom-4 left-4 right-4 bg-red-950/40 border border-red-900 p-3 rounded-lg flex items-start gap-3 cursor-pointer hover:bg-red-900/50 transition" onClick={() => setIsExceptional(!isExceptional)}>
                            <input type="checkbox" checked={isExceptional} readOnly className="mt-1 w-4 h-4 accent-red-600" />
                            <div className="text-left select-none">
                                <p className="text-red-400 font-bold text-xs uppercase flex items-center gap-1"><ShieldAlert size={14}/> Exceptional Sub</p>
                                <p className="text-[10px] text-red-300 mt-0.5 leading-tight">กรณีบาดเจ็บ/ให้ออก (ไม่นับ 6 ครั้ง)</p>
                            </div>
                        </div>
                    </div>

                    {/* ด้านขวา: Player IN */}
                    <div className="flex-1 flex flex-col">
                        <div className="flex justify-between items-end mb-2">
                            <span className="text-green-400 font-bold uppercase tracking-widest text-sm text-center">Select Player In</span>
                            <span className="text-xs font-bold px-2 py-1 bg-slate-800 rounded text-slate-300">
                                Sub: <span className={subTracker?.count >= 6 ? "text-red-400" : "text-white"}>{subTracker?.count || 0}/6</span>
                            </span>
                        </div>
                        
                        <div className={`border p-3 rounded-lg mb-4 flex items-start gap-2 text-sm ${isError && !isExceptional ? 'bg-red-900/20 border-red-900/50 text-red-400' : isExceptional ? 'bg-orange-900/20 border-orange-900/50 text-orange-400' : 'bg-blue-900/20 border-blue-900/50 text-blue-300'}`}>
                            <AlertCircle size={18} className="shrink-0 mt-0.5" />
                            <p>{ruleMessage}</p>
                        </div>

                        <div className="flex-1 overflow-y-auto custom-scrollbar grid grid-cols-2 gap-3 pr-2 content-start">
                            {eligibleBenchPlayers.length > 0 ? (
                                eligibleBenchPlayers.map(p => (
                                    <button
                                        key={p.id} onClick={() => setSelectedPlayerIn(p)}
                                        className={`flex items-center gap-3 p-3 rounded-xl border transition-all ${
                                            selectedPlayerIn?.id === p.id 
                                            ? 'bg-green-600 border-green-400 text-white shadow-[0_0_15px_rgba(22,163,74,0.5)]' 
                                            : 'bg-slate-800 border-slate-600 text-slate-300 hover:border-slate-400'
                                        }`}
                                    >
                                        <div className={`w-10 h-10 rounded-full flex items-center justify-center font-bold text-lg ${
                                            selectedPlayerIn?.id === p.id ? 'bg-white text-green-700' : 'bg-slate-700 text-white'
                                        }`}>{p.number}</div>
                                        <div className="text-left flex-1 overflow-hidden">
                                            <div className="font-bold truncate">{p.first_name || p.firstname || p.name || `Athlete #${p.number}`}</div>
                                            <div className="text-xs opacity-70 truncate">{p.lastname || ''}</div>
                                        </div>
                                    </button>
                                ))
                            ) : (
                                <div className="col-span-2 flex items-center justify-center h-full text-slate-500 italic">
                                    {isError && !isExceptional ? "ไม่สามารถเปลี่ยนตัวตามปกติได้ กรุณาใช้กรณีพิเศษหากมีผู้เล่นบาดเจ็บ" : "ไม่มีผู้เล่นสำรองที่ถูกกติกา"}
                                </div>
                            )}
                        </div>
                    </div>
                </div>

                <div className="p-4 border-t border-slate-800 bg-slate-900 flex justify-end gap-3">
                    <button onClick={onClose} className="px-6 py-2 rounded-lg font-bold text-slate-400 hover:text-white hover:bg-slate-800 transition">Cancel</button>
                    <button onClick={handleConfirm} disabled={!selectedPlayerIn} className="px-8 py-2 rounded-lg font-bold bg-blue-600 hover:bg-blue-500 text-white disabled:opacity-50 disabled:cursor-not-allowed transition flex items-center gap-2">
                        <ArrowRightLeft size={18} /> Confirm {isExceptional ? 'Exceptional Sub' : 'Sub'}
                    </button>
                </div>
            </div>
        </div>
    );
}