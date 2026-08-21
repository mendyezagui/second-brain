import fs from "node:fs";

const ENV_PATH = "/Users/mendyezagui/Documents/New project/second-brain-worktree/.env.local";
const GROUP_TAG = "Library Shul Business Newtorking";

const roster = [
  "Mendy Ezagui",
  "Miki",
  "Alex Gertel",
  "Ari Baitelman",
  "Ari Richler",
  "Ariel Hess",
  "Avi Schotenstein",
  "Benny Amrami",
  "Choni Chein",
  "Dovid Goldenberg",
  "Dovid Lieder Library Shul",
  "Eli Rice",
  "Isaac Rosenfeld",
  "Jacobson",
  "Joseph Percia (2026)",
  "Levi Teleshevsky",
  "Memem Schmukler",
  "Menachem Dahan",
  "Mendel Inglis",
  "Mendel Kamish",
  "Mendy Baitelman",
  "Michael Hakimi",
  "Peretz",
  "Pesach Davidoff USA",
  "Shlomo Pinhas",
  "Shlomo Stark",
  "Shmuel Hess",
  "Shmulik Naparstek",
  "Yisroel Meir Munitz",
  "Yossi Spigler",
];

const aliases = new Map([
  ["miki", ["miki", "miki chein"]],
  ["joseph percia 2026", ["joseph percia 2026", "joseph percia"]],
  ["dovid lieder library shul", ["dovid lieder library shul", "dovid lieder"]],
  ["pesach davidoff usa", ["pesach davidoff usa", "pesach davidoff"]],
  ["yisroel meir munitz", ["yisroel meir munitz", "aaron meir munitz", "aaaron meir munitz"]],
]);

const normalize = (value) => String(value || "")
  .toLowerCase()
  .normalize("NFKD")
  .replace(/[^a-z0-9]+/g, " ")
  .trim();

const env = Object.fromEntries(fs.readFileSync(ENV_PATH, "utf8")
  .split(/\r?\n/)
  .filter((line) => line && !line.startsWith("#") && line.includes("="))
  .map((line) => {
    const index = line.indexOf("=");
    return [line.slice(0, index), line.slice(index + 1).replace(/^['\"]|['\"]$/g, "")];
  }));

const url = env.SUPABASE_URL || env.VITE_SUPABASE_URL;
const key = env.SUPABASE_SERVICE_ROLE_KEY;
if (!url || !key) throw new Error("Supabase service credentials are unavailable");

const headers = {
  apikey: key,
  Authorization: `Bearer ${key}`,
  "Content-Type": "application/json",
};

const response = await fetch(`${url}/rest/v1/contacts?select=*`, { headers });
if (!response.ok) throw new Error(`Contacts read failed: ${response.status} ${await response.text()}`);
const contacts = await response.json();

const resolve = (rosterName) => {
  const normalized = normalize(rosterName);
  const candidates = aliases.get(normalized) || [normalized];
  return contacts.filter((contact) => candidates.includes(normalize(contact.name)));
};

const plan = roster.map((rosterName) => {
  const matches = resolve(rosterName);
  const rosterTokens = normalize(rosterName).split(" ").filter((token) => token.length > 2);
  const nearby = contacts.filter((contact) => {
    const candidate = normalize(contact.name);
    return rosterTokens.some((token) => candidate.split(" ").includes(token));
  });
  return {
    rosterName,
    matches: matches.map(({ id, name, tags, phone }) => ({ id, name, tags: tags || [], hasPhone: Boolean(phone) })),
    nearby: nearby.slice(0, 8).map(({ id, name }) => ({ id, name })),
    action: matches.length === 1 ? "tag_existing" : matches.length === 0 ? "create" : "ambiguous",
  };
});

if (!process.argv.includes("--apply")) {
  console.log(JSON.stringify({ groupTag: GROUP_TAG, contactCount: contacts.length, plan }, null, 2));
  process.exit(0);
}

const maxId = contacts.reduce((max, contact) => Math.max(max, Number(contact.id) || 0), 0);
let nextId = maxId + 1;
const results = [];

for (const item of plan) {
  if (item.action === "ambiguous") {
    results.push({ ...item, result: "skipped_ambiguous" });
    continue;
  }

  if (item.action === "tag_existing") {
    const contact = item.matches[0];
    const tags = [...new Set([...(contact.tags || []), GROUP_TAG])];
    const update = await fetch(`${url}/rest/v1/contacts?id=eq.${contact.id}`, {
      method: "PATCH",
      headers: { ...headers, Prefer: "return=representation" },
      body: JSON.stringify({ tags }),
    });
    if (!update.ok) throw new Error(`Contact update failed for ${contact.name}: ${update.status} ${await update.text()}`);
    results.push({ rosterName: item.rosterName, contactId: contact.id, contactName: contact.name, result: "tagged_existing" });
    continue;
  }

  const record = {
    id: nextId++,
    name: item.rosterName === "Joseph Percia (2026)" ? "Joseph Percia" : item.rosterName,
    tags: [GROUP_TAG],
    source: "WhatsApp",
    notes: `Imported from WhatsApp group ${GROUP_TAG}; phone was not exposed in the group roster view.`,
  };
  const insert = await fetch(`${url}/rest/v1/contacts`, {
    method: "POST",
    headers: { ...headers, Prefer: "return=representation" },
    body: JSON.stringify(record),
  });
  if (!insert.ok) throw new Error(`Contact insert failed for ${record.name}: ${insert.status} ${await insert.text()}`);
  results.push({ rosterName: item.rosterName, contactId: record.id, contactName: record.name, result: "created" });
}

console.log(JSON.stringify({ groupTag: GROUP_TAG, results }, null, 2));
