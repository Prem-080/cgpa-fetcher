export default async function sgpa(page) {
    console.log('SGPA function called with page:', !!page);

    // Function to extract credits and grades from the marks table
    const extractCreditsAndGrades = async (page) => {
        try {
            const creditsGradesData = await page.evaluate(() => {
                // Find the table containing the marks data with multiple selectors
                let table = document.querySelector('table[id*="grdSemwise"]') ||
                    document.querySelector('table[id*="GridView"]') ||
                    document.querySelector('table[id*="grd"]') ||
                    document.querySelector('table');

                if (!table) {
                    console.log('No table found with any selector');
                    // Try to find any table with grade-related content
                    const tables = document.querySelectorAll('table');
                    for (let t of tables) {
                        const tableText = t.textContent.toLowerCase();
                        if (tableText.includes('grade') || tableText.includes('credit') || tableText.includes('subject')) {
                            table = t;
                            console.log('Found table with grade/credit content');
                            break;
                        }
                    }
                }

                if (!table) {
                    console.log('No table found anywhere on page');
                    return { error: 'Table not found' };
                }

                const rows = Array.from(table.querySelectorAll('tr'));
                const creditsGrades = {};

                // Find header row to identify column positions
                let creditsColumnIndex = -1;
                let gradeColumnIndex = -1;
                let subjectColumnIndex = -1;

                for (let i = 0; i < rows.length; i++) {
                    const row = rows[i];
                    const cells = Array.from(row.querySelectorAll('th, td'));

                    // Check if this is a header row
                    const headerTexts = cells.map(cell => cell.textContent.trim().toLowerCase());

                    if (headerTexts.some(text => text.includes('credit') || text.includes('grade') || text.includes('subject'))) {
                        // Find column indices
                        headerTexts.forEach((text, index) => {
                            if (text.includes('credit')) creditsColumnIndex = index;
                            if (text.includes('grade') || text.includes('finalgrade')) gradeColumnIndex = index;
                            if (text.includes('subject')) subjectColumnIndex = index;
                        });
                        break;
                    }
                }

                // If we couldn't find headers by text, try positional approach
                if (creditsColumnIndex === -1 || gradeColumnIndex === -1) {
                    // Based on the screenshot structure: Subject(4), Grade(5), Credits(6)
                    subjectColumnIndex = 4;
                    gradeColumnIndex = 5;
                    creditsColumnIndex = 6;
                }

                console.log(`Column indices - Subject: ${subjectColumnIndex}, Grade: ${gradeColumnIndex}, Credits: ${creditsColumnIndex}`);

                // Extract data from table rows
                for (let i = 1; i < rows.length; i++) { // Skip header row
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

                            // Convert credits to number
                            const credits = parseFloat(creditsText);

                            // Only add if both grade and credits are valid
                            if (grade && !isNaN(credits) && credits > 0) {
                                // Use subject as key and store both credits and grade
                                creditsGrades[subject] = { credits, grade };

                                console.log(`Extracted: ${subject} - Credits: ${credits}, Grade: ${grade}`);
                            }
                        }
                    }
                }

                const totalEntries = Object.keys(creditsGrades).length;
                console.log(`Total entries found: ${totalEntries}`);

                if (totalEntries === 0) {
                    console.log('No valid grade/credit entries found');
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
            console.error('Error extracting credits and grades:', error);
            return { error: error.message };
        }
    };

    const result = await extractCreditsAndGrades(page);
    console.log('Extract result:', result);

    if (result.error) {
        console.error('Failed to extract credits and grades:', result.error);
        return 0;
    }

    const creditAndGrade = result.data;
    console.log('Credit and grade data:', creditAndGrade);
    const gradePoints = {
        "O": 10.00,
        "A+": 9.00,
        "A": 8.00,
        "B+": 7.00,
        "B": 6.00,
        "C": 5.00,
        "F": 0.00,
        "AB": 0.00
    };

    let totalCredits = 0;
    let totalPoints = 0;

    for (const subject in creditAndGrade) {
        const { credits, grade } = creditAndGrade[subject];
        const points = gradePoints[grade] || 0;
        console.log(`Subject: ${subject}, Credits: ${credits}, Grade: ${grade}, Points: ${points}`);
        totalCredits += credits;
        totalPoints += points * credits;
    }

    const finalSgpa = totalCredits > 0 ? (totalPoints / totalCredits).toFixed(2) : 0;
    console.log(`Final SGPA calculation: totalPoints=${totalPoints}, totalCredits=${totalCredits}, SGPA=${finalSgpa}`);
    return finalSgpa;


    // const sgpa = calculateSGPA(subjects);
    // console.log(`SGPA: ${sgpa}`);

}