import { NextResponse } from "next/server";
import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import { generateMemberCode } from "@/lib/participants";

/** Appelle public.is_admin_user() avec le jeton de l'appelant. */
async function callIsAdminUser(
  url: string,
  anonKey: string,
  token: string
): Promise<boolean> {
  try {
    const res = await fetch(`${url}/rest/v1/rpc/is_admin_user`, {
      method: "POST",
      headers: {
        apikey: anonKey,
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
      body: "{}",
      cache: "no-store",
    });
    if (!res.ok) return false;
    return (await res.json()) === true;
  } catch {
    return false;
  }
}

/**
 * Gestion de l'équipe d'administration.
 *
 * Le service role est nécessaire pour créer / supprimer les comptes Supabase
 * Auth liés. L'appelant est toujours vérifié : jeton de session -> utilisateur
 * Auth -> RPC `is_admin_user()` (RLS + suspension respectés).
 */

export const dynamic = "force-dynamic";

type AdminRow = {
  id: string;
  name: string;
  auth_email: string | null;
  member_code: string | null;
  admin_role: string | null;
  admin_active: boolean;
  last_login_at: string | null;
  created_at: string;
};

const ADMIN_COLUMNS =
  "id, name, auth_email, member_code, admin_role, admin_active, last_login_at, created_at";

async function withAdmin(req: Request) {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !serviceKey || !anonKey) {
    return { error: "Configuration serveur incomplète.", status: 503 } as const;
  }

  const token = req.headers.get("authorization")?.replace(/^Bearer\s+/i, "");
  if (!token) return { error: "Authentification requise.", status: 401 } as const;

  const anon = createClient(url, anonKey, { auth: { persistSession: false } });
  const { data: userData, error: userError } = await anon.auth.getUser(token);
  if (userError || !userData.user) {
    return { error: "Session invalide ou expirée.", status: 401 } as const;
  }

  // `is_admin_user()` lit auth.jwt() : on appelle donc la RPC en transmettant
  // explicitement le jeton de l'appelant (le client tout juste créé n'a pas la
  // session en mémoire).
  const isAdmin = await callIsAdminUser(url, anonKey, token);
  if (!isAdmin) {
    return { error: "Accès réservé aux administrateurs.", status: 403 } as const;
  }

  const service = createClient(url, serviceKey, { auth: { persistSession: false } });
  return { service, actor: userData.user, actorEmail: userData.user.email ?? "" } as const;
}

/**
 * Tous les comptes administrateurs partagent le mot de passe serveur
 * (ADMIN_HASSANE_PASSWORD) : la preuve d'accès demandée au navigateur reste le
 * couple nom + code convention. Le mot de passe n'est jamais transmis.
 */
function sharedAdminPassword() {
  return process.env.ADMIN_HASSANE_PASSWORD ?? "";
}

export async function GET(req: Request) {
  const ctx = await withAdmin(req);
  if ("error" in ctx) return NextResponse.json({ error: ctx.error }, { status: ctx.status });

  const { data, error } = await ctx.service
    .from("participants")
    .select(ADMIN_COLUMNS)
    .eq("is_admin", true)
    .order("created_at", { ascending: true });

  if (error) {
    return NextResponse.json({ error: "Liste indisponible." }, { status: 500 });
  }
  return NextResponse.json({ admins: (data ?? []) as AdminRow[] });
}

export async function POST(req: Request) {
  const ctx = await withAdmin(req);
  if ("error" in ctx) return NextResponse.json({ error: ctx.error }, { status: ctx.status });

  const body = (await req.json().catch(() => ({}))) as {
    name?: string;
    email?: string;
    role?: string;
    code?: string;
    participantId?: string;
  };

  const role = (body.role ?? "Admin").trim() || "Admin";
  const customCode = (body.code ?? "").trim().toUpperCase();
  const participantId = (body.participantId ?? "").trim();

  if (customCode && !/^[A-Z0-9-]{6,32}$/.test(customCode)) {
    return NextResponse.json(
      { error: "Code invalide (lettres, chiffres et tirets uniquement)." },
      { status: 400 }
    );
  }

  // ---- Promotion d'un participant déjà présent dans l'annuaire ----
  let name: string;
  let email: string;
  let existingCode: string | null = null;

  if (participantId) {
    const { data: target, error: targetError } = await ctx.service
      .from("participants")
      .select("id, name, member_code, is_admin, auth_email")
      .eq("id", participantId)
      .maybeSingle();

    if (targetError || !target) {
      return NextResponse.json({ error: "Participant introuvable." }, { status: 404 });
    }
    if (target.is_admin) {
      return NextResponse.json(
        { error: `${target.name} est déjà administrateur.` },
        { status: 409 }
      );
    }

    name = (body.name ?? "").trim() || target.name;
    email = (body.email ?? "").trim().toLowerCase() || (target.auth_email ?? "");
    existingCode = target.member_code;
  } else {
    name = (body.name ?? "").trim();
    email = (body.email ?? "").trim().toLowerCase();
  }

  if (!name) return NextResponse.json({ error: "Le nom est requis." }, { status: 400 });
  if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email)) {
    return NextResponse.json(
      {
        error: participantId
          ? "Renseignez l'email de connexion de ce participant."
          : "Adresse email invalide.",
      },
      { status: 400 }
    );
  }

  const { data: linked } = await ctx.service
    .from("participants")
    .select("id")
    .ilike("auth_email", email)
    .maybeSingle();
  if (linked && linked.id !== participantId) {
    return NextResponse.json(
      { error: "Cette adresse est déjà liée à un participant." },
      { status: 409 }
    );
  }

  // 1) Compte Auth (le code convention reste la preuve d'accès côté login).
  const password = sharedAdminPassword();
  if (!password) {
    return NextResponse.json(
      { error: "ADMIN_HASSANE_PASSWORD absent du serveur : accès impossible." },
      { status: 500 }
    );
  }

  const { error: createUserError } = await ctx.service.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
  });

  if (createUserError) {
    const alreadyExists = /already|registered|exists/i.test(createUserError.message);
    if (!alreadyExists) {
      return NextResponse.json(
        { error: `Compte Auth impossible : ${createUserError.message}` },
        { status: 500 }
      );
    }
    // Le compte existe déjà : on le réutilise tel quel.
  }

  // 2) Promotion ou création de la ligne administrateur.
  let memberCode = customCode || existingCode || "";
  let participant: { id: string } | null = null;

  if (participantId) {
    const { data, error: updateError } = await ctx.service
      .from("participants")
      .update({
        is_admin: true,
        admin_active: true,
        admin_role: role,
        auth_email: email,
        admin_added_by: ctx.actorEmail,
        member_code: memberCode || generateMemberCode(),
        is_public: false,
      })
      .eq("id", participantId)
      .select("id, name, auth_email, member_code, admin_role, admin_active")
      .single();

    if (updateError) {
      return NextResponse.json(
        { error: `Promotion impossible : ${updateError.message}` },
        { status: 500 }
      );
    }
    participant = data;
    memberCode = data?.member_code ?? memberCode;
  } else {
    for (let attempt = 0; attempt < 4; attempt += 1) {
      const candidate = memberCode || generateMemberCode();
      const { data, error: insertError } = await ctx.service
        .from("participants")
        .insert({
          name,
          auth_email: email,
          is_admin: true,
          admin_active: true,
          admin_role: role,
          admin_added_by: ctx.actorEmail,
          member_code: candidate,
          role: "Administrateur",
          is_public: false,
        })
        .select("id, name, auth_email, member_code, admin_role, admin_active")
        .single();

      if (!insertError) {
        participant = data;
        memberCode = candidate;
        break;
      }
      if (!/duplicate|unique/i.test(insertError.message)) {
        return NextResponse.json(
          { error: `Enregistrement impossible : ${insertError.message}` },
          { status: 500 }
        );
      }
      memberCode = "";
    }
  }

  if (!participant) {
    return NextResponse.json(
      { error: "Impossible de générer un code unique. Réessayez." },
      { status: 500 }
    );
  }

  return NextResponse.json({ admin: participant, code: memberCode, promoted: Boolean(participantId) });
}

export async function PATCH(req: Request) {
  const ctx = await withAdmin(req);
  if ("error" in ctx) return NextResponse.json({ error: ctx.error }, { status: ctx.status });

  const body = (await req.json().catch(() => ({}))) as {
    id?: string;
    name?: string;
    role?: string;
    active?: boolean;
    regenerateCode?: boolean;
  };

  const id = body.id;
  if (!id) return NextResponse.json({ error: "Identifiant manquant." }, { status: 400 });

  const patch: Record<string, unknown> = {};
  if (typeof body.name === "string" && body.name.trim()) patch.name = body.name.trim();
  if (typeof body.role === "string" && body.role.trim()) patch.admin_role = body.role.trim();
  if (typeof body.active === "boolean") patch.admin_active = body.active;

  if (body.regenerateCode) {
    for (let attempt = 0; attempt < 5; attempt += 1) {
      const candidate = generateMemberCode();
      const { data: taken } = await ctx.service
        .from("participants")
        .select("id")
        .eq("member_code", candidate)
        .maybeSingle();
      if (taken) continue;
      patch.member_code = candidate;
      break;
    }
    if (!patch.member_code) {
      return NextResponse.json(
        { error: "Impossible de générer un code. Réessayez." },
        { status: 500 }
      );
    }
  }

  if (patch.admin_active === false) {
    const guard = await assertNotLastAdmin(ctx.service, id);
    if (guard) return NextResponse.json({ error: guard }, { status: 409 });
  }

  const { data, error } = await ctx.service
    .from("participants")
    .update(patch)
    .eq("id", id)
    .eq("is_admin", true)
    .select(ADMIN_COLUMNS)
    .single();

  if (error || !data) {
    return NextResponse.json({ error: "Mise à jour impossible." }, { status: 500 });
  }
  return NextResponse.json({ admin: data as AdminRow });
}

export async function DELETE(req: Request) {
  const ctx = await withAdmin(req);
  if ("error" in ctx) return NextResponse.json({ error: ctx.error }, { status: ctx.status });

  const id = new URL(req.url).searchParams.get("id");
  if (!id) return NextResponse.json({ error: "Identifiant manquant." }, { status: 400 });

  const guard = await assertNotLastAdmin(ctx.service, id);
  if (guard) return NextResponse.json({ error: guard }, { status: 409 });

  const { data: target } = await ctx.service
    .from("participants")
    .select("auth_email")
    .eq("id", id)
    .eq("is_admin", true)
    .maybeSingle();

  if (!target) {
    return NextResponse.json({ error: "Administrateur introuvable." }, { status: 404 });
  }

  // L'accès est retiré, la fiche participant est conservée pour l'historique.
  const { error } = await ctx.service
    .from("participants")
    .update({ is_admin: false, admin_active: false, is_public: false, admin_role: null })
    .eq("id", id);

  if (error) {
    return NextResponse.json({ error: "Retrait impossible." }, { status: 500 });
  }

  const targetEmail = target.auth_email;
  if (targetEmail) {
    const { data: list } = await ctx.service.auth.admin.listUsers({ page: 1, perPage: 200 });
    const users = (list?.users ?? []) as { id: string; email?: string }[];
    const authUser = users.find(
      (user) => (user.email ?? "").toLowerCase() === targetEmail.toLowerCase()
    );
    if (authUser) {
      await ctx.service.auth.admin.deleteUser(authUser.id);
    }
  }

  return NextResponse.json({ ok: true });
}

/** Empêche de supprimer / suspendre le dernier administrateur actif. */
async function assertNotLastAdmin(service: SupabaseClient, id: string) {
  const { data: target } = await service
    .from("participants")
    .select("id, admin_active, auth_email")
    .eq("id", id)
    .eq("is_admin", true)
    .maybeSingle();

  if (!target) return "Administrateur introuvable.";
  // Déjà suspendu / révoqué : aucun risque de verrouiller la console.
  if (!target.admin_active) return null;

  const { count } = await service
    .from("participants")
    .select("id", { count: "exact", head: true })
    .eq("is_admin", true)
    .eq("admin_active", true);

  if ((count ?? 0) <= 1) {
    return "Impossible : ce compte est le dernier administrateur actif.";
  }
  return null;
}
