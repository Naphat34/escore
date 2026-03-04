import React, { useState } from 'react';
import { Flag, CheckCircle, X } from 'lucide-react';

const ChallengeModal = ({ isOpen, onClose, teamName, remaining, onConfirm }) => {
    if (!isOpen) return null;

    const reasons = [
        { id: 'BALL_IN_OUT', label: 'Ball In/Out' },
        { id: 'TOUCH_BLOCK', label: 'Touch Block' },
        { id: 'NET_TOUCH', label: 'Net Touch' },
        { id: 'ANTENNA', label: 'Antenna Touch' },
        { id: 'FOOT_FAULT', label: 'Foot Fault (Serve/Line)' },
    ];

    const [selectedReason, setSelectedReason] = useState(reasons[0].id);

    return (
        <div className="fixed inset-0 z-50 bg-black/90 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in zoom-in duration-200">
            <div className="bg-slate-800 w-full max-w-md rounded-2xl shadow-2xl border border-slate-600 overflow-hidden">
                <div className="bg-slate-900 p-4 border-b border-slate-700 flex justify-between items-center">
                    <div>
                        <h2 className="text-xl font-bold text-white flex items-center gap-2">
                            <Flag className="text-yellow-500" /> Video Challenge
                        </h2>
                        <div className="text-sm text-slate-400">Team: <span className="text-white font-bold">{teamName}</span></div>
                    </div>
                    <div className="bg-slate-800 px-3 py-1 rounded text-xs font-bold border border-slate-600">
                        Remaining: {remaining}
                    </div>
                </div>

                <div className="p-6 space-y-6">
                    <div>
                        <label className="text-xs font-bold text-slate-500 uppercase mb-2 block">Challenge Reason</label>
                        <div className="grid grid-cols-2 gap-2">
                            {reasons.map(r => (
                                <button
                                    key={r.id}
                                    onClick={() => setSelectedReason(r.id)}
                                    className={`p-2 rounded text-sm font-bold border transition-all ${selectedReason === r.id ? 'bg-yellow-600 border-yellow-500 text-white' : 'bg-slate-700 border-slate-600 text-slate-400 hover:bg-slate-600'}`}
                                >
                                    {r.label}
                                </button>
                            ))}
                        </div>
                    </div>

                    <div>
                        <label className="text-xs font-bold text-slate-500 uppercase mb-2 block">Challenge Result</label>
                        <div className="grid grid-cols-2 gap-4">
                            <button
                                onClick={() => onConfirm('SUCCESSFUL', selectedReason)}
                                className="bg-green-600 hover:bg-green-500 text-white p-4 rounded-xl font-bold border-b-4 border-green-800 active:border-b-0 active:mt-1 flex flex-col items-center gap-1"
                            >
                                <CheckCircle size={24} /> Successful <span className="text-[10px] font-normal opacity-75">(Keep Quota)</span>
                            </button>
                            <button
                                onClick={() => onConfirm('UNSUCCESSFUL', selectedReason)}
                                className="bg-red-600 hover:bg-red-500 text-white p-4 rounded-xl font-bold border-b-4 border-red-800 active:border-b-0 active:mt-1 flex flex-col items-center gap-1"
                            >
                                <X size={24} /> Unsuccessful <span className="text-[10px] font-normal opacity-75">(Lose 1 Quota)</span>
                            </button>
                        </div>
                    </div>
                </div>

                <div className="p-4 bg-slate-900 border-t border-slate-700 text-center">
                    <button onClick={onClose} className="text-slate-500 hover:text-white text-sm font-bold">Cancel Request</button>
                </div>
            </div>
        </div>
    );
};

export default ChallengeModal;