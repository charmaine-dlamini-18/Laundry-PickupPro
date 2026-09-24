// Delete a driver account (auth user + profile + driver details).
// Deploy with: supabase functions deploy delete-driver --no-verify-jwt
import { createClient } from "npm:@supabase/supabase-js@2";

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "Content-Type": "application/json" },
  });
}

Deno.serve(async (req) => {
  try {
    const { id } = await req.json();

    if (!id) return json({ error: "Driver id is required." }, 400);

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    const { error } = await supabase.auth.admin.deleteUser(id);
    if (error) return json({ error: error.message }, 400);

    // profile + drivers rows are removed by ON DELETE CASCADE.
    return json({ ok: true });
  } catch {
    return json({ error: "Invalid request body." }, 400);
  }
});