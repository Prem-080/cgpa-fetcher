import { debug } from './index.js';
import extractCreditsAndGrades from './extractCreditsAndGrades.js';

export default async function sgpa(page) {
    const result = await extractCreditsAndGrades(page);

    if (result.error) {
        debug(`SGPA failed: ${result.error}`);
        return 0;
    }

    const creditAndGrade = result.data;
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
        totalCredits += credits;
        totalPoints += points * credits;
    }

    const finalSgpa = totalCredits > 0 ? (totalPoints / totalCredits).toFixed(2) : 0;
    debug(`SGPA calculated: ${finalSgpa}`);
    return finalSgpa;
}