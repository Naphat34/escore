import React from 'react';
import { X, FileText, Clock } from 'lucide-react';

const MatchLogModal = ({ isOpen, onClose, events }) => {
    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-[90] flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 animate-in fade-in zoom-in duration-200">
            <div className="bg-slate-800 rounded-2xl shadow-2xl border border-slate-600 w-full max-w-lg h-[80vh] flex flex-col">
                {/* Header */}
                <div className="bg-slate-900 p-4 border-b border-slate-700 flex justify-between items-center rounded-t-2xl">
                    <h3 className="font-bold text-white text-lg flex items-center gap-2">
                        <FileText className="text-blue-400" size={20} /> Match Log
                    </h3>
                    <button onClick={onClose} className="p-1 rounded-full hover:bg-slate-800 transition-colors">
                        <X className="text-slate-400 hover:text-white" size={24} />
                    </button>
                </div>

                {/* Body (List) */}
                <div className="flex-1 overflow-y-auto p-4 space-y-2 custom-scrollbar bg-slate-900/50">
                    {(!events || events.length === 0) ? (
                        <div className="flex flex-col items-center justify-center h-full text-slate-500 opacity-60">
                            <FileText size={48} className="mb-4" />
                            <p className="italic">No events recorded yet.</p>
                        </div>
                    ) : (
                        events.map((ev, i) => (
                            <div key={i} className="flex gap-3 text-sm p-3 rounded-lg bg-slate-800 border border-slate-700 hover:border-slate-500 transition-colors">
                                <div className="text-slate-500 font-mono text-xs w-14 pt-1 flex flex-col items-center border-r border-slate-700 pr-2">
                                    <Clock size={12} className="mb-1 opacity-50"/>
                                    {ev.time}
                                </div>
                                <div className="flex-1 pl-1">
                                    <div className="text-white font-bold text-sm">{ev.description}</div>
                                    <div className="text-slate-400 text-xs mt-1 flex gap-2">
                                        <span className="bg-slate-700 px-1.5 rounded text-[10px]">Set {ev.set}</span>
                                        <span>Score: <span className="text-white">{ev.score}</span></span>
                                    </div>
                                </div>
                            </div>
                        ))
                    )}
                </div>

                {/* Footer */}
                <div className="p-3 bg-slate-900 border-t border-slate-700 text-center rounded-b-2xl">
                    <button onClick={onClose} className="text-slate-500 hover:text-white text-xs font-bold uppercase tracking-wider">Close Log</button>
                </div>
            </div>
        </div>
    );
};

export default MatchLogModal;