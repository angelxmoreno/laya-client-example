import { createDecider, isLayaConnectionError } from 'laya-http-client';
import { CATEGORIES, questions as rubricQuestions, SEVERITY } from './questions';

const BARE = {
    urgent: { type: 'noul', instructions: 'Should a maintainer drop everything and handle this issue now?' },
    severity: { type: 'score', instructions: 'How severe is this issue?', criteria: [...SEVERITY] },
    category: { type: 'choice', instructions: 'What kind of issue is this?', criteria: [...CATEGORIES] },
} as const;

const variants = {
    bare: BARE,
    rubric: rubricQuestions,
} as const;

type Item = { number: number; title: string; body: string; actual: (typeof CATEGORIES)[number] };
type Row = { number: number; actual: string; predicted: string };

const items: Item[] = await Bun.file('data/issues.json').json();

const runVariant = async (questions: (typeof variants)[keyof typeof variants]): Promise<Row[]> => {
    const decide = createDecider({
        url: process.env.LAYA_URL ?? 'http://127.0.0.1:8000',
        apiKey: process.env.LAYA_API_KEY,
        timeout: 30_000,
        questions,
    });
    const rows: Row[] = [];
    for (const item of items) {
        const state = `${item.title}\n${item.body.slice(0, 2000)}`;
        try {
            const result = await decide(state);
            rows.push({ number: item.number, actual: item.actual, predicted: result.answers.category.choice });
        } catch (e) {
            if (isLayaConnectionError(e)) {
                console.error('Cannot reach the Laya server. Start it first (see README).');
                process.exit(1);
            }
            throw e;
        }
    }
    return rows;
};

const bare = await runVariant(variants.bare);
const rubric = await runVariant(variants.rubric);

for (const [name, rows] of Object.entries({ bare, rubric })) {
    const hits = rows.filter((r) => r.actual === r.predicted).length;
    console.log(`${name}: ${hits}/${rows.length} (${Math.round((hits / rows.length) * 100)}%)`);
}

console.log('\n#      ACTUAL     BARE-PRED   HIT  RUBRIC-PRED HIT');
for (const [i, b] of bare.entries()) {
    const r = rubric[i];
    if (!b || !r) continue;
    const bh = b.actual === b.predicted ? '✓' : '✗';
    const rh = r.actual === r.predicted ? '✓' : '✗';
    const flip = bh !== rh ? '  ← flip' : '';
    console.log(
        `${String(b.number).padEnd(7)} ${b.actual.padEnd(10)} ${b.predicted.padEnd(12)}${bh}    ${r.predicted.padEnd(12)}${rh}${flip}`
    );
}
