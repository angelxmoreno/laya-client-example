import { Octokit } from '@octokit/core';
import { type CATEGORIES, labelToCategory } from './questions';

const octokit = new Octokit({ auth: process.env.GITHUB_TOKEN });

/** Fetch open issues for a repo, up to `count`, keeping only issues whose labels give us ground truth. */
export const fetchIssues = async (owner: string, repo: string, count: number) => {
    // ponytail: GitHub mixes PRs into this list; fetch a full page and take the first N real issues
    const { data } = await octokit.request('GET /repos/{owner}/{repo}/issues', {
        owner,
        repo,
        state: 'open',
        per_page: 100,
    });
    const items: { issue: (typeof data)[number]; actual: (typeof CATEGORIES)[number] }[] = [];
    for (const i of data) {
        if (i.pull_request) continue;
        const label = i.labels
            .map((l) => (typeof l === 'object' && typeof l.name === 'string' ? l.name : undefined))
            .find((name): name is keyof typeof labelToCategory => !!name && name in labelToCategory);
        if (!label) continue;
        items.push({ issue: i, actual: labelToCategory[label] });
        if (items.length === count) break; // early exit once we have enough
    }
    return items;
};
