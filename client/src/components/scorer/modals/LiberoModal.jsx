import React, { useState, useEffect } from 'react';
import { X, Repeat, ShieldAlert, CheckCircle } from 'lucide-react';

export default function LiberoModal({ 
    isOpen, onClose, teamName, lineup, liberos, tracker, disqualifiedPlayers = [], onConfirm 
}) {
    const [selectedOutIndex, setSelectedOutIndex] = useState(null);
    const [selectedInPlayer, setSelectedInPlayer] = useState(null);

    useEffect(() => {
        if (isOpen) {
            setSelectedOutIndex(null);
            setSelectedInPlayer(null);
        }
    }, [isOpen]);

    if (!isOpen) return null;

    // ตรวจสอบว่ามี Libero และ "ต้องไม่ติดแบน"
    const isL1Available = liberos?.l1 && !disqualifiedPlayers.includes(liberos.l1.id);
    const isL2Available = liberos?.l2 && !disqualifiedPlayers.includes(liberos.l2.id);
    const hasLibero = isL1Available || isL2Available || tracker.onCourt;


    const handleConfirm = () => {
        if (tracker.onCourt) {
            // กรณี Libero อยู่ในสนาม -> เปลี่ยนออก
            onConfirm('OUT', { 
                posIndex: tracker.posIndex, 
                playerIn: selectedInPlayer, // อาจเป็นตัวจริงคนเดิม หรือ Libero อีกคน
                playerOut: tracker.activeLibero 
            });
        } else {
            // กรณี Libero อยู่ข้างสนาม -> เปลี่ยนเข้า
            if (selectedOutIndex !== null && selectedInPlayer) {
                onConfirm('IN', { 
                    posIndex: selectedOutIndex, 
                    playerIn: selectedInPlayer, 
                    playerOut: lineup[selectedOutIndex] 
                });
            }
        }
        onClose();
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm animate-in fade-in">
            <div className="bg-slate-900 border border-slate-700 rounded-2xl shadow-2xl w-full max-w-2xl overflow-hidden flex flex-col">
                
                <div className="bg-slate-800 p-4 border-b border-slate-700 flex justify-between items-center">
                    <h2 className="text-xl font-bold text-white flex items-center gap-2">
                        <Repeat className="text-pink-500" />
                        Libero Replacement - {teamName}
                    </h2>
                    <button onClick={onClose} className="p-2 hover:bg-slate-700 rounded-full text-slate-400 hover:text-white transition">
                        <X size={24} />
                    </button>
                </div>

                <div className="p-6 h-[400px] flex flex-col">
                    <div className="bg-blue-900/20 border border-blue-900/50 p-3 rounded-lg mb-4 flex items-start gap-2 text-xs text-blue-300">
                        <ShieldAlert size={16} className="shrink-0 mt-0.5" />
                        <p><strong>กฎ FIVB (19.3.1.1):</strong> ตัวรับอิสระสามารถเปลี่ยนเข้าแทน <b>ผู้เล่นแดนหลัง</b> ได้เท่านั้น และผู้เล่นตัวจริงจะต้องกลับเข้ามาที่เดิมเสมอ</p>
                    </div>

                    {!hasLibero ? (
                        <div className="flex-1 flex flex-col items-center justify-center text-slate-500">
                            <ShieldAlert size={48} className="mb-4 opacity-50" />
                            <p>ไม่มีการลงทะเบียนตัวรับอิสระ (Libero) สำหรับทีมนี้ในเซตนี้</p>
                        </div>
                    ) : (
                        <div className="flex-1 flex gap-6">
                            
                            {/* --- กรณีที่ 1: LIBERO อยู่ในสนาม (ต้องการสลับออก) --- */}
                            {tracker.onCourt ? (
                                <>
                                    <div className="w-1/2 bg-red-950/30 border border-red-900/50 rounded-xl p-4 flex flex-col items-center justify-center">
                                        <span className="text-red-400 font-bold mb-4">Libero ออก (Out)</span>
                                        <div className="w-20 h-20 rounded-full bg-pink-600 flex items-center justify-center text-3xl font-black text-white shadow-lg mb-2">
                                            {tracker.activeLibero?.number || 'L'}
                                        </div>
                                        <p className="text-white">{tracker.activeLibero?.firstname}</p>
                                    </div>
                                    <div className="w-1/2 flex flex-col">
                                        <span className="text-green-400 font-bold mb-4 text-center">Player In</span>
                                        <div className="space-y-3">
                                            {/* เปลี่ยนกลับเป็นผู้เล่นตัวจริงคนเดิม (ตามกติกา 19.3.2.2) */}
                                            <button onClick={() => setSelectedInPlayer(tracker.replacedPlayer)} className={`w-full p-3 rounded-xl border flex items-center gap-3 transition-all ${selectedInPlayer?.id === tracker.replacedPlayer?.id ? 'bg-green-600 border-green-400 text-white' : 'bg-slate-800 border-slate-600 text-white hover:border-slate-400'}`}>
                                                <div className="w-10 h-10 bg-slate-700 rounded-full flex items-center justify-center font-bold">{tracker.replacedPlayer?.number}</div>
                                                <div className="text-left"><p className="font-bold"></p><p className="text-xs opacity-70">{tracker.replacedPlayer?.firstname}</p></div>
                                            </button>
                                            
                                            {/* หรือ เปลี่ยนกับ Libero คนที่ 2 (ถ้ามี) */}
                                            {isL1Available && isL2Available && (
                                                <button onClick={() => {
                                                    const nextLibero = tracker.activeLibero.id === liberos.l1.id ? liberos.l2 : liberos.l1;
                                                    setSelectedInPlayer(nextLibero);
                                                }} className={`w-full p-3 rounded-xl border flex items-center gap-3 transition-all ${selectedInPlayer?.isLibero ? 'bg-pink-600 border-pink-400 text-white' : 'bg-slate-800 border-slate-600 text-white hover:border-slate-400'}`}>
                                                    <div className="w-10 h-10 bg-pink-700 rounded-full flex items-center justify-center font-bold text-white">L</div>
                                                    <div className="text-left"><p className="font-bold">สลับ Libero อีกคน</p></div>
                                                </button>
                                            )}
                                        </div>
                                    </div>
                                </>
                            ) : (
                            /* --- กรณีที่ 2: LIBERO อยู่ข้างสนาม (ต้องการเปลี่ยนลงไป) --- */
                                <>
                                    <div className="w-1/2 flex flex-col">
                                        <span className="text-red-400 font-bold mb-2 text-center text-sm">Player</span>
                                        <div className="flex-1 overflow-y-auto space-y-2 pr-2 custom-scrollbar">
                                            {[0, 5, 4].map(idx => { // ตำแหน่ง P1, P6, P5
                                                const p = lineup[idx];
                                                const posMap = { 0: 'P1', 5: 'P6', 4: 'P5' };
                                                if (!p) return null;

                                                return (
                                                    <button key={idx} onClick={() => setSelectedOutIndex(idx)} className={`w-full p-2 rounded-lg border flex items-center gap-3 transition-colors ${selectedOutIndex === idx ? 'bg-red-900 border-red-500 text-white' : 'bg-slate-800 border-slate-700 text-slate-300 hover:border-slate-500'}`}>
                                                        <div className="w-8 h-8 rounded-full bg-slate-700 flex items-center justify-center font-bold">{p.number}</div>
                                                        <div className="text-left text-sm truncate flex-1">{p.firstname}</div>
                                                        <span className="text-xs font-bold text-slate-500 bg-slate-900 px-2 py-1 rounded">{posMap[idx]}</span>
                                                    </button>
                                                );
                                            })}
                                        </div>
                                    </div>
                                    <div className="w-1/2 flex flex-col">
                                        <span className="text-green-400 font-bold mb-2 text-center text-sm">Libero In</span>
                                        <div className="space-y-3">
                                            {isL1Available && (
                                                <button onClick={() => setSelectedInPlayer(liberos.l1)} className={`w-full p-3 rounded-xl border flex items-center gap-3 transition-all ${selectedInPlayer?.id === liberos.l1.id ? 'bg-pink-600 border-pink-400 text-white' : 'bg-slate-800 border-slate-600 text-white'}`}>
                                                    <div className="w-10 h-10 bg-pink-700 rounded-full flex items-center justify-center font-bold text-white">{liberos.l1.number || 'L1'}</div>
                                                    <div className="text-left"><p className="font-bold">{liberos.l1.firstname}</p></div>
                                                </button>
                                            )}
                                            {isL2Available && (
                                                <button onClick={() => setSelectedInPlayer(liberos.l2)} className={`w-full p-3 rounded-xl border flex items-center gap-3 transition-all ${selectedInPlayer?.id === liberos.l2.id ? 'bg-pink-600 border-pink-400 text-white' : 'bg-slate-800 border-slate-600 text-white'}`}>
                                                    <div className="w-10 h-10 bg-pink-700 rounded-full flex items-center justify-center font-bold text-white">{liberos.l2.number || 'L2'}</div>
                                                    <div className="text-left"><p className="font-bold">{liberos.l2.firstname}</p></div>
                                                </button>
                                            )}
                                        </div>
                                    </div>
                                </>
                            )}
                        </div>
                    )}
                </div>

                <div className="p-4 border-t border-slate-800 bg-slate-900 flex justify-end gap-3">
                    <button onClick={onClose} className="px-6 py-2 rounded-lg font-bold text-slate-400 hover:text-white hover:bg-slate-800">Cancel</button>
                    <button 
                        onClick={handleConfirm} 
                        disabled={!hasLibero || (tracker.onCourt && !selectedInPlayer) || (!tracker.onCourt && (selectedOutIndex === null || !selectedInPlayer))}
                        className="px-8 py-2 rounded-lg font-bold bg-pink-600 hover:bg-pink-500 text-white disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                    >
                        <CheckCircle size={18} /> ยืนยันสลับตัว
                    </button>
                </div>
            </div>
        </div>
    );
}