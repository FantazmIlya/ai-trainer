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

const LEVEL = {
  patch: "patch",
  minor: "minor",
  major: "major",
};

function fail(message) {
  console.error(`Release commit validation failed: ${message}`);
  process.exit(1);
}

function run(command) {
  return execSync(command, { encoding: "utf8" }).trim();
}

function normalizeTag(tag) {
  return String(tag || "").replace(/^v/, "");
}

function parseSemver(tag) {
  const match = normalizeTag(tag).match(/^(\d+)\.(\d+)\.(\d+)(?:[.-][0-9A-Za-z.-]+)?$/);
  if (!match) {
    return null;
  }

  return {
    major: Number(match[1]),
    minor: Number(match[2]),
    patch: Number(match[3]),
  };
}

function compareSemver(a, b) {
  if (a.major !== b.major) {
    return a.major - b.major;
  }
  if (a.minor !== b.minor) {
    return a.minor - b.minor;
  }
  return a.patch - b.patch;
}

function detectBump(previousTag, currentTag) {
  const previous = parseSemver(previousTag);
  const current = parseSemver(currentTag);

  if (!previous || !current) {
    return null;
  }

  if (current.major === previous.major + 1 && current.minor === 0 && current.patch === 0) {
    return LEVEL.major;
  }

  if (current.major === previous.major && current.minor === previous.minor + 1 && current.patch === 0) {
    return LEVEL.minor;
  }

  if (current.major === previous.major && current.minor === previous.minor && current.patch === previous.patch + 1) {
    return LEVEL.patch;
  }

  return "invalid";
}

function getSemverTags() {
  const output = run("git tag --list 'v*'");
  if (!output) {
    return [];
  }

  return output
    .split("\n")
    .map((tag) => tag.trim())
    .filter((tag) => /^v\d+\.\d+\.\d+([.-][0-9A-Za-z.-]+)?$/.test(tag));
}

function resolvePreviousTag(targetTag) {
  const targetVersion = parseSemver(targetTag);
  if (!targetVersion) {
    fail(`Invalid target tag format: ${targetTag}`);
  }

  const tags = getSemverTags()
    .filter((tag) => tag !== targetTag)
    .map((tag) => ({
      tag,
      version: parseSemver(tag),
    }))
    .filter((entry) => entry.version)
    .filter((entry) => compareSemver(entry.version, targetVersion) < 0)
    .sort((a, b) => compareSemver(a.version, b.version));

  if (tags.length === 0) {
    return null;
  }

  return tags[tags.length - 1].tag;
}

function getCommitSubjectsAndBodies(range) {
  const output = run(`git log --no-merges --pretty=format:%H%x1f%s%x1f%b%x1e ${range}`);
  if (!output) {
    return [];
  }

  return output
    .split("\u001e")
    .map((chunk) => chunk.trim())
    .filter(Boolean)
    .map((line) => {
      const [sha, subject = "", body = ""] = line.split("\u001f");
      return {
        sha,
        subject: subject.trim(),
        body: body.trim(),
      };
    });
}

function detectRequiredLevel(commits) {
  const hasBreaking = commits.some((commit) => {
    return /!:/.test(commit.subject) || /BREAKING CHANGE:/i.test(commit.body);
  });
  if (hasBreaking) {
    return LEVEL.major;
  }

  const hasFeat = commits.some((commit) => /^feat(\(|!|:)/i.test(commit.subject));
  if (hasFeat) {
    return LEVEL.minor;
  }

  return LEVEL.patch;
}

const releaseTag = process.env.RELEASE_TAG?.trim();
if (!releaseTag) {
  fail("Missing RELEASE_TAG environment variable.");
}

if (!/^v\d+\.\d+\.\d+([.-][0-9A-Za-z.-]+)?$/.test(releaseTag)) {
  fail(`RELEASE_TAG must match vX.Y.Z format, got '${releaseTag}'.`);
}

const previousTag = process.env.PREVIOUS_TAG?.trim() || resolvePreviousTag(releaseTag);
const range = previousTag ? `${previousTag}..${releaseTag}` : releaseTag;
const commits = getCommitSubjectsAndBodies(range);

if (commits.length === 0) {
  fail(`No commits found in release range '${range}'.`);
}

const invalidCommits = commits.filter((commit) => {
  return !CONVENTIONAL_SUBJECT_REGEX.test(commit.subject);
});

if (invalidCommits.length > 0) {
  console.error("Non-conventional commits in release range:");
  for (const commit of invalidCommits) {
    console.error(`- ${commit.sha.slice(0, 12)} ${commit.subject}`);
  }
  fail("All release commits must follow Conventional Commits.");
}

if (previousTag) {
  const actualBump = detectBump(previousTag, releaseTag);
  const requiredBump = detectRequiredLevel(commits);
  if (!actualBump || actualBump === "invalid") {
    fail(`Release tag ${releaseTag} must increment one semantic step from previous tag ${previousTag}.`);
  }

  if (actualBump !== requiredBump) {
    fail(
      `Release bump mismatch: commits require '${requiredBump}' bump, but ${previousTag} -> ${releaseTag} is '${actualBump}'.`,
    );
  }

  console.log(
    `Release commit policy passed for ${releaseTag}: ${commits.length} conventional commit(s), required bump '${requiredBump}'.`,
  );
} else {
  console.log(
    `Initial release policy passed for ${releaseTag}: ${commits.length} conventional commit(s). No previous tag to compare bump.`,
  );
}