import { jsPDF } from 'jspdf';
import 'jspdf-autotable';

/**
 * Generate FIVB Style Scoresheet PDF
 * @param {Object} data - The comprehensive match data from backend
 */
export const generateScoresheetPDF = (data) => {
    const { match, sets, lineups, homePlayers } = data;
    const doc = new jsPDF({
        orientation: 'landscape',
        unit: 'mm',
        format: 'a4'
    });

    // Helper: Draw box with text
    const drawBox = (x, y, w, h, text, fontSize = 8, align = 'center', bold = false) => {
        doc.rect(x, y, w, h);
        if (text) {
            doc.setFontSize(fontSize);
            doc.setFont('helvetica', bold ? 'bold' : 'normal');
            const ty = y + (h / 2) + (fontSize / 4);
            if (align === 'center') doc.text(String(text), x + w / 2, ty, { align: 'center' });
            else doc.text(String(text), x + 2, ty);
        }
    };

    // --- HEADER SECTION ---
    doc.setFontSize(16);
    doc.setFont('helvetica', 'bold');
    doc.text('VOLLEYBALL SCORESHEET', 148, 15, { align: 'center' });
    
    doc.setFontSize(10);
    doc.text(`Competition: ${match.competition_name || ''}`, 20, 25);
    doc.text(`Venue: ${match.location || ''}`, 20, 30);
    doc.text(`City: ${match.city || 'Bangkok'}`, 250, 25, { align: 'right' });
    doc.text(`Date: ${match.start_time ? new Date(match.start_time).toLocaleDateString() : ''}`, 20, 35);
    doc.text(`Match No: ${match.match_number || '-'}`, 100, 35);
    doc.text(`Pool: ${match.pool_name || '-'}`, 150, 35);
    doc.text(`Phase: ${match.round_name || '-'}`, 200, 35);

    // --- TEAMS SECTION ---
    doc.setLineWidth(0.5);
    drawBox(20, 40, 120, 10, `(A) ${match.home_team_name}`, 12, 'left', true);
    drawBox(157, 40, 120, 10, `(B) ${match.away_team_name}`, 12, 'left', true);

    // --- SETS TABLES (1-5) ---
    const setWidth = 52;
    const startY = 55;

    for (let i = 1; i <= 5; i++) {
        const x = 20 + (i - 1) * (setWidth + 3);
        const setData = sets.find(s => s.set_number === i);
        
        // Set Title
        drawBox(x, startY, setWidth, 6, `SET ${i}`, 10, 'center', true);
        
        // Lineup Headers
        const headerY = startY + 6;
        for (let j = 0; j < 6; j++) {
            drawBox(x + (j * (setWidth / 6)), headerY, setWidth / 6, 6, `P${j + 1}`, 7);
        }

        // Starting Lineup
        const homeLineup = lineups.find(l => l.set_number === i && String(l.team_id) === String(match.home_team_id));
        
        const lineupY = headerY + 6;
        const positions = ['player_id_p1', 'player_id_p2', 'player_id_p3', 'player_id_p4', 'player_id_p5', 'player_id_p6'];
        
        // Draw Home starting lineup numbers
        for (let j = 0; j < 6; j++) {
            const pId = homeLineup ? homeLineup[positions[j]] : null;
            const p = pId ? homePlayers.find(pl => String(pl.id) === String(pId)) : null;
            drawBox(x + (j * (setWidth / 6)), lineupY, setWidth / 6, 8, p ? p.number : '');
        }

        // Points area (Simplified - just a few boxes for subs)
        const subY = lineupY + 8;
        doc.setFontSize(6);
        doc.text('Substitutions', x + 2, subY + 4);
        for (let row = 0; row < 2; row++) {
            for (let col = 0; col < 6; col++) {
                drawBox(x + (col * (setWidth / 6)), subY + 6 + (row * 6), setWidth / 6, 6, '');
            }
        }

        // Score display
        if (setData) {
            doc.setFontSize(10);
            doc.setFont('helvetica', 'bold');
            doc.text(`${setData.home_score} - ${setData.away_score}`, x + setWidth / 2, subY + 25, { align: 'center' });
            doc.setFontSize(7);
            doc.text(`${setData.duration_minutes || 0} min`, x + setWidth / 2, subY + 30, { align: 'center' });
        }
    }

    // --- SUMMARY TABLE (RESULTS) ---
    const resultsY = 130;
    doc.setFontSize(12);
    doc.setFont('helvetica', 'bold');
    doc.text('MATCH RESULTS', 20, resultsY - 5);

    const resultRows = sets.map(s => ({
        set: s.set_number,
        scoreA: s.home_score,
        scoreB: s.away_score,
        duration: s.duration_minutes
    }));

    // Add total row
    const totalHome = sets.reduce((sum, s) => sum + s.home_score, 0);
    const totalAway = sets.reduce((sum, s) => sum + s.away_score, 0);
    const totalDur = sets.reduce((sum, s) => sum + (s.duration_minutes || 0), 0);
    
    resultRows.push({
        set: 'TOTAL',
        scoreA: totalHome,
        scoreB: totalAway,
        duration: totalDur
    });

    doc.autoTable({
        startY: resultsY,
        head: [['Set', 'Home Score', 'Away Score', 'Duration']],
        body: resultRows.map(r => [r.set, r.scoreA, r.scoreB, r.duration]),
        margin: { left: 20 },
        tableWidth: 120,
        theme: 'grid',
        headStyles: { fillGray: 200, textColor: 0, fontStyle: 'bold' }
    });

    // --- OFFICIALS SECTION ---
    const officialsY = 130;
    const officialsX = 150;
    doc.setFontSize(12);
    doc.text('OFFICIALS', officialsX, officialsY - 5);
    
    const officialData = [
        ['1st Referee', `${match.r1_firstname || '-'} ${match.r1_lastname || ''}`, match.r1_country || '-'],
        ['2nd Referee', `${match.r2_firstname || '-'} ${match.r2_lastname || ''}`, match.r2_country || '-'],
        ['Scorer', `${match.scorer_firstname || '-'} ${match.scorer_lastname || ''}`, match.scorer_country || '-'],
        ['Asst Scorer', `${match.assistant_scorer_name || '-'}`, match.assistant_scorer_country || '-']
    ];

    doc.autoTable({
        startY: officialsY,
        head: [['Position', 'Name', 'Country']],
        body: officialData,
        margin: { left: officialsX },
        tableWidth: 120,
        theme: 'grid',
        headStyles: { fillGray: 200, textColor: 0, fontStyle: 'bold' }
    });

    // --- FINAL RESULT ---
    const finalY = doc.lastAutoTable.finalY + 10;
    doc.setFontSize(14);
    doc.setFont('helvetica', 'bold');
    const winnerName = match.home_set_score > match.away_set_score ? match.home_team_name : match.away_team_name;
    doc.text(`WINNER: ${winnerName} (${match.home_set_score}-${match.away_set_score})`, 148, finalY, { align: 'center' });

    // Save PDF
    const filename = `Scoresheet_Match_${match.match_number || match.id}.pdf`;
    doc.save(filename);
};

/**
 * Generate FIVB Style Match Roster PDF
 * @param {Object} data - Match, Home, Away data from backend
 */
export const generateMatchRosterPDF = (data) => {
    const { match, home, away } = data;
    const doc = new jsPDF({
        orientation: 'portrait',
        unit: 'mm',
        format: 'a4'
    });

    const drawBox = (x, y, w, h, text, fontSize = 8, align = 'center', bold = false) => {
        doc.rect(x, y, w, h);
        if (text) {
            doc.setFontSize(fontSize);
            doc.setFont('helvetica', bold ? 'bold' : 'normal');
            const ty = y + (h / 2) + (fontSize / 4) - 0.5;
            if (align === 'center') doc.text(String(text), x + w / 2, ty, { align: 'center' });
            else doc.text(String(text), x + 2, ty);
        }
    };

    // --- HEADER ---
    doc.setFontSize(10);
    doc.setFont('helvetica', 'bold');
    doc.rect(10, 10, 190, 25);
    doc.text(`Name of the Competition :`, 12, 15);
    doc.setFont('helvetica', 'normal');
    doc.text(match.competition_title || match.competition_name || '', 55, 15);

    // City, Hall, etc.
    drawBox(10, 18, 10, 6, 'City', 7, 'left');
    drawBox(20, 18, 50, 6, match.stadium_city || '', 8, 'left');
    drawBox(70, 18, 30, 6, 'Country Code :', 7, 'left');
    drawBox(100, 18, 20, 6, match.home_team_code || '', 8, 'center', true);
    
    drawBox(120, 18, 10, 6, 'Date', 7, 'left');
    const dateStr = match.start_time ? new Date(match.start_time).toLocaleDateString() : '';
    drawBox(130, 18, 30, 6, dateStr, 8, 'center');
    
    drawBox(160, 18, 10, 6, 'Time', 7, 'left');
    const timeStr = match.start_time ? new Date(match.start_time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: false }) : '';
    drawBox(170, 18, 30, 6, timeStr, 8, 'center');

    drawBox(10, 24, 10, 6, 'Hall', 7, 'left');
    drawBox(20, 24, 50, 6, match.stadium_name || '', 8, 'left');
    drawBox(70, 24, 20, 6, 'Pool/Phase', 7, 'left');
    drawBox(90, 24, 20, 6, match.pool_name || match.round_name || '', 8, 'center');
    drawBox(110, 24, 20, 6, 'Match No.', 7, 'left');
    drawBox(130, 24, 10, 6, match.match_number || '', 8, 'center', true);

    // Division & Category (Simplified checkboxes)
    doc.setFontSize(8);
    doc.text('Division :', 12, 33);
    doc.text('Men', 25, 33); doc.rect(32, 30, 4, 4); if (match.competition_gender === 'Male') doc.text('X', 33, 33);
    doc.text('Women', 40, 33); doc.rect(52, 30, 4, 4); if (match.competition_gender === 'Female') doc.text('X', 53, 33);

    doc.text('Category :', 70, 33);
    doc.text('Senior', 85, 33); doc.rect(95, 30, 4, 4); if (match.age_group_name === 'Senior' || !match.age_group_name) doc.text('X', 96, 33);
    doc.text('Junior', 105, 33); doc.rect(115, 30, 4, 4); if (match.age_group_name === 'Junior') doc.text('X', 116, 33);
    doc.text('Youth', 125, 33); doc.rect(135, 30, 4, 4); if (match.age_group_name === 'Youth') doc.text('X', 136, 33);

    // --- TEAMS HEADER ---
    const tableY = 38;
    drawBox(10, tableY, 20, 10, '(A)', 14, 'center', true);
    drawBox(30, tableY, 65, 10, match.home_team_code || match.home_team_name, 12, 'center', true);
    drawBox(95, tableY, 20, 10, 'TEAMS', 8, 'center');
    drawBox(115, tableY, 65, 10, match.away_team_code || match.away_team_name, 12, 'center', true);
    drawBox(180, tableY, 20, 10, '(B)', 14, 'center', true);

    // --- PLAYERS TABLE ---
    const rowH = 6;
    const col1W = 10;
    const col2W = 75;
    const startTableY = tableY + 10;

    // Headers
    drawBox(10, startTableY, col1W, rowH, 'No.', 7);
    drawBox(20, startTableY, col2W, rowH, 'Name of the player', 7);
    drawBox(105, startTableY, col1W, rowH, 'No.', 7);
    drawBox(115, startTableY, col2W, rowH, 'Name of the player', 7);

    // Regular Players
    const homeRegular = home.players.filter(p => p.position !== 'L');
    const awayRegular = away.players.filter(p => p.position !== 'L');

    for (let i = 0; i < 12; i++) {
        const y = startTableY + rowH + (i * rowH);
        const hp = homeRegular[i];
        drawBox(10, y, col1W, rowH, hp ? hp.number : '');
        let hpName = hp ? `${hp.first_name} ${hp.last_name}` : '';
        if (hp?.is_captain) hpName += ' (C)';
        drawBox(20, y, col2W, rowH, hpName, 8, 'left');

        const ap = awayRegular[i];
        drawBox(105, y, col1W, rowH, ap ? ap.number : '');
        let apName = ap ? `${ap.first_name} ${ap.last_name}` : '';
        if (ap?.is_captain) apName += ' (C)';
        drawBox(115, y, col2W, rowH, apName, 8, 'left');
    }

    // --- LIBERO SECTION ---
    const liberoY = startTableY + rowH + (12 * rowH);
    drawBox(10, liberoY, 190, 6, 'LIBERO PLAYERS ("L")', 8, 'center', true);
    
    const homeLiberos = home.players.filter(p => p.position === 'L');
    const awayLiberos = away.players.filter(p => p.position === 'L');

    for (let i = 0; i < 2; i++) {
        const y = liberoY + 6 + (i * rowH);
        const hl = homeLiberos[i];
        drawBox(10, y, col1W, rowH, hl ? hl.number : '');
        drawBox(20, y, col2W, rowH, hl ? `${hl.first_name} ${hl.last_name}` : '', 8, 'left');

        const al = awayLiberos[i];
        drawBox(105, y, col1W, rowH, al ? al.number : '');
        drawBox(115, y, col2W, rowH, al ? `${al.first_name} ${al.last_name}` : '', 8, 'left');
    }

    // --- OFFICIALS SECTION ---
    const officialsY = liberoY + 6 + (2 * rowH) + 2;
    drawBox(10, officialsY, 190, 6, 'OFFICIALS', 8, 'center', true);

    const roles = [
        { key: 'Head Coach', label: 'C' },
        { key: 'Assistant Coach', label: 'AC1' },
        { key: 'Assistant Coach', label: 'AC2' },
        { key: 'Trainer', label: 'T' },
        { key: 'Medical', label: 'M' }
    ];

    roles.forEach((role, i) => {
        const y = officialsY + 6 + (i * rowH);
        const hs = home.staff.find(s => s.role === role.key);
        drawBox(10, y, 75, rowH, hs ? `${hs.first_name} ${hs.last_name}` : '', 7, 'left');
        drawBox(85, y, 30, rowH, role.label, 8, 'center', true);
        const as = away.staff.find(s => s.role === role.key);
        drawBox(115, y, 75, rowH, as ? `${as.first_name} ${as.last_name}` : '', 7, 'left');
    });

    // --- SIGNATURES ---
    const sigY = officialsY + 6 + (5 * rowH) + 4;
    drawBox(10, sigY, 190, 6, 'SIGNATURES', 8, 'center', true);
    drawBox(10, sigY + 6, 95, 12, 'Team Captain', 7, 'left');
    drawBox(105, sigY + 6, 95, 12, 'Team Captain', 7, 'left');
    drawBox(10, sigY + 18, 95, 12, 'Coach', 7, 'left');
    drawBox(105, sigY + 18, 95, 12, 'Coach', 7, 'left');

    doc.setFontSize(6);
    doc.text(`Generated: ${new Date().toLocaleString()}`, 10, 290);
    doc.text('E-Score Standard (2024)', 180, 290, { align: 'right' });
    doc.save(`Roster_${match.match_number || 'Match'}.pdf`);
};
