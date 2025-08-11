import { useEffect } from "react";
import { supabase } from "../../lib/supabaseClient";

/**
 * It makes (or keeps) a row in public.users for the signed-in user.
 */
export default function EnsureProfile() {
  useEffect(() => {
    const upsertFor = async () => {
      const { data } = await supabase.auth.getSession();
      const u = data.session?.user;
      if (!u) return;

      const m = (u.user_metadata ?? {}) as Record<string, string>;
      const payload = {
        user_id: u.id,
        email: u.email ?? "",
        first_name: (m.firstName ?? "").trim(),
        last_name: (m.lastName ?? "").trim(),
        phone_number: (m.phone ?? "") || null,
        country: (m.country ?? "") || null,
        user_role: "customer",
        password_hash: "mocked_hash",
        updated_at: new Date().toISOString(),
      };

      // one canonical upsert; duplicate calls won't error
      const { error } = await supabase
        .from("users")
        .upsert(payload, { onConflict: "user_id", ignoreDuplicates: true });

      if (error) console.warn("EnsureProfile upsert:", error);
    };

    upsertFor();

    const { data: sub } = supabase.auth.onAuthStateChange((evt, sess) => {
      if (evt === "SIGNED_IN" && sess?.user) upsertFor();
    });

    return () => sub.subscription.unsubscribe();
  }, []);

  return null;
}
