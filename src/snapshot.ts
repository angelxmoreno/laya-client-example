import { Octokit } from '@octokit/core';
import { labelToCategory } from './questions';

const octokit = new Octokit({ auth: process.env.GITHUB_TOKEN });

/** Fetch labeled issues once and snapshot them, so both prompt variants grade identical data. */
const main = async () => {
    const items: { number: number; title: string; body: string; actual: string }[] = [];
    for (let page = 1; items.length < 50 && page <= 10; page++) {
        const { data } = await octokit.request('GET /repos/{owner}/{repo}/issues', {
            owner: 'oven-sh',
            repo: 'bun',
            state: 'open',
            per_page: 100,
            page,
        });
        for (const i of data) {
            if (i.pull_request) continue;
            const label = i.labels
                .map((l) => (typeof l === 'object' && typeof l.name === 'string' ? l.name : undefined))
                .find((name): name is keyof typeof labelToCategory => !!name && name in labelToCategory);
            if (!label) continue;
            items.push({ number: i.number, title: i.title, body: i.body ?? '', actual: labelToCategory[label] });
            if (items.length >= 50) break;
        }
    }
    await Bun.write('data/issues.json', JSON.stringify(items, null, 4));
    console.log(`snapshotted ${items.length} labeled issues to data/issues.json`);
};

main();
