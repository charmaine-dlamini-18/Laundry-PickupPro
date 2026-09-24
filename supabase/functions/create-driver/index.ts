// Create a driver account (auth user + profile + driver details).
// Deploy with: supabase functions deploy create-driver --no-verify-jwt
import { createClient } from "npm:@supabase/supabase-js@2";

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "Content-Type": "application/json" },
  });
}

Deno.serve(async (req) => {
  try {
    const { name, email, phone, password, vehicle, registration, area } =
      await req.json();

    if (!name?.trim()) return json({ error: "Driver name is required." }, 400);
    if (!email?.trim()) return json({ error: "Email is required." }, 400);
    if (!password || password.length < 8) {
      return json({ error: "Password must be at least 8 characters." }, 400);
    }

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    const { data, error } = await supabase.auth.admin.createUser({
      email: email.trim().toLowerCase(),
      password,
      email_confirm: true,
      user_metadata: { role: "driver", name: name.trim(), phone: phone?.trim() ?? "" },
    });

    if (error) return json({ error: error.message }, 400);

    const profileId = data.user.id;

    // The DB trigger normally creates the profile; upsert makes it idempotent.
    const { error: profileError } = await supabase
      .from("profiles")
      .upsert(
        { id: profileId, name: name.trim(), email: email.trim().toLowerCase(), phone: phone?.trim() ?? "", role: "driver" },
        { onConflict: "id" }
      );
    if (profileError) return json({ error: profileError.message }, 400);

    const { error: driversError } = await supabase.from("drivers").insert({
      profile_id: profileId,
      name: name.trim(),
      email: email.trim().toLowerCase(),
      phone: phone?.trim() ?? "",
      vehicle: vehicle?.trim() ?? "",
      registration: registration?.trim() ?? "",
      area: area ?? "",
    });
    if (driversError) return json({ error: driversError.message }, 400);

    return json({ id: profileId, email: email.trim().toLowerCase() }, 201);
  } catch {
    return json({ error: "Invalid request body." }, 400);
  }
});