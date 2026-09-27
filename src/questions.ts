import { createDecider, type Result } from 'laya-http-client';

export const SEVERITY = ['low', 'medium', 'high'] as const;
export const CATEGORIES = ['bug', 'feature', 'docs', 'other'] as const;

/** GitHub label → ground-truth category. Issues with no match are shown but excluded from accuracy. */
export const labelToCategory = {
    bug: 'bug',
    'bug: regression': 'bug',
    crash: 'bug',
    enhancement: 'feature',
    'feature request': 'feature',
    documentation: 'docs',
    docs: 'docs',
} as const satisfies Record<string, (typeof CATEGORIES)[number]>;

export const questions = {
    urgent: {
        type: 'noul',
        instructions:
            'Should a maintainer drop everything and handle this issue now? Data loss, crashes, security problems, or broken core functionality are urgent; nice-to-haves are not.',
    },
    severity: { type: 'score', instructions: 'How severe is this issue?', criteria: [...SEVERITY] },
    category: {
        type: 'choice',
        instructions:
            'What kind of issue is this? bug: something that already shipped is broken, crashes, or behaves differently than documented. feature: a request for new behavior or a change, where nothing currently shipped is broken. docs: documentation is wrong or missing. other: anything else. A report that existing functionality misbehaves is always bug, even if the title reads like a request.',
        criteria: [...CATEGORIES],
    },
} as const;

export type Row = {
    number: number;
    title: string;
    result: Result<typeof questions>;
    actual: (typeof CATEGORIES)[number];
};

export const decide = createDecider({
    url: process.env.LAYA_URL ?? 'http://127.0.0.1:8000',
    apiKey: process.env.LAYA_API_KEY,
    timeout: 30_000,
    questions,
});
