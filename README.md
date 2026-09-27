# laya-client-example

Example CLI that exercises [laya-http-client](https://www.npmjs.com/package/laya-http-client): fetches GitHub issues, asks Laya to triage each one (urgency, severity, category), then grades the category predictions against the repo's labels.

## Setup

```bash
bun install
cp .env.example .env   # fill in GITHUB_TOKEN; LAYA_API_KEY optional
```

Start the Laya server (MLX sidecar) first — see the [laya-mlx-client](https://github.com/angelxmoreno/laya-mlx-client) README.

## Run

```bash
bun run src/index.ts <owner/repo> [count]
```

Ground truth comes from GitHub labels only: `bug`/`crash` → bug, `enhancement`/`feature request` → feature, `documentation`/`docs` → docs. Unlabeled issues print with `-` and don't count toward accuracy.

Accuracy is one small sample against one model — directional, not a benchmark.