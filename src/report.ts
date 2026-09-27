import { Table } from 'console-table-printer';
import { type Row, SEVERITY } from './questions';

// ponytail: cap column width so wide titles don't blow out terminal width
const truncate = (s: string, n: number) => (s.length > n ? `${s.slice(0, n - 1)}…` : s);

export const printTable = (rows: Row[]) => {
    const table = new Table({
        columns: [
            { name: '#', alignment: 'left' },
            { name: 'Title', alignment: 'left' },
            { name: 'Urgency', alignment: 'left' },
            { name: 'Severity', alignment: 'left' },
            { name: 'Predicted', alignment: 'left' },
            { name: 'Actual', alignment: 'left' },
            { name: 'Hit', alignment: 'left' },
        ],
    });
    let hits = 0;
    for (const { number, title, result, actual } of rows) {
        const { urgent, severity, category } = result.answers;
        const hit = actual === category.choice;
        table.addRow(
            {
                '#': number,
                Title: truncate(title, 60),
                Urgency: urgent.noul.toFixed(2),
                Severity: SEVERITY[Math.round(severity.score)] ?? String(severity.score),
                Predicted: category.choice,
                Actual: actual,
                Hit: hit ? '✓' : '✗',
            },
            { color: hit ? 'green' : 'red' }
        );
        if (hit) hits++;
    }
    table.printTable();
    const graded = rows.length;
    console.log(`\ncategory accuracy: ${hits}/${graded} (${Math.round((hits / graded) * 100)}%)`);
};
