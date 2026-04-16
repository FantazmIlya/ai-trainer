import fs from "node:fs";

const CHANGELOG_PATH = "CHANGELOG.md";
const CORE_SECTIONS = ["Added", "Changed", "Fixed"];
const SEMVER_CHANGE_LEVEL = {
  patch: "patch",
  minor: "minor",
  major: "major",
};

function fail(message) {
  console.error(`CHANGELOG validation failed: ${message}`);
  process.exit(1);
}

function normalizeVersion(value) {
  return value.replace(/^v/, "");
}

function parseSemver(version) {
  const match = normalizeVersion(version).match(/^(\d+)\.(\d+)\.(\d+)(?:[.-][0-9A-Za-z.-]+)?$/);
  if (!match) {
    return null;
  }

  return {
    major: Number(match[1]),
    minor: Number(match[2]),
    patch: Number(match[3]),
  };
}

function bumpSemver(version, level) {
  const parsed = parseSemver(version);
  if (!parsed) {
    return "0.1.0";
  }

  if (level === SEMVER_CHANGE_LEVEL.major) {
    return `${parsed.major + 1}.0.0`;
  }

  if (level === SEMVER_CHANGE_LEVEL.minor) {
    return `${parsed.major}.${parsed.minor + 1}.0`;
  }

  return `${parsed.major}.${parsed.minor}.${parsed.patch + 1}`;
}

function todayIsoDate() {
  return new Date().toISOString().slice(0, 10);
}

function parseChangelog(content) {
  const normalized = content.replace(/\r\n/g, "\n");
  const headingRegex = /^##\s+\[(.+?)\](?:\s+-\s+(\d{4}-\d{2}-\d{2}))?\s*$/gm;
  const matches = [...normalized.matchAll(headingRegex)];

  if (matches.length === 0) {
    fail("No section headings found. Expected headings like '## [Unreleased]' or '## [1.2.3] - YYYY-MM-DD'.");
  }

  const sections = matches.map((match, index) => {
    const start = match.index + match[0].length;
    const end = index + 1 < matches.length ? matches[index + 1].index : normalized.length;

    return {
      rawTitle: match[1],
      normalizedTitle: normalizeVersion(match[1]),
      date: match[2] ?? null,
      body: normalized.slice(start, end).trim(),
    };
  });

  return sections;
}

function validateSectionBasics(section) {
  if (section.normalizedTitle.toLowerCase() === "unreleased") {
    return;
  }

  if (!/^\d+\.\d+\.\d+([.-][0-9A-Za-z.-]+)?$/.test(section.normalizedTitle)) {
    fail(`Section [${section.rawTitle}] is not a valid semantic version.`);
  }

  if (!section.date) {
    fail(`Release section [${section.rawTitle}] must include a date in format YYYY-MM-DD.`);
  }

  if (section.date > todayIsoDate()) {
    fail(`Release section [${section.rawTitle}] has future date ${section.date}.`);
  }
}

function collectSubsectionBodies(sectionBody) {
  const subsectionRegex = /^###\s+([A-Za-z][A-Za-z\s-]*)\s*$/gm;
  const matches = [...sectionBody.matchAll(subsectionRegex)];

  return matches.map((match, index) => {
    const start = match.index + match[0].length;
    const end = index + 1 < matches.length ? matches[index + 1].index : sectionBody.length;
    return {
      title: match[1].trim(),
      body: sectionBody.slice(start, end).trim(),
    };
  });
}

function hasBulletList(text) {
  return /^-\s+.+$/m.test(text);
}

function extractBullets(text) {
  const matches = [...text.matchAll(/^\s*-\s+(.+)$/gm)];
  return matches.map((match) => match[1].trim());
}

function isPlaceholderBullet(value) {
  return /^(none|none\.|n\/a|n\.a\.|not applicable|tbd|to be defined|no changes|nothing|nil)$/i.test(value.trim());
}

function isBreakingBullet(value) {
  return /(\bbreaking\b|!:|\bbreaking change\b)/i.test(value);
}

function getCoreSubsections(section) {
  return collectSubsectionBodies(section.body).filter((part) => CORE_SECTIONS.includes(part.title));
}

function getBulletsByCoreSection(section) {
  const result = {
    Added: [],
    Changed: [],
    Fixed: [],
  };

  for (const part of getCoreSubsections(section)) {
    result[part.title] = extractBullets(part.body);
  }

  return result;
}

function detectRequiredSemverLevel(section) {
  const bullets = getBulletsByCoreSection(section);
  const allBullets = [...bullets.Added, ...bullets.Changed, ...bullets.Fixed];

  if (allBullets.some(isBreakingBullet)) {
    return SEMVER_CHANGE_LEVEL.major;
  }

  const hasFeatureBullets = bullets.Added.some((item) => !isPlaceholderBullet(item));
  if (hasFeatureBullets) {
    return SEMVER_CHANGE_LEVEL.minor;
  }

  return SEMVER_CHANGE_LEVEL.patch;
}

function detectActualSemverBump(previousVersion, currentVersion) {
  const previous = parseSemver(previousVersion);
  const current = parseSemver(currentVersion);

  if (!previous || !current) {
    return null;
  }

  if (current.major === previous.major + 1 && current.minor === 0 && current.patch === 0) {
    return SEMVER_CHANGE_LEVEL.major;
  }

  if (current.major === previous.major && current.minor === previous.minor + 1 && current.patch === 0) {
    return SEMVER_CHANGE_LEVEL.minor;
  }

  if (current.major === previous.major && current.minor === previous.minor && current.patch === previous.patch + 1) {
    return SEMVER_CHANGE_LEVEL.patch;
  }

  return "invalid";
}

function validateSemverBumpPolicy(section, previousSection) {
  const requiredLevel = detectRequiredSemverLevel(section);
  const actualLevel = detectActualSemverBump(previousSection.normalizedTitle, section.normalizedTitle);

  if (!actualLevel || actualLevel === "invalid") {
    fail(
      `Section [${section.rawTitle}] must increment version from previous release [${previousSection.rawTitle}] by exactly one semantic step (patch, minor, or major).`,
    );
  }

  if (actualLevel !== requiredLevel) {
    const recommended = bumpSemver(previousSection.normalizedTitle, requiredLevel);
    fail(
      `Section [${section.rawTitle}] requires ${requiredLevel} bump based on changelog entries, but actual bump is ${actualLevel}. Expected version example: [${recommended}].`,
    );
  }
}

function validateCoreSectionStructure(section, options) {
  const { requireAllCoreSections, disallowPlaceholderBullets } = options;
  const subsections = collectSubsectionBodies(section.body);

  if (subsections.length === 0) {
    fail(`Section [${section.rawTitle}] must contain subsection headings (for example: ### Added).`);
  }

  const subsectionNames = new Set(subsections.map((part) => part.title));
  const presentCore = CORE_SECTIONS.filter((name) => subsectionNames.has(name));

  if (requireAllCoreSections) {
    const missing = CORE_SECTIONS.filter((name) => !subsectionNames.has(name));
    if (missing.length > 0) {
      fail(`Section [${section.rawTitle}] is missing required subsections: ${missing.join(", ")}.`);
    }
  } else if (presentCore.length === 0) {
    fail(`Section [${section.rawTitle}] must include at least one of: ${CORE_SECTIONS.join(", ")}.`);
  }

  for (const part of subsections) {
    if (!CORE_SECTIONS.includes(part.title)) {
      continue;
    }

    if (!hasBulletList(part.body)) {
      fail(`Subsection '${part.title}' in [${section.rawTitle}] must contain at least one bullet item.`);
    }

    if (disallowPlaceholderBullets) {
      const bullets = extractBullets(part.body);
      const placeholder = bullets.find(isPlaceholderBullet);
      if (placeholder) {
        fail(
          `Subsection '${part.title}' in [${section.rawTitle}] contains placeholder bullet '${placeholder}'. Replace it with a real change item before production promotion.`,
        );
      }
    }
  }
}

if (!fs.existsSync(CHANGELOG_PATH)) {
  fail("CHANGELOG.md not found.");
}

const content = fs.readFileSync(CHANGELOG_PATH, "utf8");
const sections = parseChangelog(content);
const unreleased = sections.find((section) => section.normalizedTitle.toLowerCase() === "unreleased");

if (!unreleased) {
  fail("Missing [Unreleased] section.");
}

for (const section of sections) {
  validateSectionBasics(section);
}

const releaseTag = process.env.RELEASE_TAG?.trim();
const requireAllCoreSections = String(process.env.REQUIRE_ALL_CORE_SECTIONS || "false").toLowerCase() === "true";
const enforceSemverBumpPolicy = String(process.env.ENFORCE_SEMVER_BUMP_POLICY || "false").toLowerCase() === "true";

if (releaseTag) {
  const targetVersion = normalizeVersion(releaseTag);
  const targetSection = sections.find((section) => section.normalizedTitle === targetVersion);
  const firstReleaseSection = sections.find((section) => section.normalizedTitle.toLowerCase() !== "unreleased");

  if (!targetSection) {
    fail(`Could not find section for ${releaseTag}. Expected heading like '## [${targetVersion}] - YYYY-MM-DD'.`);
  }

  if (!firstReleaseSection) {
    fail("No release section found. Add at least one release entry below [Unreleased].");
  }

  if (firstReleaseSection.normalizedTitle !== targetVersion) {
    fail(
      `Release tag ${releaseTag} must match the first release section in CHANGELOG.md ([${firstReleaseSection.rawTitle}]).`,
    );
  }

  validateCoreSectionStructure(targetSection, {
    requireAllCoreSections,
    disallowPlaceholderBullets: true,
  });

  if (enforceSemverBumpPolicy) {
    const releaseSections = sections.filter((section) => section.normalizedTitle.toLowerCase() !== "unreleased");
    const targetIndex = releaseSections.findIndex((section) => section.normalizedTitle === targetVersion);
    const previousRelease = targetIndex >= 0 ? releaseSections[targetIndex + 1] : null;

    if (previousRelease) {
      validateSemverBumpPolicy(targetSection, previousRelease);
      console.log(
        `Semver bump policy passed for ${releaseTag}: ${targetSection.normalizedTitle} over ${previousRelease.normalizedTitle}.`,
      );
    } else {
      console.log(`Semver bump policy skipped for ${releaseTag}: no previous release section to compare.`);
    }
  }

  console.log(`CHANGELOG section for ${releaseTag} is valid and aligned with first release section.`);
  process.exit(0);
}

for (const section of sections) {
  validateCoreSectionStructure(section, {
    requireAllCoreSections: false,
    disallowPlaceholderBullets: false,
  });
}

console.log("CHANGELOG structure is valid.");