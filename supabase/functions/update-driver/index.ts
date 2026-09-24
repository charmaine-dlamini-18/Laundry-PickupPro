// Update a driver account (profile + driver details + optional password).
// Deploy with: supabase functions deploy update-driver --no-verify-jwt
import { createClient } from "npm:@supabase/supabase-js@2";

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "Content-Type": "application/json" },
  });
}

Deno.serve(async (req) => {
  try {
    const { id, name, email, phone, password, vehicle, registration, area } =
      await req.json();

    if (!id) return json({ error: "Driver id is required." }, 400);

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    const normalizedEmail = email?.trim().toLowerCase();

    if (password && password.length < 8) {
      return json({ error: "Password must be at least 8 characters." }, 400);
    }

    if (password) {
      const { error: authError } = await supabase.auth.admin.updateUserById(id, {
        password,
      });
      if (authError) return json({ error: authError.message }, 400);
    }

    const { error: profileError } = await supabase
      .from("profiles")
      .update({
        name: name?.trim(),
        email: normalizedEmail,
        phone: phone?.trim(),
      })
      .eq("id", id);
    if (profileError) return json({ error: profileError.message }, 400);

    const { error: driversError } = await supabase
      .from("drivers")
      .update({
        name: name?.trim(),
        email: normalizedEmail,
        phone: phone?.trim(),
        vehicle: vehicle?.trim(),
        registration: registration?.trim(),
        area,
      })
      .eq("profile_id", id);
    if (driversError) return json({ error: driversError.message }, 400);

    return json({ ok: true });
  } catch {
    return json({ error: "Invalid request body." }, 400);
  }
});