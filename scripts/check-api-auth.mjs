/* Fails if any API route exports a handler that is not behind withAuth.
 *
 *   npm run check-api-auth
 *
 * Every route already checked the session by hand, so nothing was open. What
 * was missing was a way to stop the next route from forgetting, and the
 * middleware cannot supply it: its matcher deliberately skips /api, because
 * /api/auth is the endpoint you use to sign in and it only ever redirects,
 * which is wrong for an API client.
 *
 * withAuth makes a forgotten guard a type error in most cases, since the
 * handler is handed a `userId` it cannot otherwise obtain. This catches the
 * rest: a route that quietly goes back to `export async function POST`.
 */
import { readdirSync, statSync, readFileSync } from "node:fs";
import { join } from "node:path";

const ROOT = "app/api";

/* NextAuth's own handler must stay unauthenticated — requiring a session to
   reach the endpoint that creates one would lock everybody out. */
const EXEMPT = [join("app", "api", "auth")];

const VERBS = ["GET", "POST", "PUT", "PATCH", "DELETE", "HEAD", "OPTIONS"];

function walk(dir, out = []) {
  for (const name of readdirSync(dir)) {
    const p = join(dir, name);
    if (statSync(p).isDirectory()) walk(p, out);
    else if (name === "route.ts" || name === "route.js") out.push(p);
  }
  return out;
}

const problems = [];
let checked = 0;

for (const file of walk(ROOT)) {
  if (EXEMPT.some((e) => file.startsWith(e))) continue;
  checked++;
  const src = readFileSync(file, "utf8");

  for (const verb of VERBS) {
    const bare = new RegExp(`export\\s+(async\\s+)?function\\s+${verb}\\b`);
    const wrapped = new RegExp(`export\\s+const\\s+${verb}\\s*=\\s*withAuth\\b`);
    if (bare.test(src)) {
      problems.push(`${file}: ${verb} is declared directly — wrap it in withAuth`);
    } else if (wrapped.test(src)) {
      // good
    } else if (new RegExp(`export\\s+const\\s+${verb}\\b`).test(src)) {
      problems.push(`${file}: ${verb} is exported but not through withAuth`);
    }
  }
}

if (problems.length) {
  console.error(`\n  ${problems.length} unguarded handler(s):\n`);
  for (const p of problems) console.error(`    ${p}`);
  console.error("");
  process.exit(1);
}

console.log(`\n  ${checked} API route(s) checked — every handler is behind withAuth.\n`);
