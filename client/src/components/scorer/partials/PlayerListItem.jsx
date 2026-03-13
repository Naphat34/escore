import React from 'react';

const PlayerListItem = ({ player, label, align, isActive, isLibero, teamColor, isDarkMode, isSwappedLibero, isLastSwap }) => {
    const isRight = align === 'right';
    
    const getPlayerName = (p) => {
        if (!p) return '';
        if (p.name) return p.name;
        if (p.firstname) return p.firstname + ' ' + (p.lastname || '');
        if (p.first_name) return p.first_name + ' ' + (p.last_name || '');
        return 'Unknown';
    };

    // Conditional styles
    const activeClass = isDarkMode ? 'bg-slate-800/80 border-slate-700/50 shadow-sm' : 'bg-gray-100 border-gray-200 shadow-sm';
    const inactiveClass = isDarkMode ? 'hover:bg-slate-800/30 text-slate-400' : 'hover:bg-gray-50 text-gray-500';
    const numberInactiveClass = isDarkMode ? 'bg-slate-700 text-slate-500' : 'bg-gray-200 text-gray-500';
    const liberoClass = isDarkMode ? 'bg-yellow-600 text-white' : 'bg-yellow-500 text-black';
    const swappedLiberoClass = isDarkMode ? 'bg-white text-black border-2 border-slate-400' : 'bg-white text-black border-2 border-gray-300';
    const lastSwapClass = isDarkMode ? 'ring-2 ring-offset-2 ring-offset-slate-800 ring-yellow-400' : 'ring-2 ring-offset-2 ring-offset-white ring-yellow-400';
    const nameActiveClass = isDarkMode ? 'text-slate-200' : 'text-gray-800';
    const nameInactiveClass = isDarkMode ? 'text-slate-500' : 'text-gray-500';
    const numberActiveClass = isDarkMode ? 'bg-slate-700 text-white' : 'bg-gray-800 text-white';
    const captainClass = isDarkMode ? 'bg-yellow-500 text-black' : 'bg-yellow-400 text-yellow-900';
    const labelClass = isDarkMode ? 'text-slate-500 bg-slate-900' : 'text-gray-500 bg-gray-100';

    return (
        <div className={`flex items-center gap-3 p-2 rounded border border-transparent transition-all ${isActive ? activeClass : inactiveClass} ${isRight ? 'flex-row-reverse text-right' : 'flex-row text-left'} ${isLastSwap ? lastSwapClass : ''}`}>
            <div className={`w-8 h-8 rounded flex items-center justify-center font-bold text-sm shrink-0 ${isSwappedLibero ? swappedLiberoClass : (isLibero ? liberoClass : (isActive && player ? numberActiveClass : numberInactiveClass))}`}>
                {player ? player.number : '-'}
            </div>
            <div className="flex-1 min-w-0 flex flex-col justify-center">
                <div className={`text-sm truncate font-medium flex items-center gap-1.5 ${isActive ? nameActiveClass : nameInactiveClass} ${isRight ? 'flex-row-reverse' : ''}`}>
                    <span>{getPlayerName(player)}</span>
                    {player?.isCaptain && (
                        <span className={`text-[9px] font-black px-1.5 rounded-full ${captainClass}`} title="Captain"> C </span>
                    )}
                </div>
            </div>
            {label && (
                <div className={`text-[10px] font-bold px-2 py-1 rounded ${labelClass}`}>{label}</div>
            )}
        </div>
    );
};

export default PlayerListItem;