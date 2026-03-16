import React, { useState, useEffect, useRef } from 'react';
import { useLocation, useParams, useNavigate } from 'react-router-dom';
import {
    ArrowRightLeft, Users, ListChecks, CheckCircle, Shield, X, PlayCircle, Loader,
    Trophy, RotateCcw, Flag, Clock, RefreshCcw, History, FileText, AlertTriangle, Repeat,
    Moon, Sun, Timer, Video, ArrowUpDown, ArrowDown, ArrowUp, Pause
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
        } catch {
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

    // Limits & Quotas

    // Modals Control State
    const [showLineupModal, setShowLineupModal] = useState(false);
    const [showMatchLogModal, setShowMatchLogModal] = useState(false);

    const [showPlayerPicker, setShowPlayerPicker] = useState(false);
    const [pickerContext, setPickerContext] = useState({ team: 'home', posIndex: null });


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

    const [subTracker, setSubTracker] = useState(() => {
        const saved = localStorage.getItem(`match_${matchId}_subTracker`);
        return saved ? JSON.parse(saved) : {
            home: { count: 0, positions: {}, usedPlayers: [] },
            away: { count: 0, positions: {}, usedPlayers: [] }
        };
    });
    const [lastLiberoSwap, setLastLiberoSwap] = useState(() => loadState('lastLiberoSwap', null));

    const [activeHistoryTab, setActiveHistoryTab] = useState(1);

    // --- BUTTON CLASS HELPER ---

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
                homeLiberoSwaps, awayLiberoSwaps, showTimeoutTimer, timeoutStartTime, subTracker
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
                subTracker, // ✅ เพิ่มการส่งค่าไปยัง Server
            };
            api.updateLiveState(matchId, liveStateForServer).catch(err => {
                console.error("Failed to sync state to server:", err);
            });
        }, 500); // 500ms debounce delay

        return () => {
            clearTimeout(debounceTimeoutRef.current);
        };
    }, [matchId, matchData, workflowStep, score, setsWon, completedSets, activeAction, timeouts, challenges, substitutions, matchEvents, servingTeam, isHomeLeft, homeRoster, awayRoster, homeLineup, awayLineup, homeLiberos, awayLiberos, history, setsToWin, matchDuration, isTimerRunning, homeLiberoSwaps, awayLiberoSwaps, lastLiberoSwap, teamColors, showTimeoutTimer, timeoutStartTime, subTracker]);

    // เก็บ ID ผู้เล่นที่ถูกเปลี่ยนตัวออกด้วยกรณีพิเศษ (บาดเจ็บ/ให้ออก) ห้ามลงเล่นทั้งนัด
    const [disqualifiedPlayers, setDisqualifiedPlayers] = useState(() => {
        const saved = localStorage.getItem(`match_${matchId}_disqualified`);
        return saved ? JSON.parse(saved) : { home: [], away: [] };
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

    useEffect(() => {
        localStorage.setItem(`match_${matchId}_subTracker`, JSON.stringify(subTracker));
    }, [subTracker, matchId]);



    // --- LOAD DATA ---
    useEffect(() => {
        const fetchMatchData = async () => {
    try {
        setIsLoading(true);
        let currentMatch = matchData;

        // ✅ 1. ยิง API ดึงข้อมูลแมตช์เสมอ เพื่อเอา max_sets ที่ถูกต้องชัวร์ๆ
        const resMatch = await api.getMatchById(matchId);
        const m = resMatch.data;
        
        // คำนวณระบบการแข่งขัน (เช่น 3/2 = 2, 5/2 = 3)
        const maxSets = m.max_sets || 5;
        const calculatedSetsToWin = Math.ceil(maxSets / 2);
        
        currentMatch = {
            ...matchData,
            teamHome: m.home_team_name || matchData.teamHome,
            teamAway: m.away_team_name || matchData.teamAway,
            teamHomeId: m.home_team_id || matchData.teamHomeId,
            teamAwayId: m.away_team_id || matchData.teamAwayId,
            currentSet: m.current_set || matchData.currentSet || 1,
            maxSets: maxSets
        };
        
        setMatchData(currentMatch);
        setSetsToWin(calculatedSetsToWin); // ✅ อัปเดต setsToWin เสมอ

        // ✅ 2. ดึงรายชื่อผู้เล่นเมื่อได้ ID ทีมมาแล้ว
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

        if (eventType === 'POINT') {
            description = `Point ${teamName}`;
            metadata = { type: 'POINT', team: teamName };
        }
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

        // ✅ 2. หมุนตำแหน่งใน Substitution Tracker (subTracker)
        setSubTracker(prev => {
            const teamTracker = prev[teamCode];
            const newPositions = {};
            Object.keys(teamTracker.positions).forEach(idx => {
                const i = parseInt(idx);
                const newIdx = i === 0 ? 5 : i - 1;
                newPositions[newIdx] = teamTracker.positions[i];
            });
            return {
                ...prev,
                [teamCode]: { ...teamTracker, positions: newPositions }
            };
        });

        // ✅ 3. หมุนตำแหน่งใน Libero Tracker (กรณี Libero อยู่ในสนาม)
        setLiberoTracker(prev => {
            const teamLib = prev[teamCode];
            if (teamLib.onCourt && teamLib.posIndex !== null) {
                const newIdx = teamLib.posIndex === 0 ? 5 : teamLib.posIndex - 1;
                return {
                    ...prev,
                    [teamCode]: { ...teamLib, posIndex: newIdx }
                };
            }
            return prev;
        });

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

    const finishSet = async (winnerCode, finalScore) => {
    try {
        const response = await api.endSet(matchId, {
            setNumber: matchData.currentSet,
            homeScore: finalScore.home,
            awayScore: finalScore.away,
            duration: Math.ceil(matchDuration / 60)
        });

        if (response.data.success) {
            // 1. ดึงข้อมูลจาก backend (แก้ชื่อให้ตรงเผื่อไว้ด้วย)

            // 2. คำนวณจำนวนเซตล่าสุดจากฝั่ง Frontend เอง (ปลอดภัยที่สุด)
            const newSetsWon = {
                home: winnerCode === 'home' ? setsWon.home + 1 : setsWon.home,
                away: winnerCode === 'away' ? setsWon.away + 1 : setsWon.away
            };

            setSetsWon(newSetsWon);
            setCompletedSets(prev => [...prev, {
                set: matchData.currentSet,
                home: finalScore.home,
                away: finalScore.away,
                winner: winnerCode
            }]);

            // 🚨 3. เช็คการจบแมตช์จาก setsToWin ของ Frontend เลย (ชัวร์ 100%)
            // ถ้าฝ่ายใดฝ่ายหนึ่งได้เซต >= ที่กำหนดไว้ (เช่น ได้ 2 เซต) ให้จบแมตช์ทันที
            if (newSetsWon.home >= setsToWin || newSetsWon.away >= setsToWin) {
                setWorkflowStep('MATCH_FINISHED');
                setIsTimerRunning(false);
                // ถ้าคุณมีฟังก์ชันเรียกหน้าต่างสรุปผล ก็สามารถใส่ไว้ตรงนี้ได้ครับ
            } else {
                // ถ้าเซตยังไม่ครบ ถึงให้เริ่มตั้งค่าเซตถัดไป
                setWorkflowStep('SET_FINISHED');
            }
        }
    } catch (error) {
        console.error("Error ending set:", error);
        Swal.fire('Error', 'ไม่สามารถบันทึกผลเซตลงฐานข้อมูลได้ กรุณาลองใหม่อีกครั้ง', 'error');
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

        const isTieBreak = (setsWon?.home === setsToWin - 1) && (setsWon.away === setsToWin - 1);
        setMatchData(prev => ({ ...prev, currentSet: nextSetNumber }));

        if (!isTieBreak) setIsHomeLeft(prev => !prev);

        // Auto-fill from last set if available, otherwise clear
        setHomeLineup(lastSetHomeLineup ? [...lastSetHomeLineup] : Array(6).fill(null));
        setHomeLiberos(lastSetHomeLiberos ? { ...lastSetHomeLiberos } : { l1: null, l2: null });

        setAwayLineup(lastSetAwayLineup ? [...lastSetAwayLineup] : Array(6).fill(null));
        setAwayLiberos(lastSetAwayLiberos ? { ...lastSetAwayLiberos } : { l1: null, l2: null });

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
    // 1. เรียกแสดง Popup สรุปผลและยืนยันการจบการแข่งขัน
    Swal.fire({
        title: 'จบการแข่งขันสมบูรณ์!',
        html: `
            <p>สรุปผลเซต: <b>${matchData.teamHome}</b> ${setsWon?.home || 0} - ${setsWon?.away || 0} <b>${matchData.teamAway}</b></p>
            <p style="font-size: 0.9em; color: gray;">คุณต้องการออกจากหน้านี้และกลับสู่หน้าหลักใช่หรือไม่?<br/>(ระบบจะทำการล้างข้อมูลแคชชั่วคราวของแมตช์นี้)</p>
        `,
        icon: 'success',
        showCancelButton: true,
        confirmButtonColor: '#3085d6',
        cancelButtonColor: '#d33',
        confirmButtonText: 'ตกลง, กลับสู่หน้าหลัก',
        cancelButtonText: 'ยกเลิก'
    }).then((result) => {
        if (result.isConfirmed) {
            
            // 2. ล้างข้อมูล LocalStorage เฉพาะของแมตช์นี้ (ป้องกันขยะตกค้างและบั๊กในอนาคต)
            const keysToClear = [
                'matchData', 'workflowStep', 'score', 'setsWon', 'completedSets',
                'timeouts', 'challenges', 'substitutions', 'matchEvents', 'servingTeam',
                'isHomeLeft', 'homeRoster', 'awayRoster', 'homeLineup', 'awayLineup',
                'homeLiberos', 'awayLiberos', 'history', 'setsToWin', 'matchDuration',
                'isTimerRunning', 'lastLiberoSwap', 'teamColors', 'homeLiberoSwaps',
                'awayLiberoSwaps', 'liberoTracker', 'disqualified'
            ];

            keysToClear.forEach(key => {
                localStorage.removeItem(`match_${matchId}_${key}`);
            });

            // 3. เปลี่ยนหน้ากลับไปที่ Admin
            navigate('/admin');
        }
    });
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
        setLastSetHomeLiberos({ ...homeLiberos });
        setLastSetAwayLiberos({ ...awayLiberos });

        // Add Lineup to Match Events history
        const homeNumbers = homeLineup.map(p => p.number).join(', ');
        const awayNumbers = awayLineup.map(p => p.number).join(', ');
        
        setMatchEvents(prev => [{
            id: Date.now(),
            set: matchData.currentSet,
            score: `${score.home}-${score.away}`,
            description: `Lineup Confirmed - ${matchData.teamHome}: [${homeNumbers}] | ${matchData.teamAway}: [${awayNumbers}]`,
            metadata: { type: 'LINEUP_CONFIRM' },
            time: new Date().toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' })
        }, ...prev]);

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

        const roster = team === 'home' ? homeRoster : awayRoster;
        const setLineup = team === 'home' ? setHomeLineup : setAwayLineup;
        const currentLineup = team === 'home' ? homeLineup : awayLineup;
        
        // All players default to not being captains during this phase
        let newLineup = [...currentLineup];
        let newPlayer = { ...player, isCaptain: false };

        newLineup[posIndex] = newPlayer;
        setLineup(newLineup);
        setShowPlayerPicker(false);
    };

    const handleSanction = (player, cardType) => {
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

    const handleChallengeSelect = (result) => {
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

        // ==========================================
        // 🌟 NEW LOGIC: เช็คกัปตันทีมในสนาม
        // ==========================================
        // Removed Court Captain logic and prompts
        // ==========================================
        // สิ้นสุดส่วนที่เพิ่มใหม่
        // ==========================================

        if (playerOut.isLibero) {
            Swal.fire({
                icon: 'error',
                title: 'ผิดกติกา FIVB',
                text: 'ไม่สามารถทำ "การเปลี่ยนตัวปกติ" กับตัวรับอิสระได้ กรุณาใช้ปุ่ม [เปลี่ยน Libero] ด้านล่างสนาม เพื่อให้ผู้เล่นตัวจริงกลับเข้ามาก่อน'
            });
            return;
        }

        const currentLiberos = actualTeamCode === 'home' ? homeLiberos : awayLiberos;
        const pOutId = playerOut.id || playerOut.player_id;
        const isLiberoOnCourt = playerOut.isLibero || 
                                (currentLiberos.l1 && (currentLiberos.l1.id == pOutId || currentLiberos.l1.player_id == pOutId)) || 
                                (currentLiberos.l2 && (currentLiberos.l2.id == pOutId || currentLiberos.l2.player_id == pOutId));
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
        const posData = tracker.positions[posIndex]; // ดูประวัติการเปลี่ยนตัวในตำแหน่งนี้

        // เช็ค 1: ตำแหน่งนี้เปลี่ยนตัวคู่ครบแล้วหรือยัง? (ตัวจริงกลับเข้าสนามแล้ว = ห้ามเปลี่ยนอีก)
        if (posData && posData.returned) {
            Swal.fire("ผิดกติกา FIVB", "ตำแหน่งนี้มีการเปลี่ยนตัวกลับครบโควต้าแล้ว (ผู้เล่นตัวจริงกลับเข้าสนามแล้ว) ไม่สามารถเปลี่ยนตัวได้อีกในเซตนี้", "error");
            return;
        }

        // เช็ค 2: โควต้ารวมทีมครบ 6 ครั้งหรือยัง?
        if (tracker.count >= 6) {
            Swal.fire("หมดโควต้า", "ทีมนี้ใช้สิทธิ์เปลี่ยนตัวครบ 6 ครั้งในเซตนี้แล้ว", "warning");
            return;
        }

        // 🌟 NEW LOGIC: หากลุ่มนักกีฬาที่ "สามารถเปลี่ยนตัวลงมาได้" ตามกฎการจับคู่
        const roster = actualTeamCode === 'home' ? homeRoster : awayRoster;
        const currentLineupIds = lineup.map(p => p?.id || p?.player_id);
        let validSubs = [];

        if (!posData) {
            // กรณียังไม่เคยเปลี่ยนตัวในตำแหน่งนี้: เลือกใครก็ได้ในคอกสำรอง ที่ "ยังไม่เคยลงสนามในตำแหน่งอื่น" ในเซตนี้
            const usedIds = tracker.usedPlayers || [];
            validSubs = roster.filter(p => {
                const pId = p.id || p.player_id;
                return !currentLineupIds.some(cId => cId == pId) && 
                       !usedIds.some(uId => uId == pId) && 
                       !p.isLibero;
            });
        } else {
            // กรณีเคยเปลี่ยนตัวไปแล้ว (สำรองอยู่ในสนาม): บังคับเลือกได้แค่ "ผู้เล่นตัวจริง (Starter)" คนเดิมคนเดียวเท่านั้น
            validSubs = roster.filter(p => {
                const pId = p.id || p.player_id;
                return pId == posData.starterId;
            });
        }

        if (validSubs.length === 0) {
            Swal.fire("ไม่มีผู้เล่น", "ไม่มีผู้เล่นสำรองที่สามารถเปลี่ยนตัวลงมาได้ตามกติกา", "warning");
            return;
        }

        // อัปเดต State พร้อมส่ง validSubs ไปให้ Modal ใช้งาน
        setSubData({
            isOpen: true,
            team: actualTeamCode,
            posIndex: posIndex,
            playerOut,
            validSubs // 👈 เพิ่มตัวแปรนี้เข้าไป เพื่อให้ Modal เอาไปแสดงผล
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

            // กรณีปกติ (Normal Substitution) - อัปเดต Tracker
            setSubTracker(prev => {
                const newTracker = { ...prev };
                const teamTracker = { 
                    ...newTracker[team],
                    positions: { ...newTracker[team].positions },
                    usedPlayers: [...newTracker[team].usedPlayers]
                };
                
                const posData = teamTracker.positions[posIndex];
                const pInId = playerIn.id || playerIn.player_id;
                const pOutId = playerOut.id || playerOut.player_id || playerOut; // Handle if playerOut is primitive

                teamTracker.count += 1;

                if (posData) {
                    // เปลี่ยนตัวกลับ -> สลับกลับเข้าที่เดิม ล็อกตำแหน่ง
                    teamTracker.positions[posIndex] = { ...posData, currentOnCourt: pInId, returned: true };
                } else {
                    // เปลี่ยนตัวครั้งแรก -> จดจำว่าใครคือตัวจริง ใครคือตัวสำรอง
                    teamTracker.positions[posIndex] = { starterId: pOutId, subId: pInId, currentOnCourt: pInId, returned: false };
                    teamTracker.usedPlayers.push(pInId);
                    teamTracker.usedPlayers.push(pOutId);
                }
                newTracker[team] = teamTracker;
                return newTracker;
            });
        }

        // --- 2. อัปเดต Lineup บนหน้าจอ พร้อม LOGIC กัปตันทีม (Captain & Court Captain) ---
        const roster = team === 'home' ? homeRoster : awayRoster;
        const realCaptain = roster.find(p => p.isCaptain);
        const currentLineup = team === 'home' ? homeLineup : awayLineup;
        const setLineup = team === 'home' ? setHomeLineup : setAwayLineup;

        let newLineup = [...currentLineup];
        // จับผู้เล่นใหม่ใส่ลงสนามไปก่อน (และริบ C ออกไว้ก่อนเผื่อพกติดมา)
        newLineup[posIndex] = { ...playerIn, isCaptain: false };

        const realCaptainIdx = newLineup.findIndex(p => p && realCaptain && (p.id === realCaptain.id || p.player_id === realCaptain.player_id));
        if (realCaptainIdx !== -1) {
            newLineup = newLineup.map((p, idx) => {
                if (!p) return p;
                return { ...p, isCaptain: (idx === realCaptainIdx) };
            });
        }
        setLineup(newLineup);

        // --- 3. จัดการการตัดสิทธิ์ (Disqualify) หากเป็นกรณีพิเศษ ---
        if (isExceptional) {
            const pOutId = playerOut.id || playerOut.player_id || playerOut;
            setDisqualifiedPlayers(prev => ({
                ...prev,
                [team]: [...prev[team], pOutId]
            }));
        }

        // --- 4. บันทึกประวัติลง Database ---
        // แนบ Flag isExceptional ไปให้ระบบหลังบ้านรู้ด้วย (เผื่อไปใช้ตอนปริ้นท์ใบบันทึกคะแนน)
        await saveEventToBackend('SUBSTITUTION', team, {
            player_id: playerIn.id || playerIn.player_id,
            details: { 
                out: playerOut.id || playerOut.player_id || playerOut, 
                isExceptional 
            }
        });

        setSubData({ isOpen: false, team: null, posIndex: null, playerOut: null });
    };


    if (isLoading) return (
        <div className="h-screen bg-slate-50 flex flex-col items-center justify-center gap-4">
            <div className="w-16 h-16 border-4 border-slate-200 border-t-indigo-600 rounded-full animate-spin"></div>
            <p className="text-slate-400 font-bold animate-pulse uppercase tracking-widest text-sm">Loading Console...</p>
        </div>
    );

    const isSetupPhase = ['ROSTER_CHECK', 'SERVER_SELECT', 'LINEUP_SELECT'].includes(workflowStep);
    const leftTeam = getLeftTeam();
    const rightTeam = getRightTeam();

    return (
        <div className="h-screen flex flex-col bg-slate-50 text-slate-900 font-sans overflow-hidden">
            {/* --- HEADER --- */}
            <header className="h-16 bg-white border-b border-slate-200 flex items-center justify-between px-6 shrink-0 z-20 shadow-sm">
                <div className="flex items-center gap-4">
                    <div className="bg-indigo-600 p-2 rounded-xl text-white shadow-indigo-200 shadow-lg">
                        <Trophy size={20} />
                    </div>
                    <div>
                        <h1 className="font-black text-xl tracking-tight text-slate-800 uppercase flex items-center gap-2">
                            Scorer Console
                            <span className="text-[10px] bg-indigo-100 text-indigo-700 px-2 py-0.5 rounded-full font-bold">LIVE</span>
                        </h1>
                        <div className="flex items-center gap-2 text-xs text-slate-500 font-medium">
                            <span>Volleyball MS</span>
                            <span className="w-1 h-1 bg-slate-300 rounded-full"></span>
                            <span>SET {matchData.currentSet}</span>
                        </div>
                    </div>
                </div>

                <div className="flex items-center gap-3">
                    <div className="flex bg-slate-100 p-1 rounded-xl">
                        <button onClick={() => setShowMatchLogModal(true)} className="p-2.5 rounded-lg text-slate-600 hover:bg-white hover:shadow-sm transition-all" title="Match Log"><ListChecks size={20} /></button>
                        <button onClick={() => navigate('/admin')} className="p-2.5 rounded-lg text-slate-600 hover:bg-white hover:shadow-sm transition-all" title="Exit"><X size={20} /></button>
                    </div>
                </div>
            </header>

            <main className="flex-1 flex overflow-hidden p-4 gap-4">
                {/* Left Sidebar */}
                <aside className="w-80 bg-white/80 backdrop-blur-xl border border-slate-200 rounded-2xl hidden lg:flex flex-col z-10 shadow-sm overflow-hidden">
                    <TeamInfoPanel team={leftTeam} align="left" onPlayerClick={handleCourtPlayerClick} />
                </aside>

                {/* CENTER: COURT & SCORE */}
                <section className="flex-1 flex flex-col gap-3 overflow-hidden min-w-[600px]">
                    {/* NEW: TOP INFO STRIP */}
                    <div className="bg-white/80 backdrop-blur-md border border-slate-200 rounded-2xl p-3 flex items-center justify-between shadow-sm shrink-0">
                        {/* Left Team Info */}
                        <div className="flex-1 flex items-center gap-4">
                            <div className="flex flex-col items-start">
                                <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest leading-none mb-1">SET WON</span>
                                <div className="flex gap-1">
                                    {Array.from({ length: setsToWin }).map((_, i) => (
                                        <div key={i} className={`w-3 h-3 rounded-sm border ${i < leftTeam.sets ? 'bg-indigo-600 border-indigo-400 shadow-sm' : 'bg-slate-100 border-slate-200'}`}></div>
                                    ))}
                                </div>
                            </div>
                            <div className="flex flex-col">
                                <span className="text-sm font-black text-slate-800 uppercase truncate max-w-[120px]">{leftTeam.name}</span>
                                {servingTeam === leftTeam.code && <div className="flex items-center gap-1 text-[10px] text-indigo-600 font-bold"><ArrowUpDown size={10} className="rotate-90"/> SERVING</div>}
                            </div>
                        </div>

                        {/* Central BIG Score */}
                        <div className="flex items-center gap-8 px-6 py-1 bg-slate-50 rounded-2xl border border-slate-100 shadow-inner">
                            <span className="text-5xl font-black tabular-nums tracking-tighter" style={{ color: leftTeam.color }}>{leftTeam.score}</span>
                            <div className="flex flex-col items-center gap-0.5">
                                <div className="bg-indigo-600 px-3 py-0.5 rounded-full text-white text-[10px] font-black shadow-sm">SET {matchData.currentSet}</div>
                                <div className="flex items-center gap-1 text-[10px] font-mono font-bold text-slate-400 uppercase">
                                    <Clock size={10} />
                                    {Math.floor(matchDuration / 60)}:{(matchDuration % 60).toString().padStart(2, '0')}
                                </div>
                            </div>
                            <span className="text-5xl font-black tabular-nums tracking-tighter" style={{ color: rightTeam.color }}>{rightTeam.score}</span>
                        </div>

                        {/* Right Team Info */}
                        <div className="flex-1 flex items-center justify-end gap-4">
                            <div className="flex flex-col items-end">
                                <span className="text-sm font-black text-slate-800 uppercase truncate max-w-[120px]">{rightTeam.name}</span>
                                {servingTeam === rightTeam.code && <div className="flex items-center gap-1 text-[10px] text-indigo-600 font-bold">SERVING <ArrowUpDown size={10} className="-rotate-90"/></div>}
                            </div>
                            <div className="flex flex-col items-end">
                                <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest leading-none mb-1">SET WON</span>
                                <div className="flex gap-1">
                                    {Array.from({ length: setsToWin }).map((_, i) => (
                                        <div key={i} className={`w-3 h-3 rounded-sm border ${i < rightTeam.sets ? 'bg-rose-600 border-rose-400 shadow-sm' : 'bg-slate-100 border-slate-200'}`}></div>
                                    ))}
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* COURT VIEW */}
                    <div className="flex-1 relative bg-white/40 backdrop-blur-sm border border-slate-200 rounded-[2rem] shadow-inner overflow-hidden flex items-center justify-center p-1">
                        <div className="w-full h-full max-w-4xl max-h-[320px]">
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
                        </div>
                    </div>
                        {/* OVERLAYS */}
                        <div className="absolute inset-0 z-40 flex items-center justify-center pointer-events-none">
                            {workflowStep === 'ROSTER_CHECK' && (
                                <div className="pointer-events-auto">
                                    <PreMatchSetupModal
                                        isOpen={true}
                                        teamHome={matchData.teamHome} teamAway={matchData.teamAway}
                                        homeRoster={masterHomeRoster} awayRoster={masterAwayRoster}
                                        onConfirm={handleSetupConfirm}
                                    />
                                </div>
                            )}

                            {workflowStep === 'SERVER_SELECT' && (
                                <div className="fixed inset-0 z-[60] bg-gray-900/50 backdrop-blur-sm flex items-center justify-center pointer-events-auto">
                                    <div className="bg-white p-8 rounded-3xl border border-slate-200 max-w-2xl w-full text-center space-y-8 shadow-2xl">
                                        <h2 className="text-3xl font-bold flex items-center justify-center gap-3 text-slate-800"><ArrowRightLeft className="text-indigo-600" /> Coin Toss & Sides</h2>
                                        <div className="flex justify-around items-center px-4">
                                            <div className="flex flex-col items-center gap-2">
                                                <span className="font-bold text-slate-700">{matchData.teamHome} Color</span>
                                                <input type="color" value={teamColors.home} onChange={(e) => setTeamColors({ ...teamColors, home: e.target.value })} className="w-16 h-10 cursor-pointer rounded border border-slate-200 shadow-sm" />
                                            </div>
                                            <div className="flex flex-col items-center gap-2">
                                                <span className="font-bold text-slate-700">{matchData.teamAway} Color</span>
                                                <input type="color" value={teamColors.away} onChange={(e) => setTeamColors({ ...teamColors, away: e.target.value })} className="w-16 h-10 cursor-pointer rounded border border-slate-200 shadow-sm" />
                                            </div>
                                        </div>
                                        <div className="flex gap-4 h-32">
                                            <button onClick={() => setIsHomeLeft(true)} className={`flex-1 border-2 rounded-2xl flex items-center justify-center text-2xl font-black transition-all ${isHomeLeft ? 'border-indigo-500 bg-indigo-50 text-indigo-600 shadow-inner' : 'border-slate-100 bg-slate-50 text-slate-300'}`}>Left: {matchData.teamHome}</button>
                                            <div className="flex items-center"><RefreshCcw className="cursor-pointer hover:rotate-180 transition-transform text-slate-400" onClick={() => setIsHomeLeft(!isHomeLeft)} /></div>
                                            <button onClick={() => setIsHomeLeft(false)} className={`flex-1 border-2 rounded-2xl flex items-center justify-center text-2xl font-black transition-all ${!isHomeLeft ? 'border-indigo-500 bg-indigo-50 text-indigo-600 shadow-inner' : 'border-slate-100 bg-slate-50 text-slate-300'}`}>Left: {matchData.teamAway}</button>
                                        </div>
                                        <div className="grid grid-cols-2 gap-4">
                                            <button onClick={() => setServingTeam('home')} className={`p-4 border-2 rounded-2xl font-black transition-all ${servingTeam === 'home' ? 'bg-indigo-600 border-indigo-400 text-white shadow-lg' : 'bg-slate-50 border-slate-100 text-slate-400'}`}>{matchData.teamHome} Serves</button>
                                            <button onClick={() => setServingTeam('away')} className={`p-4 border-2 rounded-2xl font-black transition-all ${servingTeam === 'away' ? 'bg-rose-600 border-rose-400 text-white shadow-lg' : 'bg-slate-50 border-slate-100 text-slate-400'}`}>{matchData.teamAway} Serves</button>
                                        </div>
                                        <button onClick={() => servingTeam && setWorkflowStep('LINEUP_SELECT')} disabled={!servingTeam} className="w-full py-4 bg-indigo-600 hover:bg-black text-white rounded-2xl font-black text-xl disabled:opacity-30 shadow-lg transition-all">CONFIRM SETUP</button>
                                    </div>
                                </div>
                            )}

                            {workflowStep === 'LINEUP_SELECT' && (
                                <button onClick={() => setShowLineupModal(true)} className="pointer-events-auto animate-pulse bg-emerald-500 hover:bg-emerald-600 px-10 py-5 rounded-full text-2xl font-black text-white shadow-2xl border-4 border-white flex items-center gap-3 transition-transform hover:scale-105">
                                    <Users size={32} /> SET LINEUPS
                                </button>
                            )}

                            {workflowStep === 'READY' && (
                                <button onClick={handleStartMatch} className="pointer-events-auto animate-pulse bg-indigo-600 hover:bg-indigo-700 px-10 py-5 rounded-full text-2xl font-black text-white shadow-2xl border-4 border-white flex items-center gap-3 transition-transform hover:scale-105">
                                    <PlayCircle size={32} /> START MATCH
                                </button>
                            )}

                            {workflowStep === 'SET_FINISHED' && (
                                <div className="pointer-events-auto bg-white/95 p-10 rounded-3xl backdrop-blur-md border border-slate-200 text-center shadow-2xl max-w-lg">
                                    <h2 className="text-4xl font-black mb-4 text-indigo-600">SET {matchData.currentSet} FINISHED</h2>
                                    <div className="h-1 w-20 bg-indigo-100 mx-auto mb-6 rounded-full"></div>
                                    <p className="text-xl mb-8 text-slate-600 font-bold">Winner: <span className="text-indigo-600">{score.home > score.away ? matchData.teamHome : matchData.teamAway}</span></p>
                                    <button onClick={startNextSet} className="bg-indigo-600 text-white px-8 py-4 rounded-2xl font-black text-xl hover:bg-black transition-all shadow-lg active:scale-95">START SET {matchData.currentSet + 1}</button>
                                </div>
                            )}

                            {workflowStep === 'MATCH_FINISHED' && (
                                <div className="pointer-events-auto bg-white/95 p-12 rounded-[2.5rem] border border-slate-200 text-center shadow-2xl max-w-xl">
                                    <div className="bg-amber-100 w-24 h-24 flex items-center justify-center rounded-full mx-auto mb-6">
                                        <Trophy className="text-amber-500" size={56} />
                                    </div>
                                    <h2 className="text-5xl font-black text-slate-800 mb-2 italic">VICTORY!</h2>
                                    <p className="text-2xl font-bold text-slate-400 mb-8 uppercase tracking-widest">Match Completed</p>
                                    <div className="bg-slate-50 p-6 rounded-3xl mb-8 border border-slate-100">
                                        <p className="text-3xl font-black text-indigo-600">{setsWon.home > setsWon.away ? matchData.teamHome : matchData.teamAway}</p>
                                        <p className="text-slate-400 font-bold text-sm mt-1 uppercase">Match Winner</p>
                                    </div>
                                    <button onClick={handleFinishMatch} className="bg-indigo-600 text-white px-10 py-4 rounded-2xl font-black text-xl hover:bg-black transition-all shadow-lg active:scale-95">RETURN TO DASHBOARD</button>
                                </div>
                            )}
                        </div>

                    {/* CONTROLS & SCORE */}
                    <div className="h-56 bg-white/80 backdrop-blur-xl border border-slate-200 rounded-[2rem] shadow-xl p-5 flex flex-col shrink-0">
                        {workflowStep === 'RALLY' || workflowStep === 'SERVING' || workflowStep === 'SERVER_SELECT' ? (
                            <div className="flex-1 flex gap-6 items-center">
                                {/* Left Controls */}
                                <div className="flex-1 flex items-stretch gap-3">
                                    <button 
                                        onClick={() => {
                                            if (workflowStep === 'SERVING' && servingTeam === leftTeam.code) setWorkflowStep('RALLY');
                                            else handlePoint(leftTeam.code);
                                        }} 
                                        disabled={workflowStep !== 'RALLY' && !(workflowStep === 'SERVING' && servingTeam === leftTeam.code)} 
                                        className="flex-1 rounded-[1.5rem] flex items-center justify-center px-6 border-b-8 shadow-lg active:border-b-0 active:mt-1 transition-all text-white disabled:opacity-30 disabled:grayscale group" 
                                        style={{ backgroundColor: leftTeam.color, borderBottomColor: 'rgba(0,0,0,0.2)' }}
                                    >
                                        <span className="font-black text-4xl group-active:scale-95 transition-transform italic">
                                            {(workflowStep === 'SERVING' && servingTeam === leftTeam.code) ? 'SERVE' : 'POINT'}
                                        </span>
                                    </button>
                                    <div className="flex flex-col gap-1.5 w-24 shrink-0">
                                        <button onClick={() => handleActionSelect(leftTeam.code, 'TIMEOUT')} disabled={timeouts[leftTeam.code] >= 2 || workflowStep === 'RALLY'} className={`flex-1 rounded-xl text-[10px] font-black border border-slate-200 bg-white/50 backdrop-blur-sm hover:bg-white hover:shadow-md transition-all duration-200 text-slate-600 hover:text-indigo-600 disabled:opacity-30`}>TIMEOUT ({2 - timeouts[leftTeam.code]})</button>
                                        <button onClick={() => setSubData({ isOpen: true, team: leftTeam.code, posIndex: null, playerOut: null })} disabled={workflowStep === 'RALLY'} className={`flex-1 rounded-xl text-[10px] font-black border border-slate-200 bg-white/50 backdrop-blur-sm hover:bg-white hover:shadow-md transition-all duration-200 text-indigo-600 hover:bg-indigo-50 disabled:opacity-30`}>SUBS ({substitutions[leftTeam.code]}/6)</button>
                                        <button onClick={() => { setChallengeData({ team: leftTeam.code }); setShowChallengeModal(true); }} disabled={challenges[leftTeam.code] <= 0 || workflowStep === 'RALLY'} className={`flex-1 rounded-xl text-[10px] font-black border border-slate-200 bg-white/50 backdrop-blur-sm hover:bg-white hover:shadow-md transition-all duration-200 text-amber-600 hover:bg-amber-50 disabled:opacity-30`}>CHALLENGE</button>
                                        <button onClick={() => { setSanctionTeam(leftTeam.code); setShowSanctionModal(true); }} disabled={workflowStep === 'RALLY'} className={`flex-1 rounded-xl text-[10px] font-black border border-slate-200 bg-white/50 backdrop-blur-sm hover:bg-white hover:shadow-md transition-all duration-200 text-rose-600 hover:bg-rose-50 disabled:opacity-30`}>SANCTION</button>
                                    </div>
                                </div>

                                {/* Center Controls (Timer & Undo) */}
                                <div className="flex flex-col items-center gap-4 w-40 shrink-0">
                                    <div className="bg-slate-100 px-4 py-2 rounded-full flex items-center justify-between w-full shadow-inner">
                                        <div className="flex items-center gap-2">
                                            <Timer size={14} className="text-slate-400" />
                                            <span className="font-mono text-xs font-black text-slate-700">TIMER</span>
                                        </div>
                                        <button onClick={() => setIsTimerRunning(!isTimerRunning)} className={`p-1.5 rounded-full transition-colors ${isTimerRunning ? 'text-rose-500 bg-rose-100 hover:bg-rose-200' : 'text-emerald-600 bg-emerald-100 hover:bg-emerald-200'}`}>
                                            {isTimerRunning ? <Pause size={14} /> : <PlayCircle size={14} />}
                                        </button>
                                    </div>

                                    <div className="flex gap-2 w-full flex-1">
                                        <button onClick={handleUndo} disabled={workflowStep !== 'RALLY' && history.length === 0} className={`flex-1 rounded-xl border border-slate-100 bg-white shadow-sm text-slate-400 hover:text-indigo-600 hover:border-indigo-100 transition-all disabled:opacity-30 flex items-center justify-center`} title="Undo Action">
                                            <RotateCcw size={20} />
                                        </button>
                                        <button onClick={() => setIsHomeLeft(!isHomeLeft)} className={`flex-1 rounded-xl border border-slate-100 bg-white shadow-sm text-slate-400 hover:text-indigo-600 hover:border-indigo-100 transition-all flex items-center justify-center`} title="Switch Sides">
                                            <ArrowRightLeft size={20} />
                                        </button>
                                    </div>
                                </div>

                                {/* Right Controls */}
                                <div className="flex-1 flex items-stretch gap-3">
                                    <div className="flex flex-col gap-1.5 w-24 shrink-0">
                                        <button onClick={() => handleActionSelect(rightTeam.code, 'TIMEOUT')} disabled={timeouts[rightTeam.code] >= 2 || workflowStep === 'RALLY'} className={`flex-1 rounded-xl text-[10px] font-black border border-slate-200 bg-white/50 backdrop-blur-sm hover:bg-white hover:shadow-md transition-all duration-200 text-slate-600 hover:text-indigo-600 disabled:opacity-30`}>TIMEOUT ({2 - timeouts[rightTeam.code]})</button>
                                        <button onClick={() => setSubData({ isOpen: true, team: rightTeam.code, posIndex: null, playerOut: null })} disabled={workflowStep === 'RALLY'} className={`flex-1 rounded-xl text-[10px] font-black border border-slate-200 bg-white/50 backdrop-blur-sm hover:bg-white hover:shadow-md transition-all duration-200 text-indigo-600 hover:bg-indigo-50 disabled:opacity-30`}>SUBS ({substitutions[rightTeam.code]}/6)</button>
                                        <button onClick={() => { setChallengeData({ team: rightTeam.code }); setShowChallengeModal(true); }} disabled={challenges[rightTeam.code] <= 0 || workflowStep === 'RALLY'} className={`flex-1 rounded-xl text-[10px] font-black border border-slate-200 bg-white/50 backdrop-blur-sm hover:bg-white hover:shadow-md transition-all duration-200 text-amber-600 hover:bg-amber-50 disabled:opacity-30`}>CHALLENGE</button>
                                        <button onClick={() => { setSanctionTeam(rightTeam.code); setShowSanctionModal(true); }} disabled={workflowStep === 'RALLY'} className={`flex-1 rounded-xl text-[10px] font-black border border-slate-200 bg-white/50 backdrop-blur-sm hover:bg-white hover:shadow-md transition-all duration-200 text-rose-600 hover:bg-rose-50 disabled:opacity-30`}>SANCTION</button>
                                    </div>
                                    <button 
                                        onClick={() => {
                                            if (workflowStep === 'SERVING' && servingTeam === rightTeam.code) setWorkflowStep('RALLY');
                                            else handlePoint(rightTeam.code);
                                        }} 
                                        disabled={workflowStep !== 'RALLY' && !(workflowStep === 'SERVING' && servingTeam === rightTeam.code)} 
                                        className="flex-1 rounded-[1.5rem] flex items-center justify-center px-6 border-b-8 shadow-lg active:border-b-0 active:mt-1 transition-all text-white disabled:opacity-30 disabled:grayscale group" 
                                        style={{ backgroundColor: rightTeam.color, borderBottomColor: 'rgba(0,0,0,0.2)' }}
                                    >
                                        <span className="font-black text-4xl group-active:scale-95 transition-transform italic">
                                            {(workflowStep === 'SERVING' && servingTeam === rightTeam.code) ? 'SERVE' : 'POINT'}
                                        </span>
                                    </button>
                                </div>
                            </div>
                        ) : (
                            <div className="flex-1 flex flex-col justify-center items-center gap-2 bg-slate-50/50 rounded-2xl border-2 border-dashed border-slate-200 text-slate-300">
                                <AlertTriangle size={32} />
                                <span className="font-black text-sm uppercase tracking-[0.2em]">Controls Locked</span>
                            </div>
                        )}
                    </div>
                </section>

                {/* Right Sidebar (Team Info) */}
                <aside className="w-80 bg-white/80 backdrop-blur-xl border border-slate-200 rounded-2xl hidden lg:flex flex-col z-10 shadow-sm overflow-hidden">
                    <TeamInfoPanel team={rightTeam} align="right" onPlayerClick={handleCourtPlayerClick} />
                </aside>

                {/* NEW: Match History Sidebar */}
                <aside className="w-80 bg-white/80 backdrop-blur-xl border border-slate-200 rounded-2xl hidden xl:flex flex-col z-10 shadow-sm overflow-hidden">
                    <div className="p-4 bg-slate-50/50 border-b border-slate-200 font-bold flex items-center gap-2">
                        <History className="text-indigo-600" size={18} /> 
                        <span className="tracking-tight text-slate-700">MATCH HISTORY</span>
                    </div>

                    {/* Tabs */}
                    <div className="flex bg-slate-100/50 p-1 border-b border-slate-200 overflow-x-auto scrollbar-hide">
                        {Array.from({ length: matchData.currentSet }, (_, i) => i + 1).map(setNum => (
                            <button
                                key={setNum}
                                onClick={() => setActiveHistoryTab(setNum)}
                                className={`flex-1 py-2 text-[10px] font-black rounded-lg transition-all whitespace-nowrap px-3 ${activeHistoryTab === setNum
                                        ? 'bg-white text-indigo-600 shadow-sm'
                                        : 'text-slate-500 hover:text-slate-700 hover:bg-white/50'
                                    }`}
                            >
                                SET {setNum}
                            </button>
                        ))}
                    </div>

                    <div className="flex-1 overflow-y-auto bg-white/50">
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
                                    <div className="bg-slate-50 p-3 border-b border-slate-200">
                                        <div className="text-center font-black text-[10px] text-slate-400 uppercase tracking-widest mb-2">
                                            SET {activeHistoryTab} SUMMARY
                                        </div>
                                        <div className="grid grid-cols-[1fr_auto_1fr] items-center gap-4">
                                            <div className="flex items-center gap-2 justify-start bg-white p-1.5 rounded-xl border border-slate-100 shadow-sm">
                                                <Timer className="text-indigo-400" size={12} />
                                                <span className="text-xs font-bold text-slate-700">{stats.home.timeouts}</span>
                                                <ArrowUpDown className="text-emerald-400" size={12} />
                                                <span className="text-xs font-bold text-slate-700">{stats.home.subs}</span>
                                            </div>

                                            <div className="bg-indigo-600 px-3 py-1 rounded-full text-white font-black text-sm shadow-md">
                                                {stats.score}
                                            </div>

                                            <div className="flex items-center gap-2 justify-end bg-white p-1.5 rounded-xl border border-slate-100 shadow-sm">
                                                <span className="text-xs font-bold text-slate-700">{stats.away.timeouts}</span>
                                                <Timer className="text-rose-400" size={12} />
                                                <span className="text-xs font-bold text-slate-700">{stats.away.subs}</span>
                                                <ArrowUpDown className="text-emerald-400" size={12} />
                                            </div>
                                        </div>
                                    </div>

                                    {/* Events List */}
                                    {setEvents.length === 0 ? (
                                        <div className="flex flex-col items-center justify-center h-40 text-slate-300 italic">
                                            <FileText size={32} className="mb-2 opacity-10" />
                                            <span className="text-xs font-bold uppercase tracking-tight">No events recorded</span>
                                        </div>
                                    ) : (
                                        <div className="p-3 space-y-2">
                                            {setEvents.map((ev) => {
                                                const isHome = ev.metadata?.team === matchData.teamHome;
                                                const isAway = ev.metadata?.team === matchData.teamAway;
                                                const borderLeftColor = isHome 
                                                    ? teamColors.home 
                                                    : isAway 
                                                        ? teamColors.away 
                                                        : '#e2e8f0';

                                                const [homeScore, awayScore] = ev.score.split('-');

                                                return (
                                                    <div key={ev.id} className="p-2 rounded-xl border border-slate-100 bg-white shadow-sm transition-all hover:shadow-md" style={{ borderLeftWidth: '4px', borderLeftColor }}>
                                                        <div className="flex items-center justify-between gap-2">
                                                            <div className="flex items-center gap-2">
                                                                <div className="flex items-center gap-0.5 font-mono font-black text-[10px] shrink-0">
                                                                    <span className="px-1.5 py-0.5 rounded bg-slate-50 border border-slate-100" style={{ color: teamColors.home }}>{homeScore}</span>
                                                                    <span className="text-slate-300 mx-0.5">:</span>
                                                                    <span className="px-1.5 py-0.5 rounded bg-slate-50 border border-slate-100" style={{ color: teamColors.away }}>{awayScore}</span>
                                                                </div>
                                                                <div className="text-xs font-bold text-slate-700">
                                                                    {ev.metadata && (ev.metadata.type === 'SUBSTITUTION' || ev.metadata.type === 'LIBERO') ? (
                                                                        <div className="flex flex-wrap gap-1 items-center">
                                                                            <span className="text-indigo-600 font-black uppercase text-[10px]">IN {ev.metadata.in}</span>
                                                                            <ArrowRightLeft size={10} className="text-slate-300" />
                                                                            <span className="text-rose-500 font-black uppercase text-[10px]">OUT {ev.metadata.out}</span>
                                                                        </div>
                                                                    ) : (
                                                                        ev.description.replace(ev.metadata?.team || '', '').trim()
                                                                    )}
                                                                </div>
                                                            </div>
                                                            <div className="text-[10px] font-bold text-slate-400 flex items-center gap-1 shrink-0">
                                                                <Clock size={10} /> {ev.time}
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
                disqualifiedPlayers={subData.team ? disqualifiedPlayers[subData.team] : []} // ✅ ส่งเฉพาะอาเรย์ของทีมนั้น
                onConfirm={handleSubstitutionConfirm}
            />

            <SanctionModal
                isOpen={showSanctionModal}
                onClose={() => setShowSanctionModal(false)}
                teamName={sanctionTeam === 'home' ? matchData.teamHome : matchData.teamAway}
                roster={sanctionTeam === 'home' ? homeRoster : awayRoster}
                onConfirm={handleSanction}
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
                disqualifiedPlayers={liberoActionData.team ? disqualifiedPlayers[liberoActionData.team] : []}
                onConfirm={handleLiberoConfirm}
            />
        </div>
    );
}
