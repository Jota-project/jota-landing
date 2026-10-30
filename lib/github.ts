export const GITHUB_ORG = "https://github.com/Jota-project";

/** Active public repos, in the order the footer lists them. */
export const GITHUB_REPOS = [
  "jota-gateway",
  "jota-transcriber",
  "jota-speaker",
  "jota-voice",
  "jota-wake-trainer",
  "jota-screen",
] as const;

export const repoUrl = (repo: (typeof GITHUB_REPOS)[number]) => `${GITHUB_ORG}/${repo}`;
