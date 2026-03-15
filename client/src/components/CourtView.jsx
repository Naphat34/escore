import React from 'react';
import { Repeat } from 'lucide-react';
import Ball from '../assets/img/ball.png'

// ✅ 1. รับ prop onPlayerClick เพิ่มเข้ามา
const CourtView = ({ 
    homePositions = [], 
    awayPositions = [], 
    servingSide, 
    hideTokens = false, 
    onPlayerClick, 
    onLiberoClick,
    leftTeam,
    rightTeam,
    disableLibero = false
}) => {

    const leftColor = leftTeam?.bg || 'bg-blue-600';
    const rightColor = rightTeam?.bg || 'bg-pink-600';

    // Component ย่อย: ตัวผู้เล่นในสนาม
    // ✅ 2. รับ prop onClick เข้ามาใน PlayerToken
    const PlayerToken = ({ player, colorClass, onClick }) => {
        if (hideTokens) return null;

        const isLibero = player && player.isLibero;
        const isHex = colorClass && colorClass.startsWith('#');
        const finalColorClass = isLibero ? 'bg-white' : (isHex ? '' : colorClass);
        const finalStyle = (!isLibero && isHex) ? { backgroundColor: colorClass } : {};
        const finalTextColorClass = isLibero ? 'text-black' : 'text-white';

        return (
        // ✅ 3. เพิ่ม onClick เข้าที่ div หลัก
        <div 
            className="flex flex-col items-center justify-center w-full h-full p-1 group cursor-pointer"
            onClick={onClick}
        >
            <div 
                className={`
                    relative
                    w-12 h-12 lg:w-16 lg:h-16 
                    rounded-full border-2 border-white shadow-md shadow-black/30
                    flex flex-col items-center justify-center 
                    transition-transform transform group-hover:scale-110 hover:border-yellow-400
                    ${finalColorClass}
                `}
                style={finalStyle}
            >
                {player?.isCaptain && (
                    <div className="absolute -top-2 lg:-top-3 bg-yellow-400 text-black text-[10px] lg:text-xs font-black px-1.5 py-0.5 rounded-sm shadow-sm z-10">
                        C
                    </div>
                )}
                <span className={`text-xl lg:text-3xl font-black drop-shadow-md ${finalTextColorClass}`}>
                    {player ? player.number : ''}
                </span>
            </div>
            
            <div className="mt-1 text-center w-full">
                {player && (
                    <div className="hidden lg:flex items-center justify-center gap-0.5 text-[10px] font-medium text-white drop-shadow-md w-full">
                        <span className="truncate max-w-[60px]">{player.name || `${player.first_name || ''} ${player.last_name || ''}`.trim() || player.firstname}</span>
                    </div>
                )}
            </div>
        </div>
        );
    };

    return (
        <div className="w-full max-w-4xl mx-auto">
            <div className="relative w-full aspect-[2/1] bg-orange-500 shadow-[0_0_20px_rgba(0,0,0,0.5)] rounded-sm overflow-hidden flex select-none">
            {/* --- HOME TEAM (ซ้าย) --- */}
            <div className="flex-1 border-4 border-white relative h-full z-10">
                <div className="absolute inset-0  border-t-white/20 border-b-white/20 pointer-events-none z-0"></div>
                <div className="absolute right-0 top-0 bottom-0 w-[38%] border-l-4 border-white bg-blue-900/10 pointer-events-none z-0"></div>

                <div className="absolute inset-4 z-10  rounded-sm">
                    {/* Grid 3 แถว 2 คอลัมน์ */}
                    <div className="grid grid-cols-2 grid-rows-3 w-full h-full relative">
                        {/* Back Row (Left on court) | Front Row (Right on court, near net) */}
                        {/* Row 1 */}
                        <div className="flex items-center justify-center"><PlayerToken player={homePositions[4]} colorClass={leftColor} onClick={() => onPlayerClick && onPlayerClick('home', 4)} /></div> {/* P5 */}
                        <div className="flex items-center justify-center"><PlayerToken player={homePositions[3]} colorClass={leftColor} onClick={() => onPlayerClick && onPlayerClick('home', 3)} /></div> {/* P4 */}
                        {/* Row 2 */}
                        <div className="flex items-center justify-center"><PlayerToken player={homePositions[5]} colorClass={leftColor} onClick={() => onPlayerClick && onPlayerClick('home', 5)} /></div> {/* P6 */}
                        <div className="flex items-center justify-center"><PlayerToken player={homePositions[2]} colorClass={leftColor} onClick={() => onPlayerClick && onPlayerClick('home', 2)} /></div> {/* P3 */}
                        {/* Row 3 */}
                        <div className="flex items-center justify-center relative">
                            <PlayerToken player={homePositions[0]} colorClass={leftColor} onClick={() => onPlayerClick && onPlayerClick('home', 0)} /> {/* P1 */}
                            {servingSide === 'left' && !hideTokens && (
                                <div className="absolute -left-1 lg:-left-4 text-xl lg:text-3xl animate-bounce drop-shadow-md z-20">{Ball}</div>
                            )}
                        </div>
                        <div className="flex items-center justify-center"><PlayerToken player={homePositions[1]} colorClass={leftColor} onClick={() => onPlayerClick && onPlayerClick('home', 1)} /></div> {/* P2 */}
                    </div>
                </div>
            </div>
           

            {/* --- AWAY TEAM (ขวา) --- */}
            <div className="flex-1 border-4 border-white relative h-full  -ml-[2px] z-10">
                <div className="absolute inset-0  border-t-white/50 border-b-white/20 pointer-events-none z-0"></div>
                <div className="absolute left-0 top-0 bottom-0 w-[38%] border-r-4 border-white bg-pink-900/10 pointer-events-none z-0"></div>

                <div className="absolute inset-4 z-10 rounded-sm">
                    <div className="grid grid-cols-2 grid-rows-3 w-full h-full relative">
                        {/* Front Row (Left on court, near net) | Back Row (Right on court) - Mirrored */}
                        {/* Row 1 */}
                        <div className="flex items-center justify-center"><PlayerToken player={awayPositions[1]} colorClass={rightColor} onClick={() => onPlayerClick && onPlayerClick('away', 1)} /></div> {/* P2 */}
                        <div className="flex items-center justify-center relative">
                            <PlayerToken player={awayPositions[0]} colorClass={rightColor} onClick={() => onPlayerClick && onPlayerClick('away', 0)} /> {/* P1 */}
                            {servingSide === 'right' && !hideTokens && (
                                <div className="absolute -right-1 lg:-right-4 text-xl lg:text-3xl animate-bounce drop-shadow-md z-20">{Ball}</div>
                            )}
                        </div>
                        {/* Row 2 */}
                        <div className="flex items-center justify-center"><PlayerToken player={awayPositions[2]} colorClass={rightColor} onClick={() => onPlayerClick && onPlayerClick('away', 2)} /></div> {/* P3 */}
                        <div className="flex items-center justify-center"><PlayerToken player={awayPositions[5]} colorClass={rightColor} onClick={() => onPlayerClick && onPlayerClick('away', 5)} /></div> {/* P6 */}
                        {/* Row 3 */}
                        <div className="flex items-center justify-center"><PlayerToken player={awayPositions[3]} colorClass={rightColor} onClick={() => onPlayerClick && onPlayerClick('away', 3)} /></div> {/* P4 */}
                        <div className="flex items-center justify-center"><PlayerToken player={awayPositions[4]} colorClass={rightColor} onClick={() => onPlayerClick && onPlayerClick('away', 4)} /></div> {/* P5 */}
                    </div>
                </div>
            </div>
        </div>

            {/* ปุ่ม Libero ด้านล่างสนาม */}
            {onLiberoClick && !hideTokens && leftTeam && rightTeam && (
                <div className="flex justify-between items-start mt-4 px-2">
                    <div className="flex flex-col items-center gap-2 text-center">
                        <span className={`font-bold text-sm ${leftTeam.color}`}></span>
                        <button 
                            onClick={() => !disableLibero && onLiberoClick(leftTeam.code)}
                            disabled={disableLibero}
                            className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-all shadow-lg font-bold text-sm ${disableLibero ? 'bg-slate-800 text-slate-600 border border-slate-700 cursor-not-allowed' : 'bg-slate-900 hover:bg-blue-600 text-blue-400 hover:text-white border border-blue-500/30'}`}
                        >
                            <Repeat size={16} />
                            <span>
                                {leftTeam.liberos?.l1 || leftTeam.liberos?.l2 
                                    ? `L: ${[leftTeam.liberos.l1?.number, leftTeam.liberos.l2?.number].filter(Boolean).join(',')}` 
                                    : 'Libero'}
                            </span>
                        </button>
                    </div>

                    <div className="flex flex-col items-center gap-2 text-center">
                        <span className={`font-bold text-sm ${rightTeam.color}`}></span>
                        <button 
                            onClick={() => !disableLibero && onLiberoClick(rightTeam.code)}
                            disabled={disableLibero}
                            className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-all shadow-lg font-bold text-sm ${disableLibero ? 'bg-slate-800 text-slate-600 border border-slate-700 cursor-not-allowed' : 'bg-slate-900 hover:bg-pink-600 text-pink-400 hover:text-white border border-pink-500/30'}`}
                        >
                            <Repeat size={16} />
                            <span>
                                {rightTeam.liberos?.l1 || rightTeam.liberos?.l2 
                                    ? `L: ${[rightTeam.liberos.l1?.number, rightTeam.liberos.l2?.number].filter(Boolean).join(',')}` 
                                    : 'Libero'}
                            </span>
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
};

export default CourtView;