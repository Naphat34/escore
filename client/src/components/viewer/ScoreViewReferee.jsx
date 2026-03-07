import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { Clock, RefreshCw, ArrowRightLeft, Wifi, WifiOff } from 'lucide-react';
import CourtView from '../../CourtView';

export default function ScoreViewReferee() {
    const { matchId } = useParams();
    const [localFlip, setLocalFlip] = useState(false);
    const [lastUpdated, setLastUpdated] = useState(Date.now());

    // --- LOCAL STORAGE HELPER ---
    const loadState = (key, defaultValue) => {
        try {
            const saved = localStorage.getItem(`match_${matchId}_${key}`);
            return saved !== null ? JSON.parse(saved) : defaultValue;
        } catch (e) {
            return defaultValue;
        }
    };

    // --- STATE MANAGEMENT ---
    const [matchData, setMatchData] = useState(() => loadState('matchData', { teamHome: "HOME", teamAway: "AWAY", currentSet: 1 }));
    const [score, setScore] = useState(() => loadState('score', { home: 0, away: 0 }));
    const [setsWon, setSetsWon] = useState(() => loadState('setsWon', { home: 0, away: 0 }));
    const [timeouts, setTimeouts] = useState(() => loadState('timeouts', { home: 0, away: 0 }));
    const [challenges, setChallenges] = useState(() => loadState('challenges', { home: 2, away: 2 }));
    const [substitutions, setSubstitutions] = useState(() => loadState('substitutions', { home: 0, away: 0 }));
    const [servingTeam, setServingTeam] = useState(() => loadState('servingTeam', null));
    const [isHomeLeft, setIsHomeLeft] = useState(() => loadState('isHomeLeft', true));
    const [matchDuration, setMatchDuration] = useState(() => loadState('matchDuration', 0));
    const [workflowStep, setWorkflowStep] = useState(() => loadState('workflowStep', ''));
    
    // Lineup & Liberos for CourtView
    const [homeLineup, setHomeLineup] = useState(() => loadState('homeLineup', Array(6).fill(null)));
    const [awayLineup, setAwayLineup] = useState(() => loadState('awayLineup', Array(6).fill(null)));
    const [homeLiberos, setHomeLiberos] = useState(() => loadState('homeLiberos', { l1: null, l2: null }));
    const [awayLiberos, setAwayLiberos] = useState(() => loadState('awayLiberos', { l1: null, l2: null }));

    const refreshData = () => {
        setMatchData(loadState('matchData', { teamHome: "HOME", teamAway: "AWAY", currentSet: 1 }));
        setScore(loadState('score', { home: 0, away: 0 }));
        setSetsWon(loadState('setsWon', { home: 0, away: 0 }));
        setTimeouts(loadState('timeouts', { home: 0, away: 0 }));
        setChallenges(loadState('challenges', { home: 2, away: 2 }));
        setSubstitutions(loadState('substitutions', { home: 0, away: 0 }));
        setServingTeam(loadState('servingTeam', null));
        setIsHomeLeft(loadState('isHomeLeft', true));
        setMatchDuration(loadState('matchDuration', 0));
        setWorkflowStep(loadState('workflowStep', ''));
        setHomeLineup(loadState('homeLineup', Array(6).fill(null)));
        setAwayLineup(loadState('awayLineup', Array(6).fill(null)));
        setHomeLiberos(loadState('homeLiberos', { l1: null, l2: null }));
        setAwayLiberos(loadState('awayLiberos', { l1: null, l2: null }));
        setLastUpdated(Date.now());
    };

    // --- EFFECT: LIVE POLLING ---
    useEffect(() => {
        const interval = setInterval(refreshData, 1000); // Poll every 1 second
        return () => clearInterval(interval);
    }, [matchId]);

    // --- UI HELPERS ---
    const effectiveIsHomeLeft = localFlip ? !isHomeLeft : isHomeLeft;

    const getLeftTeam = () => effectiveIsHomeLeft
        ? { name: matchData.teamHome, score: score.home, sets: setsWon.home, code: 'home', color: 'text-indigo-700', bg: 'bg-indigo-600', lineup: homeLineup, liberos: homeLiberos }
        : { name: matchData.teamAway, score: score.away, sets: setsWon.away, code: 'away', color: 'text-rose-700', bg: 'bg-rose-600', lineup: awayLineup, liberos: awayLiberos };

    const getRightTeam = () => effectiveIsHomeLeft
        ? { name: matchData.teamAway, score: score.away, sets: setsWon.away, code: 'away', color: 'text-rose-700', bg: 'bg-rose-600', lineup: awayLineup, liberos: awayLiberos }
        : { name: matchData.teamHome, score: score.home, sets: setsWon.home, code: 'home', color: 'text-indigo-700', bg: 'bg-indigo-600', lineup: homeLineup, liberos: homeLiberos };

    const leftTeam = getLeftTeam();
    const rightTeam = getRightTeam();

    // Format Duration
    const formatTime = (seconds) => {
        const m = Math.floor(seconds / 60);
        const s = seconds % 60;
        return `${m}:${s.toString().padStart(2, '0')}`;
    };

    return (
        <div className="h-screen w-screen bg-slate-900 text-white flex flex-col overflow-hidden font-sans">
            {/* 1. Header: Set Won A | Name A | Duration | Name B | Set Won B */}
            <div className="flex items-center justify-between px-6 py-4 bg-slate-800 border-b border-slate-700 shadow-md h-20 shrink-0">
                <div className="flex items-center gap-4 flex-1">
                    <div className="bg-slate-700 px-4 py-2 rounded-lg text-3xl font-bold text-yellow-400 border border-slate-600 min-w-[60px] text-center">
                        {leftTeam.sets}
                    </div>
                    <div className={`text-2xl font-bold truncate ${leftTeam.color.replace('text-', 'text-') === 'text-indigo-700' ? 'text-indigo-400' : 'text-rose-400'}`}>
                        {leftTeam.name}
                    </div>
                </div>

                <div className="flex flex-col items-center px-6">
                    <div className="text-[10px] text-slate-400 uppercase font-bold tracking-widest mb-1">Duration</div>
                    <div className="text-3xl font-mono font-bold text-white flex items-center gap-2">
                        <Clock size={24} className="text-slate-500" />
                        {formatTime(matchDuration)}
                    </div>
                </div>

                <div className="flex items-center gap-4 flex-1 justify-end">
                    <div className={`text-2xl font-bold truncate ${rightTeam.color.replace('text-', 'text-') === 'text-indigo-700' ? 'text-indigo-400' : 'text-rose-400'}`}>
                        {rightTeam.name}
                    </div>
                    <div className="bg-slate-700 px-4 py-2 rounded-lg text-3xl font-bold text-yellow-400 border border-slate-600 min-w-[60px] text-center">
                        {rightTeam.sets}
                    </div>
                </div>
            </div>

            {/* 2. Court View */}
            <div className="flex-1 relative bg-slate-900 flex items-center justify-center p-4 overflow-hidden">
                <div className="w-full max-w-5xl aspect-[1.8/1] relative">
                     <CourtView 
                        homePositions={effectiveIsHomeLeft ? homeLineup : awayLineup}
                        awayPositions={effectiveIsHomeLeft ? awayLineup : homeLineup}
                        servingSide={servingTeam ? ((servingTeam === leftTeam.code) ? 'left' : 'right') : null}
                        leftTeam={leftTeam}
                        rightTeam={rightTeam}
                        disableLibero={true}
                        isReadOnly={true}
                    />
                </div>
            </div>

            {/* 3. Set Indicator */}
            <div className="bg-slate-800 py-2 text-center border-y border-slate-700 shrink-0">
                <span className="text-xl font-bold text-slate-300">SET {matchData.currentSet}</span>
            </div>

            {/* 4. Stats Table */}
            <div className="bg-slate-900 p-4 shrink-0">
                <div className="max-w-4xl mx-auto bg-slate-800 rounded-xl border border-slate-700 overflow-hidden shadow-lg">
                    {/* Row 1: Points */}
                    <div className="grid grid-cols-3 border-b border-slate-700">
                        <div className="p-4 text-center text-6xl font-black text-white bg-slate-800/50">{leftTeam.score}</div>
                        <div className="p-4 flex items-center justify-center bg-slate-700/30 text-slate-400 font-bold text-sm uppercase tracking-wider">POINTS</div>
                        <div className="p-4 text-center text-6xl font-black text-white bg-slate-800/50">{rightTeam.score}</div>
                    </div>
                    
                    {/* Row 2: VC (Challenges) */}
                    <div className="grid grid-cols-3 border-b border-slate-700">
                        <div className="p-3 text-center text-2xl font-bold text-blue-400">{challenges[leftTeam.code]}</div>
                        <div className="p-3 flex items-center justify-center bg-slate-700/30 text-slate-500 font-bold text-xs">VC (Challenges)</div>
                        <div className="p-3 text-center text-2xl font-bold text-blue-400">{challenges[rightTeam.code]}</div>
                    </div>

                    {/* Row 3: TO (Timeouts) */}
                    <div className="grid grid-cols-3 border-b border-slate-700">
                        <div className="p-3 text-center text-2xl font-bold text-yellow-500">{timeouts[leftTeam.code]}</div>
                        <div className="p-3 flex items-center justify-center bg-slate-700/30 text-slate-500 font-bold text-xs">TO (Timeouts)</div>
                        <div className="p-3 text-center text-2xl font-bold text-yellow-500">{timeouts[rightTeam.code]}</div>
                    </div>

                    {/* Row 4: SUB (Substitutions) */}
                    <div className="grid grid-cols-3">
                        <div className="p-3 text-center text-2xl font-bold text-green-500">{substitutions[leftTeam.code]}</div>
                        <div className="p-3 flex items-center justify-center bg-slate-700/30 text-slate-500 font-bold text-xs">SUB (Substitutions)</div>
                        <div className="p-3 text-center text-2xl font-bold text-green-500">{substitutions[rightTeam.code]}</div>
                    </div>
                </div>
            </div>

            {/* 5. Footer */}
            <div className="bg-slate-950 px-6 py-3 flex justify-between items-center text-sm text-slate-500 shrink-0 border-t border-slate-800">
                <div className="flex items-center gap-2">
                    {Date.now() - lastUpdated < 3000 ? (
                        <div className="flex items-center gap-2 text-green-500">
                            <Wifi size={16} /> <span className="font-bold">Connected</span>
                        </div>
                    ) : (
                        <div className="flex items-center gap-2 text-red-500">
                            <WifiOff size={16} /> <span className="font-bold">Disconnected</span>
                        </div>
                    )}
                    <span className="text-slate-600 ml-2 hidden sm:inline">Last update: {new Date(lastUpdated).toLocaleTimeString()}</span>
                </div>

                <div className="flex items-center gap-4">
                    <button 
                        onClick={() => setLocalFlip(!localFlip)}
                        className="flex items-center gap-2 px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg transition-colors border border-slate-700"
                    >
                        <ArrowRightLeft size={16} /> Swap Sides
                    </button>
                    <button 
                        onClick={refreshData}
                        className="flex items-center gap-2 px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg transition-colors border border-slate-700"
                    >
                        <RefreshCw size={16} /> Refresh
                    </button>
                </div>
            </div>
        </div>
    );
}
