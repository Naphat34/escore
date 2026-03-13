import React, { useState, useEffect, useRef } from 'react';
import { useLocation, useParams, useNavigate } from 'react-router-dom';
import { 
    ArrowRightLeft, Users, ListChecks, CheckCircle, Shield, X, PlayCircle, Loader, 
    Trophy, RotateCcw, Flag, Clock, RefreshCcw, History, FileText, AlertTriangle, Repeat,
    Moon, Sun, Timer, Video, ArrowUpDown, ArrowDown, ArrowUp
} from 'lucide-react';
import Swal from 'sweetalert2';

import CourtView from '../CourtView';
import client, { api } from '../../api';

// --- Imported Modals ---
import ChallengeModal from './modals/ChallengeModal';
import SanctionModal from './modals/SanctionModal';
import PreMatchSetupModal from './modals/PreMatchSetupModal';
import SubstitutionModal from './modals/SubstitutionModal';
import TimeoutModal from './modals/TimeoutModal';
import TimeoutTimerModal from './modals/TimeoutTimerModal';
import PlayerPicker from './modals/PlayerPickerModal';
import TeamInfoPanel from './partials/TeamInfoPanel';
import LineupModal from './modals/LineupModal';     // ✅ เพิ่มไฟล์นี้
import MatchLogModal from './modals/MatchLogModal'; // ✅ เพิ่มไฟล์นี้
import LiberoModal from './modals/LiberoModal';

// -----------------------------------------------------------------------------
// ✅ MAIN COMPONENT (ScorerConsole)
// -----------------------------------------------------------------------------
export default function ScorerConsole() {
    const { matchId } = useParams();
    const location = useLocation();
    const navigate = useNavigate();

    // --- LOCAL STORAGE HELPER ---
    const loadState = (key, defaultValue) => {
        try {
            const saved = localStorage.getItem(`match_${matchId}_${key}`);
            return saved !== null ? JSON.parse(saved) : defaultValue;
        } catch (e) {
            return defaultValue;
        }
    };

    // --- INITIAL DATA ---
    const [matchData, setMatchData] = useState(() => {
        const saved = loadState('matchData', null);
        if (saved) return saved;
        const stateData = location.state?.matchData || {};
        return {
            teamHome: stateData.teamHome || "HOME",
            teamAway: stateData.teamAway || "AWAY",
            teamHomeId: stateData.teamHomeId || null,
            teamAwayId: stateData.teamAwayId || null,
            currentSet: stateData.currentSet || 1
        };
    });
    // ==========================================
    // 💾 LOCAL STORAGE STATES (ป้องกันข้อมูลหายเมื่อ Refresh)
    // ==========================================

    // --- STATES ---
    const [isLoading, setIsLoading] = useState(true);
     
    // 1. คะแนนปัจจุบัน (Score)
    const [score, setScore] = useState(() => {
        const saved = localStorage.getItem(`match_${matchId}_score`);
        return saved ? JSON.parse(saved) : { home: 0, away: 0 };
    });
    // 2. ขั้นตอนการทำงาน (Workflow Step) เพื่อไม่ให้เด้งกลับไปหน้า Roster ใหม่
    const [workflowStep, setWorkflowStep] = useState(() => {
        const saved = localStorage.getItem(`match_${matchId}_workflowStep`);
        return saved ? JSON.parse(saved) : 'ROSTER_CHECK';
    });
    // 3. ทีมที่ได้สิทธิ์เสิร์ฟ และ ฝั่งสนาม (ซ้าย-ขวา)
    const [servingTeam, setServingTeam] = useState(() => {
        const saved = localStorage.getItem(`match_${matchId}_servingTeam`);
        return saved ? JSON.parse(saved) : null;
    });
    const [isHomeLeft, setIsHomeLeft] = useState(() => {
        const saved = localStorage.getItem(`match_${matchId}_isHomeLeft`);
        return saved ? JSON.parse(saved) : true;
    });
    // 4. โควต้าการขอเวลานอก (Timeouts)
    const [timeouts, setTimeouts] = useState(() => {
        const saved = localStorage.getItem(`match_${matchId}_timeouts`);
        return saved ? JSON.parse(saved) : { home: 0, away: 0 };
    });
    // 5. โควต้าชาเลนจ์ (Challenges) (ปกติได้เซตละ 2 ครั้ง)
    const [challenges, setChallenges] = useState(() => {
        const saved = localStorage.getItem(`match_${matchId}_challenges`);
        return saved ? JSON.parse(saved) : { home: 2, away: 2 };
    });
    // 6. ลิเบอโร่ (Liberos)
    const [homeLiberos, setHomeLiberos] = useState(() => {
        const saved = localStorage.getItem(`match_${matchId}_homeLiberos`);
        return saved ? JSON.parse(saved) : { l1: null, l2: null };
    });
    const [awayLiberos, setAwayLiberos] = useState(() => {
        const saved = localStorage.getItem(`match_${matchId}_awayLiberos`);
        return saved ? JSON.parse(saved) : { l1: null, l2: null };
    });
    // 7. ประวัติเหตุการณ์ (Match Events Log)
    const [matchEvents, setMatchEvents] = useState(() => {
        const saved = localStorage.getItem(`match_${matchId}_matchEvents`);
        return saved ? JSON.parse(saved) : [];
    });
     // 8. ประวัติการเปลี่ยนตัว Libero (แยกจากโควต้าเปลี่ยนตัวปกติ)
    const [liberoTracker, setLiberoTracker] = useState(() => {
        const saved = localStorage.getItem(`match_${matchId}_liberoTracker`);
        return saved ? JSON.parse(saved) : {
            home: { onCourt: false, activeLibero: null, replacedPlayer: null, posIndex: null },
            away: { onCourt: false, activeLibero: null, replacedPlayer: null, posIndex: null }
        };
    });

    
    const [setsWon, setSetsWon] = useState(() => loadState('setsWon', { home: 0, away: 0 }));
    const [completedSets, setCompletedSets] = useState(() => loadState('completedSets', []));

    const [substitutions, setSubstitutions] = useState(() => loadState('substitutions', { home: 0, away: 0 }));
    

    // Lineup State
    const [homeLineup, setHomeLineup] = useState(() => loadState('homeLineup', Array(6).fill(null)));
    const [awayLineup, setAwayLineup] = useState(() => loadState('awayLineup', Array(6).fill(null)));
    const [lastSetHomeLineup, setLastSetHomeLineup] = useState(null);
    const [lastSetAwayLineup, setLastSetAwayLineup] = useState(null);
    

    // Libero State
    const [lastSetHomeLiberos, setLastSetHomeLiberos] = useState(null);
    const [lastSetAwayLiberos, setLastSetAwayLiberos] = useState(null);
    const [liberoActionData, setLiberoActionData] = useState({ isOpen: false, team: null });

    const [teamColors, setTeamColors] = useState(() => loadState('teamColors', { home: '#4f46e5', away: '#e11d48' }));

    // ✅ New State: Track Libero Swaps (Index -> Original Player)
    const [homeLiberoSwaps, setHomeLiberoSwaps] = useState(() => loadState('homeLiberoSwaps', {}));
    const [awayLiberoSwaps, setAwayLiberoSwaps] = useState(() => loadState('awayLiberoSwaps', {}));

    // History & Logs
    const [history, setHistory] = useState(() => loadState('history', []));
    const [liberoLogs, setLiberoLogs] = useState(() => loadState('liberoLogs', []));

    // Limits & Quotas
    
    // Modals Control State
    const [showRosterModal, setShowRosterModal] = useState(true);
    const [showLineupModal, setShowLineupModal] = useState(false);
    const [showMatchLogModal, setShowMatchLogModal] = useState(false);
    
    const [showPlayerPicker, setShowPlayerPicker] = useState(false);
    const [pickerContext, setPickerContext] = useState({ team: 'home', posIndex: null });

    const [showSubModal, setShowSubModal] = useState(false);
    const [subTeam, setSubTeam] = useState(null);
    
    const [showSanctionModal, setShowSanctionModal] = useState(false);
    const [sanctionTeam, setSanctionTeam] = useState(null);

    const [showChallengeModal, setShowChallengeModal] = useState(false);
    const [challengeData, setChallengeData] = useState({ team: null });

    const [showTimeoutModal, setShowTimeoutModal] = useState(false);
    const [showTimeoutTimer, setShowTimeoutTimer] = useState(false);
    const [timeoutStartTime, setTimeoutStartTime] = useState(null);
    const [activeAction, setActiveAction] = useState({ team: null, type: null });

    // Settings
    const [setsToWin, setSetsToWin] = useState(() => loadState('setsToWin', 3)); 
    
    // Roster Data
    const [masterHomeRoster, setMasterHomeRoster] = useState([]);
    const [masterAwayRoster, setMasterAwayRoster] = useState([]);
    const [homeRoster, setHomeRoster] = useState(() => loadState('homeRoster', [])); 
    const [awayRoster, setAwayRoster] = useState(() => loadState('awayRoster', [])); 

    // Timer
    const [matchDuration, setMatchDuration] = useState(() => loadState('matchDuration', 0));
    const [isTimerRunning, setIsTimerRunning] = useState(() => loadState('isTimerRunning', false));

    // Substitution Context
    const [subData, setSubData] = useState({ 
    isOpen: false, 
    team: null, 
    posIndex: null, 
    playerOut: null 
    });
    
    const [subTracker, setSubTracker] = useState({
        home: { count: 0, positions: {}, usedPlayers: [] },
        away: { count: 0, positions: {}, usedPlayers: [] }
    });
    const [lastLiberoSwap, setLastLiberoSwap] = useState(() => loadState('lastLiberoSwap', null));

    const [activeHistoryTab, setActiveHistoryTab] = useState(1);

    // --- THEME STATE (Dark/Light Mode) ---
    const [isDarkMode, setIsDarkMode] = useState(() => {
        try {
            // This part seems to be for a different feature (theme), 
            // but it's good practice to keep error handling.
            const saved = localStorage.getItem('theme_mode');
            return saved ? JSON.parse(saved) : false;
        } catch (e) { return false; }
    });

    useEffect(() => {
        localStorage.setItem('theme_mode', JSON.stringify(isDarkMode));
    }, [isDarkMode]);

    // --- EFFECT: TIMER ---
    useEffect(() => {
        let interval;
        if (isTimerRunning) {
            interval = setInterval(() => setMatchDuration(prev => prev + 1), 1000);
        }
        return () => clearInterval(interval);
    }, [isTimerRunning]);

    // --- EFFECT: SYNC HISTORY TAB ---
    useEffect(() => {
        setActiveHistoryTab(matchData.currentSet);
    }, [matchData.currentSet]);

    const debounceTimeoutRef = useRef(null);

    // --- EFFECT: SAVE STATE ---
    useEffect(() => {
        // Debounce to prevent spamming the server on rapid state changes
        if (debounceTimeoutRef.current) {
            clearTimeout(debounceTimeoutRef.current);
        }

        debounceTimeoutRef.current = setTimeout(() => {
            const stateForLocalStorage = {
                matchData, workflowStep, score, setsWon, completedSets, activeAction,
                timeouts, challenges, substitutions, matchEvents, servingTeam, isHomeLeft, 
                homeRoster, awayRoster, homeLineup, awayLineup, homeLiberos, awayLiberos, 
                history, setsToWin, matchDuration, isTimerRunning, lastLiberoSwap, teamColors,
                homeLiberoSwaps, awayLiberoSwaps, showTimeoutTimer, timeoutStartTime
            };

            // 1. Save to localStorage for local persistence on refresh
            Object.entries(stateForLocalStorage).forEach(([key, value]) => {
                localStorage.setItem(`match_${matchId}_${key}`, JSON.stringify(value));
            });

            // 2. Save to backend for real-time sync with other devices
            // Create a smaller object for the live state to avoid sending large data like 'history'
            const liveStateForServer = {
                matchData,
                workflowStep,
                score,
                setsWon,
                timeouts,
                challenges,
                substitutions,
                servingTeam,
                isHomeLeft,
                homeLineup,
                awayLineup,
                homeLiberos,
                awayLiberos,
                teamColors,
                showTimeoutTimer,
                timeoutStartTime,
                matchDuration,
                isTimerRunning,
            };
            api.updateLiveState(matchId, liveStateForServer).catch(err => {
                console.error("Failed to sync state to server:", err);
            });
        }, 500); // 500ms debounce delay

        return () => {
            clearTimeout(debounceTimeoutRef.current);
        };
    }, [matchId, matchData, workflowStep, score, setsWon, completedSets, activeAction, timeouts, challenges, substitutions, matchEvents, servingTeam, isHomeLeft, homeRoster, awayRoster, homeLineup, awayLineup, homeLiberos, awayLiberos, history, setsToWin, matchDuration, isTimerRunning, homeLiberoSwaps, awayLiberoSwaps, lastLiberoSwap, teamColors, showTimeoutTimer, timeoutStartTime]);

    // เก็บ ID ผู้เล่นที่ถูกเปลี่ยนตัวออกด้วยกรณีพิเศษ (บาดเจ็บ/ให้ออก) ห้ามลงเล่นทั้งนัด
    const [disqualifiedPlayers, setDisqualifiedPlayers] = useState(() => {
        const saved = localStorage.getItem(`match_${matchId}_disqualified`);
        return saved ? JSON.parse(saved) : [];
    });

    useEffect(() => {
        localStorage.setItem(`match_${matchId}_disqualified`, JSON.stringify(disqualifiedPlayers));
    }, [disqualifiedPlayers, matchId]);
    // ==========================================
    // 🔄 AUTO-SAVE TO LOCAL STORAGE
    // ==========================================

    useEffect(() => {
        localStorage.setItem(`match_${matchId}_score`, JSON.stringify(score));
    }, [score, matchId]);

    useEffect(() => {
        localStorage.setItem(`match_${matchId}_workflowStep`, JSON.stringify(workflowStep));
    }, [workflowStep, matchId]);

    useEffect(() => {
        localStorage.setItem(`match_${matchId}_servingTeam`, JSON.stringify(servingTeam));
        localStorage.setItem(`match_${matchId}_isHomeLeft`, JSON.stringify(isHomeLeft));
    }, [servingTeam, isHomeLeft, matchId]);

    useEffect(() => {
        localStorage.setItem(`match_${matchId}_timeouts`, JSON.stringify(timeouts));
        localStorage.setItem(`match_${matchId}_challenges`, JSON.stringify(challenges));
    }, [timeouts, challenges, matchId]);

    useEffect(() => {
        localStorage.setItem(`match_${matchId}_homeLiberos`, JSON.stringify(homeLiberos));
        localStorage.setItem(`match_${matchId}_awayLiberos`, JSON.stringify(awayLiberos));
    }, [homeLiberos, awayLiberos, matchId]);

    useEffect(() => {
        localStorage.setItem(`match_${matchId}_matchEvents`, JSON.stringify(matchEvents));
    }, [matchEvents, matchId]);
   
    useEffect(() => {
        localStorage.setItem(`match_${matchId}_liberoTracker`, JSON.stringify(liberoTracker));
    }, [liberoTracker, matchId]);



    // --- LOAD DATA ---
    useEffect(() => {
        const fetchMatchData = async () => {
            try {
                setIsLoading(true);
                let currentMatch = matchData;
                
                if (!currentMatch.teamHomeId || !currentMatch.teamAwayId) {
                    const resMatch = await api.getMatchById(matchId);
                    const m = resMatch.data;
                    currentMatch = {
                        ...matchData,
                        teamHome: m.home_team_name,
                        teamAway: m.away_team_name,
                        teamHomeId: m.home_team_id,
                        teamAwayId: m.away_team_id,
                        currentSet: m.current_set || 1
                    };
                    setMatchData(currentMatch);
                }

                if (currentMatch.teamHomeId) {
                    const resHome = await api.getPlayersByTeam(currentMatch.teamHomeId);
                    setMasterHomeRoster(resHome.data || []);
                }
                if (currentMatch.teamAwayId) {
                    const resAway = await api.getPlayersByTeam(currentMatch.teamAwayId);
                    setMasterAwayRoster(resAway.data || []);
                }
            } catch (error) {
                console.error("Error fetching match data:", error);
            } finally {
                setIsLoading(false);
            }
        };
        fetchMatchData();
    }, [matchId]);

    // --- API HELPER: SAVE EVENT ---
    const saveEventToBackend = async (eventType, teamCode, details = {}) => {
        const currentScore = details.newScore || score;

        try {
            const teamId = teamCode === 'home' ? matchData.teamHomeId : matchData.teamAwayId;
            await client.post(`/scorer/match/${matchId}/event`, {
                set_number: matchData.currentSet,
                event_type: eventType,
                team_id: teamId,
                score_home: currentScore.home,
                score_away: currentScore.away,
                ...details
            });
        } catch (error) {
            console.error(`Failed to save event ${eventType}:`, error);
        }

        let description = eventType;
        let metadata = null;
        const teamName = teamCode === 'home' ? matchData.teamHome : (teamCode === 'away' ? matchData.teamAway : '');
        
        if (eventType === 'POINT') description = `Point ${teamName}`;
        else if (eventType === 'TIMEOUT') {
            description = `Timeout ${teamName}`;
            metadata = { type: 'TIMEOUT', team: teamName };
        }
        else if (eventType === 'CHALLENGE') {
            description = `Challenge ${teamName}`;
            metadata = { type: 'CHALLENGE', team: teamName };
        }
        else if (eventType === 'SUBSTITUTION') {
             const roster = teamCode === 'home' ? homeRoster : awayRoster;
             const pIn = roster.find(p => p.id === details.player_id);
             const pOut = roster.find(p => p.id === details.details?.out);
             description = `Sub: IN #${pIn?.number || '?'} / OUT #${pOut?.number || '?'} (${teamName})`;
             metadata = {
                 type: 'SUBSTITUTION',
                 in: pIn?.number || '?',
                 out: pOut?.number || '?',
                 team: teamName
             };
        } else if (eventType === 'SANCTION') {
            const roster = teamCode === 'home' ? homeRoster : awayRoster;
            const p = roster.find(p => p.id === details.player_id);
            const card = details.details?.card || 'Card';
            description = `${card} CARD for #${p?.number || '?'} (${teamName})`;
            metadata = {
                type: 'SANCTION',
                player: p?.number || '?',
                card,
                team: teamName
            };
        } else if (eventType === 'LIBERO_REPLACEMENT') {
            const roster = teamCode === 'home' ? homeRoster : awayRoster;
            const pIn = roster.find(p => p.id === details.player_id);
            const pOut = roster.find(p => p.id === details.details?.out);
            description = `Libero: IN #${pIn?.number || '?'} / OUT #${pOut?.number || '?'} (${teamName})`;
            metadata = {
                type: 'LIBERO',
                in: pIn?.number || '?',
                out: pOut?.number || '?',
                team: teamName
            };
        } else if (eventType === 'LIBERO_SWAP') {
            const d = details.details || {};
            const pIn = d.type === 'IN' ? d.libero : d.player;
            const pOut = d.type === 'IN' ? d.player : d.libero;
            description = `Libero Swap: IN #${pIn} / OUT #${pOut} (${teamName})`;
            metadata = {
                type: 'LIBERO',
                in: pIn,
                out: pOut,
                team: teamName
            };
        }

        setMatchEvents(prev => [{
            id: Date.now(),
            set: matchData.currentSet,
            score: `${currentScore.home}-${currentScore.away}`,
            description,
            metadata,
            time: new Date().toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' })
        }, ...prev]);
    };

    const saveStateToHistory = () => {
        const currentState = {
            score: { ...score },
            setsWon: { ...setsWon },
            servingTeam,
            homeLineup: [...homeLineup],
            awayLineup: [...awayLineup],
            isHomeLeft,
            workflowStep,
            timeouts: { ...timeouts },
            challenges: { ...challenges },
            substitutions: { ...substitutions },
            matchEvents: [...matchEvents],
            homeLiberoSwaps: { ...homeLiberoSwaps },
            awayLiberoSwaps: { ...awayLiberoSwaps },
            subTracker: JSON.parse(JSON.stringify(subTracker)),
            liberoTracker: JSON.parse(JSON.stringify(liberoTracker))
        };
        setHistory(prev => [...prev, currentState]);
    };

    // --- CORE GAME LOGIC ---
    const rotateLineup = (currentLineup, teamCode) => {
        // Check P5 (index 4) moving to P4 (index 3)
        const p5 = currentLineup[4];
        if (p5) {
            const liberos = teamCode === 'home' ? homeLiberos : awayLiberos;
            const isLibero = (p5.id === liberos.l1?.id || p5.id === liberos.l2?.id);
            
            if (isLibero) {
                Swal.fire({
                    title: 'Libero Rotation Warning',
                    text: `Libero #${p5.number} is rotating to the front row (P4). They must be replaced!`,
                    icon: 'warning',
                    timer: 5000,
                    toast: true,
                    position: 'top-end'
                });
            }
        }

        const newLineup = [...currentLineup];
        const p1 = newLineup.shift();
        newLineup.push(p1);

        const currentSwaps = teamCode === 'home' ? homeLiberoSwaps : awayLiberoSwaps;
        const setSwaps = teamCode === 'home' ? setHomeLiberoSwaps : setAwayLiberoSwaps;
        
        if (Object.keys(currentSwaps).length > 0) {
            const newSwaps = {};
            Object.keys(currentSwaps).forEach(idx => {
                const i = parseInt(idx);
                const newIdx = i === 0 ? 5 : i - 1;
                newSwaps[newIdx] = currentSwaps[i];
            });
            setSwaps(newSwaps);
        }

        return newLineup;
    };

    const handlePoint = (winnerTeamCode) => {
        saveStateToHistory();
        const newScore = { ...score, [winnerTeamCode]: score[winnerTeamCode] + 1 };
        setScore(newScore);

        if (winnerTeamCode !== servingTeam) {
            setServingTeam(winnerTeamCode);
            if (winnerTeamCode === 'home') setHomeLineup(prev => rotateLineup(prev, 'home'));
            else setAwayLineup(prev => rotateLineup(prev, 'away'));
        }

        saveEventToBackend('POINT', winnerTeamCode, { newScore });

        // Check Set Winner
        const tieBreakSet = (setsToWin * 2) - 1; 
        const isTieBreak = matchData.currentSet === tieBreakSet;
        const pointsToWin = isTieBreak ? 15 : 25;
        const winnerScore = newScore[winnerTeamCode];
        const loserScore = newScore[winnerTeamCode === 'home' ? 'away' : 'home'];

        if (winnerScore >= pointsToWin && (winnerScore - loserScore) >= 2) {
            finishSet(winnerTeamCode, newScore);
        } else {
            setWorkflowStep('SERVING');
        }
    };

    const finishSet = (winnerCode, finalScore) => {
        const newSetsWon = { ...setsWon, [winnerCode]: setsWon[winnerCode] + 1 };
        setSetsWon(newSetsWon);
        setCompletedSets(prev => [...prev, {
            set: matchData.currentSet,
            home: finalScore.home,
            away: finalScore.away,
            winner: winnerCode
        }]);

        if (newSetsWon[winnerCode] >= setsToWin) {
            setWorkflowStep('MATCH_FINISHED');
            setIsTimerRunning(false);
        } else {
            setWorkflowStep('SET_FINISHED');
        }
    };

    const startNextSet = () => {
        // Reset scores and quotas for the new set
        setScore({ home: 0, away: 0 });
        setTimeouts({ home: 0, away: 0 });
        setChallenges({ home: 2, away: 2 });
        setSubstitutions({ home: 0, away: 0 });
        setSubTracker({ // Reset substitution tracker
            home: { count: 0, positions: {}, usedPlayers: [] },
            away: { count: 0, positions: {}, usedPlayers: [] }
        });
        setHomeLiberoSwaps({});
        setAwayLiberoSwaps({});
        setHistory([]);

        const nextSetNumber = matchData.currentSet + 1;

        // Add "Set Started" event to the cumulative match history
        setMatchEvents(prev => [{
            id: Date.now(),
            set: nextSetNumber,
            score: `0-0`,
            description: `Set ${nextSetNumber} Started`,
            time: new Date().toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' })
        }, ...prev]);

        const isTieBreak = (setsWon.home === setsToWin - 1) && (setsWon.away === setsToWin - 1);
        setMatchData(prev => ({ ...prev, currentSet: nextSetNumber }));
        
        if (!isTieBreak) setIsHomeLeft(prev => !prev);
        
        // Auto-fill from last set if available, otherwise clear
        setHomeLineup(lastSetHomeLineup ? [...lastSetHomeLineup] : Array(6).fill(null));
        setHomeLiberos(lastSetHomeLiberos ? {...lastSetHomeLiberos} : { l1: null, l2: null });

        setAwayLineup(lastSetAwayLineup ? [...lastSetAwayLineup] : Array(6).fill(null));
        setAwayLiberos(lastSetAwayLiberos ? {...lastSetAwayLiberos} : { l1: null, l2: null });

        if (isTieBreak) {
            setServingTeam(null);
            setWorkflowStep('SERVER_SELECT');
        } else {
            setWorkflowStep('LINEUP_SELECT');
            setShowLineupModal(true);
        }
    };

    const handleUndo = () => {
        if (history.length === 0) return;

        Swal.fire({
            title: 'ยืนยันการย้อนกลับ?',
            text: "คุณต้องการยกเลิกการกระทำล่าสุดใช่หรือไม่?",
            icon: 'warning',
            showCancelButton: true,
            confirmButtonColor: '#3085d6',
            cancelButtonColor: '#d33',
            confirmButtonText: 'ใช่, ย้อนกลับ',
            cancelButtonText: 'ยกเลิก'
        }).then((result) => {
            if (result.isConfirmed) {
                const lastState = history[history.length - 1];
                
                setScore(lastState.score);
                setSetsWon(lastState.setsWon);
                setServingTeam(lastState.servingTeam);
                setHomeLineup(lastState.homeLineup);
                setAwayLineup(lastState.awayLineup);
                setIsHomeLeft(lastState.isHomeLeft);
                
                if (lastState.workflowStep) setWorkflowStep(lastState.workflowStep);
                if (lastState.timeouts) setTimeouts(lastState.timeouts);
                if (lastState.challenges) setChallenges(lastState.challenges);
                if (lastState.substitutions) setSubstitutions(lastState.substitutions);
                if (lastState.matchEvents) setMatchEvents(lastState.matchEvents);
                if (lastState.homeLiberoSwaps) setHomeLiberoSwaps(lastState.homeLiberoSwaps);
                if (lastState.awayLiberoSwaps) setAwayLiberoSwaps(lastState.awayLiberoSwaps);
                
                if (lastState.subTracker) setSubTracker(lastState.subTracker);
                if (lastState.liberoTracker) setLiberoTracker(lastState.liberoTracker);

                setHistory(prev => prev.slice(0, -1));
                
                Swal.fire({
                    icon: 'success',
                    title: 'ย้อนกลับเรียบร้อย',
                    toast: true,
                    position: 'top-end',
                    showConfirmButton: false,
                    timer: 1500
                });
            }
        });
    };

    const handleStartMatch = () => {
        // Clear previous events and log the start of the match.
        setMatchEvents([{
            id: Date.now(),
            set: matchData.currentSet,
            score: `0-0`,
            description: `Set ${matchData.currentSet} Started`,
            time: new Date().toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' })
        }]);
        setWorkflowStep('SERVING');
        setIsTimerRunning(true);
    };

    const handleFinishMatch = () => {
        // Clear logic would go here
        navigate('/admin');
    };

    // --- CONFIRM HANDLERS ---
    const handleSetupConfirm = (data) => {
        // The value from setup should be the number of sets needed to win (e.g., 2 for Bo3, 3 for Bo5)
        const setsNeeded = parseInt(data.setsToWin, 10);

        // Validate and set, defaulting to 3 (for Best of 5) if invalid.
        // A match must be at least best of 3 (win 2 sets).
        setSetsToWin(setsNeeded >= 2 ? setsNeeded : 3);

        setHomeRoster(data.confirmedHome);
        setAwayRoster(data.confirmedAway);
        setShowRosterModal(false);
        setWorkflowStep('SERVER_SELECT');
    };

    const handleLineupConfirm = async () => {
        if (homeLineup.some(p => !p) || awayLineup.some(p => !p)) {
            alert("กรุณาเลือกผู้เล่นตัวจริงให้ครบทั้ง 6 ตำแหน่ง");
            return;
        }

        // ✅ บันทึก Lineup ลงฐานข้อมูล
        try {
            await Promise.all([
                api.saveLineup(matchId, {
                    team_id: matchData.teamHomeId,
                    set_number: matchData.currentSet,
                    player_positions: homeLineup,
                    libero_id: homeLiberos.l1?.id
                }),
                api.saveLineup(matchId, {
                    team_id: matchData.teamAwayId,
                    set_number: matchData.currentSet,
                    player_positions: awayLineup,
                    libero_id: awayLiberos.l1?.id
                })
            ]);
        } catch (error) {
            console.error("Failed to save lineups to DB:", error);
            // แจ้งเตือนแต่ยอมให้ทำงานต่อได้ (หรือจะ return เพื่อบังคับบันทึกก็ได้)
            Swal.fire('Warning', 'บันทึก Lineup ลงฐานข้อมูลไม่สำเร็จ (แต่ยังเล่นต่อได้)', 'warning');
        }

        // Save Lineups for next set reuse
        setLastSetHomeLineup([...homeLineup]);
        setLastSetAwayLineup([...awayLineup]);
        setLastSetHomeLiberos({...homeLiberos});
        setLastSetAwayLiberos({...awayLiberos});

        setShowLineupModal(false);
        setWorkflowStep('READY');
    };

    const handleActionSelect = (teamCode, actionType) => {
        setActiveAction({ team: teamCode, type: actionType });
        if (actionType === 'TIMEOUT') {
            // Directly start the timeout without showing confirmation modal
            if (timeouts[teamCode] >= 2) {
                alert("Timeout limit reached.");
                return;
            }
            saveStateToHistory();
            setTimeouts(prev => ({ ...prev, [teamCode]: prev[teamCode] + 1 }));
            saveEventToBackend('TIMEOUT', teamCode);
            setTimeoutStartTime(Date.now());
            setShowTimeoutTimer(true);
            setActiveAction({ team: null, type: null });
        }
    };

    const handleActionCancel = () => {
        setActiveAction({ team: null, type: null });
        setShowTimeoutModal(false);
    };

    const handleActionConfirm = () => {
        const { team, type } = activeAction;
        if (!team || !type) return;
        saveStateToHistory();

        if (type === 'TIMEOUT') {
            if (timeouts[team] >= 2) return alert("Timeout limit reached.");
            setTimeouts(prev => ({ ...prev, [team]: prev[team] + 1 }));
            saveEventToBackend('TIMEOUT', team);
            setTimeoutStartTime(Date.now());
            setShowTimeoutTimer(true);
        }
        setShowTimeoutModal(false);
        handleActionCancel();
    };

    const handlePlayerSelect = (player) => {

        console.log("SELECTED:", player);
        console.log("Context:", pickerContext);

        const { team, posIndex } = pickerContext;
        const isCourtPos = typeof posIndex === 'number';

        if (isCourtPos && player.isLibero) {
            alert("ไม่สามารถเลือก Libero ลงเป็นผู้เล่น 6 คนแรกได้");
            return;
        }

        if (team === 'home') {
            if (posIndex === 'l1' || posIndex === 'l2') setHomeLiberos(prev => ({ ...prev, [posIndex]: player }));
            else { 
                const n = [...homeLineup]; n[posIndex] = player; setHomeLineup(n); 
            }
        } else {
            if (posIndex === 'l1' || posIndex === 'l2') setAwayLiberos(prev => ({ ...prev, [posIndex]: player }));
            else { 
                const n = [...awayLineup]; n[posIndex] = player; setAwayLineup(n); 
            }
        }
        setShowPlayerPicker(false);
    };

    const handleSubConfirm = (playerOut, playerIn) => {
        if (!playerOut || !playerIn || !subTeam) return;
        saveStateToHistory();
        
        const teamCode = subTeam;
        const currentLineup = teamCode === 'home' ? homeLineup : awayLineup;
        const setLineup = teamCode === 'home' ? setHomeLineup : setAwayLineup;

        // ค้นหา index ของผู้เล่นที่จะเปลี่ยนออก เพื่อให้แน่ใจว่าเปลี่ยนถูกตำแหน่ง
        const posIndex = currentLineup.findIndex(p => p && (p.id || p.player_id) === (playerOut.id || playerOut.player_id));

        if (posIndex === -1) {
            console.error("Substitution Error: Player to sub out not found in lineup.", playerOut);
            return;
        }

        // สร้าง lineup ใหม่โดยการเปลี่ยนผู้เล่นที่ index ที่ถูกต้อง
        const newLineup = [...currentLineup];
        newLineup[posIndex] = playerIn;
        setLineup(newLineup);

        setSubCounts(prev => ({ ...prev, [teamCode]: prev[teamCode] + 1 }));
        saveEventToBackend('SUBSTITUTION', teamCode, { player_id: playerIn.id, details: { out: playerOut.id } });
        setShowSubModal(false);
        setSubTeam(null);
    };

    const handleSanctionConfirm = (player, cardType) => {
        if (!player || !cardType || !sanctionTeam) return;
        saveStateToHistory();
        saveEventToBackend('SANCTION', sanctionTeam, { player_id: player.id, details: { card: cardType } });
        
        if (cardType === 'RED') {
            const opponentTeam = sanctionTeam === 'home' ? 'away' : 'home';
            handlePoint(opponentTeam);
        }
        setShowSanctionModal(false);
        setSanctionTeam(null);
    };

    const handleChallengeSelect = (result, reason) => {
        const team = challengeData.team;
        if (!team) return;
        if (result === 'UNSUCCESSFUL') {
            setChallenges(prev => ({ ...prev, [team]: Math.max(0, prev[team] - 1) }));
        }
        setShowChallengeModal(false);
        setChallengeData({ team: null });
    };

    // --- LIBERO REPLACEMENT HANDLER ---
    const handleLiberoConfirm = async (actionType, details) => {
        const team = liberoActionData.team;
        let { posIndex, playerIn, playerOut } = details;

        // ดึง Lineup ปัจจุบันของทีมมาเตรียมไว้
        const currentLineup = team === 'home' ? [...homeLineup] : [...awayLineup];

        // 🌟 [แก้บั๊กหมุนตำแหน่ง] 🌟
        // หากเป็นการสลับ Libero ออก ต้องหา "ตำแหน่งปัจจุบัน" ของ Libero ในสนาม
        // เพราะระหว่างเกมอาจจะมีการหมุน (Rotate) ตำแหน่งไปแล้ว
        if (actionType === 'OUT') {
            const actualIndex = currentLineup.findIndex(p => p && p.id === playerOut.id);
            if (actualIndex !== -1) {
                posIndex = actualIndex; // อัปเดตไปใช้ตำแหน่งปัจจุบันแทน
            }
        }

        // 1. อัปเดต Lineup บนหน้าจอ (เอาผู้เล่นใหม่เสียบทับตำแหน่งนั้น)
        currentLineup[posIndex] = playerIn;

        if (team === 'home') {
            setHomeLineup(currentLineup);
        } else {
            setAwayLineup(currentLineup);
        }

        // 2. อัปเดตสถานะ Tracker 
        setLiberoTracker(prev => {
            const newTracker = { ...prev };
            if (actionType === 'IN') {
                // Libero ลงสนาม (จดจำตัวจริงที่ถูกเปลี่ยนออกไป)
                newTracker[team] = { onCourt: true, activeLibero: playerIn, replacedPlayer: playerOut, posIndex };
            } else {
                // Libero ออกจากสนาม
                if (playerIn.isLibero) {
                    // กรณี: เปลี่ยน Libero 1 เป็น Libero 2 (ยังคงสถานะ onCourt)
                    newTracker[team].activeLibero = playerIn;
                    newTracker[team].posIndex = posIndex; // อัปเดตตำแหน่งล่าสุดไว้ด้วย
                } else {
                    // กรณี: เปลี่ยนตัวจริงกลับเข้ามา (เคลียร์สถานะ Libero กลับไปนั่งม้านั่ง)
                    newTracker[team] = { onCourt: false, activeLibero: null, replacedPlayer: null, posIndex: null };
                }
            }
            return newTracker;
        });

        // 3. บันทึก Log ลงระบบหลังบ้าน (ไม่นับเป็นโควต้า 6 ครั้ง)
        await saveEventToBackend('LIBERO_REPLACEMENT', team, {
            player_id: playerIn.id,
            details: { out: playerOut.id, isLiberoAction: true }
        });

        // 4. เขียน Log แถบด้านข้าง
        

        setLiberoActionData({ isOpen: false, team: null });
    };

    // Helper for UI
    const getLeftTeam = () => isHomeLeft 
        ? { name: matchData.teamHome, score: score.home, sets: setsWon.home, code: 'home', color: teamColors.home, bg: teamColors.home, roster: homeRoster, lineup: homeLineup, liberos: homeLiberos, liberoSwaps: homeLiberoSwaps, lastLiberoSwap: lastLiberoSwap } 
        : { name: matchData.teamAway, score: score.away, sets: setsWon.away, code: 'away', color: teamColors.away, bg: teamColors.away, roster: awayRoster, lineup: awayLineup, liberos: awayLiberos, liberoSwaps: awayLiberoSwaps, lastLiberoSwap: lastLiberoSwap };

    const getRightTeam = () => isHomeLeft 
        ? { name: matchData.teamAway, score: score.away, sets: setsWon.away, code: 'away', color: teamColors.away, bg: teamColors.away, roster: awayRoster, lineup: awayLineup, liberos: awayLiberos, liberoSwaps: awayLiberoSwaps, lastLiberoSwap: lastLiberoSwap } 
        : { name: matchData.teamHome, score: score.home, sets: setsWon.home, code: 'home', color: teamColors.home, bg: teamColors.home, roster: homeRoster, lineup: homeLineup, liberos: homeLiberos, liberoSwaps: homeLiberoSwaps, lastLiberoSwap: lastLiberoSwap };

    // Opens picker for LineupModal
    const openPickerForLineup = (team, index) => {
        setPickerContext({ team, posIndex: index });
        setShowPlayerPicker(true);
    };

    // --- SUBSTITUTION HANDLERS ---

    // ใน ScorerConsole.jsx (ส่วนของการเขียนฟังก์ชัน)
    const handleCourtPlayerClick = async (clickedSide, posIndex) => {
        // ป้องกันการเปลี่ยนตัวระหว่าง Rally หรือก่อนเริ่มแมตช์
        if (workflowStep === 'RALLY' || isSetupPhase || workflowStep === 'READY') {
            return;
        }

        const actualTeamCode = (clickedSide === 'home') ? (isHomeLeft ? 'home' : 'away') : (isHomeLeft ? 'away' : 'home');
        const lineup = actualTeamCode === 'home' ? homeLineup : awayLineup; 
        const playerOut = lineup[posIndex];

        if (!playerOut) return;

        if (playerOut.isLibero) {
            Swal.fire({
                icon: 'error',
                title: 'ผิดกติกา FIVB',
                text: 'ไม่สามารถทำ "การเปลี่ยนตัวปกติ" กับตัวรับอิสระได้ กรุณาใช้ปุ่ม [เปลี่ยน Libero] ด้านล่างสนาม เพื่อให้ผู้เล่นตัวจริงกลับเข้ามาก่อน'
            });
            return;
        }

        const currentLiberos = actualTeamCode === 'home' ? homeLiberos : awayLiberos;
        const isLiberoOnCourt = playerOut.id === currentLiberos.l1?.id || playerOut.id === currentLiberos.l2?.id;
        const isBackRowForLibero = [0, 4, 5].includes(posIndex);

        // CASE 1: Clicked on a Libero on court -> Swap them OUT
        if (isLiberoOnCourt) {
            const currentSwaps = actualTeamCode === 'home' ? homeLiberoSwaps : awayLiberoSwaps;
            const originalPlayer = currentSwaps[posIndex];
            
            if (!originalPlayer) {
                Swal.fire('Action Not Allowed', 'This Libero cannot be swapped out from here. This might be a formal replacement.', 'info');
                return;
            }

            saveStateToHistory();
            const setLineup = actualTeamCode === 'home' ? setHomeLineup : setAwayLineup;
            const setSwaps = actualTeamCode === 'home' ? setHomeLiberoSwaps : setAwayLiberoSwaps;

            const newLineup = [...lineup];
            newLineup[posIndex] = originalPlayer;
            setLineup(newLineup);

            const newSwaps = { ...currentSwaps };
            delete newSwaps[posIndex];
            setSwaps(newSwaps);

            setLastLiberoSwap({ team: actualTeamCode, posIndex });
            saveEventToBackend('LIBERO_SWAP', actualTeamCode, { details: { type: 'OUT', libero: playerOut.number, player: originalPlayer.number } });
            return;
        }

        // CASE 2: Clicked on a regular player in a back-row position -> Ask for intent
        if (!isLiberoOnCourt && isBackRowForLibero) {
            const { value: action } = await Swal.fire({
                title: 'Select Action',
                text: `Player #${playerOut.number}: ${playerOut.first_name}`,
                icon: 'question',
                showDenyButton: true,
                showCancelButton: true,
                confirmButtonText: 'Normal Substitution',
                denyButtonText: 'Libero Swap',
                confirmButtonColor: '#3085d6',
                denyButtonColor: '#28a745',
                cancelButtonText: 'Cancel'
            });

            if (action === false) { // isDenied -> Libero Swap IN
                const setLineup = actualTeamCode === 'home' ? setHomeLineup : setAwayLineup;
                const setSwaps = actualTeamCode === 'home' ? setHomeLiberoSwaps : setAwayLiberoSwaps;

                const availableLiberos = [currentLiberos.l1, currentLiberos.l2].filter(Boolean);

                if (availableLiberos.length === 0) {
                    Swal.fire('No Libero', 'This team has no Libero registered.', 'warning');
                    return;
                }

                let liberoToEnter = availableLiberos[0];
                if (availableLiberos.length > 1) {
                    const result = await Swal.fire({
                        title: 'Select Libero',
                        text: 'Which Libero is entering?',
                        icon: 'question',
                        showDenyButton: true,
                        showCancelButton: true,
                        confirmButtonText: `#${availableLiberos[0].number}`,
                        denyButtonText: `#${availableLiberos[1].number}`,
                    });
                    if (result.isConfirmed) liberoToEnter = availableLiberos[0];
                    else if (result.isDenied) liberoToEnter = availableLiberos[1];
                    else return;
                }

                saveStateToHistory();
                const newLineup = [...lineup];
                newLineup[posIndex] = liberoToEnter;
                setLineup(newLineup);
                setSwaps(prev => ({ ...prev, [posIndex]: playerOut }));
                setLastLiberoSwap({ team: actualTeamCode, posIndex });
                saveEventToBackend('LIBERO_SWAP', actualTeamCode, { details: { type: 'IN', libero: liberoToEnter.number, player: playerOut.number } });
                return;
            }
            if (action === undefined) { // isDismissed (Cancel)
                return;
            }
        }

        // CASE 3: Normal Substitution logic
        const tracker = subTracker[actualTeamCode];
        if (tracker.count >= 6) {
            Swal.fire("หมดโควต้าเปลี่ยนตัว", "ทีมนี้ใช้สิทธิ์เปลี่ยนตัวครบ 6 ครั้งในเซตนี้แล้ว", "warning");
            return;
        }

        setSubData({
            isOpen: true,
            team: actualTeamCode,
            posIndex: posIndex,
            playerOut
        });
    };

    // 2. ฟังก์ชันนี้จะถูกเรียกเมื่อกด Confirm ใน SubstitutionModal
    const handleSubstitutionConfirm = async (playerIn, isExceptional) => {
        const { team, posIndex, playerOut } = subData;
        
        // --- 1. Update Tracker ตามกติกา FIVB ---
        if (!isExceptional) {
            setSubstitutions(prev => {
                const newCount = prev[team] + 1;
                
                // แจ้งเตือนเมื่อมีการเปลี่ยนตัวครบ 5 ครั้ง (เหลืออีก 1 ครั้ง)
                if (newCount === 5) {
                    setTimeout(() => {
                        Swal.fire({
                            title: '⚠️ แจ้งเตือนโควต้า',
                            text: `ทีม ${team === 'home' ? matchData.teamHome : matchData.teamAway} เปลี่ยนตัวไปแล้ว 5 ครั้ง (เหลือโควต้าอีก 1 ครั้ง)`,
                            icon: 'warning',
                            confirmButtonColor: '#f59e0b',
                            confirmButtonText: 'รับทราบ'
                        });
                    }, 500); // หน่วงเวลาเล็กน้อยเพื่อให้หน้าต่างเปลี่ยนตัวปิดลงก่อน
                }

                return { ...prev, [team]: newCount };
            });
        } else {
            // กรณีปกติ (Normal Substitution)
            setSubTracker(prev => {
                const teamTracker = { ...prev[team] };
                const posData = teamTracker.positions[posIndex];
                
                teamTracker.count += 1; // นับเพิ่มโควต้า
                
                if (posData) {
                    // เปลี่ยนตัวกลับ -> สลับกลับเข้าที่เดิม ล็อกตำแหน่ง
                    teamTracker.positions[posIndex] = { ...posData, currentOnCourt: playerIn.id, isClosed: true };
                } else {
                    // เปลี่ยนตัวครั้งแรก -> จดจำว่าใครคือตัวจริง ใครคือตัวสำรอง
                    teamTracker.positions[posIndex] = { starterId: playerOut.id, subId: playerIn.id, currentOnCourt: playerIn.id, isClosed: false };
                    teamTracker.usedPlayers.push(playerIn.id);
                    teamTracker.usedPlayers.push(playerOut.id);
                }
                return { ...prev, [team]: teamTracker };
            });
        }

        // --- 2. อัปเดต Lineup บนหน้าจอ ---
        if (team === 'home') {
            const newLineup = [...homeLineup];
            newLineup[posIndex] = playerIn;
            setHomeLineup(newLineup);
        } else {
            const newLineup = [...awayLineup];
            newLineup[posIndex] = playerIn;
            setAwayLineup(newLineup);
        }

        // --- 3. บันทึกประวัติลง Database ---
        // แนบ Flag isExceptional ไปให้ระบบหลังบ้านรู้ด้วย (เผื่อไปใช้ตอนปริ้นท์ใบบันทึกคะแนน)
        await saveEventToBackend('SUBSTITUTION', team, {
            player_id: playerIn.id,
            details: { out: playerOut.id, isExceptional }
        });

        setSubData({ isOpen: false, team: null, posIndex: null, playerOut: null });
    };

    const handleSetFinish = async () => {
    // ตรวจสอบคะแนนก่อนจบ (เช่น ต้องห่าง 2 แต้ม และเกิน 25)
    // ... logic ตรวจสอบ ...

    try {
        const response = await api.endSet(matchId, {
            setNumber: matchSetupData.currentSet,
            homeScore: score.home,
            awayScore: score.away,
            duration: 25 // ส่งเวลาที่จับได้จริงไป (นาที)
        });

        if (response.data.success) {
            if (response.data.isMatchFinished) {
                alert(`จบการแข่งขัน! ทีมชนะคือทีม  ${response.data.winnerId}`);
                // Redirect ไปหน้าสรุปผล หรือ กลับหน้าหลัก
                navigate('/dashboard'); 
            } else {
                alert(`จบเซตที่ ${matchSetupData.currentSet} เริ่มเซตต่อไป...`);
                // รีเซ็ตค่าสำหรับเซตใหม่
                setScore({ home: 0, away: 0 });
                setMatchData(prev => ({
                    ...prev,
                    currentSet: response.data.nextSet,
                    setsWonHome: response.data.currentScore.home,
                    setsWonAway: response.data.currentScore.away
                }));
                // อาจจะต้องเคลียร์ Lineup หรือเริ่ม process Roster Check ใหม่อีกรอบสำหรับเซตใหม่
                setWorkflowStep('LINEUP_SELECT'); 
            }
        }
    } catch (error) {
        console.error("Error ending set:", error);
        alert("เกิดข้อผิดพลาดในการบันทึกผลเซต");
    }
};

    if (isLoading) return <div className="h-screen bg-slate-950 text-white flex items-center justify-center"><Loader className="animate-spin" /></div>;
    const isSetupPhase = ['ROSTER_CHECK', 'SERVER_SELECT', 'LINEUP_SELECT'].includes(workflowStep);

    // Helper class for secondary buttons in controls
    const secondaryBtnClass = isDarkMode 
        ? 'bg-slate-700 text-gray-200 border-slate-600 hover:bg-slate-600 disabled:opacity-40' 
        : 'bg-gray-100 text-gray-700 border-gray-200 hover:bg-gray-200 disabled:opacity-40';

    return (
        <div className={`h-screen font-sans flex flex-col overflow-hidden relative transition-colors duration-300 ${isDarkMode ? 'bg-slate-900 text-gray-100' : 'bg-gray-50 text-gray-900'}`}>
            <main className="flex-1 flex relative overflow-hidden">
                <aside className={`w-80 border-r hidden lg:flex flex-col z-10 shadow-xl transition-colors duration-300 ${isDarkMode ? 'bg-slate-800 border-slate-700' : 'bg-white border-gray-200'}`}>
                     <TeamInfoPanel team={getLeftTeam()} align="left" isDarkMode={isDarkMode} onPlayerClick={handleCourtPlayerClick} />
                </aside>

                <section className={`flex-1 relative flex flex-col h-full transition-colors duration-300 ${isDarkMode ? 'bg-slate-900' : 'bg-gray-50'}`}>
                    

                    {/* SCOREBOARD */}
                    <div className="absolute top-4 left-0 right-0 z-30 flex justify-center items-center gap-3 pointer-events-none px-4">
                        <div className="flex items-center gap-2">
                            <div className={`backdrop-blur-md border rounded-xl py-3 px-4 text-right max-w-[320px] flex items-center justify-end gap-3 shadow-sm transition-colors ${isDarkMode ? 'bg-slate-800/90 border-slate-700 text-gray-100' : 'bg-white/90 border-gray-200'}`}>
                                <div className={`text-3xl font-bold px-2 py-1 rounded border shrink-0 ${isDarkMode ? 'bg-slate-700 border-slate-600 text-gray-300' : 'bg-gray-100 border-gray-300 text-gray-500'}`}>{getLeftTeam().sets}</div>
                                <div className="font-bold text-2xl truncate min-w-0" style={{ color: getLeftTeam().color }}>{getLeftTeam().name}</div>
                            </div>
                            <div className={`border rounded-xl p-2 w-24 h-20 flex items-center justify-center shadow-sm shrink-0 transition-colors ${isDarkMode ? 'bg-slate-800/90 border-slate-700' : 'bg-white/90 border-gray-200'}`}>
                                <div className="text-5xl font-black" style={{ color: getLeftTeam().color }}>{getLeftTeam().score}</div>
                            </div>
                        </div>

                        <div className="relative shrink-0 flex flex-col items-center">
                            <div className={`border rounded-xl px-6 py-2 flex flex-col items-center justify-center h-20 min-w-[80px] shadow-lg transition-colors ${isDarkMode ? 'bg-slate-800 border-slate-700' : 'bg-gray-800 border-gray-700'}`}>
                                <span className="text-xs text-gray-400 font-bold uppercase">SET</span>
                                <span className="text-4xl font-bold text-white">{matchData.currentSet}</span>
                            </div>
                            {isTimerRunning && (
                                <div className={`absolute top-full mt-2 left-1/2 -translate-x-1/2 py-2 px-4 rounded-xl border flex items-center gap-2 z-40 shadow-md transition-colors ${isDarkMode ? 'bg-slate-800/90 border-slate-700' : 'bg-white/90 border-gray-300'}`}>
                                    <Clock size={20} className="text-green-400 animate-pulse" />
                                    <span className={`font-bold font-mono text-lg ${isDarkMode ? 'text-gray-100' : 'text-gray-800'}`}>{Math.floor(matchDuration/60)}:{String(matchDuration%60).padStart(2,'0')}</span>
                                </div>
                            )}
                        </div>

                        <div className="flex items-center gap-2">
                            <div className={`border rounded-xl p-2 w-24 h-20 flex items-center justify-center shadow-sm shrink-0 transition-colors ${isDarkMode ? 'bg-slate-800/90 border-slate-700' : 'bg-white/90 border-gray-200'}`}>
                                <div className="text-5xl font-black" style={{ color: getRightTeam().color }}>{getRightTeam().score}</div>
                            </div>
                            <div className={`backdrop-blur-md border rounded-xl py-3 px-4 text-left max-w-[320px] flex items-center justify-start gap-3 shadow-sm transition-colors ${isDarkMode ? 'bg-slate-800/90 border-slate-700 text-gray-100' : 'bg-white/90 border-gray-200'}`}>
                                <div className="font-bold text-2xl truncate min-w-0" style={{ color: getRightTeam().color }}>{getRightTeam().name}</div>
                                <div className={`text-3xl font-bold px-2 py-1 rounded border shrink-0 ${isDarkMode ? 'bg-slate-700 border-slate-600 text-gray-300' : 'bg-gray-100 border-gray-300 text-gray-500'}`}>{getRightTeam().sets}</div>
                            </div>
                        </div>
                    </div>

                    {!isSetupPhase && (
                        <button onClick={() => setShowMatchLogModal(true)} className={`absolute top-6 right-6 z-50 p-3 rounded-full border shadow-md transition-all pointer-events-auto lg:hidden ${isDarkMode ? 'bg-slate-800 border-slate-600 text-gray-300 hover:bg-slate-700' : 'bg-white border-gray-300 text-gray-600 hover:bg-gray-100'}`}>
                            <FileText size={24} />
                        </button>
                    )}

                    {/* COURT VIEW */}
                    <div className="flex-1 flex items-center justify-center pt-24 pb-4 px-4 relative">
                        <CourtView 
                            homePositions={!isSetupPhase ? (isHomeLeft ? homeLineup : awayLineup) : Array(6).fill(null)}
                            awayPositions={!isSetupPhase ? (isHomeLeft ? awayLineup : homeLineup) : Array(6).fill(null)}
                            servingSide={!isSetupPhase && servingTeam ? ((servingTeam === 'home' && isHomeLeft) || (servingTeam === 'away' && !isHomeLeft) ? 'left' : 'right') : null}
                            onPlayerClick={handleCourtPlayerClick}
                            onLiberoClick={(team) => setLiberoActionData({ isOpen: true, team })}
                            leftTeam={getLeftTeam()}
                            rightTeam={getRightTeam()}
                            disableLibero={workflowStep === 'RALLY'}
                        />
                        
                                                
                        {/* OVERLAYS */}
                        <div className="absolute inset-0 z-40 flex items-center justify-center pointer-events-none">
                            {workflowStep === 'ROSTER_CHECK' && (
                                <div className="pointer-events-auto">
                                    <PreMatchSetupModal 
                                        isOpen={true}
                                        teamHome={matchData.teamHome} teamAway={matchData.teamAway}
                                        homeRoster={masterHomeRoster} awayRoster={masterAwayRoster}
                                        onConfirm={handleSetupConfirm}
                                        isDarkMode={isDarkMode}
                                    />
                                </div>
                            )}

                            {workflowStep === 'SERVER_SELECT' && (
                                <div className="fixed inset-0 z-[60] bg-gray-900/50 backdrop-blur-sm flex items-center justify-center pointer-events-auto">
                                    <div className="bg-white p-8 rounded-3xl border border-gray-200 max-w-2xl w-full text-center space-y-8 shadow-2xl">
                                        <h2 className="text-3xl font-bold flex items-center justify-center gap-3 text-gray-800"><ArrowRightLeft className="text-yellow-500"/> Coin Toss & Sides</h2>
                                        <div className="flex justify-around items-center px-4">
                                            <div className="flex flex-col items-center gap-2">
                                                <span className="font-bold text-gray-700">{matchData.teamHome} Color</span>
                                                <input type="color" value={teamColors.home} onChange={(e) => setTeamColors({...teamColors, home: e.target.value})} className="w-16 h-10 cursor-pointer rounded border" />
                                            </div>
                                            <div className="flex flex-col items-center gap-2">
                                                <span className="font-bold text-gray-700">{matchData.teamAway} Color</span>
                                                <input type="color" value={teamColors.away} onChange={(e) => setTeamColors({...teamColors, away: e.target.value})} className="w-16 h-10 cursor-pointer rounded border" />
                                            </div>
                                        </div>
                                        <div className="flex gap-4 h-32">
                                            <button onClick={() => setIsHomeLeft(true)} className={`flex-1 border-2 rounded-xl flex items-center justify-center text-2xl font-bold transition-all ${isHomeLeft ? 'border-indigo-500 bg-indigo-50 text-indigo-600' : 'border-gray-200 text-gray-400'}`}>Left: {matchData.teamHome}</button>
                                            <div className="flex items-center"><RefreshCcw className="cursor-pointer hover:rotate-180 transition-transform text-gray-500" onClick={() => setIsHomeLeft(!isHomeLeft)}/></div>
                                            <button onClick={() => setIsHomeLeft(false)} className={`flex-1 border-2 rounded-xl flex items-center justify-center text-2xl font-bold transition-all ${!isHomeLeft ? 'border-indigo-500 bg-indigo-50 text-indigo-600' : 'border-gray-200 text-gray-400'}`}>Left: {matchData.teamAway}</button>
                                        </div>
                                        <div className="grid grid-cols-2 gap-4">
                                            <button onClick={() => setServingTeam('home')} className={`p-4 border-2 rounded-xl font-bold ${servingTeam === 'home' ? 'bg-indigo-600 border-indigo-400 text-white' : 'bg-gray-100 text-gray-600'}`}>{matchData.teamHome} Serves</button>
                                            <button onClick={() => setServingTeam('away')} className={`p-4 border-2 rounded-xl font-bold ${servingTeam === 'away' ? 'bg-rose-600 border-rose-400 text-white' : 'bg-gray-100 text-gray-600'}`}>{matchData.teamAway} Serves</button>
                                        </div>
                                        <button onClick={() => servingTeam && setWorkflowStep('LINEUP_SELECT')} disabled={!servingTeam} className="w-full py-4 bg-green-600 hover:bg-green-500 rounded-xl font-bold text-xl disabled:opacity-50">Confirm Setup</button>
                                    </div>
                                </div>
                            )}

                            {workflowStep === 'LINEUP_SELECT' && (
                                <button onClick={() => setShowLineupModal(true)} className="pointer-events-auto animate-pulse bg-green-600 hover:bg-green-500 px-10 py-5 rounded-full text-2xl font-bold shadow-2xl border-4 border-green-400 flex items-center gap-3">
                                    <Users size={32}/> Set Line-ups
                                </button>
                            )}

                            {workflowStep === 'READY' && (
                                <button onClick={handleStartMatch} className="pointer-events-auto animate-pulse bg-indigo-600 hover:bg-indigo-500 px-10 py-5 rounded-full text-2xl font-bold shadow-2xl border-4 border-indigo-400 flex items-center gap-3">
                                    <PlayCircle size={32}/> Start Match
                                </button>
                            )}
                            
                            {workflowStep === 'SET_FINISHED' && (
                                <div className="pointer-events-auto bg-black/90 p-10 rounded-3xl backdrop-blur-md border border-yellow-500/50 text-center">
                                    <h2 className="text-4xl font-black mb-4 text-yellow-500">SET {matchData.currentSet} FINISHED</h2>
                                    <p className="text-2xl mb-8 text-yellow-500">Winner: {score.home > score.away ? matchData.teamHome : matchData.teamAway}</p>
                                    <button onClick={startNextSet} className="bg-white text-black px-8 py-4 rounded-xl font-bold text-xl hover:bg-gray-200">Start Set {matchData.currentSet + 1}</button>
                                </div>
                            )}

                            {workflowStep === 'MATCH_FINISHED' && (
                                <div className="pointer-events-auto bg-black/95 p-12 rounded-3xl border border-yellow-500 text-center">
                                    <Trophy className="text-yellow-400 mx-auto mb-6" size={80} />
                                    <h2 className="text-5xl font-black text-white mb-4">MATCH FINISHED</h2>
                                    <p className="text-3xl font-bold text-yellow-400 mb-8">Winner: {setsWon.home > setsWon.away ? matchData.teamHome : matchData.teamAway}</p>
                                    <button onClick={handleFinishMatch} className="bg-yellow-500 text-black px-10 py-4 rounded-full font-bold text-xl">Return to Dashboard</button>
                                </div>
                            )}
                        </div>
                    </div>

                    {/* CONTROLS */}
                    <div className={`h-40 border-t p-4 relative z-20 transition-colors duration-300 ${isDarkMode ? 'bg-slate-800 border-slate-700' : 'bg-white border-gray-200'}`}>
                         {(workflowStep === 'RALLY' || workflowStep === 'SERVING') ? (
                            <div className="max-w-6xl mx-auto flex items-stretch gap-4 h-full">
                                {/* Left Controls */}
                                <div className="flex-1 flex items-stretch gap-2">
                                    <button onClick={() => handlePoint(getLeftTeam().code)} disabled={workflowStep !== 'RALLY'} className={`flex-1 rounded-xl flex items-center justify-center px-6 border-b-4 active:border-b-0 active:mt-1 transition-all text-white disabled:opacity-50 disabled:cursor-not-allowed`} style={{ backgroundColor: getLeftTeam().bg, borderColor: 'rgba(0,0,0,0.2)' }}><span className="font-black text-3xl">POINT</span></button>
                                    <div className="flex flex-col gap-1 w-24">
                                        <button onClick={() => handleActionSelect(getLeftTeam().code, 'TIMEOUT')} disabled={timeouts[getLeftTeam().code] >= 2 || workflowStep === 'RALLY'} className={`flex-1 rounded text-xs font-bold border ${secondaryBtnClass}`}>TIMEOUT ({2 - timeouts[getLeftTeam().code]})</button>
                                        <button 
                                        onClick={() => Swal.fire('คำแนะนำ', 'กรุณาคลิกที่ผู้เล่นในสนาม ที่ต้องการเปลี่ยนตัวออก', 'info')}
                                        className={`flex-1 rounded text-xs font-bold text-blue-600 border ${secondaryBtnClass}`}
                                    >SUBS ({substitutions[getLeftTeam().code]}/6)</button>
                                        <button onClick={() => { setChallengeData({ team: getLeftTeam().code }); setShowChallengeModal(true); }} disabled={challenges[getLeftTeam().code] <= 0 || workflowStep === 'RALLY'} className={`flex-1 rounded text-xs font-bold text-yellow-600 border ${secondaryBtnClass}`}>CHALLENGE</button>
                                        <button onClick={() => { setSanctionTeam(getLeftTeam().code); setShowSanctionModal(true); }} disabled={workflowStep === 'RALLY'} className={`flex-1 rounded text-xs font-bold text-red-600 border ${secondaryBtnClass}`}>SANCTION</button>
                                    </div>
                                </div>

                                {/* Center Controls */}
                                <div className="w-48 flex flex-col items-center justify-center gap-2">
                                    {workflowStep === 'SERVING' ? (
                                        <button onClick={() => setWorkflowStep('RALLY')} className="w-full flex-1 bg-blue-600 hover:bg-blue-500 text-white rounded-2xl font-black text-2xl shadow-lg border-b-4 border-blue-800 active:border-b-0 active:mt-1 flex items-center justify-center gap-2">SERVE 🏐</button>
                                    ) : (
                                        <button onClick={() => setWorkflowStep('SERVING')} className="w-full flex-1 bg-yellow-500 hover:bg-yellow-400 text-black rounded-2xl font-bold text-xl shadow-lg border-b-4 border-yellow-700 active:border-b-0 active:mt-1 flex items-center justify-center gap-2">
                                            <X size={20} /> CANCEL
                                        </button>
                                    )}
                                    <div className="flex gap-2 w-full">
                                        <button onClick={handleUndo} disabled={workflowStep !== 'RALLY' && history.length === 0} className={`flex-1 rounded text-xs font-bold text-gray-500 py-2 border ${secondaryBtnClass}`}><RotateCcw size={14} className="mx-auto" /></button>
                                        <button onClick={() => setIsHomeLeft(!isHomeLeft)} className={`flex-1 rounded text-xs font-bold text-gray-500 py-2 border ${secondaryBtnClass}`}><ArrowRightLeft size={14} className="mx-auto" /></button>
                                    </div>
                                </div>

                                {/* Right Controls */}
                                <div className="flex-1 flex items-stretch gap-2">
                                    <div className="flex flex-col gap-1 w-24">
                                        <button onClick={() => handleActionSelect(getRightTeam().code, 'TIMEOUT')} disabled={timeouts[getRightTeam().code] >= 2 || workflowStep === 'RALLY'} className={`flex-1 rounded text-xs font-bold border ${secondaryBtnClass}`}>TIMEOUT ({2 - timeouts[getRightTeam().code]})</button>
                                        <button 
                                            onClick={() => Swal.fire('คำแนะนำ', 'กรุณาคลิกที่ผู้เล่นในสนาม ที่ต้องการเปลี่ยนตัวออก', 'info')}
                                            className={`flex-1 rounded text-xs font-bold text-blue-600 border ${secondaryBtnClass}`}
                                        >SUBS ({substitutions[getRightTeam().code]}/6)</button>
                                        <button onClick={() => { setChallengeData({ team: getRightTeam().code }); setShowChallengeModal(true); }} disabled={challenges[getRightTeam().code] <= 0 || workflowStep === 'RALLY'} className={`flex-1 rounded text-xs font-bold text-yellow-600 border ${secondaryBtnClass}`}>CHALLENGE</button>
                                        <button onClick={() => { setSanctionTeam(getRightTeam().code); setShowSanctionModal(true); }} disabled={workflowStep === 'RALLY'} className={`flex-1 rounded text-xs font-bold text-red-600 border ${secondaryBtnClass}`}>SANCTION</button>
                                    </div>
                                    <button onClick={() => handlePoint(getRightTeam().code)} disabled={workflowStep !== 'RALLY'} className={`flex-1 rounded-xl flex items-center justify-center px-6 border-b-4 active:border-b-0 active:mt-1 transition-all text-white disabled:opacity-50 disabled:cursor-not-allowed`} style={{ backgroundColor: getRightTeam().bg, borderColor: 'rgba(0,0,0,0.2)' }}><span className="font-black text-3xl">POINT</span></button>
                                </div>
                            </div>
                        ) : (
                            <div className="flex justify-center items-center h-full text-gray-400 italic">Controls locked</div>
                        )}
                    </div>
                </section>

                <aside className={`w-80 border-l hidden lg:flex flex-col z-10 shadow-xl transition-colors duration-300 ${isDarkMode ? 'bg-slate-800 border-slate-700' : 'bg-white border-gray-200'}`}>
                     <TeamInfoPanel team={getRightTeam()} align="right" isDarkMode={isDarkMode} onPlayerClick={handleCourtPlayerClick} />
                </aside>

                {/* NEW: Match History Sidebar */}
                <aside className={`w-80 ml-4 border-l hidden xl:flex flex-col z-10 shadow-xl transition-colors duration-300 ${isDarkMode ? 'bg-slate-800 border-slate-700' : 'bg-white border-gray-200'}`}>
                    <div className={`p-4 border-b font-bold flex items-center gap-2 shadow-sm transition-colors ${isDarkMode ? 'bg-slate-900 border-slate-700 text-gray-100' : 'bg-gray-50 border-gray-200 text-gray-800'}`}>
                        <History className="text-indigo-600" size={20} /> Match History
                    </div>
                    
                    {/* Tabs */}
                    <div className={`flex overflow-x-auto border-b ${isDarkMode ? 'border-slate-700 bg-slate-800' : 'border-gray-200 bg-gray-50'}`}>
                        {Array.from({ length: matchData.currentSet }, (_, i) => i + 1).map(setNum => (
                            <button
                                key={setNum}
                                onClick={() => setActiveHistoryTab(setNum)}
                                className={`flex-1 py-2 text-xs font-bold border-b-2 transition-colors whitespace-nowrap px-2 ${
                                    activeHistoryTab === setNum 
                                        ? 'border-indigo-500 text-indigo-600 bg-indigo-50/10' 
                                        : 'border-transparent text-gray-500 hover:text-gray-700'
                                }`}
                            >
                                Set {setNum}
                            </button>
                        ))}
                    </div>

                    <div className={`flex-1 overflow-y-auto p-0 transition-colors ${isDarkMode ? 'bg-slate-800' : 'bg-white'}`}>
                        {(() => {
                            const setEvents = matchEvents.filter(e => e.set === activeHistoryTab);
                            
                            // Calculate Stats
                            const stats = {
                                home: { timeouts: 0, challenges: 0, subs: 0 },
                                away: { timeouts: 0, challenges: 0, subs: 0 },
                                score: setEvents.length > 0 ? setEvents[0].score : '0-0'
                            };
                            
                            setEvents.forEach(ev => {
                                if (ev.metadata && ev.metadata.team) {
                                    const isHome = ev.metadata.team === matchData.teamHome;
                                    const target = isHome ? stats.home : stats.away;
                                    if (ev.metadata.type === 'TIMEOUT') target.timeouts++;
                                    if (ev.metadata.type === 'CHALLENGE') target.challenges++;
                                    if (ev.metadata.type === 'SUBSTITUTION') target.subs++;
                                }
                            });

                            return (
                                <>
                                    {/* Summary Box */}
                                    <div className={`border-b border-gray-200 dark:border-slate-700 ${isDarkMode ? 'bg-slate-800/50' : 'bg-white'}`}>
                                        <div className={`py-2 text-center border-b font-black text-xs ${isDarkMode ? 'border-slate-700 text-gray-200' : 'border-gray-200 text-gray-800'}`}>
                                            END SET {activeHistoryTab} <span className="text-gray-400 font-medium">- {setEvents.length > 0 ? setEvents[0].time : '--:--'}</span>
                                        </div>
                                        <div className="flex items-center justify-between p-2">
                                            {/* Home Stats */}
                                            <div className="flex items-center gap-1.5">
                                                <div className="flex items-center gap-1 font-bold text-sm">
                                                    <Timer className="text-yellow-500" size={16} strokeWidth={2.5} /> <span className={isDarkMode ? 'text-gray-200' : 'text-gray-800'}>{stats.home.timeouts}</span>
                                                </div>
                                                <div className="w-px h-4 bg-gray-200 dark:bg-gray-700 mx-0.5"></div>
                                                <div className="flex items-center gap-1 font-bold text-sm">
                                                    <Video className="text-yellow-500" size={16} strokeWidth={2.5} /> <span className={isDarkMode ? 'text-gray-200' : 'text-gray-800'}>{stats.home.challenges}</span>
                                                </div>
                                                <div className="w-px h-4 bg-gray-200 dark:bg-gray-700 mx-0.5"></div>
                                                <div className="flex items-center gap-0.5 font-bold text-sm">
                                                    <div className="flex -space-x-1 shrink-0">
                                                        <ArrowDown className="text-red-500" size={14} strokeWidth={3} />
                                                        <ArrowUp className="text-green-500" size={14} strokeWidth={3} />
                                                    </div> 
                                                    <span className={`ml-0.5 ${isDarkMode ? 'text-gray-200' : 'text-gray-800'}`}>{stats.home.subs}</span>
                                                </div>
                                            </div>

                                            {/* Score */}
                                            <div className={`flex items-center justify-center gap-1 px-2 py-1 rounded-md min-w-[60px] mx-1 ${isDarkMode ? 'bg-slate-700/50' : 'bg-slate-50'}`}>
                                                <span 
                                                    className={`font-bold text-base px-1.5 rounded border shadow-sm ${isDarkMode ? 'bg-slate-600 border-slate-500' : 'bg-white border-gray-200'}`}
                                                    style={{ color: teamColors.home }}
                                                >
                                                    {stats.score.split('-')[0] || 0}
                                                </span>
                                                <span className={`font-bold text-gray-400 text-sm`}>:</span>
                                                <span 
                                                    className={`font-bold text-base px-1.5 rounded border shadow-sm ${isDarkMode ? 'bg-slate-600 border-slate-500' : 'bg-white border-gray-200'}`}
                                                    style={{ color: teamColors.away }}
                                                >
                                                    {stats.score.split('-')[1] || 0}
                                                </span>
                                            </div>

                                            {/* Away Stats */}
                                            <div className="flex items-center gap-1.5">
                                                <div className="flex items-center gap-1 font-bold text-sm">
                                                    <Timer className="text-blue-500" size={16} strokeWidth={2.5} /> <span className={isDarkMode ? 'text-gray-200' : 'text-gray-800'}>{stats.away.timeouts}</span>
                                                </div>
                                                <div className="w-px h-4 bg-gray-200 dark:bg-gray-700 mx-0.5"></div>
                                                <div className="flex items-center gap-1 font-bold text-sm">
                                                    <Video className="text-blue-500" size={16} strokeWidth={2.5} /> <span className={isDarkMode ? 'text-gray-200' : 'text-gray-800'}>{stats.away.challenges}</span>
                                                </div>
                                                <div className="w-px h-4 bg-gray-200 dark:bg-gray-700 mx-0.5"></div>
                                                <div className="flex items-center gap-0.5 font-bold text-sm">
                                                    <div className="flex -space-x-1 shrink-0">
                                                        <ArrowDown className="text-red-500" size={14} strokeWidth={3} />
                                                        <ArrowUp className="text-green-500" size={14} strokeWidth={3} />
                                                    </div> 
                                                    <span className={`ml-0.5 ${isDarkMode ? 'text-gray-200' : 'text-gray-800'}`}>{stats.away.subs}</span>
                                                </div>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Events List */}
                                    {setEvents.length === 0 ? (
                                        <div className="flex flex-col items-center justify-center h-40 text-gray-400 text-sm italic">
                                            <FileText size={32} className="mb-2 opacity-20"/>
                                            No events recorded
                                        </div>
                                    ) : (
                                        <div className="p-2 space-y-2">
                                            {setEvents.map((ev) => {
                                                const isHome = ev.metadata?.team === matchData.teamHome;
                                                const isAway = ev.metadata?.team === matchData.teamAway;
                                                let borderColor = 'border-gray-200 dark:border-gray-700';
                                                if (isHome) borderColor = 'border-indigo-500';
                                                else if (isAway) borderColor = 'border-rose-500';

                                                const [homeScore, awayScore] = ev.score.split('-');

                                                return (
                                                    <div key={ev.id} className={`p-2 rounded-md border-l-4 ${borderColor} shadow-sm transition-colors ${isDarkMode ? 'bg-slate-700/40' : 'bg-white'}`}>
                                                        <div className="flex items-center justify-between gap-2">
                                                            {/* Left side: Score + Description */}
                                                            <div className="flex items-center gap-3">
                                                                {/* Score */}
                                                                <div className="flex items-center gap-1 font-mono font-bold text-base">
                                                                    <span className={`px-2 py-0.5 rounded ${isDarkMode ? 'bg-indigo-900/50 text-indigo-300' : 'bg-indigo-100 text-indigo-700'}`}>{homeScore}</span>
                                                                    <span className={`${isDarkMode ? 'text-gray-500' : 'text-gray-400'}`}>:</span>
                                                                    <span className={`px-2 py-0.5 rounded ${isDarkMode ? 'bg-rose-900/50 text-rose-300' : 'bg-rose-100 text-rose-700'}`}>{awayScore}</span>
                                                                </div>
                                                                {/* Description */}
                                                                <div className={`text-xs font-semibold ${isDarkMode ? 'text-gray-200' : 'text-gray-800'}`}>
                                                                    {ev.metadata && (ev.metadata.type === 'SUBSTITUTION' || ev.metadata.type === 'LIBERO') ? (
                                                                        <div className="flex flex-wrap gap-1 items-center">
                                                                            <span className="text-green-600 dark:text-green-400">IN {ev.metadata.in}</span>
                                                                            <span className="text-gray-400">/</span>
                                                                            <span className="text-red-600 dark:text-red-400">OUT {ev.metadata.out}</span>
                                                                            {ev.metadata.type === 'LIBERO' && <span className="text-[9px] bg-blue-100 text-blue-800 px-1 rounded ml-1">Libero</span>}
                                                                        </div>
                                                                    ) : (
                                                                        ev.description
                                                                    )}
                                                                </div>
                                                            </div>
                                                            {/* Right side: Time */}
                                                            <div className={`text-[10px] font-bold text-gray-400 flex items-center gap-1 shrink-0`}>
                                                                <Clock size={10}/> {ev.time}
                                                            </div>
                                                        </div>
                                                    </div>
                                                );
                                            })}
                                        </div>
                                    )}
                                </>
                            );
                        })()}
                    </div>
                </aside>
            </main>

            {/* --- MODALS ZONE --- */}
            <PlayerPicker 
                isOpen={showPlayerPicker}
                onClose={() => setShowPlayerPicker(false)}
                teamName={pickerContext.team === 'home' ? matchData.teamHome : matchData.teamAway}
                roster={pickerContext.team === 'home' ? homeRoster : awayRoster}
                lineup={pickerContext.team === 'home' ? homeLineup : awayLineup}
                liberos={pickerContext.team === 'home' ? homeLiberos : awayLiberos}
                onSelect={handlePlayerSelect}
                context={pickerContext}
            />

            <LineupModal
                isOpen={showLineupModal}
                onClose={() => setShowLineupModal(false)}
                teamHome={matchData.teamHome}
                teamAway={matchData.teamAway}
                homeLineup={homeLineup}
                awayLineup={awayLineup}
                homeLiberos={homeLiberos}
                awayLiberos={awayLiberos}
                onSlotClick={openPickerForLineup}
                onConfirm={handleLineupConfirm}
            />

            <MatchLogModal 
                isOpen={showMatchLogModal}
                onClose={() => setShowMatchLogModal(false)}
                events={matchEvents}
            />

            <SubstitutionModal 
                isOpen={subData.isOpen}
                onClose={() => setSubData({ isOpen: false, team: null, posIndex: null, playerOut: null })}
                teamName={subData.team === 'home' ? matchData.teamHome : matchData.teamAway}
                roster={subData.team === 'home' ? homeRoster : awayRoster}
                currentLineup={subData.team === 'home' ? homeLineup : awayLineup}
                playerOut={subData.playerOut}
                posIndex={subData.posIndex}
                subTracker={subData.team ? subTracker[subData.team] : null}
                liberoTracker={subData.team ? liberoTracker[subData.team] : null}
                disqualifiedPlayers={disqualifiedPlayers} // ✅ เพิ่ม Prop นี้
                onConfirm={handleSubstitutionConfirm}
            />

            <SanctionModal 
                isOpen={showSanctionModal}
                onClose={() => setShowSanctionModal(false)}
                teamName={sanctionTeam === 'home' ? matchData.teamHome : matchData.teamAway}
                roster={sanctionTeam === 'home' ? homeRoster : awayRoster}
                onConfirm={handleSanctionConfirm}
            />

            <ChallengeModal 
                isOpen={showChallengeModal}
                onClose={() => setShowChallengeModal(false)}
                teamName={challengeData.team === 'home' ? matchData.teamHome : matchData.teamAway}
                remaining={challengeData.team ? challenges[challengeData.team] : 0}
                onConfirm={handleChallengeSelect}
            />

            <TimeoutModal 
                isOpen={showTimeoutModal}
                onClose={handleActionCancel}
                teamName={activeAction.team === 'home' ? matchData.teamHome : matchData.teamAway}
                used={activeAction.team ? timeouts[activeAction.team] : 0}
                limit={2}
                onConfirm={handleActionConfirm}
            />

            <TimeoutTimerModal 
                isOpen={showTimeoutTimer}
                onClose={() => {
                    setShowTimeoutTimer(false);
                    setTimeoutStartTime(null);
                }}
                startTime={timeoutStartTime}
            />

            <LiberoModal 
                isOpen={liberoActionData.isOpen}
                onClose={() => setLiberoActionData({ isOpen: false, team: null })}
                teamName={liberoActionData.team === 'home' ? matchData.teamHome : matchData.teamAway}
                lineup={liberoActionData.team === 'home' ? homeLineup : awayLineup}
                liberos={liberoActionData.team === 'home' ? homeLiberos : awayLiberos}
                tracker={liberoActionData.team ? liberoTracker[liberoActionData.team] : {}}
                disqualifiedPlayers={disqualifiedPlayers}
                onConfirm={handleLiberoConfirm}
            />
        </div>
    );
}