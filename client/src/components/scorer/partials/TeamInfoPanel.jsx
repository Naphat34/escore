import React from 'react';
import { PlayCircle, Users } from 'lucide-react';
import PlayerListItem from './PlayerListItem';

const TeamInfoPanel = ({ team, align = 'left', isDarkMode, onPlayerClick }) => {
    const isRight = align === 'right';
    const benchPlayers = team.roster.filter(p => {
        const lineupIds = team.lineup.filter(l => l).map(l => l.id);
        const liberoIds = [team.liberos.l1?.id, team.liberos.l2?.id].filter(id => id);
        return !lineupIds.includes(p.id) && !liberoIds.includes(p.id);
    });

    return (
        <div className="flex flex-col h-full overflow-hidden">
            <div className={`p-5 border-b ${isDarkMode ? 'border-slate-700' : 'border-gray-200'} ${isRight ? 'text-right' : 'text-left'}`}>
                 <h3 className={`font-bold text-xl uppercase ${team.color} truncate`}>{team.name}</h3>
            </div>
            <div className="flex-1 overflow-y-auto p-4 custom-scrollbar flex flex-col gap-6">
                <div>
                    <h4 className={`text-xs font-bold ${isDarkMode ? 'text-green-400' : 'text-green-600'} uppercase tracking-wider mb-2 flex items-center gap-2 ${isRight ? 'justify-end' : ''}`}>
                        <PlayCircle size={14}/> On Court
                    </h4>
                    <div className="space-y-1">
                        {team.lineup.map((p, i) => {
                            const isSwappedLibero = p && p.isLibero && team.liberoSwaps && Object.keys(team.liberoSwaps).includes(i.toString());
                            const isLastSwap = team.lastLiberoSwap && team.lastLiberoSwap.team === team.code && team.lastLiberoSwap.posIndex === i;
                            return (
                                <div key={i} className="cursor-pointer rounded-lg" onClick={() => onPlayerClick && p && onPlayerClick(align === 'left' ? 'home' : 'away', i)}>
                                    <PlayerListItem player={p} align={align} isActive={true} teamColor={team.bg} isDarkMode={isDarkMode} isSwappedLibero={isSwappedLibero} isLastSwap={isLastSwap} />
                                </div>
                            );
                        })}
                        <PlayerListItem player={team.liberos.l1} align={align} isLibero={true} isDarkMode={isDarkMode} />
                        {team.liberos.l2 && <PlayerListItem player={team.liberos.l2} align={align} isLibero={true} isDarkMode={isDarkMode} />}
                    </div>
                </div>
                <div>
                     <h4 className={`text-xs font-bold ${isDarkMode ? 'text-slate-400' : 'text-gray-500'} uppercase tracking-wider mb-2 flex items-center gap-2 ${isRight ? 'justify-end' : ''}`}>
                        <Users size={14}/> On Bench
                     </h4>
                     <div className="space-y-1">
                         {benchPlayers.length > 0 ? (
                             benchPlayers.map(p => <PlayerListItem key={p.id} player={p} align={align} isDarkMode={isDarkMode} />)
                         ) : (
                             <div className={`text-xs ${isDarkMode ? 'text-slate-500' : 'text-gray-500'} italic py-4 ${isRight ? 'text-right' : ''}`}>
                                 No bench players
                             </div>
                         )}
                     </div>
                 </div>
            </div>
        </div>
    );
};

export default TeamInfoPanel;