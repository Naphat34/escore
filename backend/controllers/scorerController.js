const db = require('../config/db');

module.exports = {  // ✅ สำคัญ: ต้องมี module.exports ตรงนี้

    // 1. ดึงเหตุการณ์ทั้งหมด (ปรับให้ตรงกับ match_events)
    async getMatchEvents(req, res) {
        try {
            const { matchId } = req.params;
            // ใช้ชื่อคอลัมน์ตามที่คุณแจ้งมา: match_id, set_id, player_id, skill, grade, ...
            const result = await db.query(`
                SELECT id, match_id, set_id, player_id, skill, grade, 
                       score_home, score_away, server_player_id, start_zone, end_zone,
                       created_at
                FROM match_events 
                WHERE match_id = $1 
                ORDER BY id DESC
            `, [matchId]);
            res.json(result.rows);
        } catch (err) {
            console.error("Get Match Events Error", err);
            res.status(500).json({ error: "Database error" });
        }
    },

    // 1.5 ดึงรายละเอียดแมตช์ (สำหรับ Scorer Console)
    async getMatchDetails(req, res) {
        try {
            const { matchId } = req.params;
            const result = await db.query(`
                SELECT 
                    m.*, 
                    t1.name as home_team_name, 
                    t2.name as away_team_name,
                    c.max_sets, -- Added max_sets
                    -- ข้อมูล Referee 1
                    r1.firstname as r1_firstname, r1.lastname as r1_lastname, r1.country as r1_country,
                    -- ข้อมูล Referee 2
                    r2.firstname as r2_firstname, r2.lastname as r2_lastname, r2.country as r2_country,
                    -- ข้อมูล Scorer
                    s1.firstname as scorer_firstname, s1.lastname as scorer_lastname,
                    -- ข้อมูล Line Judges (ตัวอย่างดึงแค่ 2 คน)
                    l1.firstname as lj1_firstname, l1.lastname as lj1_lastname,
                    l2.firstname as lj2_firstname, l2.lastname as lj2_lastname,

                    -- New Columns
                    m.rr_name, m.rr_country, m.rr_code,
                    m.rc_name, m.rc_country, m.rc_code,
                    m.assistant_scorer_name, m.assistant_scorer_country, m.assistant_scorer_code,
                    m.td_name, m.td_country, m.td_code,
                    m.rd_name, m.rd_country, m.rd_code

                FROM matches m
                LEFT JOIN teams t1 ON m.home_team_id = t1.id
                LEFT JOIN teams t2 ON m.away_team_id = t2.id
                LEFT JOIN competitions c ON m.competition_id = c.id -- Join Competitions
                -- Join ตารางกรรมการ
                LEFT JOIN referees r1 ON m.referee_1_id = r1.id
                LEFT JOIN referees r2 ON m.referee_2_id = r2.id
                LEFT JOIN scorers s1 ON m.scorer_id = s1.id
                LEFT JOIN line_judges l1 ON m.line_judge_1_id = l1.id
                LEFT JOIN line_judges l2 ON m.line_judge_2_id = l2.id
                
                WHERE m.id = $1
            `, [matchId]);

            if (result.rows.length === 0) {
                return res.status(404).json({ error: "Match not found" });
            }

            res.json(result.rows[0]);
        } catch (err) {
            console.error("Get Match Details Error", err);
            res.status(500).json({ error: "Database error" });
        }
    },

    // --- [เพิ่มใหม่] ฟังก์ชันสำหรับอัปเดตและดึง Live State ---
    async updateLiveState(req, res) {
        try {
            const { matchId } = req.params;
            const { state } = req.body; // รับ state ทั้งก้อนจาก frontend

            // ตรวจสอบว่า state เป็น object ที่ถูกต้อง
            if (typeof state !== 'object' || state === null) {
                return res.status(400).json({ error: 'Invalid state data provided.' });
            }

            await db.query(
                'UPDATE matches SET live_state = $1 WHERE id = $2',
                [state, matchId]
            );
            res.json({ success: true, message: 'State updated.' });
        } catch (err) {
            console.error("Update Live State Error:", err);
            res.status(500).json({ error: "Database error while updating live state." });
        }
    },

    async getLiveState(req, res) {
        try {
            const { matchId } = req.params;
            const result = await db.query('SELECT live_state FROM matches WHERE id = $1', [matchId]);
            const state = result.rows[0]?.live_state;
            
            state ? res.json(state) : res.status(404).json({ error: "No live state found." });
        } catch (err) {
            console.error("Get Live State Error:", err);
            res.status(500).json({ error: "Database error while fetching live state." });
        }
    },

    // 2. ดึง Lineup ล่าสุด (ปรับให้ตรงกับ match_lineups: p1-p6)
    async getMatchLineup(req, res) {
        try {
            const { matchId } = req.params;

            // ดึง Lineup ล่าสุดของแต่ละทีม
            const lineupResult = await db.query(`
                SELECT DISTINCT ON (team_id) 
                    match_id, team_id, set_number, 
                    player_id_p1, player_id_p2, player_id_p3, 
                    player_id_p4, player_id_p5, player_id_p6, 
                    libero_id
                FROM match_lineups 
                WHERE match_id = $1
                ORDER BY team_id, set_number DESC
            `, [matchId]);

            // ถ้าไม่มีข้อมูลเลย ให้ส่ง Array ว่างกลับไป
            if (lineupResult.rows.length === 0) {
                return res.json([]);
            }

            // รวบรวม Player IDs ทั้งหมดเพื่อไปดึงชื่อและเบอร์มาแสดง
            let allPlayerIds = [];
            lineupResult.rows.forEach(row => {
                allPlayerIds.push(
                    row.player_id_p1, row.player_id_p2, row.player_id_p3,
                    row.player_id_p4, row.player_id_p5, row.player_id_p6,
                    row.libero_id
                );
            });

            // กรอง ID ที่ซ้ำและไม่เป็น null
            allPlayerIds = [...new Set(allPlayerIds.filter(id => id))];

            // ดึงข้อมูลนักกีฬา (ชื่อ, เบอร์) จากตาราง players
            let playersMap = {};
            if (allPlayerIds.length > 0) {
                const playersRes = await db.query(`
                    SELECT id, first_name, last_name, number, position 
                    FROM players 
                    WHERE id = ANY($1::int[])
                `, [allPlayerIds]);

                playersRes.rows.forEach(p => {
                    playersMap[p.id] = {
                        id: p.id,
                        number: p.number,
                        name: `${p.first_name.charAt(0)}.${p.last_name}`,
                        firstname: p.first_name,
                        lastname: p.last_name,
                        position: p.position
                    };
                });
            }

            // จัด Format ส่งกลับ Frontend ให้เป็น Array [p1, p2, ..., p6]
            const formattedLineups = lineupResult.rows.map(row => {
                const getP = (id) => playersMap[id] || { id: id, number: '?', name: 'Unknown' };
                return {
                    team_id: row.team_id,
                    lineup: [
                        getP(row.player_id_p1),
                        getP(row.player_id_p2),
                        getP(row.player_id_p3),
                        getP(row.player_id_p4),
                        getP(row.player_id_p5),
                        getP(row.player_id_p6)
                    ],
                    libero: playersMap[row.libero_id] || null
                };
            });

            res.json(formattedLineups);

            res.json(formattedLineups);

        } catch (err) {
            console.error("Get Match Lineup Error", err);
            res.status(500).json({ error: "Database error: " + err.message });
        }
    },

    // 3. บันทึกเหตุการณ์ (Mapping ค่าให้ตรงกับ skill, grade, start_zone, end_zone)
    async saveMatchEvent(req, res) {
        try {
            const { matchId } = req.params;
            const {
                set_number, // Map ไป set_id
                event_type, // 'POINT', 'SUBSTITUTION', etc.
                team_id,
                player_id,  // Player involved (e.g. Scorer, Sub In, Sanctioned)
                score_home,
                score_away,
                server_player_id,
                start_zone,
                end_zone,
                details, // JSON or extra info
                skill: explicitSkill, // รับค่า skill โดยตรง
                grade: explicitGrade  // รับค่า grade โดยตรง
            } = req.body;

            // 💬 อัปเดตคะแนนสดเข้าระบบ Public แทนการบันทึกประวัติ VIS
            await db.query(`
                UPDATE matches
                SET team_a_score = $1, team_b_score = $2
                WHERE id = $3
            `, [score_home, score_away, matchId]);

            // อัปเดตตาราง matches หลัก (ถ้าจำเป็น เพื่อให้หน้า Public เห็นคะแนนรวม)
            // *หมายเหตุ: ถ้าคุณไม่มีตาราง match_sets อาจจะต้องข้ามส่วนนี้ หรือแก้ query ให้ตรงกับระบบคุณ
            /*
            await db.query(`
                UPDATE matches 
                SET home_set_score = (SELECT COUNT(*) FROM match_sets WHERE match_id = $1 AND home_score > away_score),
                    away_set_score = (SELECT COUNT(*) FROM match_sets WHERE match_id = $1 AND away_score > home_score)
                WHERE id = $1
            `, [matchId]);
            */

            res.json({ success: true });
            res.json({ success: true });
        } catch (err) {
            console.error("Save Event Error", err);
            let validEnums = "";
            try {
                const enumRes = await db.query("SELECT enumlabel FROM pg_enum WHERE enumtypid = 'skill_enum'::regtype");
                validEnums = enumRes.rows.map(r => r.enumlabel).join(', ');
            } catch(e) {}
            const msg = validEnums ? `${err.message} (Valid enum values: ${validEnums})` : err.message;
            res.status(500).json({ error: "Database error: " + msg });
        }
    },

    // 4. บันทึก Lineup (แตก Array ลง p1-p6)
    async saveLineup(req, res) {
        const client = await db.pool.connect();
        try {
            await client.query('BEGIN');
            const { matchId } = req.params;
            const { team_id, set_number, player_positions, libero_id } = req.body;

            // Validation
            if (!team_id || !set_number) {
                return res.status(400).json({ error: "Missing required fields: team_id or set_number" });
            }

            // แปลง Array player_positions ให้เป็น ID ล้วน
            // player_positions อาจเป็น [{id:1}, {id:2}...] หรือ [1, 2...]
            const pIds = player_positions.map(p => (p && typeof p === 'object' && p.id) ? p.id : p);

            // ลบของเก่าออกก่อน (ถ้ามี lineup ซ้ำในเซตเดิม)
            await client.query(`
                DELETE FROM match_lineups 
                WHERE match_id = $1 AND team_id = $2 AND set_number = $3
            `, [matchId, team_id, set_number]);

            // Insert ใหม่แยกคอลัมน์ p1-p6
            await client.query(`
                INSERT INTO match_lineups 
                (match_id, team_id, set_number, player_id_p1, player_id_p2, player_id_p3, player_id_p4, player_id_p5, player_id_p6, libero_id)
                VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
            `, [
                matchId,
                team_id,
                set_number,
                pIds[0] || null,
                pIds[1] || null,
                pIds[2] || null,
                pIds[3] || null,
                pIds[4] || null,
                pIds[5] || null,
                libero_id
            ]);

            await client.query('COMMIT');
            res.json({ success: true });
        } catch (err) {
            await client.query('ROLLBACK');
            await client.query('ROLLBACK');
            console.error("Save Lineup Error", err);
            // Enhanced logging
            console.error("Payload:", { matchId, team_id, set_number, pIds, libero_id });
            res.status(500).json({ error: "Database error", details: err.message });
        } finally {
            client.release();
        }
    },

    // --- [เพิ่มใหม่] Master Data สำหรับเจ้าหน้าที่ ---
    async getAllReferees(req, res) {
        try {
            const result = await db.query('SELECT * FROM referees ORDER BY firstname ASC');
            res.json(result.rows);
        } catch (err) {
            console.error("Get Referees Error", err);
            res.status(500).json({ error: "Database error" });
        }
    },

    async getAllScorers(req, res) {
        try {
            const result = await db.query('SELECT * FROM scorers ORDER BY firstname ASC');
            res.json(result.rows);
        } catch (err) {
            console.error("Get Scorers Error", err);
            res.status(500).json({ error: "Database error" });
        }
    },

    async getAllLineJudges(req, res) {
        try {
            const result = await db.query('SELECT * FROM line_judges ORDER BY firstname ASC');
            res.json(result.rows);
        } catch (err) {
            console.error("Get Line Judges Error", err);
            res.status(500).json({ error: "Database error" });
        }
    },

    // --- [เพิ่มใหม่] อัปเดตรายชื่อเจ้าหน้าที่ในแมตช์ ---
    async updateMatchOfficials(req, res) {
        try {
            const { matchId } = req.params;
            const {
                referee_1_id, referee_2_id, scorer_id,
                line_judge_1_id, line_judge_2_id, line_judge_3_id, line_judge_4_id,

                // New Fields
                rr_name, rr_country, rr_code,
                rc_name, rc_country, rc_code,
                assistant_scorer_name, assistant_scorer_country, assistant_scorer_code,
                td_name, td_country, td_code,
                rd_name, rd_country, rd_code
            } = req.body;

            await db.query(`
                UPDATE matches 
                SET referee_1_id = $1,
                    referee_2_id = $2,
                    scorer_id = $3,
                    line_judge_1_id = $4,
                    line_judge_2_id = $5,
                    line_judge_3_id = $6,
                    line_judge_4_id = $7,

                    rr_name = $8, rr_country = $9, rr_code = $10,
                    rc_name = $11, rc_country = $12, rc_code = $13,
                    assistant_scorer_name = $14, assistant_scorer_country = $15, assistant_scorer_code = $16,
                    td_name = $17, td_country = $18, td_code = $19,
                    rd_name = $20, rd_country = $21, rd_code = $22
                WHERE id = $23
            `, [
                referee_1_id || null,
                referee_2_id || null,
                scorer_id || null,
                line_judge_1_id || null,
                line_judge_2_id || null,
                line_judge_3_id || null,
                line_judge_4_id || null,

                rr_name || null, rr_country || null, rr_code || null,
                rc_name || null, rc_country || null, rc_code || null,
                assistant_scorer_name || null, assistant_scorer_country || null, assistant_scorer_code || null,
                td_name || null, td_country || null, td_code || null,
                rd_name || null, rd_country || null, rd_code || null,

                matchId
            ]);

            res.json({ success: true, message: "Match officials updated" });
        } catch (err) {
            console.error("Update Officials Error", err);
            res.status(500).json({ error: "Database error" });
        }
    },

    // ✅ ฟังก์ชันจบเซต
    async endSet(req, res) {
        const client = await db.pool.connect(); // ใช้ Client เพื่อทำ Transaction
        try {
            await client.query('BEGIN'); // เริ่ม Transaction

            const { matchId } = req.params;
            const { setNumber, homeScore, awayScore, duration } = req.body;

            // 1. บันทึกผลเซตลงตาราง match_sets
            await client.query(`
                INSERT INTO match_sets (match_id, set_number, home_score, away_score, duration_minutes)
                VALUES ($1, $2, $3, $4, $5)
            `, [matchId, setNumber, homeScore, awayScore, duration || 0]);

            // 2. คำนวณว่าใครชนะเซตนี้
            let homeSetWin = 0;
            let awaySetWin = 0;
            if (homeScore > awayScore) {
                homeSetWin = 1;
            } else {
                awaySetWin = 1;
            }

            // 2.5 ดึงคะแนนทุกเซตเพื่ออัปเดต set_scores ในตาราง matches (เพื่อให้หน้า Admin เห็นคะแนนรายเซต)
            const allSetsRes = await client.query(`
                SELECT home_score, away_score FROM match_sets WHERE match_id = $1 ORDER BY set_number ASC
            `, [matchId]);
            const setScoresStr = JSON.stringify(allSetsRes.rows.map(s => `${s.home_score}-${s.away_score}`));

            // 3. อัปเดตคะแนนเซตรวมในตาราง matches
            // (COALESCE คือถ้าค่าเดิมเป็น null ให้ถือเป็น 0)
            const updateMatchRes = await client.query(`
                UPDATE matches 
                SET home_set_score = COALESCE(home_set_score, 0) + $1,
                    away_set_score = COALESCE(away_set_score, 0) + $2,
                    set_scores = $4
                WHERE id = $3
                RETURNING home_set_score, away_set_score, home_team_id, away_team_id
            `, [homeSetWin, awaySetWin, matchId, setScoresStr]);

            const matchData = updateMatchRes.rows[0];
            const currentHomeSets = matchData.home_set_score;
            const currentAwaySets = matchData.away_set_score;

            // 4. ตรวจสอบเงื่อนไขจบการแข่งขัน (คำนวณจาก max_sets ของการแข่งขัน)
            const matchInfoRes = await client.query(`
                SELECT m.home_team_id, m.away_team_id, c.max_sets 
                FROM matches m
                LEFT JOIN competitions c ON m.competition_id = c.id
                WHERE m.id = $1
            `, [matchId]);
            
            const matchInfo = matchInfoRes.rows[0];
            const setsToWinMatch = Math.ceil(((matchInfo && matchInfo.max_sets) || 5) / 2); // Default เป็น 3 จาก 5 (ชนะ 3)

            let isMatchFinished = false;
            let winnerId = null;

            if (currentHomeSets >= setsToWinMatch) {
                isMatchFinished = true;
                winnerId = matchInfo ? matchInfo.home_team_id : matchData.home_team_id;
            } else if (currentAwaySets >= setsToWinMatch) {
                isMatchFinished = true;
                winnerId = matchInfo ? matchInfo.away_team_id : matchData.away_team_id;
            }

            // 5. ถ้าจบการแข่งขัน ให้บันทึกสถานะและผู้ชนะ
            if (isMatchFinished) {
                await client.query(`
                    UPDATE matches 
                    SET status = 'COMPLETED',
                        winner_team_id = $1
                    WHERE id = $2
                `, [winnerId, matchId]);
            }

            await client.query('COMMIT'); // ยืนยันข้อมูลลง Database

            res.json({
                success: true,
                message: isMatchFinished ? "Match Completed" : "Set Completed",
                isMatchFinished,
                winnerId,
                nextSet: setNumber + 1,
                currentScore: { home: currentHomeSets, away: currentAwaySets }
            });

        } catch (err) {
            await client.query('ROLLBACK'); // ยกเลิกถ้ามี Error
            console.error("End Set Error:", err);
            res.status(500).json({ error: "Failed to end set: " + err.message });
        } finally {
            client.release(); // คืน Connection
        }
    }

}; // ✅ ปิด module.exports