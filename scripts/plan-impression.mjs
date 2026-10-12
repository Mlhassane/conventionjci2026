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

async function main() {
  for (const table of ["badges", "participants"]) {
    const { count, error } = await supabase
      .from(table)
      .select("*", { count: "exact", head: true });
    console.log(`${table} : ${error ? error.message : count}`);
  }

  // Badges ayant deja une photo de participant
  const { data } = await supabase.from("badges").select("participant_id");
  const avecPhoto = (data ?? []).filter((row) => row.participant_id).length;
  console.log(`badges rattaches a un participant : ${avecPhoto}`);

  // Format du visuel
  console.log("\nFormat du visuel : 1080 x 1600 px, ratio largeur/hauteur = 0,675");
  console.log("A4 : 21,0 x 29,7 cm\n");

  const largeurA4 = 21.0;
  const hauteurA4 = 29.7;
  const ratio = 1080 / 1600;
  const nb = 79;

  const options = [10.0, 9.0, 8.0, 7.0, 6.5, 6.4, 5.8];
  console.log("largeur | hauteur | par A4 | feuilles");
  for (const largeur of options) {
    const hauteur = largeur / ratio;
    const colonnes = Math.floor(largeurA4 / largeur);
    const rangees = Math.floor(hauteurA4 / hauteur);
    const parFeuille = colonnes * rangees;
    const feuilles = Math.ceil(nb / parFeuille);
    console.log(
      `${largeur.toFixed(1).padStart(6)} cm | ${hauteur.toFixed(2).padStart(5)} cm |` +
        ` ${colonnes}x${rangees} = ${String(parFeuille).padStart(2)} | ${feuilles}`
    );
  }
}

main();