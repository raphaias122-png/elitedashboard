import { createClient } from "@supabase/supabase-js";

export async function POST(request: Request) {
  const secret = request.headers.get("x-bootstrap-secret");
  if (!process.env.ADMIN_BOOTSTRAP_SECRET || secret !== process.env.ADMIN_BOOTSTRAP_SECRET)
    return Response.json({ error: "Bootstrap não autorizado." }, { status: 401 });
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  const email = process.env.INITIAL_ADMIN_EMAIL;
  const password = process.env.INITIAL_ADMIN_PASSWORD;
  if (!url || !serviceKey || !email || !password)
    return Response.json({ error: "Configure as variáveis seguras do bootstrap." }, { status: 503 });
  const supabase = createClient(url, serviceKey, { auth: { autoRefreshToken: false, persistSession: false } });
  const { data, error } = await supabase.auth.admin.createUser({ email, password, email_confirm: true, user_metadata: { full_name: "Administrador Elite", role: "admin" } });
  if (error) return Response.json({ error: error.message }, { status: 400 });
  await supabase.from("users").upsert({ id: data.user.id, full_name: "Administrador Elite", role: "admin", must_change_password: true });
  return Response.json({ created: true, email: data.user.email, role: "admin", must_change_password: true });
}
