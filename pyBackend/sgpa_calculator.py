from playwright.async_api import async_playwright

GRADE_POINTS = {
    "O": 10.0,
    "A+": 9.0,
    "A": 8.0,
    "B+": 7.0,
    "B": 6.0,
    "C": 5.0,
    "F": 0.0,
    "AB": 0.0,
}


async def sgpa(page):
    print("SGPA function called with page:", page is not None)

    async def extract_credits_and_grades():
        try:
            credits_grades_data = await page.evaluate(
                """
            () => {
                let table = document.querySelector('table[id*="grdSemwise"]') ||
                            document.querySelector('table[id*="GridView"]') ||
                            document.querySelector('table[id*="grd"]') ||
                            document.querySelector('table');

                if (!table) {
                    const tables = document.querySelectorAll('table');
                    for (let t of tables) {
                        const text = t.textContent.toLowerCase();
                        if (text.includes('grade') || text.includes('credit') || text.includes('subject')) {
                            table = t;
                            break;
                        }
                    }
                }

                if (!table) return {error: 'Table not found'};

                const rows = Array.from(table.querySelectorAll('tr'));
                const creditsGrades = {};
                let creditsIndex = -1, gradeIndex = -1, subjectIndex = -1;

                for (let row of rows) {
                    const cells = Array.from(row.querySelectorAll('th, td'));
                    const headers = cells.map(c => c.textContent.trim().toLowerCase());
                    if (headers.some(h => h.includes('credit') || h.includes('grade') || h.includes('subject'))) {
                        headers.forEach((h, i) => {
                            if (h.includes('credit')) creditsIndex = i;
                            if (h.includes('grade') || h.includes('finalgrade')) gradeIndex = i;
                            if (h.includes('subject')) subjectIndex = i;
                        });
                        break;
                    }
                }

                    if (creditsIndex === -1 || gradeIndex === -1) {
                    subjectIndex = 4
                    gradeIndex = 5
                    creditsIndex = 6
                    }

                for (let i = 1; i < rows.length; i++) {
                    const cells = Array.from(rows[i].querySelectorAll('td'));
                    if (cells.length > Math.max(creditsIndex, gradeIndex)) {
                        const subject = cells[subjectIndex]?.textContent.trim() || `Subject_${i}`;
                        const grade = cells[gradeIndex]?.textContent.trim();
                        const credits = parseFloat(cells[creditsIndex]?.textContent.trim());
                        if (grade && !isNaN(credits) && credits > 0) {
                            creditsGrades[subject] = {credits:credits, grade:grade};
                        }
                    }
                }

                if (Object.keys(creditsGrades).length === 0) {
                    return {error: 'No valid grade data found in table'};
                }

                    return {success: true, data: creditsGrades, totalEntries: Object.keys(creditsGrades).length};
            }
            """
            )
            return credits_grades_data
        except Exception as e:
            print("Error extracting credits and grades:", e)
            return {"error": str(e)}

    result = await extract_credits_and_grades()
    print("Extract result:", result)

    if "error" in result:
        print("Failed to extract credits and grades:", result["error"])
        return 0

    credit_and_grade = result["data"]
    total_credits = 0
    total_points = 0

    for subject, info in credit_and_grade.items():
        credits = info["credits"]
        grade = info["grade"]
        points = GRADE_POINTS.get(grade, 0)
        print(
            f"Subject: {subject}, Credits: {credits}, Grade: {grade}, Points: {points}"
        )
        total_credits += credits
        total_points += points * credits

    final_sgpa = round(total_points / total_credits, 2) if total_credits > 0 else 0
    print(
        f"Final SGPA calculation: totalPoints={total_points}, totalCredits={total_credits}, SGPA={final_sgpa}"
    )
    return final_sgpa
