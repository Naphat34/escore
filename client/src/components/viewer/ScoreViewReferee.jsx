import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { Clock, Flag, Repeat, Video } from 'lucide-react';

// This component is a VIEW-ONLY display for referees or a second screen.
// It reads all its data from localStorage, which is written by the ScorerConsole.
// It polls localStorage every 500ms to get "real-time" updates.

export default function ScoreViewReferee() {
    const { matchId } = useParams();

    // --- LOCAL STORAGE HELPER ---
    // A generic function to safely load and parse state from localStorage.
    const loadState = (key, defaultValue) => {
        try {
            const saved = localStorage.getItem(`match_${matchId}_${key}`);
            // If a value is found, parse it. If parsing fails, it will be caught.
            // If no value is found (saved is null), return the defaultValue.
            return saved !== null ? JSON.parse(saved) : defaultValue;
        } catch (e) {
            // If any error occurs (e.g., corrupted JSON), return the default value.
            console.error(`Failed to load state for key: ${key}`, e);
            return defaultValue;
        }
    };

    // --- STATE MANAGEMENT ---
    // All state is mirrored from the ScorerConsole via localStorage.
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

    // --- EFFECT: LIVE POLLING ---
    // This effect sets up an interval to continuously read data from localStorage.
    useEffect(() => {
        const interval = setInterval(() => {
            // In each tick, reload all relevant data from localStorage.
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
        }, 500); // Poll every 500 milliseconds.

        // Cleanup function: This is crucial to stop the interval when the component unmounts,
        // preventing memory leaks and unnecessary processing.
        return () => clearInterval(interval);
    }, [matchId]); // The effect re-runs only if the matchId changes.

    // --- UI HELPERS ---
    // These functions determine which team is on which side of the screen,
    // based on the `isHomeLeft` flag from the ScorerConsole.
    const getLeftTeam = () => isHomeLeft
        ? { name: matchData.teamHome, score: score.home, sets: setsWon.home, code: 'home' }
        : { name: matchData.teamAway, score: score.away, sets: setsWon.away, code: 'away' };

    const getRightTeam = () => isHomeLeft
        ? { name: matchData.teamAway, score: score.away, sets: setsWon.away, code: 'away' }
        : { name: matchData.teamHome, score: score.home, sets: setsWon.home, code: 'home' };

    const leftTeam = getLeftTeam();
    const rightTeam = getRightTeam();
    const isTimerRunning = workflowStep !== 'ROSTER_CHECK' && workflowStep !== 'SERVER_SELECT' && workflowStep !== 'LINEUP_SELECT' && workflowStep !== 'READY' && workflowStep !== 'MATCH_FINISHED';

    return (
        <div className="h-screen w-screen font-sans flex flex-col bg-slate-900 text-gray-100 p-8">
            {/* Main Scoreboard */}
            <div className="flex justify-center items-center gap-6">
                {/* Left Team */}
                <div className="flex items-center gap-4 flex-1 justify-end">
                    <div className="text-right">
                        <h1 className="text-6xl font-bold truncate max-w-lg">{leftTeam.name}</h1>
                        <div className="flex items-center justify-end gap-3 mt-2">
                            {servingTeam === leftTeam.code && <span className="text-2xl animate-pulse">🏐</span>}
                            <span className="text-2xl font-semibold text-gray-400">SETS: {leftTeam.sets}</span>
                        </div>
                    </div>
                    <div className="bg-slate-800 border-2 border-slate-700 rounded-2xl w-48 h-40 flex items-center justify-center">
                        <span className="text-9xl font-black">{leftTeam.score}</span>
                    </div>
                </div>

                {/* Center Info */}
                <div className="flex flex-col items-center gap-4">
                    <div className="bg-gray-800 border-2 border-gray-700 rounded-2xl px-8 py-4 flex flex-col items-center justify-center h-40 w-40">
                        <span className="text-xl text-gray-400 font-bold uppercase">SET</span>
                        <span className="text-8xl font-bold text-white">{matchData.currentSet}</span>
                    </div>
                    {isTimerRunning && (
                        <div className="py-2 px-5 rounded-xl border-2 border-slate-700 bg-slate-800 flex items-center gap-3">
                            <Clock size={28} className="text-green-400" />
                            <span className="font-bold font-mono text-3xl text-gray-100">
                                {Math.floor(matchDuration / 60)}:{String(matchDuration % 60).padStart(2, '0')}
                            </span>
                        </div>
                    )}
                </div>

                {/* Right Team */}
                <div className="flex items-center gap-4 flex-1">
                    <div className="bg-slate-800 border-2 border-slate-700 rounded-2xl w-48 h-40 flex items-center justify-center">
                        <span className="text-9xl font-black">{rightTeam.score}</span>
                    </div>
                    <div className="text-left">
                        <h1 className="text-6xl font-bold truncate max-w-lg">{rightTeam.name}</h1>
                        <div className="flex items-center gap-3 mt-2">
                            {servingTeam === rightTeam.code && <span className="text-2xl animate-pulse">🏐</span>}
                            <span className="text-2xl font-semibold text-gray-400">SETS: {rightTeam.sets}</span>
                        </div>
                    </div>
                </div>
            </div>

            {/* Quotas and Stats */}
            <div className="flex-1 flex items-center justify-between max-w-7xl mx-auto w-full">
                {/* Left Team Stats */}
                <div className="flex flex-col gap-6 text-4xl font-bold text-gray-300">
                    <div className="flex items-center gap-4">
                        <Flag size={40} className="text-yellow-400" />
                        <span>TIMEOUTS: {2 - timeouts[leftTeam.code]}</span>
                    </div>
                    <div className="flex items-center gap-4">
                        <Video size={40} className="text-blue-400" />
                        <span>CHALLENGES: {challenges[leftTeam.code]}</span>
                    </div>
                    <div className="flex items-center gap-4">
                        <Repeat size={40} className="text-green-400" />
                        <span>SUBSTITUTIONS: {6 - substitutions[leftTeam.code]}</span>
                    </div>
                </div>

                {/* Right Team Stats */}
                <div className="flex flex-col gap-6 text-4xl font-bold text-gray-300 items-end">
                    <div className="flex items-center gap-4">
                        <span>TIMEOUTS: {2 - timeouts[rightTeam.code]}</span>
                        <Flag size={40} className="text-yellow-400" />
                    </div>
                    <div className="flex items-center gap-4">
                        <span>CHALLENGES: {challenges[rightTeam.code]}</span>
                        <Video size={40} className="text-blue-400" />
                    </div>
                    <div className="flex items-center gap-4">
                        <span>SUBSTITUTIONS: {6 - substitutions[rightTeam.code]}</span>
                        <Repeat size={40} className="text-green-400" />
                    </div>
                </div>
            </div>

            {/* Footer/Status */}
            <div className="text-center text-gray-500 text-lg">
                Match ID: {matchId} - Status: <span className="font-semibold">{workflowStep.replace('_', ' ')}</span>
            </div>
        </div>
    );
}