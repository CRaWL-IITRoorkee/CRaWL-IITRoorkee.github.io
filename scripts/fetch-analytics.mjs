/* Fetch real totals from GoatCounter and write assets/data/analytics.json.
   Run monthly by .github/workflows/analytics.yml.

   Needs two repository secrets:
     GOATCOUNTER_CODE   your site code (the MYCODE in MYCODE.goatcounter.com)
     GOATCOUNTER_TOKEN  an API token with "read statistics" permission
                        (GoatCounter → Settings → API tokens)

   Writes only what the API returned. If the call fails, the job fails
   and the previous file is left untouched — the footer never shows a
   number that did not come from the API. */

import { mkdir, writeFile } from "node:fs/promises";

const code = process.env.GOATCOUNTER_CODE;
const token = process.env.GOATCOUNTER_TOKEN;
if (!code || !token) {
  console.error("GOATCOUNTER_CODE and GOATCOUNTER_TOKEN must be set.");
  process.exit(1);
}

const api = `https://${code}.goatcounter.com/api/v0`;
const start = "2020-01-01T00:00:00Z";                 // everything on record
const end = new Date().toISOString().slice(0, 19) + "Z";

const res = await fetch(`${api}/stats/total?start=${start}&end=${end}`, {
  headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" }
});
if (!res.ok) {
  console.error(`GoatCounter API returned ${res.status}: ${await res.text()}`);
  process.exit(1);
}

const d = await res.json();
const out = {
  visitors: d.total_unique ?? d.unique ?? null,       // people
  pageviews: d.total ?? null,                         // pages viewed
  updated: new Date().toLocaleDateString("en-GB", { month: "long", year: "numeric" }),
  source: "GoatCounter"
};

if (out.visitors === null && out.pageviews === null) {
  console.error("No usable totals in API response:", JSON.stringify(d));
  process.exit(1);
}

await mkdir("assets/data", { recursive: true });
await writeFile("assets/data/analytics.json", JSON.stringify(out, null, 2) + "\n");
console.log("Wrote assets/data/analytics.json", out);
