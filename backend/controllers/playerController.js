const db = require('../config/db');

// 5. ดึงสถิติรายบุคคล (Player Stats)
exports.getPlayerStats = async (req, res) => {
    try {
        const { id } = req.params;
        
        // ดึงข้อมูลรายละเอียดนักกีฬา
        const playerRes = await db.query('SELECT first_name, last_name, number, position FROM players WHERE id = $1', [id]);

        // Query รวมยอดสถิติจาก match_actions
        // skill: A=Attack, B=Block, S=Serve, D=Dig, R=Receive
        // grade: #=Point/Ace/Kill, ==Error, !=Continue
        const stats = await db.query(`
            SELECT 
                COUNT(*) FILTER (WHERE skill = 'A') as attack_attempts,
                COUNT(*) FILTER (WHERE skill = 'A' AND grade = '#') as attack_kills,
                COUNT(*) FILTER (WHERE skill = 'A' AND grade = '=') as attack_errors,
                
                COUNT(*) FILTER (WHERE skill = 'B' AND grade = '#') as block_points,
                
                COUNT(*) FILTER (WHERE skill = 'S') as serve_attempts,
                COUNT(*) FILTER (WHERE skill = 'S' AND grade = '#') as serve_aces,
                COUNT(*) FILTER (WHERE skill = 'S' AND grade = '=') as serve_errors,
                
                COUNT(*) FILTER (WHERE skill = 'D') as digs,
                
                COUNT(*) FILTER (WHERE skill = 'R') as receptions,
                COUNT(*) FILTER (WHERE skill = 'R' AND grade = '=') as reception_errors,
                
                COUNT(*) as total_actions
            FROM match_actions
            WHERE player_id = $1
        `, [id]);

        const data = stats.rows[0] || {};
        
        // คำนวณ Efficiency %
        const attAtt = parseInt(data.attack_attempts) || 0;
        const attKill = parseInt(data.attack_kills) || 0;
        const attErr = parseInt(data.attack_errors) || 0;
        data.attack_efficiency = attAtt > 0 ? ((attKill - attErr) / attAtt * 100).toFixed(1) : 0;

        res.json(data);
        res.json({
            ...playerRes.rows[0], // เพิ่มข้อมูลนักกีฬา (ชื่อ, เบอร์, ตำแหน่ง) เข้าไปใน Response
            ...data
        });

    } catch (err) {
        console.error("Get Player Stats Error:", err);
        // ส่งค่า 0 กลับไปหากเกิดข้อผิดพลาด (เช่น ยังไม่มีตาราง match_actions)
        res.json({
            attack_attempts: 0, attack_kills: 0, attack_errors: 0,
            block_points: 0, serve_attempts: 0, serve_aces: 0, serve_errors: 0,
            digs: 0, receptions: 0, reception_errors: 0, attack_efficiency: 0
        });
    }
};