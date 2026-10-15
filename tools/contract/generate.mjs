// Generates TypeScript contract types from the Documentation-owned OpenAPI
// specification, pinned to an immutable commit SHA in contract.lock.json.
// Run via `npm run contract:generate` / `npm run contract:check` from the repo root.
//
//   node generate.mjs generate   write src/contract/* from the pinned revision
//   node generate.mjs check      regenerate in memory; fail on missing or drifted files
import { createHash } from "node:crypto";
import { mkdir, readFile, writeFile } from "node:fs/promises";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import openapiTS, { astToString } from "openapi-typescript";

const toolDir = dirname(fileURLToPath(import.meta.url));
const root = resolve(toolDir, "../..");
const lock = JSON.parse(await readFile(resolve(toolDir, "contract.lock.json"), "utf8"));

if (!/^[0-9a-f]{40}$/.test(lock.commit)) {
  throw new Error("contract.lock.json: commit must be a full 40-character SHA, not a branch or tag");
}

const generatorVersion = JSON.parse(
  await readFile(resolve(toolDir, "node_modules/openapi-typescript/package.json"), "utf8"),
).version;

const sourceUrl = `https://raw.githubusercontent.com/${lock.repository}/${lock.commit}/${lock.path}`;
const response = await fetch(sourceUrl);
if (!response.ok) {
  throw new Error(`Failed to fetch ${sourceUrl}: ${response.status} ${response.statusText}`);
}
const spec = await response.text();
const specSha256 = createHash("sha256").update(spec).digest("hex");

const header = `/**
 * GENERATED FILE - DO NOT EDIT.
 * Regenerate with \`npm run contract:generate\`.
 *
 * Source:    https://github.com/${lock.repository}/blob/${lock.commit}/${lock.path}
 * Revision:  ${lock.commit}
 * Spec SHA-256: ${specSha256}
 * Generator: openapi-typescript@${generatorVersion}
 */
`;

const ast = await openapiTS(spec);
const outputs = {
  "src/contract/schema.ts": `${header}\n${astToString(ast)}`,
  "src/contract/revision.ts": `${header}
export const CONTRACT_REPOSITORY = ${JSON.stringify(lock.repository)};
export const CONTRACT_PATH = ${JSON.stringify(lock.path)};
export const CONTRACT_REVISION = ${JSON.stringify(lock.commit)};
export const CONTRACT_SPEC_SHA256 = ${JSON.stringify(specSha256)};
export const CONTRACT_GENERATOR = ${JSON.stringify(`openapi-typescript@${generatorVersion}`)};
`,
};

const mode = process.argv[2];
if (mode === "generate") {
  for (const [file, content] of Object.entries(outputs)) {
    const target = resolve(root, file);
    await mkdir(dirname(target), { recursive: true });
    await writeFile(target, content);
    console.log(`wrote ${file}`);
  }
} else if (mode === "check") {
  const problems = [];
  for (const [file, expected] of Object.entries(outputs)) {
    let actual;
    try {
      actual = await readFile(resolve(root, file), "utf8");
    } catch {
      problems.push(`${file}: missing`);
      continue;
    }
    if (actual !== expected) problems.push(`${file}: differs from regeneration at ${lock.commit}`);
  }
  if (problems.length > 0) {
    console.error(`Contract artifacts are out of date:\n  ${problems.join("\n  ")}`);
    console.error("Run `npm run contract:generate` and commit the result.");
    process.exit(1);
  }
  console.log(`Contract artifacts match ${lock.repository}@${lock.commit}`);
} else {
  console.error("Usage: node generate.mjs <generate|check>");
  process.exit(2);
}
