import fs from "node:fs";

const roster = [
  "Mendy Ezagui", "Miki", "Alex Gertel", "Ari Baitelman", "Ari Richler",
  "Ariel Hess", "Avi Schotenstein", "Benny Amrami", "Choni Chein",
  "Dovid Goldenberg", "Dovid Lieder Library Shul", "Eli Rice", "Isaac Rosenfeld",
  "Jacobson", "Joseph Percia (2026)", "Levi Teleshevsky", "Memem Schmukler",
  "Menachem Dahan", "Mendel Inglis", "Mendel Kamish", "Mendy Baitelman",
  "Michael Hakimi", "Peretz", "Pesach Davidoff USA", "Shlomo Pinhas",
  "Shlomo Stark", "Shmuel Hess", "Shmulik Naparstek", "Yisroel Meir Munitz",
  "Yossi Spigler",
];

const normalize = (value) => String(value || "").toLowerCase().normalize("NFKD")
  .replace(/[^a-z0-9]+/g, " ").trim();
const env = Object.fromEntries(fs.readFileSync("/Users/mendyezagui/Documents/New project/second-brain-worktree/.env.local", "utf8")
  .split(/\r?\n/).filter((line) => line && !line.startsWith("#") && line.includes("="))
  .map((line) => { const i = line.indexOf("="); return [line.slice(0, i), line.slice(i + 1).replace(/^['\"]|['\"]$/g, "")]; }));
const url = env.SUPABASE_URL || env.VITE_SUPABASE_URL;
const key = env.SUPABASE_SERVICE_ROLE_KEY;
const response = await fetch(`${url}/rest/v1/contacts?select=id,name,tags,phone`, {
  headers: { apikey: key, Authorization: `Bearer ${key}` },
});
if (!response.ok) throw new Error(`Contacts read failed: ${response.status}`);
const contacts = await response.json();

const results = roster.map((rosterName) => {
  const wanted = normalize(rosterName).replace(/ 2026$/, "");
  const tokens = wanted.split(" ").filter((token) => token.length > 2);
  const exact = contacts.filter((contact) => normalize(contact.name).replace(/ 2026$/, "") === wanted);
  const nearby = contacts.filter((contact) => {
    const candidateTokens = normalize(contact.name).split(" ");
    return tokens.some((token) => candidateTokens.includes(token));
  });
  return {
    rosterName,
    exact: exact.map(({ id, name, tags, phone }) => ({ id, name, tags: tags || [], hasPhone: Boolean(phone) })),
    nearby: nearby.slice(0, 10).map(({ id, name }) => ({ id, name })),
  };
});

if (process.argv.includes("--summary")) {
  console.log(JSON.stringify({
    contactCount: contacts.length,
    rosterCount: roster.length,
    exactSingleMatches: results.filter((item) => item.exact.length === 1).length,
    unmatched: results.filter((item) => item.exact.length === 0).map((item) => item.rosterName),
    ambiguous: results.filter((item) => item.exact.length > 1).map((item) => item.rosterName),
    tagged: results.filter((item) => item.exact.length === 1 && item.exact[0].tags.includes("Library Shul Business Newtorking")).length,
  }, null, 2));
} else {
  console.log(JSON.stringify({ contactCount: contacts.length, results }, null, 2));
}
