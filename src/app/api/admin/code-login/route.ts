import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

/**
 * Connexion administrateur par code convention : { name, code }.
 *
 * 1. Vérifie le couple nom + code avec la RPC `participant_login_by_name`
 *    (client service role) et exige un participant `is_admin`, actif, avec un
 *    `auth_email` lié.
 * 2. Ouvre une vraie session Supabase Auth pour le compte lié via un jeton
 *    « magic link » généré côté serveur. Le mot de passe de l'administrateur
 *    n'est plus utilisé ici : il est personnel (voir /admin/mon-compte) et
 *    n.exit jamais du navigateur.
 */
export async function POST(req: Request) {
  try {
    const { name, code } = (await req.json()) as {
      name?: string;
      code?: string;
    };
    if (!name?.trim() || !code?.trim()) {
      return NextResponse.json(
        { error: "Nom et code requis." },
        { status: 400 }
      );
    }

    const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
    const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
    if (!url || !serviceKey || !anonKey) {
      return NextResponse.json(
        { error: "Configuration incomplète." },
        { status: 500 }
      );
    }

    const admin = createClient(url, serviceKey);

    // La toute première requête peut tomber sur une connexion froide de
    // PostgREST : on réessaie une fois avant de conclure.
    let profile: {
      id: string;
      is_admin: boolean;
      admin_active?: boolean;
      auth_email: string;
    } | null = null;
    for (let attempt = 0; attempt < 2; attempt += 1) {
      const { data, error } = await admin.rpc("participant_login_by_name", {
        p_name: name.trim(),
        p_code: code.trim(),
      });
      if (error) {
        if (attempt === 0) continue;
        console.error("[code-login] RPC indisponible:", error.message);
        return NextResponse.json(
          { error: "Service momentanément indisponible. Réessayez." },
          { status: 503 }
        );
      }
      profile =
        (data as { id: string; is_admin: boolean; admin_active?: boolean; auth_email: string } | null) ??
        null;
      break;
    }

    if (!profile || !profile.is_admin || !profile.auth_email) {
      return NextResponse.json(
        { error: "Code ou nom incorrect, ou compte non administrateur." },
        { status: 401 }
      );
    }

    // Accès suspendu depuis la console : la connexion par code est refusée.
    if (profile.admin_active === false) {
      return NextResponse.json(
        { error: "Votre accès administrateur est suspendu." },
        { status: 403 }
      );
    }

    // Jeton à usage unique : il est immédiatement échangé contre une session
    // standard, ce qui garde les politiques RLS actives côté base.
    const { data: link, error: linkError } = await admin.auth.admin.generateLink({
      type: "magiclink",
      email: profile.auth_email,
    });
    const tokenHash = link?.properties?.hashed_token;

    if (linkError || !tokenHash) {
      return NextResponse.json(
        { error: "Session impossible. Réessayez." },
        { status: 500 }
      );
    }

    const verifyResponse = await fetch(`${url}/auth/v1/verify`, {
      method: "POST",
      headers: {
        apikey: anonKey,
        Authorization: `Bearer ${anonKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ token_hash: tokenHash, type: "magiclink" }),
    });
    const session = await verifyResponse.json().catch(() => null);

    if (!verifyResponse.ok || !session?.access_token) {
      return NextResponse.json(
        { error: "Session impossible. Réessayez." },
        { status: 500 }
      );
    }

    // Trace la dernière connexion (affichée dans l'écran « Équipe admin »).
    await admin
      .from("participants")
      .update({ last_login_at: new Date().toISOString() })
      .eq("id", profile.id);

    return NextResponse.json({
      session: {
        access_token: session.access_token,
        refresh_token: session.refresh_token,
      },
    });
  } catch {
    return NextResponse.json(
      { error: "Une erreur est survenue." },
      { status: 500 }
    );
  }
}
