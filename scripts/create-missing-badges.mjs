import { readFileSync } from "node:fs";
import { createClient } from "@supabase/supabase-js";

const env = Object.fromEntries(
  readFileSync(".env.local", "utf8")
    .split("\n")
    .filter((line) => line.includes("="))
    .map((line) => {
      const i = line.indexOf("=");
      return [line.slice(0, i).trim(), line.slice(i + 1).trim()];
    })
);

const supabase = createClient(env.NEXT_PUBLIC_SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY, {
  auth: { persistSession: false },
});

/* Même format que generateBadgeCode() / generateMemberCode() côté admin. */
const ALPHABET = "ABCDEFGHJKMNPQRSTUVWXYZ23456789";

function generateCode() {
  let suffix = "";
  for (let i = 0; i < 4; i += 1) {
    suffix += ALPHABET[Math.floor(Math.random() * ALPHABET.length)];
  }
  return `JCI-2026-${suffix}`;
}

async function main() {
  const [{ data: participants }, { data: badges }] = await Promise.all([
    supabase.from("participants").select("id, name, role, organization, city, photo_url, is_admin"),
    supabase.from("badges").select("id, participant_id, unique_code"),
  ]);

  if (!participants || !badges) {
    console.log("Lecture impossible.");
    return;
  }

  const dejaLa = new Set(badges.map((b) => b.participant_id).filter(Boolean));
  const manquants = participants.filter(
    (p) => !dejaLa.has(p.id) && !p.is_admin
  );

  console.log(`participants : ${participants.length}`);
  console.log(`badges existants : ${badges.length}`);
  console.log(`badges à créer : ${manquants.length}`);

  if (manquants.length === 0) return;

  const codesConnus = new Set(badges.map((b) => b.unique_code));
  const lignes = [];
  for (const participant of manquants) {
    let code = generateCode();
    while (codesConnus.has(code)) code = generateCode();
    codesConnus.add(code);

    lignes.push({
      participant_id: participant.id,
      unique_code: code,
      full_name: participant.name,
      role: participant.role || "Participant",
      organization: participant.organization,
      city: participant.city,
      photo_url: participant.photo_url,
      status: "active",
    });
  }

  // Insertion par lots de 50 pour rester sous les limites de l'API.
  let created = 0;
  for (let i = 0; i < lignes.length; i += 50) {
    const lot = lignes.slice(i, i + 50);
    const { data, error } = await supabase.from("badges").insert(lot).select("id");
    if (error) {
      console.log(`Échec du lot ${i / 50 + 1} : ${error.message}`);
      return;
    }
    created += data?.length ?? 0;
  }

  console.log(`badges créés : ${created}`);

  const { count } = await supabase.from("badges").select("*", { count: "exact", head: true });
  console.log(`Total badges en base : ${count}`);
}

main();