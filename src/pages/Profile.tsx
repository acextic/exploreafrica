import { useEffect, useState } from "react";
import { useAuth } from "../context/AuthContext";
import { supabase } from "../lib/supabaseClient";

type UserRow = {
  user_id: string;
  first_name: string;
  last_name: string;
  email: string;
  phone_number: string | null;
  country: string | null;
  created_at: string | null;
  updated_at: string | null;
  user_role: string | null;
};

const Profile = () => {
  const { user, signOut } = useAuth();
  const [row, setRow] = useState<UserRow | null>(null);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // local edit state
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [phone, setPhone] = useState("");
  const [country, setCountry] = useState("");

  useEffect(() => {
    const load = async () => {
      if (!user) return;
      setError(null);

      // 1) try to fetch from public.users
      const { data, error } = await supabase
        .from("users")
        .select("*")
        .eq("user_id", user.id)
        .maybeSingle();

      if (error) {
        setError(error.message);
      }

      // 2) If no row yet (possible if they signed in before sign-up page existed),
      // bootstrap from auth metadata and upsert.
      let base: UserRow | null = data as any;

      if (!base) {
        const md = user.user_metadata || {};
        const bootstrap: UserRow = {
          user_id: user.id,
          first_name: md.firstName || "",
          last_name: md.lastName || "",
          email: user.email || "",
          phone_number: md.phone || null,
          country: md.country || null,
          user_role: "customer",
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        };

        const { error: upErr, data: upData } = await supabase
          .from("users")
          .upsert(bootstrap)
          .select()
          .maybeSingle();

        if (upErr) {
          setError(upErr.message);
        } else {
          base = upData as any;
        }
      }

      if (base) {
        setRow(base);
        setFirstName(base.first_name || "");
        setLastName(base.last_name || "");
        setPhone(base.phone_number || "");
        setCountry(base.country || "");
      }
    };

    load();
  }, [user]);

  const save = async () => {
    if (!user || !row) return;
    setSaving(true);
    setError(null);

    // update public.users
    const patch = {
      first_name: firstName,
      last_name: lastName,
      phone_number: phone || null,
      country: country || null,
      updated_at: new Date().toISOString(),
    };
    const { error: upErr } = await supabase
      .from("users")
      .update(patch)
      .eq("user_id", user.id);

    // also mirror to auth user metadata for admin view
    const { error: mdErr } = await supabase.auth.updateUser({
      data: {
        firstName,
        lastName,
        phone,
        country,
      },
    });

    if (upErr || mdErr) {
      setError(upErr?.message || mdErr?.message || "Save failed");
    } else {
      setRow((r) => (r ? ({ ...r, ...patch } as any) : r));
    }
    setSaving(false);
  };

  if (!user) return null;

  return (
    <main className="w-full min-h-screen bg-gray-50 pt-24 px-8">
      <div className="max-w-2xl mx-auto bg-white rounded-xl shadow p-6">
        <div className="flex items-center justify-between mb-4">
          <h1 className="text-2xl font-bold">Your profile</h1>
          <button
            onClick={signOut}
            className="text-sm border px-3 py-1 rounded hover:bg-gray-100"
          >
            Sign out
          </button>
        </div>

        {row ? (
          <>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium mb-1">
                  First name
                </label>
                <input
                  className="w-full border rounded px-3 py-2"
                  value={firstName}
                  onChange={(e) => setFirstName(e.target.value)}
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">
                  Last name
                </label>
                <input
                  className="w-full border rounded px-3 py-2"
                  value={lastName}
                  onChange={(e) => setLastName(e.target.value)}
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Email</label>
                <input
                  className="w-full border rounded px-3 py-2 bg-gray-50"
                  value={row.email}
                  readOnly
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Phone</label>
                <input
                  className="w-full border rounded px-3 py-2"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">
                  Country
                </label>
                <input
                  className="w-full border rounded px-3 py-2"
                  value={country}
                  onChange={(e) => setCountry(e.target.value)}
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Role</label>
                <input
                  className="w-full border rounded px-3 py-2 bg-gray-50"
                  value={row.user_role || "customer"}
                  readOnly
                />
              </div>
            </div>

            {error && <p className="text-sm text-red-500 mt-3">{error}</p>}

            <div className="mt-5">
              <button
                onClick={save}
                disabled={saving}
                className="bg-orange-500 text-white rounded px-4 py-2 hover:bg-orange-600 disabled:opacity-60"
              >
                {saving ? "Saving..." : "Save changes"}
              </button>
            </div>

            <p className="text-xs text-gray-500 mt-4">
              Joined:{" "}
              {row.created_at
                ? new Date(row.created_at).toLocaleDateString()
                : "—"}
              {" · "}
              Last updated:{" "}
              {row.updated_at
                ? new Date(row.updated_at).toLocaleDateString()
                : "—"}
            </p>
          </>
        ) : (
          <p>Loading profile…</p>
        )}
      </div>
    </main>
  );
};

export default Profile;
