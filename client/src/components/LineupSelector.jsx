import React, { useState, useEffect } from 'react';
import { Shield, CheckCircle } from 'lucide-react';

const LineupSelector = ({ teamName, players, onConfirm }) => {
    const [selectedStarters, setSelectedStarters] = useState([]);
    const [selectedLibero, setSelectedLibero] = useState(null);

    // Auto-select Libero based on position 'L'
    useEffect(() => {
        const liberos = players.filter(p => p.position === 'L');
        if (liberos.length > 0 && !selectedLibero) {
            setSelectedLibero(liberos[0]);
        }
    }, [players, selectedLibero]);

    const toggleStarter = (player) => {
        // Deselect Libero if selected as starter
        if (selectedLibero?.id === player.id) {
            setSelectedLibero(null);
        }
        
        if (selectedStarters.find(p => p.id === player.id)) {
            setSelectedStarters(selectedStarters.filter(p => p.id !== player.id));
        } else if (selectedStarters.length < 6) {
            setSelectedStarters([...selectedStarters, player]);
        }
    };

    const selectLibero = (player) => {
        if (selectedStarters.find(p => p.id === player.id)) return;
        setSelectedLibero(selectedLibero?.id === player.id ? null : player);
    };

    return (
        <div className="bg-gradient-to-br from-gray-800 to-gray-900 p-6 rounded-2xl border border-gray-700 shadow-xl">
            <h3 className="text-2xl font-bold text-white mb-4 flex items-center gap-2">
                <Shield className="text-indigo-400" size={24} />
                {teamName}
            </h3>
            
            <div className="grid grid-cols-2 md:grid-cols-3 gap-3 mb-6">
                {players.map(player => {
                    const isStarter = selectedStarters.find(s => s.id === player.id);
                    const isLibero = selectedLibero?.id === player.id;
                    const isLiberoPos = player.position === 'L';
                    
                    let containerClass = 'p-4 rounded-xl border-2 cursor-pointer transition-all duration-200 hover:scale-105';
                    
                    if (isStarter) {
                        containerClass += ' bg-gradient-to-br from-indigo-600 to-indigo-700 border-indigo-400 shadow-lg shadow-indigo-500/50';
                    } else if (isLibero) {
                        containerClass += ' bg-gradient-to-br from-yellow-600 to-yellow-700 border-yellow-400 shadow-lg shadow-yellow-500/50';
                    } else {
                        containerClass += ' bg-gray-700 border-gray-600 hover:bg-gray-600 hover:border-gray-500';
                    }
                    
                    if (isLiberoPos) {
                        containerClass += ' ring-2 ring-yellow-500/40';
                    }

                    return (
                        <div key={player.id} className={containerClass}>
                            <div className="flex justify-between items-start mb-3">
                                <span className="text-2xl font-black text-white">#{player.number}</span>
                                <div className="flex items-center gap-1">
                                    <span className="text-sm text-gray-200 font-medium truncate max-w-[100px]">
                                        {player.name}
                                    </span>
                                    {isLiberoPos && (
                                        <span className="text-[9px] bg-yellow-400 text-black px-1.5 py-0.5 rounded-full font-bold">
                                            L
                                        </span>
                                    )}
                                </div>
                            </div>
                            
                            <div className="flex gap-2">
                                <button 
                                    onClick={() => toggleStarter(player)} 
                                    disabled={isLibero}
                                    className={`flex-1 text-xs py-2 rounded-lg font-bold transition-all ${
                                        isStarter 
                                            ? 'bg-white text-indigo-700 shadow-md' 
                                            : 'bg-gray-600/50 text-gray-300 hover:bg-gray-600'
                                    } disabled:opacity-40 disabled:cursor-not-allowed`}
                                >
                                    {isStarter ? '✓ Starter' : 'Starter'}
                                </button>
                                <button 
                                    onClick={() => selectLibero(player)} 
                                    disabled={isStarter}
                                    className={`flex-1 text-xs py-2 rounded-lg font-bold transition-all ${
                                        isLibero 
                                            ? 'bg-white text-yellow-700 shadow-md' 
                                            : 'bg-gray-600/50 text-gray-300 hover:bg-gray-600'
                                    } disabled:opacity-40 disabled:cursor-not-allowed`}
                                >
                                    {isLibero ? '✓ Libero' : 'Libero'}
                                </button>
                            </div>
                        </div>
                    );
                })}
            </div>
            
            <div className="flex justify-between items-center bg-gray-900/50 rounded-xl p-4 border border-gray-700">
                <div className="flex gap-6 text-sm">
                    <span className="text-gray-400">
                        Starters: <span className={`font-bold ${
                            selectedStarters.length === 6 ? 'text-green-400' : 'text-red-400'
                        }`}>
                            {selectedStarters.length}/6
                        </span>
                    </span>
                    <span className="text-gray-400">
                        Libero: <span className="text-yellow-400 font-bold">
                            {selectedLibero ? `#${selectedLibero.number}` : 'None'}
                        </span>
                    </span>
                </div>
                
                <button 
                    onClick={() => onConfirm(selectedStarters, selectedLibero)} 
                    disabled={selectedStarters.length !== 6}
                    className="px-6 py-3 bg-gradient-to-r from-green-600 to-green-700 text-white rounded-xl 
                             disabled:from-gray-700 disabled:to-gray-700 disabled:text-gray-500 
                             disabled:cursor-not-allowed font-bold shadow-lg hover:shadow-green-500/50 
                             transition-all duration-200 flex items-center gap-2"
                >
                    <CheckCircle size={18} />
                    Confirm {teamName}
                </button>
            </div>
        </div>
    );
};

export default LineupSelector;