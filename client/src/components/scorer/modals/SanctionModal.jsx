import React, { useState } from 'react';
import { AlertTriangle, X } from 'lucide-react';

const SanctionModal = ({ isOpen, onClose, teamName, roster, onConfirm }) => {
    if (!isOpen) return null;

    const [selectedPlayerId, setSelectedPlayerId] = useState('');
    const [cardType, setCardType] = useState('YELLOW');

    const handleConfirmClick = () => {
        const player = roster.find(p => p.id == selectedPlayerId);
        if (player) {
            onConfirm(player, cardType);
        }
    };

    return (
        <div className="fixed inset-0 z-[70] flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 animate-in fade-in zoom-in duration-200">
            <div className="bg-slate-800 rounded-2xl shadow-2xl border border-slate-600 w-full max-w-md overflow-hidden">
                <div className="bg-slate-900 p-4 border-b border-slate-700 flex justify-between items-center">
                    <h3 className="font-bold text-white text-lg flex items-center gap-2">
                        <AlertTriangle className="text-yellow-500" size={20} /> Issue Sanction
                    </h3>
                    <button onClick={onClose}><X className="text-slate-400 hover:text-white" /></button>
                </div>
                <div className="p-6 space-y-6">
                    <div>
                        <label className="block text-xs font-bold uppercase mb-2 text-slate-400">Team</label>
                        <div className="bg-slate-700 p-3 rounded-lg text-white font-bold">{teamName}</div>
                    </div>
                    <div>
                        <label className="block text-xs font-bold uppercase mb-2 text-slate-400">Player</label>
                        <select
                            value={selectedPlayerId}
                            onChange={(e) => setSelectedPlayerId(e.target.value)}
                            className="w-full p-3 bg-slate-700 border border-slate-600 rounded-lg text-white font-medium focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                        >
                            <option value="">-- Select Player --</option>
                            {roster.map(p => (
                                <option key={p.id} value={p.id}>
                                    #{p.number} - {p.name || `${p.firstname} ${p.lastname}`}
                                </option>
                            ))}
                        </select>
                    </div>
                    <div>
                        <label className="block text-xs font-bold uppercase mb-2 text-slate-400">Card Type</label>
                        <div className="grid grid-cols-2 gap-4">
                            <button onClick={() => setCardType('YELLOW')} className={`p-4 rounded-xl font-bold border-b-4 flex flex-col items-center gap-1 transition-all ${cardType === 'YELLOW' ? 'bg-yellow-500 text-black border-yellow-700' : 'bg-slate-700 text-slate-300 border-slate-800 hover:bg-slate-600'}`}>Yellow Card <span className="text-xs font-normal opacity-75">(Warning)</span></button>
                            <button onClick={() => setCardType('RED')} className={`p-4 rounded-xl font-bold border-b-4 flex flex-col items-center gap-1 transition-all ${cardType === 'RED' ? 'bg-red-600 text-white border-red-800' : 'bg-slate-700 text-slate-300 border-slate-800 hover:bg-slate-600'}`}>Red Card <span className="text-xs font-normal opacity-75">(Penalty Point)</span></button>
                        </div>
                    </div>
                </div>
                <div className="p-4 bg-slate-900 border-t border-slate-700 flex justify-end gap-3">
                    <button onClick={onClose} className="px-6 py-2 text-slate-400 hover:text-white font-bold">Cancel</button>
                    <button onClick={handleConfirmClick} disabled={!selectedPlayerId} className="px-8 py-2 rounded-xl font-bold text-white transition-all flex items-center gap-2 bg-blue-600 hover:bg-blue-500 disabled:bg-slate-700 disabled:text-slate-500 disabled:cursor-not-allowed">Confirm</button>
                </div>
            </div>
        </div>
    );
};

export default SanctionModal;