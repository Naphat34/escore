import { jsPDF } from 'jspdf';
import 'jspdf-autotable';

/**
 * Generate FIVB Style Scoresheet PDF
 * @param {Object} data - The comprehensive match data from backend
 */
export const generateScoresheetPDF = (data) => {
    const { match, sets, lineups, homePlayers, awayPlayers, events } = data;
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
    const setHeight = 60;
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
        const awayLineup = lineups.find(l => l.set_number === i && String(l.team_id) === String(match.away_team_id));
        
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

    const resultColumns = [
        { header: 'Set', dataKey: 'set' },
        { header: 'Score A', dataKey: 'scoreA' },
        { header: 'Score B', dataKey: 'scoreB' },
        { header: 'Dur min', dataKey: 'duration' }
    ];

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
