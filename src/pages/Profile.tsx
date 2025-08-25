import { useEffect, useState } from "react";
import { useAuth } from "../context/AuthContext";
import { supabase } from "../lib/supabaseClient";
import {
  getAllCountries,
  getCountryByCode,
  toE164,
  isValidE164,
  formatAsYouType,
  DEFAULT_COUNTRY,
} from "../constants/countries";

type UserRow = {
  user_id: string;
  first_name: string;
  last_name: string;
  email: string;
  phone_number: string | null;
  country: string | null;
  created_at: string | null;
  updated_at: string | null;
};

const Profile = () => {
  const { user, signOut } = useAuth();
  const [row, setRow] = useState<UserRow | null>(null);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const allCountries = getAllCountries();

  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");

  const [countryIso, setCountryIso] = useState(DEFAULT_COUNTRY);
  const [localPhone, setLocalPhone] = useState("");
  const [prettyPhone, setPrettyPhone] = useState("");

  useEffect(() => {
    const load = async () => {
      if (!user) return;
      setError(null);
      const { data, error } = await supabase
        .from("users")
        .select("*")
        .eq("user_id", user.id)
        .maybeSingle();

      if (error) setError(error.message);

      let base: UserRow | null = (data as any) || null;

      if (!base) {
        const md = user.user_metadata || {};
        const bootstrap = {
          user_id: user.id,
          first_name: md.firstName || "",
          last_name: md.lastName || "",
          email: user.email || "",
          phone_number: (md.phone as string) || null,
          country: (md.country as string) || DEFAULT_COUNTRY,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        };
        const { error: upErr, data: upData } = await supabase
          .from("users")
          .upsert(bootstrap)
          .select()
          .maybeSingle();
        if (upErr) setError(upErr.message);
        base = (upData as any) || bootstrap;
      }

      if (base) {
        setRow(base);
        setFirstName(base.first_name || "");
        setLastName(base.last_name || "");

        const iso =
          (base.country && getCountryByCode(base.country).code) ||
          DEFAULT_COUNTRY;
        setCountryIso(iso);
        const dial = getCountryByCode(iso).dial;
        const raw = (base.phone_number || "").startsWith(dial)
          ? (base.phone_number || "").slice(dial.length)
          : base.phone_number || "";
        const digits = raw.replace(/\D/g, "");
        setLocalPhone(digits);
        setPrettyPhone(formatAsYouType(iso, digits));
      }
    };

    load();
  }, [user]);

  useEffect(() => {
    setPrettyPhone(formatAsYouType(countryIso, localPhone));
  }, [countryIso, localPhone]);

  const save = async () => {
    if (!user || !row) return;
    setSaving(true);
    setError(null);

    const e164 = toE164(countryIso, localPhone);
    if (!isValidE164(countryIso, e164)) {
      setSaving(false);
      setError("Please enter a valid phone number for the selected country.");
      return;
    }

    const patch = {
      first_name: firstName.trim(),
      last_name: lastName.trim(),
      phone_number: e164,
      country: countryIso,
      updated_at: new Date().toISOString(),
    };

    const { error: upErr } = await supabase
      .from("users")
      .update(patch)
      .eq("user_id", user.id);

    const { error: mdErr } = await supabase.auth.updateUser({
      data: {
        firstName: patch.first_name,
        lastName: patch.last_name,
        phone: e164,
        country: countryIso,
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
                <label className="block text-sm font-medium mb-1">
                  Country
                </label>
                <select
                  className="w-full border rounded px-3 py-2"
                  value={countryIso}
                  onChange={(e) => setCountryIso(e.target.value)}
                >
                  {allCountries.map((c) => (
                    <option key={c.code} value={c.code}>
                      {c.name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">Phone</label>
                <input
                  className="w-full border rounded px-3 py-2"
                  value={prettyPhone}
                  onChange={(e) => {
                    const digits = e.target.value.replace(/\D/g, "");
                    setLocalPhone(digits);
                    setPrettyPhone(e.target.value);
                  }}
                  placeholder={`${
                    getCountryByCode(countryIso).dial
                  } 5551234567`}
                  inputMode="tel"
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
                : "—"}{" "}
              · Last updated:{" "}
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
