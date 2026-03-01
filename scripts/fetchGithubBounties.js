// simple script to pull open issues from a specific GitHub repo and output them as
// bounty objects similar to the frontend ExploreBounties component.  Useful for
// debugging or pre-populating mock data.

// node-fetch v3 is ESM-only; lazily load its default export for compatibility
const fetch = (...args) => import('node-fetch').then(({default: fetch}) => fetch(...args));
const { ethers } = require('ethers');

const OWNER = 'subodh-thallada';
const REPO = 'US-Elections-2024';
const API_URL = `https://api.github.com/repos/${OWNER}/${REPO}/issues?state=open`;

function getDifficultyFromLabels(labels) {
  const names = labels.map(l => l.name.toLowerCase());
  if (names.includes('easy')) return 'easy';
  if (names.includes('medium')) return 'medium';
  if (names.includes('hard')) return 'hard';
  if (names.includes('expert')) return 'expert';
  return 'medium';
}

async function main() {
  try {
    const res = await fetch(API_URL);
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const issues = await res.json();
    const bounties = issues.map(issue => ({
      id: `gh-${issue.id}`,
      projectId: `${OWNER}/${REPO}`,
      issueId: issue.number.toString(),
      issueNumber: issue.number.toString(),
      issueTitle: issue.title,
      projectName: REPO,
      amount: ethers.utils.parseUnits('500', 18),
      difficultyLevel: getDifficultyFromLabels(issue.labels || []),
      createdAt: new Date(issue.created_at).getTime(),
      issueUrl: issue.html_url,
    }));
    console.log(JSON.stringify(bounties, null, 2));
  } catch (err) {
    console.error('Failed to fetch issues:', err);
    process.exit(1);
  }
}

main();
