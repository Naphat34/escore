import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { api } from '../../api';

export default function ScoreViewSpectator() {
    const { matchId } = useParams();
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
    const [substitutions, setSubstitutions] = useState(() => loadState('substitutions', { home: 0, away: 0 }));
    const [servingTeam, setServingTeam] = useState(() => loadState('servingTeam', null));
    const [isHomeLeft, setIsHomeLeft] = useState(() => loadState('isHomeLeft', true));
    const [teamColors, setTeamColors] = useState(() => loadState('teamColors', { home: '#4f46e5', away: '#e11d48' }));

    const refreshData = async () => {
        try {
            const res = await api.getLiveState(matchId);
            const state = res.data;

            setMatchData(state.matchData || { teamHome: "HOME", teamAway: "AWAY", currentSet: 1 });
            setScore(state.score || { home: 0, away: 0 });
            setSetsWon(state.setsWon || { home: 0, away: 0 });
            setTimeouts(state.timeouts || { home: 0, away: 0 });
            setSubstitutions(state.substitutions || { home: 0, away: 0 });
            setServingTeam(state.servingTeam || null);
            setIsHomeLeft(state.isHomeLeft !== undefined ? state.isHomeLeft : true);
            setTeamColors(state.teamColors || { home: '#4f46e5', away: '#e11d48' });
            
            setLastUpdated(Date.now());
        } catch (error) {
            console.error("Failed to refresh data from server:", error);
        }
    };

    // --- EFFECT: LIVE POLLING ---
    useEffect(() => {
        refreshData();
        const interval = setInterval(refreshData, 1000); // 1 second fast polling for live view
        return () => clearInterval(interval);
    }, [matchId]);

    const getLeftTeam = () => isHomeLeft
        ? { name: matchData.teamHome, score: score.home, sets: setsWon.home, code: 'home', color: teamColors.home }
        : { name: matchData.teamAway, score: score.away, sets: setsWon.away, code: 'away', color: teamColors.away };

    const getRightTeam = () => isHomeLeft
        ? { name: matchData.teamAway, score: score.away, sets: setsWon.away, code: 'away', color: teamColors.away }
        : { name: matchData.teamHome, score: score.home, sets: setsWon.home, code: 'home', color: teamColors.home };

    const leftTeam = getLeftTeam();
    const rightTeam = getRightTeam();

    const isLeftServing = servingTeam === leftTeam.code;
    const isRightServing = servingTeam === rightTeam.code;

    // A helper to generate the timeout dots based on how many they've taken (max 2 per set usually)
    const renderTimeouts = (taken) => {
        const maxTimeouts = 2;
        const dots = [];
        for(let i=0; i<maxTimeouts; i++) {
            dots.push(
                <div key={i} className={`w-6 h-6 rounded-full border-4 border-white ${
                    i < taken ? 'bg-red-500' : 'bg-transparent'
                }`} />
            );
        }
        return dots;
    }

    return (
        <div className="h-screen w-screen bg-black text-white flex flex-col overflow-hidden font-sans relative selection:bg-transparent cursor-default">
            
            {/* Background design */}
            <div className="absolute inset-0 bg-gradient-to-br from-gray-900 to-black pointer-events-none" />
            
            {/* Ambient lighting from team colors */}
            <div className="absolute top-0 left-0 w-1/2 h-full opacity-20 filter blur-[150px] transition-colors duration-1000" style={{backgroundColor: leftTeam.color}}></div>
            <div className="absolute top-0 right-0 w-1/2 h-full opacity-20 filter blur-[150px] transition-colors duration-1000" style={{backgroundColor: rightTeam.color}}></div>

            {/* Main Scoreboard Layout */}
            <div className="relative z-10 flex flex-col h-full p-8 md:p-16 gap-8">
                
                {/* Header (Sets & Tournament info) */}
                <div className="flex justify-center items-center shrink-0">
                    <div className="bg-white/10 backdrop-blur-md px-12 py-3 rounded-full border border-white/20 shadow-2xl flex items-center gap-6">
                        <span className="text-3xl font-extrabold tracking-widest text-slate-300 uppercase">SET</span>
                        <span className="text-5xl font-black text-white">{matchData.currentSet}</span>
                    </div>
                </div>

                {/* Score Area */}
                <div className="flex-1 flex items-stretch gap-8 mx-auto w-full max-w-screen-2xl">
                    
                    {/* Left Team */}
                    <div className="flex-1 flex flex-col items-center justify-center relative">
                        {/* Serving Indicator */}
                        <div className={`transition-opacity duration-300 absolute top-[-40px] left-1/2 -translate-x-1/2 flex items-center gap-3 ${isLeftServing ? 'opacity-100' : 'opacity-0'}`}>
                            <div className="w-4 h-4 rounded-full bg-yellow-400 shadow-[0_0_15px_rgba(250,204,21,1)] animate-pulse" />
                            <span className="text-yellow-400 uppercase tracking-widest font-bold text-sm">Serving</span>
                        </div>

                        {/* Team Name Box */}
                        <div className="w-full bg-gradient-to-r from-black/60 to-black/30 backdrop-blur-xl border-t-8 rounded-b-3xl shadow-2xl flex flex-col overflow-hidden" style={{ borderColor: leftTeam.color }}>
                            <div className="p-8 pb-4 text-center">
                                <h1 className="text-5xl md:text-7xl font-black uppercase truncate text-white drop-shadow-lg tracking-tight">
                                    {leftTeam.name}
                                </h1>
                            </div>

                            {/* Score */}
                            <div className="flex-1 flex items-center justify-center py-8">
                                <span className="text-[14rem] md:text-[20rem] leading-none font-black text-white drop-shadow-[0_10px_35px_rgba(0,0,0,0.8)] tracking-tighter" style={{ textShadow: `0 0 60px ${leftTeam.color}aa` }}>
                                    {leftTeam.score}
                                </span>
                            </div>

                            {/* Sets Won & Timeouts */}
                            <div className="flex items-center justify-between p-8 bg-black/40 border-t border-white/10">
                                <div className="flex flex-col items-start gap-2">
                                    <span className="text-sm font-bold text-slate-400 uppercase tracking-widest">Timeouts</span>
                                    <div className="flex gap-2">
                                        {renderTimeouts(timeouts[leftTeam.code])}
                                    </div>
                                </div>
                                <div className="flex flex-col items-center gap-1">
                                    <span className="text-[3rem] font-black text-yellow-400 leading-none">{leftTeam.sets}</span>
                                    <span className="text-xs font-bold text-slate-400 uppercase tracking-widest">Sets Won</span>
                                </div>
                                <div className="flex flex-col items-end gap-1">
                                    <span className="text-3xl font-black text-white leading-none">{substitutions[leftTeam.code]}</span>
                                    <span className="text-xs font-bold text-slate-400 uppercase tracking-widest">Subs</span>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Divider / VS indicator */}
                    <div className="flex flex-col justify-center items-center w-16 md:w-32 shrink-0">
                        <div className="h-1/3 w-1.5 bg-gradient-to-b from-transparent to-white/20 rounded-t-full" />
                        <div className="my-8 text-2xl md:text-4xl font-black text-white/30 italic">VS</div>
                        <div className="h-1/3 w-1.5 bg-gradient-to-t from-transparent to-white/20 rounded-b-full" />
                    </div>

                    {/* Right Team */}
                    <div className="flex-1 flex flex-col items-center justify-center relative">
                        {/* Serving Indicator */}
                        <div className={`transition-opacity duration-300 absolute top-[-40px] left-1/2 -translate-x-1/2 flex items-center gap-3 ${isRightServing ? 'opacity-100' : 'opacity-0'}`}>
                            <div className="w-4 h-4 rounded-full bg-yellow-400 shadow-[0_0_15px_rgba(250,204,21,1)] animate-pulse" />
                            <span className="text-yellow-400 uppercase tracking-widest font-bold text-sm">Serving</span>
                        </div>

                        {/* Team Name Box */}
                        <div className="w-full bg-gradient-to-l from-black/60 to-black/30 backdrop-blur-xl border-t-8 rounded-b-3xl shadow-2xl flex flex-col overflow-hidden" style={{ borderColor: rightTeam.color }}>
                            <div className="p-8 pb-4 text-center">
                                <h1 className="text-5xl md:text-7xl font-black uppercase truncate text-white drop-shadow-lg tracking-tight">
                                    {rightTeam.name}
                                </h1>
                            </div>

                            {/* Score */}
                            <div className="flex-1 flex items-center justify-center py-8">
                                <span className="text-[14rem] md:text-[20rem] leading-none font-black text-white drop-shadow-[0_10px_35px_rgba(0,0,0,0.8)] tracking-tighter" style={{ textShadow: `0 0 60px ${rightTeam.color}aa` }}>
                                    {rightTeam.score}
                                </span>
                            </div>

                            {/* Sets Won & Timeouts */}
                            <div className="flex items-center justify-between p-8 bg-black/40 border-t border-white/10 flex-row-reverse">
                                <div className="flex flex-col items-end gap-2">
                                    <span className="text-sm font-bold text-slate-400 uppercase tracking-widest">Timeouts</span>
                                    <div className="flex gap-2 flex-row-reverse">
                                        {renderTimeouts(timeouts[rightTeam.code])}
                                    </div>
                                </div>
                                <div className="flex flex-col items-center gap-1">
                                    <span className="text-[3rem] font-black text-yellow-400 leading-none">{rightTeam.sets}</span>
                                    <span className="text-xs font-bold text-slate-400 uppercase tracking-widest">Sets Won</span>
                                </div>
                                <div className="flex flex-col items-start gap-1">
                                    <span className="text-3xl font-black text-white leading-none">{substitutions[rightTeam.code]}</span>
                                    <span className="text-xs font-bold text-slate-400 uppercase tracking-widest">Subs</span>
                                </div>
                            </div>
                        </div>
                    </div>
                    
                </div>
            </div>
        </div>
    );
}
