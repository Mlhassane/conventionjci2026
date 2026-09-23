import { getBadgeByCode, isSupabaseConfigured } from "@/lib/data";

export const dynamic = "force-dynamic";

export default async function VerifyBadgePage({
  params,
}: {
  params: { id: string };
}) {
  const badge = await getBadgeByCode(params.id);

  if (!isSupabaseConfigured) {
    return (
      <Shell>
        <p className="font-serif text-2xl mb-3">Vérification indisponible</p>
        <p className="text-sm text-ink/60 max-w-sm">
          La base de données n&apos;est pas encore connectée à cette instance
          de démonstration. Une fois Supabase configuré, ce lien affichera les
          informations publiques du badge.
        </p>
      </Shell>
    );
  }

  if (!badge) {
    return (
      <Shell>
        <p className="font-serif text-2xl mb-3">Badge introuvable</p>
        <p className="text-sm text-ink/60 max-w-sm">
          Ce code ne correspond à aucun badge de la Convention JCI Niger 2026.
        </p>
      </Shell>
    );
  }

  if (badge.status === "revoked") {
    return (
      <Shell tone="warn">
        <p className="font-serif text-2xl mb-3">Badge révoqué</p>
        <p className="text-sm text-ink/60 max-w-sm">
          Ce badge n&apos;est plus valide pour la Convention JCI Niger 2026.
        </p>
      </Shell>
    );
  }

  return (
    <Shell tone="success">
      <p className="font-serif text-2xl mb-6">Badge vérifié ✅</p>
      <div className="w-full max-w-sm rounded-xl2 border border-line/10 bg-white p-6 text-left shadow-soft">
        <Row label="Nom" value={badge.full_name} />
        <Row label="Rôle" value={badge.role} />
        <Row label="Organisation" value={badge.organization || "—"} />
        <Row label="Ville" value={badge.city || "—"} />
        <div className="mt-5 pt-5 border-t border-line/10">
          <p className="text-xs uppercase tracking-wide2 text-blue-dark">
            Convention JCI Niger 2026
          </p>
          <p className="text-xs text-ink/40 mt-1">
            9 — 10 octobre · Maradi
          </p>
        </div>
      </div>
    </Shell>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-baseline justify-between py-2 border-b border-line/5 last:border-none">
      <span className="text-xs text-ink/45">{label}</span>
      <span className="text-sm font-medium text-right">{value}</span>
    </div>
  );
}

function Shell({
  children,
  tone = "neutral",
}: {
  children: React.ReactNode;
  tone?: "neutral" | "success" | "warn";
}) {
  const ring =
    tone === "success"
      ? "border-success/30"
      : tone === "warn"
      ? "border-danger/30"
      : "border-line/15";
  return (
    <main className="min-h-[80vh] flex flex-col items-center justify-center text-center px-6 py-16">
      <div className={`h-14 w-14 rounded-full border-2 ${ring} flex items-center justify-center mb-6`}>
        <span className="text-2xl">
          {tone === "success" ? "✅" : tone === "warn" ? "⚠️" : "ℹ️"}
        </span>
      </div>
      {children}
    </main>
  );
}
