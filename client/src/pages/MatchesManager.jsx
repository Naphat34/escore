import React, { useEffect, useState, useCallback } from 'react';
import api from '../api'; // Path to your api setup
import { Trophy, Calendar, CheckCircle, Edit3, Save, X, PlusCircle, Shield } from 'lucide-react';
import Swal from 'sweetalert2';
import { Toast, Input, Button, EmptyState } from './AdminShared';

export default function MatchesManager({ competition, onClose }) {
    const competitionId = competition?.id;
    const maxSets = competition?.max_sets || 5; // รับค่า max_sets (Default 5)

    const [matches, setMatches] = useState([]);
    const [loading, setLoading] = useState(true);
    const [editingMatch, setEditingMatch] = useState(null); // เก็บแมตช์ที่กำลังกรอกคะแนน

    // --- [เพิ่ม] Form State สำหรับสร้างแมตช์ใหม่ ---
    const [teams, setTeams] = useState([]); // ดึงทีมที่ลงแข่งมาใส่ dropdown
    const [isCreating, setIsCreating] = useState(false);
    const [newMatchForm, setNewMatchForm] = useState({
        round_name: 'Round 1',
        match_number: '',
        home_team_id: '',
        away_team_id: '',
        start_time: '',
        location: '',
        gender: 'Female', // Default
        pool_name: 'A'    // Default
    });

    // Form State สำหรับกรอกคะแนน
    const [scoreForm, setScoreForm] = useState({
        home_set: 0,
        away_set: 0,
        sets_detail: ["", "", "", "", ""] // รองรับ 5 เซต
    });

    useEffect(() => {
        fetchData();
    }, [fetchData]);

    const fetchData = useCallback(async () => {
        setLoading(true);
        try {
            // 1. ดึงแมตช์
            const matchRes = await api.get(`/competitions/${competitionId}/matches`);
            setMatches(matchRes.data);

            // 2. ดึงทีม (เพื่อไว้สร้างแมตช์)
            // ใช้ route ที่เราเพิ่งแก้ /admin/competitions/:id/teams
            const teamRes = await api.get(`/admin/competitions/${competitionId}/teams`);
            setTeams(teamRes.data);

        } catch (err) {
            console.error(err);
        } finally {
            setLoading(false);
        }
    }, [competitionId]);

    const handleGenerateMatches = async () => {
        const result = await Swal.fire({
            title: 'Create Schedule?',
            text: "System will generate Round Robin schedule automatically.",
            icon: 'question',
            showCancelButton: true,
            confirmButtonText: 'Generate'
        });

        if (result.isConfirmed) {
            try {
                await api.post(`/competitions/${competitionId}/generate-matches`);
                Swal.fire('Success', 'Matches generated!', 'success');
                fetchData();
            } catch (err) {
                Swal.fire('Error', err.response?.data?.error || 'Failed', 'error');
            }
        }
    };

    // --- [เพิ่ม] Handle Save New Match / Update Match ---
    const [editingMatchId, setEditingMatchId] = useState(null); // เก็บ ID เพื่อรู้ว่ากำลัง Edit

    const handleCreateMatch = async (e) => {
        e.preventDefault();
        // ---------------------------------------------------------
        // 1. Validation: ตรวจสอบความถูกต้องเบื้องต้น
        // ---------------------------------------------------------
        
        // 1.1 เช็คว่าเลือก Competition หรือยัง
        if (!competitionId) {
            Swal.fire('Error', 'กรุณาเลือกรายการแข่งขันก่อน (Please select a competition)', 'error');
            return;
        }

        // 1.2 เช็คว่าเลือกทีมซ้ำกันหรือไม่ (ถ้าเลือกครบทั้ง 2 ทีม)
        if (newMatchForm.home_team_id && newMatchForm.away_team_id && newMatchForm.home_team_id === newMatchForm.away_team_id) {
            Swal.fire('Warning', 'ทีมเหย้าและทีมเยือนต้องไม่ใช่ทีมเดียวกัน', 'warning');
            return;
        }

        try {
            // ---------------------------------------------------------
            // 2. Data Preparation: แปลงข้อมูลให้ตรงกับ Database Schema
            // ---------------------------------------------------------
            const payload = {
                // ต้องส่ง competition_id เสมอ และต้องเป็น Int
                competition_id: parseInt(competitionId), 
                
                // แปลง Team ID: ถ้ามีค่า ("15") -> แปลงเป็น Int (15), ถ้าไม่มี ("") -> ส่ง null
                home_team_id: newMatchForm.home_team_id ? parseInt(newMatchForm.home_team_id, 10) : null,
                away_team_id: newMatchForm.away_team_id ? parseInt(newMatchForm.away_team_id, 10) : null,
                
                // แปลง Match Number: เป็น Int หรือ null
                match_number: newMatchForm.match_number ? parseInt(newMatchForm.match_number, 10) : null,
                
                // แปลง Date: ถ้าเป็นค่าว่าง "" ให้ส่ง null (เพื่อไม่ให้ DB Error เรื่อง Timestamp)
                start_time: newMatchForm.start_time || null,
                
                // ข้อมูล String อื่นๆ (ใช้ค่าเดิม หรือถ้าว่างให้ส่ง String เปล่า/Default)
                location: newMatchForm.location || '',
                round_name: newMatchForm.round_name || 'Round 1',
                pool_name: newMatchForm.pool_name || '',
                gender: newMatchForm.gender || 'Male',

                // ถ้าเป็นการแก้ไข ให้คงสถานะ (Status) เดิมไว้
                ...(editingMatchId && { status: matches.find(m => m.id === editingMatchId)?.status })
            };

            // Debug: ดูค่าจริงๆ ที่จะส่งไปหลังบ้าน (กด F12 -> Console ดูได้เลย)
            console.log("Payload sending to API:", payload); 

            // ---------------------------------------------------------
            // 3. API Interaction: ส่งข้อมูลไป Backend
            // ---------------------------------------------------------
            if (editingMatchId) {
                // --- UPDATE (แก้ไข) ---
                await api.put(`/matches/${editingMatchId}`, payload);
                Swal.fire('Success', 'อัปเดตข้อมูลการแข่งขันเรียบร้อยแล้ว', 'success');
            } else {
                // --- CREATE (สร้างใหม่) ---
                await api.post('/matches', payload);
                Swal.fire('Success', 'สร้างแมตช์การแข่งขันใหม่สำเร็จ', 'success');
            }

            // ---------------------------------------------------------
            // 4. Cleanup: เคลียร์ฟอร์มและโหลดข้อมูลใหม่
            // ---------------------------------------------------------
            // Reset ค่า แต่คงค่า Default ที่ใช้บ่อยไว้ (เช่น เพศ, รอบแข่ง) เพื่อให้กรอกคู่ต่อไปง่ายขึ้น
            setNewMatchForm({ 
                home_team_id: '', 
                away_team_id: '', 
                start_time: '', 
                location: '',
                match_number: '', 
                round_name: 'Round 1', // ตั้งค่าเริ่มต้นให้
                pool_name: '', 
                gender: 'Male'         // ตั้งค่าเริ่มต้นให้
            });
            
            setEditingMatchId(null); // ออกจากโหมดแก้ไข
            
            // โหลดตารางแข่งใหม่ทันที
            fetchData();

        } catch (error) {
            console.error("Save match error:", error);
            
            // ดึงข้อความ Error จาก Backend มาแสดง (ถ้ามี)
            const errorMsg = error.response?.data?.error || error.message || 'เกิดข้อผิดพลาดในการบันทึกข้อมูล';
            Swal.fire('Error', errorMsg, 'error');
        }
    };

    const handleEditMatch = (match) => {
        setNewMatchForm({
            round_name: match.round_name || '',
            match_number: match.match_number || '',
            home_team_id: match.home_team_id || '',
            away_team_id: match.away_team_id || '',
            start_time: match.start_time ? match.start_time.slice(0, 16) : '', // format datetime-local
            location: match.location || '',
            gender: match.gender || 'Female',
            pool_name: match.pool_name || 'A'
        });
        setEditingMatchId(match.id);
        setIsCreating(true); // ใช้ Modal เดียวกับ Create
    };

    const openScoreModal = (match) => {
        // แปลง set_scores จาก JSON เป็น Array หรือค่าว่าง
        let currentDetails = ["", "", "", "", ""];
        if (match.set_scores) {
            // สมมติเก็บเป็น ["25-20", "25-15", ...]
            const parsed = typeof match.set_scores === 'string' ? JSON.parse(match.set_scores) : match.set_scores;
            parsed.forEach((val, idx) => { if (idx < 5) currentDetails[idx] = val });
        }

        setScoreForm({
            home_set: match.home_set_score || 0,
            away_set: match.away_set_score || 0,
            sets_detail: currentDetails
        });
        setEditingMatch(match);
    };

    const handleSaveScore = async () => {
        try {
            // Filter เอาเฉพาะเซตที่มีการกรอกคะแนน
            const validSets = scoreForm.sets_detail.filter(s => s.trim() !== "");

            // คำนวณคะแนนเซต (Home vs Away) จากรายละเอียดเซต
            let hScore = 0;
            let aScore = 0;
            validSets.forEach(s => {
                const [h, a] = s.split('-').map(v => parseInt(v.trim()));
                if (!isNaN(h) && !isNaN(a)) {
                    if (h > a) hScore++;
                    if (a > h) aScore++;
                }
            });

            // ตัดสินผลแพ้ชนะ (เช่น Best of 5 ต้องชนะ 3, Best of 3 ต้องชนะ 2)
            const setsToWin = Math.ceil(maxSets / 2);
            const isCompleted = hScore >= setsToWin || aScore >= setsToWin;

            await api.put(`/matches/${editingMatch.id}/result`, {
                home_set_score: hScore,
                away_set_score: aScore,
                set_scores: validSets,
                status: isCompleted ? 'completed' : 'scheduled'
            });

            setEditingMatch(null);
            fetchData();
            Swal.fire({
                icon: 'success',
                title: 'Saved',
                toast: true,
                position: 'top-end',
                showConfirmButton: false,
                timer: 1500
            });
        } catch (err) {
            console.error("Save score error:", err);
            Swal.fire('Error', 'Save failed', 'error');
        }
    };

    return (
        <div className="bg-white rounded-xl shadow-lg p-6 max-w-4xl mx-auto mt-4 animate-in fade-in zoom-in duration-200">
            <div className="flex justify-between items-center mb-6 border-b pb-4">
                <h2 className="text-xl font-bold flex items-center gap-2">
                    <Trophy className="text-yellow-500" /> Match Schedule
                </h2>
                <div className="flex gap-2">
                    <button
                        onClick={() => {
                            setEditingMatchId(null);
                            setNewMatchForm({
                                round_name: 'Round 1', match_number: '', home_team_id: '', away_team_id: '',
                                start_time: '', location: '', gender: 'Female', pool_name: 'A'
                            });
                            setIsCreating(true);
                        }}
                        className="bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-lg text-sm transition flex items-center gap-2"
                    >
                        <PlusCircle size={16} /> New Match
                    </button>

                    {matches.length === 0 && (
                        <button onClick={handleGenerateMatches} className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg text-sm transition">
                            Generate Schedule (Round Robin)
                        </button>
                    )}
                    <button onClick={onClose} className="text-gray-500 hover:text-gray-700 px-3">
                        Close
                    </button>
                </div>
            </div>

            {loading ? <p>Loading...</p> : (
                <div className="space-y-4">
                    {matches.length === 0 && <div className="text-center py-10 text-gray-400">No matches found.</div>}

                    {matches.map((match) => (
                        <div key={match.id} className="border rounded-lg p-4 flex flex-col md:flex-row items-center justify-between gap-4 hover:shadow-md transition bg-gray-50">

                            {/* Round Info */}
                            <div className="text-sm font-semibold text-gray-500 w-24 text-center md:text-left">
                                <div className="text-xs text-gray-400">Match {match.match_number}</div>
                                {match.round_name}
                            </div>

                            {/* Teams & Score */}
                            <div className="flex-1 flex items-center justify-center gap-6">
                                <div className="text-right w-1/3 flex items-center justify-end gap-3">
                                    <div>
                                        <div className="font-bold text-gray-800 text-base md:text-lg leading-tight">
                                            {teams.find(t => t.id == match.home_team_id)?.name || match.home_team || '-'}
                                        </div>
                                        <div className="text-xs text-gray-400 font-mono">{match.home_team_code}</div>
                                    </div>
                                    <div className="w-10 h-10 rounded-full bg-gray-100 flex items-center justify-center overflow-hidden border shrink-0">
                                        {teams.find(t => t.id == match.home_team_id)?.logo_url ? <img src={teams.find(t => t.id == match.home_team_id).logo_url} className="w-full h-full object-contain p-0.5"/> : <Shield size={16} className="text-gray-400"/>}
                                    </div>
                                </div>

                                <div className="flex flex-col items-center">
                                    <div className="bg-gray-800 text-white px-4 py-1 rounded-md text-xl font-mono tracking-widest">
                                        {match.home_set_score} - {match.away_set_score}
                                    </div>
                                    {/* Set Details */}
                                    {match.set_scores && (
                                        <div className="text-xs text-gray-500 mt-1">
                                            {typeof match.set_scores === 'object' ? match.set_scores.join(', ') : match.set_scores}
                                        </div>
                                    )}
                                    <div className="mt-1 text-xs text-indigo-500 font-medium">{match.start_time ? new Date(match.start_time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : 'TBD'}</div>
                                    <div className="text-[10px] text-gray-400">{match.location}</div>
                                </div>

                                <div className="text-left w-1/3 flex items-center justify-start gap-3">
                                    <div className="w-10 h-10 rounded-full bg-gray-100 flex items-center justify-center overflow-hidden border shrink-0">
                                        {teams.find(t => t.id == match.away_team_id)?.logo_url ? <img src={teams.find(t => t.id == match.away_team_id).logo_url} className="w-full h-full object-contain p-0.5"/> : <Shield size={16} className="text-gray-400"/>}
                                    </div>
                                    <div>
                                        <div className="font-bold text-gray-800 text-base md:text-lg leading-tight">
                                            {teams.find(t => t.id == match.away_team_id)?.name || match.away_team || '-'}
                                        </div>
                                        <div className="text-xs text-gray-400 font-mono">{match.away_team_code}</div>
                                    </div>
                                </div>
                            </div>

                            {/* Action Buttons */}
                            <div className="flex flex-col gap-2">
                                <button
                                    onClick={() => handleEditMatch(match)}
                                    className="p-2 text-gray-500 hover:bg-gray-100 rounded-full transition"
                                    title="Edit Details"
                                >
                                    <Edit3 size={18} />
                                </button>
                                <button
                                    onClick={() => openScoreModal(match)}
                                    className="p-2 text-blue-600 hover:bg-blue-100 rounded-full transition"
                                    title="Update Score"
                                >
                                    <Trophy size={18} />
                                </button>
                            </div>
                        </div>
                    ))}
                </div>
            )}

            {/* --- Modal สร้าง/แก้ไข แมตช์ (Create/Edit Match) --- */}
            {isCreating && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
                    <div className="bg-white p-6 rounded-lg w-full max-w-md shadow-2xl">
                        <div className="flex justify-between items-center mb-4">
                            <h3 className="font-bold text-lg">{editingMatchId ? 'Edit Match Details' : 'Create New Match'}</h3>
                            <button onClick={() => { setIsCreating(false); setEditingMatchId(null); }}><X size={20} /></button>
                        </div>

                        <form onSubmit={handleCreateMatch} className="space-y-4">
                            <div className="grid grid-cols-2 gap-3">
                                <Input label="Round Name" value={newMatchForm.round_name} onChange={e => setNewMatchForm({ ...newMatchForm, round_name: e.target.value })} required placeholder="e.g. Round 1" />
                                <Input label="Match No." type="number" value={newMatchForm.match_number} onChange={e => setNewMatchForm({ ...newMatchForm, match_number: e.target.value })} placeholder="#" />
                            </div>

                            <div className="grid grid-cols-2 gap-3">
                                <div>
                                    <label className="block text-xs font-bold uppercase mb-1 text-gray-500">Home Team</label>
                                    <select
                                        className="w-full p-2 border rounded-lg text-sm bg-gray-50 focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                                        value={newMatchForm.home_team_id}
                                        onChange={e => setNewMatchForm({ ...newMatchForm, home_team_id: e.target.value })}
                                        required
                                    >
                                        <option value="">Select Team</option>
                                        {teams.map(t => <option key={t.id} value={t.id}>{t.name}</option>)}
                                    </select>
                                </div>
                                <div>
                                    <label className="block text-xs font-bold uppercase mb-1 text-gray-500">Away Team</label>
    <select
        className="w-full p-2 border rounded-lg text-sm bg-gray-50 focus:ring-2 focus:ring-indigo-500 focus:outline-none"
        value={newMatchForm.away_team_id}
        onChange={e => setNewMatchForm({ ...newMatchForm, away_team_id: e.target.value })}
        required
    >
        <option value="">Select Team</option>
        {teams
            // กรองทีมที่ถูกเลือกเป็น Home Team ออกไป (ไม่ให้แข่งกับตัวเอง)
            .filter(t => t.id.toString() !== newMatchForm.home_team_id.toString()) 
            .map(t => (
                <option key={t.id} value={t.id}>{t.name}</option>
            ))
        }
    </select>
                                </div>
                            </div>

                            <div className="grid grid-cols-2 gap-3">
                            <div className="space-y-4">
                                <label className="block text-xs font-bold uppercase mb-1 text-gray-500">Start Date & Time (24h)</label>
                                <div className="grid grid-cols-2 gap-3">
                                    <Input 
                                        type="date" 
                                        value={newMatchForm.start_time ? newMatchForm.start_time.split('T')[0] : ''}
                                        onChange={e => {
                                            const timePart = newMatchForm.start_time?.includes('T') ? newMatchForm.start_time.split('T')[1] : '00:00';
                                            setNewMatchForm({...newMatchForm, start_time: `${e.target.value}T${timePart}`});
                                        }}
                                    />
                                    <Input 
                                        type="time" 
                                        value={newMatchForm.start_time?.includes('T') ? newMatchForm.start_time.split('T')[1] : ''}
                                        onChange={e => {
                                            const datePart = newMatchForm.start_time?.includes('T') ? newMatchForm.start_time.split('T')[0] : new Date().toISOString().split('T')[0];
                                            setNewMatchForm({...newMatchForm, start_time: `${datePart}T${e.target.value}`});
                                        }}
                                    />
                                </div>
                            </div>
                                <Input label="Location" value={newMatchForm.location} onChange={e => setNewMatchForm({ ...newMatchForm, location: e.target.value })} placeholder="Court 1" />
                            </div>

                            <Button type="submit" label={editingMatchId ? "Update Match" : "Create Match"} icon={editingMatchId ? <Edit3 size={18} /> : <PlusCircle size={18} />} full />
                        </form>
                    </div>
                </div>
            )}

            {/* --- Modal บันทึกคะแนน (Score) --- */}
            {editingMatch && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
                    <div className="bg-white p-6 rounded-lg w-full max-w-md shadow-2xl">
                        <div className="flex justify-between items-center mb-4">
                            <h3 className="font-bold text-lg">Update Score</h3>
                            <button onClick={() => setEditingMatch(null)}><X size={20} /></button>
                        </div>

                        <div className="flex justify-center items-center gap-4 mb-6">
                            <div className="text-center">
                                <label className="block text-sm text-gray-500 mb-1">{editingMatch.home_team}</label>
                                <input
                                    type="number"
                                    className="w-16 text-center border rounded p-2 text-xl font-bold"
                                    value={scoreForm.home_set}
                                    onChange={e => setScoreForm({ ...scoreForm, home_set: e.target.value })}
                                />
                            </div>
                            <span className="text-2xl font-bold text-gray-300">-</span>
                            <div className="text-center">
                                <label className="block text-sm text-gray-500 mb-1">{editingMatch.away_team}</label>
                                <input
                                    type="number"
                                    className="w-16 text-center border rounded p-2 text-xl font-bold"
                                    value={scoreForm.away_set}
                                    onChange={e => setScoreForm({ ...scoreForm, away_set: e.target.value })}
                                />
                            </div>
                        </div>

                        <div className="space-y-2 mb-6">
                            <label className="block text-sm font-medium text-gray-700">Set Scores (Points)</label>
                            <div className="grid grid-cols-5 gap-2">
                                {scoreForm.sets_detail.map((val, idx) => (
                                    <input
                                        key={idx}
                                        type="text"
                                        placeholder={`S${idx + 1}`}
                                        className="border rounded p-1 text-center text-sm"
                                        value={val}
                                        onChange={(e) => {
                                            const newSets = [...scoreForm.sets_detail];
                                            newSets[idx] = e.target.value;
                                            setScoreForm({ ...scoreForm, sets_detail: newSets });
                                        }}
                                    />
                                ))}
                            </div>
                            <p className="text-xs text-gray-400 text-center">Format e.g. "25-20"</p>
                        </div>

                        <button
                            onClick={handleSaveScore}
                            className="w-full bg-green-600 hover:bg-green-700 text-white py-2 rounded-lg font-medium flex items-center justify-center gap-2"
                        >
                            <Save size={18} /> Save Result
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
}