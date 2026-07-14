import { debug } from './index.js';

export default async function extractCreditsAndGrades(page) {
    try {
        const creditsGradesData = await page.evaluate(() => {
            let table = document.querySelector('table[id*="grdSemwise"]') ||
                document.querySelector('table[id*="GridView"]') ||
                document.querySelector('table[id*="grd"]') ||
                document.querySelector('table');

            if (!table) {
                const tables = document.querySelectorAll('table');
                for (let t of tables) {
                    const tableText = t.textContent.toLowerCase();
                    if (tableText.includes('grade') || tableText.includes('credit') || tableText.includes('subject')) {
                        table = t;
                        break;
                    }
                }
            }

            if (!table) {
                return { error: 'Table not found' };
            }

            const rows = Array.from(table.querySelectorAll('tr'));
            const creditsGrades = {};

            let creditsColumnIndex = -1;
            let gradeColumnIndex = -1;
            let subjectColumnIndex = -1;

            for (let i = 0; i < rows.length; i++) {
                const row = rows[i];
                const cells = Array.from(row.querySelectorAll('th, td'));

                const headerTexts = cells.map(cell => cell.textContent.trim().toLowerCase());

                if (headerTexts.some(text => text.includes('credit') || text.includes('grade') || text.includes('subject'))) {
                    headerTexts.forEach((text, index) => {
                        if (text.includes('credit')) creditsColumnIndex = index;
                        if (text.includes('grade') || text.includes('finalgrade')) gradeColumnIndex = index;
                        if (text.includes('subject')) subjectColumnIndex = index;
                    });
                    break;
                }
            }

            if (creditsColumnIndex === -1 || gradeColumnIndex === -1) {
                subjectColumnIndex = 4;
                gradeColumnIndex = 5;
                creditsColumnIndex = 6;
            }

            for (let i = 1; i < rows.length; i++) {
                const row = rows[i];
                const cells = Array.from(row.querySelectorAll('td'));

                if (cells.length > Math.max(creditsColumnIndex, gradeColumnIndex)) {
                    const subjectCell = cells[subjectColumnIndex];
                    const gradeCell = cells[gradeColumnIndex];
                    const creditsCell = cells[creditsColumnIndex];

                    if (gradeCell && creditsCell) {
                        const grade = gradeCell.textContent.trim();
                        const creditsText = creditsCell.textContent.trim();
                        const subject = subjectCell ? subjectCell.textContent.trim() : `Subject_${i}`;

                        const credits = parseFloat(creditsText);

                        if (grade && !isNaN(credits) && credits > 0) {
                            creditsGrades[subject] = { credits, grade };
                        }
                    }
                }
            }

            const totalEntries = Object.keys(creditsGrades).length;

            if (totalEntries === 0) {
                return { error: 'No valid grade data found in table' };
            }

            return {
                success: true,
                data: creditsGrades,
                totalEntries: totalEntries
            };
        });

        return creditsGradesData;

    } catch (error) {
        debug(`Error extracting credits and grades: ${error.message}`);
        return { error: error.message };
    }
};
