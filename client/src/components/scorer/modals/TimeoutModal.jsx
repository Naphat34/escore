import React from 'react';
import { Clock, X } from 'lucide-react';

const TimeoutModal = ({ isOpen, onClose, teamName, used, limit = 2, onConfirm }) => {
    if (!isOpen) return null;
    return (
        <div className="fixed inset-0 z-[70] flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 animate-in fade-in zoom-in duration-200">
            <div className="bg-slate-800 rounded-2xl shadow-2xl border border-slate-600 w-full max-w-md overflow-hidden">
                <div className="bg-slate-900 p-4 border-b border-slate-700 flex justify-between items-center">
                    <h3 className="font-bold text-white text-lg flex items-center gap-2">
                        <Clock className="text-orange-500" size={20} /> Timeout Request
                    </h3>
                    <button onClick={onClose}><X className="text-slate-400 hover:text-white" /></button>
                </div>
                <div className="p-6 text-center">
                    <div className="text-slate-400 text-sm uppercase font-bold mb-2">Requesting Team</div>
                    <div className="text-2xl font-black text-white mb-6">{teamName}</div>
                    <div className="flex justify-center gap-8 mb-8">
                        <div className="text-center">
                            <div className="text-4xl font-black text-orange-500">{used}</div>
                            <div className="text-xs text-slate-500 uppercase font-bold">Used</div>
                        </div>
                        <div className="text-center">
                            <div className="text-4xl font-black text-slate-600">/</div>
                        </div>
                        <div className="text-center">
                            <div className="text-4xl font-black text-white">{limit}</div>
                            <div className="text-xs text-slate-500 uppercase font-bold">Limit</div>
                        </div>
                    </div>
                    <p className="text-slate-300 text-sm mb-6">Confirm to deduct one timeout from this team?</p>
                    <div className="flex gap-3">
                        <button onClick={onClose} className="flex-1 py-3 rounded-xl font-bold text-slate-400 hover:bg-slate-700 transition">Cancel</button>
                        <button onClick={onConfirm} className="flex-1 py-3 bg-orange-600 hover:bg-orange-500 text-white rounded-xl font-bold shadow-lg transition">Confirm</button>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default TimeoutModal;