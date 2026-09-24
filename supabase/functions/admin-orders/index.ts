// Admin order operations. Runs with the service role because the admin
// app has no Supabase session (RLS would block anonymous reads).
//   list  -> all driver_orders rows (admin Orders screen)
//   assign -> assign a driver to every leg of a booking
// Deploy with: supabase functions deploy admin-orders --no-verify-jwt
import { createClient } from "npm:@supabase/supabase-js@2";

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "Content-Type": "application/json" },
  });
}

Deno.serve(async (req) => {
  try {
    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    const body = await req.json();
    const action = body?.action;

    if (action === "list") {
      const [{ data: rows, error: rowsError }, { data: assignments, error: assignError }, { data: profiles, error: profileError }] = await Promise.all([
        supabase.from("driver_orders").select("*").order("created_at", { ascending: false }),
        supabase.from("driver_assignments").select("id, order_id, driver_id, status"),
        supabase.from("profiles").select("id, name"),
      ]);

      if (rowsError) return json({ error: rowsError.message }, 400);
      if (assignError) return json({ error: assignError.message }, 400);
      if (profileError) return json({ error: profileError.message }, 400);

      const nameById = new Map<string, string>(
        (profiles ?? []).map((p: { id: string; name: string }) => [p.id, p.name])
      );

      const assignmentInfos = (assignments ?? []).map((a: { id: string; order_id: string; driver_id: string; status: string }) => ({
        id: a.id,
        order_id: a.order_id,
        driver_id: a.driver_id,
        driver_name: nameById.get(a.driver_id) ?? "",
        status: a.status,
      }));

      return json({ rows: rows ?? [], assignments: assignmentInfos });
    }

    if (action === "assign") {
      const { bookingReference, driverId } = body ?? {};

      if (!bookingReference?.trim()) {
        return json({ error: "bookingReference is required." }, 400);
      }
      if (!driverId?.trim()) {
        return json({ error: "driverId is required." }, 400);
      }

      const { data: legs, error: legsError } = await supabase
        .from("driver_orders")
        .select("id")
        .eq("booking_reference", bookingReference.trim());

      if (legsError) return json({ error: legsError.message }, 400);

      const legIds = (legs ?? []).map((l: { id: string }) => l.id);
      if (legIds.length === 0) {
        return json({ error: "No orders found for this booking reference." }, 404);
      }

      const { error: deleteError } = await supabase
        .from("driver_assignments")
        .delete()
        .in("order_id", legIds);
      if (deleteError) return json({ error: deleteError.message }, 400);

      const { error: insertError } = await supabase
        .from("driver_assignments")
        .insert(
          legIds.map((id: string) => ({
            order_id: id,
            driver_id: driverId,
            status: "Assigned",
            assigned_at: new Date().toISOString(),
          }))
        );
      if (insertError) return json({ error: insertError.message }, 400);

      const { error: updateError } = await supabase
        .from("driver_orders")
        .update({ status: "Assigned" })
        .in("id", legIds)
        .neq("status", "Completed");
      if (updateError) return json({ error: updateError.message }, 400);

      return json({ ok: true });
    }

    return json({ error: `Unknown action '${action}'.` }, 400);
  } catch {
    return json({ error: "Invalid request body." }, 400);
  }
});