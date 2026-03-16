import React from 'react';
import { PlayCircle, Users } from 'lucide-react';
import PlayerListItem from './PlayerListItem';

const TeamInfoPanel = ({ team, align = 'left', onPlayerClick }) => {
    const isRight = align === 'right';
    const benchPlayers = team.roster.filter(p => {
        const lineupIds = team.lineup.filter(l => l).map(l => l.id);
        const liberoIds = [team.liberos.l1?.id, team.liberos.l2?.id].filter(id => id);
        return !lineupIds.includes(p.id) && !liberoIds.includes(p.id);
    });

    return (
        <div className="flex flex-col h-full overflow-hidden">
            <div className={`p-5 border-b border-slate-100 ${isRight ? 'text-right' : 'text-left'}`}>
                 <h3 className={`font-black text-xl uppercase ${team.color} truncate tracking-tight`}>{team.name}</h3>
            </div>
            <div className="flex-1 overflow-y-auto p-4 custom-scrollbar flex flex-col gap-6">
                <div>
                    <h4 className={`text-[10px] font-black text-emerald-500 uppercase tracking-[0.2em] mb-3 flex items-center gap-2 ${isRight ? 'justify-end' : ''}`}>
                        <PlayCircle size={12}/> ON COURT
                    </h4>
                    <div className="space-y-1">
                        {team.lineup.map((p, i) => {
                            const isSwappedLibero = p && p.isLibero && team.liberoSwaps && Object.keys(team.liberoSwaps).includes(i.toString());
                            const isLastSwap = team.lastLiberoSwap && team.lastLiberoSwap.team === team.code && team.lastLiberoSwap.posIndex === i;
                            return (
                                <div key={i} className="cursor-pointer rounded-xl transition-all active:scale-[0.98]" onClick={() => onPlayerClick && p && onPlayerClick(align === 'left' ? 'home' : 'away', i)}>
                                    <PlayerListItem player={p} align={align} isActive={true} teamColor={team.bg} isSwappedLibero={isSwappedLibero} isLastSwap={isLastSwap} />
                                </div>
                            );
                        })}
                        <div className="pt-2 mt-2 border-t border-slate-50 space-y-1">
                            <PlayerListItem player={team.liberos.l1} align={align} isLibero={true} />
                            {team.liberos.l2 && <PlayerListItem player={team.liberos.l2} align={align} isLibero={true} />}
                        </div>
                    </div>
                </div>
                <div className="pb-8">
                     <h4 className={`text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-3 flex items-center gap-2 ${isRight ? 'justify-end' : ''}`}>
                        <Users size={12}/> BENCH ROSTER
                     </h4>
                     <div className="space-y-1">
                         {benchPlayers.length > 0 ? (
                             benchPlayers.map(p => <PlayerListItem key={p.id} player={p} align={align} />)
                         ) : (
                             <div className={`text-xs text-slate-300 font-medium italic py-4 ${isRight ? 'text-right' : ''}`}>
                                 Empty bench
                             </div>
                         )}
                     </div>
                 </div>
            </div>
        </div>
    );
};

export default TeamInfoPanel;