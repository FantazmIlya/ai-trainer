import { execSync } from "node:child_process";

const ALLOWED_TYPES = [
  "feat",
  "fix",
  "chore",
  "docs",
  "style",
  "refactor",
  "perf",
  "test",
  "build",
  "ci",
  "revert",
];

const CONVENTIONAL_SUBJECT_REGEX = new RegExp(
  `^(${ALLOWED_TYPES.join("|")})(\\([a-z0-9._/-]+\\))?(!)?: .+`,
  "i",
);

function fail(message) {
  console.error(`Conventional commit validation failed: ${message}`);
  process.exit(1);
}

function run(command) {
  return execSync(command, { encoding: "utf8" }).trim();
}

function parseCommitSubjects(range) {
  const output = run(`git log --no-merges --pretty=format:%H%x09%s ${range}`);
  if (!output) {
    return [];
  }

  return output
    .split("\n")
    .map((line) => {
      const [sha, ...subjectParts] = line.split("\t");
      return {
        sha,
        subject: subjectParts.join("\t").trim(),
      };
    })
    .filter((entry) => entry.sha && entry.subject);
}

const commitsRange = process.env.COMMITS_RANGE?.trim();
if (!commitsRange) {
  fail("Missing COMMITS_RANGE environment variable.");
}

const commits = parseCommitSubjects(commitsRange);
if (commits.length === 0) {
  console.log(`No commits found in range '${commitsRange}'. Skipping.`);
  process.exit(0);
}

const invalidCommits = commits.filter((commit) => {
  return !CONVENTIONAL_SUBJECT_REGEX.test(commit.subject);
});

if (invalidCommits.length > 0) {
  console.error("Found commits with non-conventional subjects:");
  for (const commit of invalidCommits) {
    console.error(`- ${commit.sha.slice(0, 12)} ${commit.subject}`);
  }
  fail("Use Conventional Commits format: type(scope?): description");
}

console.log(
  `Conventional commit check passed for ${commits.length} commit(s) in range '${commitsRange}'.`,
);