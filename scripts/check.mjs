#!/usr/bin/env node
// Structural check for the wippaCORE repository. Zero dependencies.
import { existsSync, readFileSync, readdirSync, statSync } from "node:fs"
import { join } from "node:path"
import { fileURLToPath } from "node:url"

const ROOT = fileURLToPath(new URL("../", import.meta.url))
const errors = []

function assert(condition, message) {
  if (!condition) errors.push(message)
}

function read(path) {
  return readFileSync(join(ROOT, path), "utf8")
}

function isFile(path) {
  return existsSync(join(ROOT, path)) && statSync(join(ROOT, path)).isFile()
}

function isDirectory(path) {
  return existsSync(join(ROOT, path)) && statSync(join(ROOT, path)).isDirectory()
}

/** Every Markdown file under a directory, recursively, relative to it. */
function markdownFilesUnder(path, prefix = "") {
  const files = []
  for (const entry of readdirSync(join(ROOT, path, prefix), { withFileTypes: true })) {
    const relative = prefix === "" ? entry.name : `${prefix}/${entry.name}`
    if (entry.isDirectory()) files.push(...markdownFilesUnder(path, relative))
    else if (entry.isFile() && entry.name.endsWith(".md")) files.push(relative)
  }
  return files.sort()
}

/** The body under `## Playbooks`, up to the next level-two heading. */
function playbooksSection(text) {
  const lines = text.split("\n")
  const start = lines.findIndex((line) => line.trim() === "## Playbooks")
  if (start === -1) return ""
  const end = lines.findIndex((line, index) => index > start && /^##\s/.test(line))
  return lines.slice(start + 1, end === -1 ? lines.length : end).join("\n")
}

/** Rows of the form `| Topic | `file.md` |`, excluding the header row. */
function playbookRows(section) {
  const rows = []
  for (const line of section.split("\n")) {
    const match = /^\|\s*(.+?)\s*\|\s*`([^`]+\.md)`\s*\|\s*$/.exec(line)
    if (match === null || match[1] === "Topic") continue
    rows.push({ topic: match[1], file: match[2] })
  }
  return rows
}

/** The text of the first level-one heading, or null. */
function firstHeading(text) {
  for (const line of text.split("\n")) {
    if (line.startsWith("# ")) return line.slice(2).trim()
  }
  return null
}

/** Link targets of the form `references/name.md` in a Markdown file. */
function referenceLinks(text) {
  return [...text.matchAll(/\]\((references\/[^)\s]+\.md)\)/g)].map((match) => match[1])
}

/** Every file under a references folder is linked exactly once from its SKILL.md. */
function checkSkillIndex(skill, label = skill) {
  const skillFile = `playbooks/${skill}/SKILL.md`
  assert(isFile(skillFile), `${skillFile}: missing`)
  if (!isFile(skillFile)) return 0

  const text = read(skillFile)
  const targets = referenceLinks(text)
  const references = `playbooks/${skill}/references`

  if (!isDirectory(references)) {
    assert(/^## Playbooks$/m.test(text), `${skill}: no references folder and no ## Playbooks section`)
    return 0
  }

  const files = markdownFilesUnder(references)
  for (const target of targets) {
    assert(isFile(`playbooks/${skill}/${target}`), `${label}: SKILL.md links ${target}, which does not exist`)
  }
  for (const file of files) {
    const target = `references/${file}`
    const count = targets.filter((name) => name === target).length
    assert(count === 1, `${label}/${file}: linked ${count} times from SKILL.md, expected exactly once`)
  }
  return files.length
}

// --- manifest and package -------------------------------------------------

const manifestFile = "manifest.json"
assert(isFile(manifestFile), `${manifestFile}: missing`)
let manifest = null
try {
  manifest = JSON.parse(read(manifestFile))
} catch (error) {
  assert(false, `${manifestFile}: not valid JSON (${error.message})`)
}

assert(isFile("package.json"), "package.json: missing")
let pkg = null
try {
  pkg = JSON.parse(read("package.json"))
} catch (error) {
  assert(false, `package.json: not valid JSON (${error.message})`)
}

let roles = []
if (manifest !== null) {
  assert(manifest.name === "wippaCORE", `${manifestFile}: name must be wippaCORE`)
  assert(manifest.version === "0.1.0", `${manifestFile}: version must be 0.1.0`)
  assert(manifest.license === "MIT", `${manifestFile}: license must be MIT`)
  assert(Array.isArray(manifest.roles), `${manifestFile}: roles must be an array`)
  roles = Array.isArray(manifest.roles) ? manifest.roles : []
  assert(roles.length === 13, `${manifestFile}: expected 13 roles, found ${roles.length}`)
}
if (pkg !== null) {
  assert(pkg.private === true, "package.json: must be private")
  assert(pkg.type === "module", "package.json: type must be module")
  assert(pkg.scripts?.check === "node scripts/check.mjs", "package.json: check script must run scripts/check.mjs")
  assert(pkg.scripts?.test === "node scripts/check.mjs", "package.json: test script must run scripts/check.mjs")
  if (manifest !== null) {
    assert(pkg.version === manifest.version, `package.json: version ${pkg.version} does not match manifest ${manifest.version}`)
  }
}

// --- roles ----------------------------------------------------------------

const roleIds = roles.map((role) => role.id)
assert(new Set(roleIds).size === roleIds.length, "manifest: role ids must be unique")
assert(roles.filter((role) => role.kind === "primary").length === 1, "manifest: expected exactly one primary role")
assert(roles.filter((role) => role.kind === "subagent").length === 12, "manifest: expected twelve subagent roles")

const accessText = (access) => {
  const edit = access.includes("edit")
  const shell = access.includes("shell")
  if (edit && shell) return "edit + shell"
  if (shell) return "shell, no edit"
  if (edit) return "edit, no shell"
  return "no edit, no shell"
}

for (const role of roles) {
  for (const field of ["id", "kind", "category", "access", "file", "playbooks"]) {
    assert(Object.hasOwn(role, field), `manifest: role ${role.id ?? "(unknown)"} is missing ${field}`)
  }
  assert(role.kind === "primary" || role.kind === "subagent", `manifest: ${role.id}: kind must be primary or subagent`)
  assert(Array.isArray(role.access), `manifest: ${role.id}: access must be an array`)
  assert(
    role.access.every((entry) => entry === "edit" || entry === "shell"),
    `manifest: ${role.id}: access may contain only edit and shell`,
  )
  assert(role.file === `roles/${role.id}.md`, `manifest: ${role.id}: file must be roles/${role.id}.md`)
  assert(isFile(role.file), `manifest: ${role.id}: ${role.file} does not exist`)

  if (!isFile(role.file)) continue
  const text = read(role.file)
  assert(firstHeading(text) !== null, `${role.file}: missing a level-one heading`)
  assert(
    text.includes(`Category: ${role.category}`),
    `${role.file}: Category must be "${role.category}"`,
  )
  assert(
    text.includes(`Access expectation: ${accessText(role.access)}`),
    `${role.file}: Access expectation must be "${accessText(role.access)}"`,
  )
  const playbookLine = role.playbooks === null ? "Playbooks: none" : `Playbooks: \`${role.playbooks}/\``
  assert(text.includes(playbookLine), `${role.file}: expected "${playbookLine}"`)

  if (role.playbooks !== null) {
    assert(isDirectory(role.playbooks), `${role.id}: playbook folder ${role.playbooks} does not exist`)
  }
}

const roleFiles = markdownFilesUnder("roles")
const expectedRoleFiles = roles.map((role) => `${role.id}.md`).sort()
assert(
  JSON.stringify(roleFiles) === JSON.stringify(expectedRoleFiles),
  `roles/: expected exactly the 13 manifest files, found ${roleFiles.length}`,
)
assert(roleFiles.length === 13, `roles/: expected 13 Markdown files, found ${roleFiles.length}`)

// --- playbook folders ----------------------------------------------------

const PLAYBOOKS = [
  "specialist-playbooks",
  "domain-playbooks",
  "powershell-automation-playbooks",
  "reinforcement-learning-playbooks",
  "compliance-privacy-playbooks",
  "content-legal-media-playbooks",
]

let playbookFileCount = 0
for (const skill of PLAYBOOKS) {
  assert(isDirectory(`playbooks/${skill}`), `playbooks/${skill}: missing`)
  assert(isFile(`playbooks/${skill}/SKILL.md`), `playbooks/${skill}/SKILL.md: missing`)
}

// Specialist playbooks: one folder per role, and every file named exactly once.
const specialistReferences = "playbooks/specialist-playbooks/references"
if (isDirectory(specialistReferences)) {
  const specialistRoles = roles.filter(
    (role) => typeof role.playbooks === "string" && role.playbooks.startsWith(`${specialistReferences}/`),
  )
  const bound = specialistRoles.map((role) => role.playbooks.slice(specialistReferences.length + 1)).sort()
  const folders = readdirSync(join(ROOT, specialistReferences), { withFileTypes: true })
    .filter((entry) => entry.isDirectory())
    .map((entry) => entry.name)
    .sort()
  assert(
    JSON.stringify(bound) === JSON.stringify(folders),
    `${specialistReferences}: expected one folder per bound role (${bound.length}), found ${folders.length}`,
  )

  for (const role of specialistRoles) {
    const folder = join(specialistReferences, role.id)
    assert(isDirectory(folder), `${role.id}: ${folder} does not exist`)
    if (!isDirectory(folder)) continue

    const rows = playbookRows(playbooksSection(read(role.file)))
    assert(rows.length > 0, `${role.file}: ## Playbooks must carry a non-empty routing table`)

    for (const row of rows) {
      const path = `${folder}/${row.file}`
      assert(isFile(path), `${role.id}: the table names ${row.file}, which does not exist`)
      if (isFile(path)) {
        assert(
          firstHeading(read(path)) === row.topic,
          `${role.id}/${row.file}: the table topic must equal the file's first heading`,
        )
      }
    }

    const files = readdirSync(join(ROOT, folder), { withFileTypes: true })
      .filter((entry) => entry.isFile() && entry.name.endsWith(".md"))
      .map((entry) => entry.name)
      .sort()
    for (const file of files) {
      const count = rows.filter((row) => row.file === file).length
      assert(count === 1, `${role.id}/${file}: named ${count} times in the routing table, expected exactly once`)
      playbookFileCount += 1
    }
  }
} else {
  assert(false, `${specialistReferences}: missing`)
}

// Domain playbooks: flat references, indexed by the skill itself.
assert(
  roles.some((role) => role.id === "domain-specialist" && role.playbooks === "playbooks/domain-playbooks"),
  "manifest: domain-specialist must bind playbooks/domain-playbooks",
)
playbookFileCount += checkSkillIndex("domain-playbooks", "domain-specialist")
playbookFileCount += checkSkillIndex("powershell-automation-playbooks")
playbookFileCount += checkSkillIndex("reinforcement-learning-playbooks")
checkSkillIndex("compliance-privacy-playbooks")
checkSkillIndex("content-legal-media-playbooks")

// --- top-level documents -------------------------------------------------

for (const file of ["README.md", "SPEC.md", "RUNTIME.md", "LICENSE", "CHANGELOG.md", "manifest.json", "package.json"]) {
  assert(isFile(file), `${file}: missing`)
  if (isFile(file)) assert(statSync(join(ROOT, file)).size > 0, `${file}: empty`)
}
assert(isFile(".github/workflows/ci.yml"), ".github/workflows/ci.yml: missing")

// --- result --------------------------------------------------------------

if (errors.length > 0) {
  console.error(`check: ${errors.length} failure(s)`)
  for (const error of errors) console.error(`- ${error}`)
  process.exit(1)
}

console.log(
  `check: ok - ${roles.length} roles (1 primary, ${roles.length - 1} subagents), ` +
    `${PLAYBOOKS.length} playbook folders, ${playbookFileCount} indexed playbook files`,
)
