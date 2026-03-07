import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { Clock, RefreshCw, ArrowRightLeft, Wifi, WifiOff } from 'lucide-react';
import CourtView from '../CourtView';

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

    return (
        <div className="h-screen w-screen bg-slate-900 text-white flex flex-col justify-center items-center overflow-hidden font-sans">
            <div className="w-full max-w-5xl">
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
            <div className="absolute bottom-4 flex items-center gap-4">
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
    );
}
