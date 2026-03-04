import React from 'react';
import { Calendar, MapPin, Swords, Edit2, Trash2 } from 'lucide-react';
import TeamLogoDisplay from './TeamLogoDisplay';
import { EmptyState } from '../pages/AdminShared';

const MatchList = ({
    matches,
    darkMode,
    onEdit,
    onDelete,
    onScore,
    isAdmin = false // Default to false (read-only)
}) => {

    if (!matches || matches.length === 0) {
        return <EmptyState text="No matches found." darkMode={darkMode} />;
    }

    return (
        <div className="space-y-3">
            {matches.map(m => {
                const isCompleted = m.status === 'completed';
                const homeWin = isCompleted && Number(m.home_set_score) > Number(m.away_set_score);
                const awayWin = isCompleted && Number(m.away_set_score) > Number(m.home_set_score);

                return (
                    <div key={m.id} className={`p-4 rounded-xl border mb-3 flex flex-col md:flex-row items-center gap-4 transition-all hover:shadow-md ${darkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'}`}>

                        {/* 1. Info (Left) - ปรับปรุงใหม่: เพิ่ม Round, Pool, Gender, Time */}
                        <div className="flex flex-col items-center md:items-start w-full md:w-40 shrink-0 gap-1.5 border-b md:border-b-0 md:border-r border-gray-200 dark:border-gray-700 pb-2 md:pb-0 md:pr-4">

                            {/* บรรทัด 1: เลขแมตช์ และ เพศ */}
                            <div className="flex items-center gap-2">
                                <span className="text-xs font-bold px-2 py-0.5 rounded-full bg-indigo-100 text-indigo-700 dark:bg-indigo-900 dark:text-indigo-300">
                                    #{m.match_number || '-'}
                                </span>
                                {/* แสดงเพศ */}
                                {m.gender && (
                                    <span className={`text-[10px] px-1.5 py-0.5 rounded border font-medium ${m.gender === 'Female' ? 'border-pink-200 text-pink-600 dark:text-pink-300 bg-pink-50 dark:bg-pink-900/20' :
                                        m.gender === 'Male' ? 'border-blue-200 text-blue-600 dark:text-blue-300 bg-blue-50 dark:bg-blue-900/20' :
                                            'border-purple-200 text-purple-600 dark:text-purple-300 bg-purple-50 dark:bg-purple-900/20'
                                        }`}>
                                        {m.gender === 'Female' ? 'หญิง' : m.gender === 'Male' ? 'ชาย' : m.gender}
                                    </span>
                                )}
                            </div>

                            {/* บรรทัด 2: รอบการแข่งขัน และ สาย (Pool) */}
                            <div className="text-xs font-semibold text-gray-700 dark:text-gray-300 truncate w-full text-center md:text-left">
                                {m.round_name || '-'}
                                {m.pool_name && <span className="ml-1 font-normal text-gray-500">({m.pool_name})</span>}
                            </div>

                            {/* บรรทัด 3: วันที่ และ เวลา (เน้นเวลา) */}
                            <div className="flex items-center text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                                <Calendar size={12} className="mr-1.5 shrink-0" />
                                {m.start_time ? (
                                    <div className="flex items-center gap-1">
                                        <span>{new Date(m.start_time).toLocaleDateString('th-TH', { day: 'numeric', month: 'short' })}</span>
                                        <span className="w-px h-3 bg-gray-300 dark:bg-gray-600 mx-0.5"></span>
                                        <span className="font-bold text-indigo-600 dark:text-indigo-400">
                                            {new Date(m.start_time).toLocaleTimeString('th-TH', { hour: '2-digit', minute: '2-digit' })}
                                        </span>
                                    </div>
                                ) : 'TBD'}
                            </div>

                            {/* บรรทัด 4: สนามแข่งขัน */}
                            <div className="flex items-center text-xs text-gray-500 dark:text-gray-400">
                                <MapPin size={12} className="mr-1.5 shrink-0" />
                                <span className="truncate max-w-[120px]">{m.location || '-'}</span>
                            </div>
                        </div>

                        {/* 2. Versus Area (Center) - ปรับปรุง: สกอร์ขึ้นก่อน, Completed อยู่ล่างสุด */}
                        <div className="flex-1 grid grid-cols-7 items-center w-full gap-2">

                            {/* Home Team */}
                            <div className="col-span-3 flex justify-end">
                                <TeamLogoDisplay
                                    logo={m.home_team_logo_url}
                                    code={m.home_team_code}
                                    name={m.home_team}
                                    isRightAligned={true}
                                    textColor={homeWin ? 'text-green-600 dark:text-green-400' : (isCompleted ? 'text-gray-400' : '')}
                                />
                            </div>

                            {/* Score / VS */}
                            <div className="col-span-1 flex flex-col items-center justify-center min-w-[80px]">
                                {(isCompleted || (m.home_set_score || 0) > 0 || (m.away_set_score || 0) > 0) ? (
                                    <div className="flex flex-col items-center w-full">
                                        {/* 1. สกอร์หลัก (Score) - ย้ายขึ้นบนสุด */}
                                        <div className="text-2xl font-black tracking-widest text-gray-800 dark:text-white leading-none mb-1">
                                            {m.home_set_score}-{m.away_set_score}
                                        </div>

                                        {/* 2. คะแนนรายเซต (Set Scores) */}
                                        <div className="w-full flex justify-center mb-1.5">
                                            <div className="flex flex-wrap justify-center gap-1 text-[10px] text-gray-500 dark:text-gray-400 font-mono">
                                                {(() => {
                                                    try {
                                                        const sets = typeof m.set_scores === 'string' ? JSON.parse(m.set_scores) : (Array.isArray(m.set_scores) ? m.set_scores : null);
                                                        return sets ? sets.join(', ') : null;
                                                    } catch (e) { return m.set_scores; }
                                                })()}
                                            </div>
                                        </div>

                                        {/* 3. ป้ายสถานะ (Completed Badge) - ย้ายลงล่างสุด */}
                                        {isCompleted && (
                                            <div className="flex flex-col items-center gap-1 mt-1">
                                                <span className="text-[9px] px-2 py-0.5 rounded bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300 font-bold whitespace-nowrap border border-green-200 dark:border-green-700">
                                                    จบการแข่งขันเป็นทางการ
                                                </span>
                                            </div>
                                        )}
                                    </div>
                                ) : (
                                    <div className="w-8 h-8 rounded-full bg-gray-100 dark:bg-gray-700 flex items-center justify-center text-xs font-bold text-gray-400">
                                        VS
                                    </div>
                                )}
                            </div>

                            {/* Away Team */}
                            <div className="col-span-3 flex justify-start">
                                <TeamLogoDisplay
                                    logo={m.away_team_logo_url}
                                    code={m.away_team_code}
                                    name={m.away_team}
                                    isRightAligned={false}
                                    textColor={awayWin ? 'text-green-600 dark:text-green-400' : (isCompleted ? 'text-gray-400' : '')}
                                />
                            </div>
                        </div>

                        {/* 3. Actions (Right) - Only show if isAdmin AND handlers are provided */}
                        {isAdmin && (
                            <div className="flex gap-2 justify-end border-l pl-4 border-gray-200 dark:border-gray-700">

                                {/* --- ปุ่มเดิม: Manual Score (สีเขียว) --- */}
                                {onScore && (
                                    <button
                                        onClick={() => onScore(m)}
                                        className={`p-2 rounded-lg transition-colors ${darkMode ? 'text-green-400 hover:bg-green-900/30' : 'text-green-600 hover:bg-green-50'}`}
                                        title="Manual Edit Result"
                                    >
                                        <Swords size={18} />
                                    </button>
                                )}

                                {/* ปุ่ม Edit */}
                                {onEdit && (
                                    <button
                                        onClick={() => onEdit(m)}
                                        className={`p-2 rounded-lg transition-colors ${darkMode ? 'text-blue-400 hover:bg-blue-900/30' : 'text-blue-600 hover:bg-blue-50'}`}
                                        title="Edit Info"
                                    >
                                        <Edit2 size={18} />
                                    </button>
                                )}

                                {/* ปุ่ม Delete */}
                                {onDelete && (
                                    <button
                                        onClick={() => onDelete(m.id)}
                                        className={`p-2 rounded-lg transition-colors ${darkMode ? 'text-red-400 hover:bg-red-900/30' : 'text-red-500 hover:bg-red-50'}`}
                                        title="Delete"
                                    >
                                        <Trash2 size={18} />
                                    </button>
                                )}
                            </div>
                        )}
                    </div>
                );
            })}
        </div>
    );
};

export default MatchList;
