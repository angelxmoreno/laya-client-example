import { isLayaConnectionError } from 'laya-http-client';
import { fetchIssues } from './issues';
import { decide, type Row } from './questions';
import { printTable } from './report';

const [owner, repo] = (Bun.argv[2] ?? 'oven-sh/bun').split('/');
const count = Number(Bun.argv[3] ?? 10);
if (!owner || !repo) {
    console.error('usage: bun run src/index.ts <owner/repo> [count]');
    process.exit(1);
}

const items = await fetchIssues(owner, repo, count);

const rows: Row[] = [];
for (const { issue, actual } of items) {
    const state = `${issue.title}\n${(issue.body ?? '').slice(0, 2000)}`;
    try {
        rows.push({ number: issue.number, title: issue.title, result: await decide(state), actual });
    } catch (e) {
        if (isLayaConnectionError(e)) {
            console.error('Cannot reach the Laya server. Start it first (see README).');
            process.exit(1);
        }
        throw e;
    }
}

printTable(rows);
