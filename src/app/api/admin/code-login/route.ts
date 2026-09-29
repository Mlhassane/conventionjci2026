import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

/**
 * Admin login by convention code: { name, code }.
 *
 * 1. Verifies the convention code + full name with the
 *    `participant_login_by_name` RPC (service-role client) and requires the
 *    participant to be flagged `is_admin` with a linked `auth_email`.
 * 2. Opens a real Supabase Auth session with the linked account — the
 *    password never leaves the server (ADMIN_HASSANE_PASSWORD), so the
 *    client receives standard session tokens and RLS write policies work.
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
    // Single admin account for today; generalize per auth_email if needed.
    const adminPassword = process.env.ADMIN_HASSANE_PASSWORD;
    if (!url || !serviceKey || !anonKey || !adminPassword) {
      return NextResponse.json(
        { error: "Configuration incomplète." },
        { status: 500 }
      );
    }

    const admin = createClient(url, serviceKey);
    const { data: profile, error: rpcError } = await admin.rpc(
      "participant_login_by_name",
      { p_name: name.trim(), p_code: code.trim() }
    );
    if (rpcError || !profile || !profile.is_admin || !profile.auth_email) {
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

    const sb = createClient(url, anonKey);
    const { data: sessionData, error: signInError } =
      await sb.auth.signInWithPassword({
        email: profile.auth_email,
        password: adminPassword,
      });
    if (signInError || !sessionData.session) {
      return NextResponse.json(
        { error: "Session impossible. Réessayez." },
        { status: 500 }
      );
    }

    // Trace la dernière connexion de l'administrateur (affichée dans
    // l'écran « Équipe admin »).
    await admin
      .from("participants")
      .update({ last_login_at: new Date().toISOString() })
      .eq("id", profile.id);

    return NextResponse.json({ session: sessionData.session });
  } catch {
    return NextResponse.json(
      { error: "Une erreur est survenue." },
      { status: 500 }
    );
  }
}
