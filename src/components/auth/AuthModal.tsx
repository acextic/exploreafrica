import { useEffect, useMemo, useState } from "react";
import { supabase } from "../../lib/supabaseClient";
import {
  getAllCountries,
  getCountryByCode,
  formatAsYouType,
  isValidE164,
  DEFAULT_COUNTRY,
} from "../../constants/countries";
import type { CountryOption } from "../../constants/countries";

type Props = { open: boolean; onClose: () => void };
type Phase = "request" | "verify";

function normEmail(x: string) {
  return x.trim().toLowerCase();
}

function onlyDigits(x: string) {
  return x.replace(/\D/g, "");
}

function e164From(country: CountryOption, formattedPhone: string) {
  const dialDigits = onlyDigits(country.dial);
  const all = onlyDigits(formattedPhone);
  const tail = all.startsWith(dialDigits) ? all.slice(dialDigits.length) : all;
  return `+${dialDigits}${tail}`;
}

export default function AuthModal({ open, onClose }: Props) {
  const countries = useMemo(() => getAllCountries(), []);
  const defaultCountry = useMemo(() => getCountryByCode(DEFAULT_COUNTRY), []);
  const [activeTab, setActiveTab] = useState<"signin" | "signup">("signin");

  const [siEmail, setSiEmail] = useState("");
  const [siPhase, setSiPhase] = useState<Phase>("request");
  const [siLoading, setSiLoading] = useState(false);
  const [siCode, setSiCode] = useState("");
  const [siError, setSiError] = useState<string | null>(null);

  const [suPhase, setSuPhase] = useState<Phase>("request");
  const [suLoading, setSuLoading] = useState(false);
  const [suCode, setSuCode] = useState("");
  const [suError, setSuError] = useState<string | null>(null);

  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [suEmail, setSuEmail] = useState("");

  const [country, setCountry] = useState<CountryOption>(defaultCountry);
  const [phone, setPhone] = useState<string>(
    formatAsYouType(defaultCountry.code, defaultCountry.dial + " ")
  );

  const phoneE164 = useMemo(() => e164From(country, phone), [country, phone]);
  const phoneValid = useMemo(
    () => isValidE164(country.code, phoneE164),
    [country, phoneE164]
  );

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (!open) return;
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  useEffect(() => {
    if (!open) return;
    setActiveTab("signin");

    setSiEmail("");
    setSiPhase("request");
    setSiLoading(false);
    setSiCode("");
    setSiError(null);

    setSuPhase("request");
    setSuLoading(false);
    setSuCode("");
    setSuError(null);
    setFirstName("");
    setLastName("");
    setSuEmail("");

    const c = getCountryByCode(DEFAULT_COUNTRY);
    setCountry(c);
    setPhone(formatAsYouType(c.code, c.dial + " "));
  }, [open]);

  const sendSignInOtp = async () => {
    setSiError(null);
    const email = normEmail(siEmail);
    if (!email) return;
    setSiLoading(true);
    const { error } = await supabase.auth.signInWithOtp({
      email,
      options: { shouldCreateUser: false },
    });
    setSiLoading(false);
    if (error) {
      const msg = error.message.toLowerCase().includes("signups not allowed")
        ? "No account found for that email. Please sign up."
        : error.message;
      setSiError(msg);
      return;
    }
    setSiPhase("verify");
    setTimeout(() => {
      (
        document.getElementById("signin-code") as HTMLInputElement | null
      )?.focus();
    }, 0);
  };

  const verifySignInOtp = async () => {
    setSiError(null);
    const email = normEmail(siEmail);
    if (!email || siCode.trim().length < 6) return;
    setSiLoading(true);
    const { error } = await supabase.auth.verifyOtp({
      email,
      token: siCode.trim(),
      type: "email",
    });
    setSiLoading(false);
    if (error) {
      setSiError(error.message);
      return;
    }
    onClose();
  };

  const rpcEmailRegistered = async (email: string) => {
    const { data, error } = await supabase.rpc("email_registered", {
      p_email: email,
    });
    if (error) return false;
    return data === true;
  };

  const sendSignUpOtp = async () => {
    setSuError(null);
    const email = normEmail(suEmail);
    if (!firstName.trim() || !lastName.trim() || !email) {
      setSuError("Please fill first name, last name and email.");
      return;
    }
    if (!phoneValid) {
      setSuError("Please enter a valid phone number for the selected country.");
      return;
    }
    setSuLoading(true);
    const exists = await rpcEmailRegistered(email);
    if (exists) {
      setSuLoading(false);
      setSuError("An account with this email already exists. Please sign in.");
      return;
    }
    const { error } = await supabase.auth.signInWithOtp({
      email,
      options: {
        shouldCreateUser: true,
        data: {
          firstName: firstName.trim(),
          lastName: lastName.trim(),
          phone: phoneE164,
          country: country.name,
        },
      },
    });
    setSuLoading(false);
    if (error) {
      setSuError(error.message);
      return;
    }
    setSuPhase("verify");
    setTimeout(() => {
      (
        document.getElementById("signup-code") as HTMLInputElement | null
      )?.focus();
    }, 0);
  };

  const verifySignUpOtp = async () => {
    setSuError(null);
    const email = normEmail(suEmail);
    if (!email || suCode.trim().length < 6) return;
    setSuLoading(true);
    const { error } = await supabase.auth.verifyOtp({
      email,
      token: suCode.trim(),
      type: "email",
    });
    setSuLoading(false);
    if (error) {
      setSuError(error.message);
      return;
    }
    onClose();
  };

  const onCountryChange = (code: string) => {
    const next = getCountryByCode(code);
    const prev = country;
    const prevDialDigits = onlyDigits(prev.dial);
    const all = onlyDigits(phone);
    const tail = all.startsWith(prevDialDigits)
      ? all.slice(prevDialDigits.length)
      : all;
    const nextRaw = `+${onlyDigits(next.dial)}${tail}`;
    setCountry(next);
    setPhone(formatAsYouType(next.code, nextRaw));
  };

  const onPhoneChange = (v: string) => {
    const dialDigits = onlyDigits(country.dial);
    const all = onlyDigits(v);
    const tail = all.startsWith(dialDigits)
      ? all.slice(dialDigits.length)
      : all;
    const raw = `+${dialDigits}${tail}`;
    setPhone(formatAsYouType(country.code, raw));
  };

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div
        className="absolute inset-0 bg-black/40 backdrop-blur-sm"
        onClick={onClose}
      />
      <div className="relative bg-white rounded-2xl shadow-xl w-[92vw] max-w-md p-6">
        <button
          onClick={onClose}
          className="absolute right-3 top-3 rounded-full w-8 h-8 flex items-center justify-center text-gray-500 hover:bg-gray-100"
          aria-label="Close"
        >
          ✕
        </button>

        <div className="flex items-center justify-center gap-2 mb-5">
          <button
            onClick={() => setActiveTab("signin")}
            className={`px-4 py-2 rounded-full text-sm font-medium ${
              activeTab === "signin"
                ? "bg-orange-500 text-white"
                : "bg-gray-100 text-gray-700 hover:bg-gray-200"
            }`}
          >
            Sign in
          </button>
          <button
            onClick={() => setActiveTab("signup")}
            className={`px-4 py-2 rounded-full text-sm font-medium ${
              activeTab === "signup"
                ? "bg-orange-500 text-white"
                : "bg-gray-100 text-gray-700 hover:bg-gray-200"
            }`}
          >
            Sign up
          </button>
        </div>

        {activeTab === "signin" ? (
          <div>
            {siPhase === "request" ? (
              <>
                <label className="block text-sm font-medium mb-1">Email</label>
                <input
                  className="w-full border rounded-lg px-3 py-2 mb-3"
                  type="email"
                  placeholder="you@example.com"
                  value={siEmail}
                  onChange={(e) => setSiEmail(e.target.value)}
                  autoFocus
                  required
                />
                {siError && (
                  <p className="text-sm text-red-500 mb-2">{siError}</p>
                )}
                <button
                  onClick={sendSignInOtp}
                  disabled={siLoading || !siEmail.trim()}
                  className="w-full bg-orange-500 text-white rounded-lg py-2 hover:bg-orange-600 disabled:opacity-60"
                >
                  {siLoading ? "Sending..." : "Send code"}
                </button>
                <div className="mt-3 text-center text-sm">
                  New here?{" "}
                  <button
                    className="underline text-orange-600"
                    onClick={() => setActiveTab("signup")}
                  >
                    Create an account
                  </button>
                </div>
              </>
            ) : (
              <>
                <p className="text-sm text-gray-700 mb-3">
                  We emailed a 6-digit code to <strong>{siEmail}</strong>.
                </p>
                <label className="block text-sm font-medium mb-1">
                  Enter code
                </label>
                <input
                  id="signin-code"
                  className="w-full border rounded-lg px-3 py-2 mb-2 tracking-widest text-center"
                  placeholder="123456"
                  value={siCode}
                  onChange={(e) => setSiCode(e.target.value)}
                  inputMode="numeric"
                  autoComplete="one-time-code"
                  maxLength={6}
                />
                {siError && (
                  <p className="text-sm text-red-500 mb-2">{siError}</p>
                )}
                <button
                  onClick={verifySignInOtp}
                  disabled={siLoading || siCode.trim().length < 6}
                  className="w-full bg-orange-500 text-white rounded-lg py-2 hover:bg-orange-600 disabled:opacity-60"
                >
                  {siLoading ? "Verifying..." : "Verify & Sign in"}
                </button>
                <button
                  onClick={sendSignInOtp}
                  disabled={siLoading}
                  className="w-full mt-2 text-sm underline"
                >
                  Resend code
                </button>
              </>
            )}
          </div>
        ) : (
          <div>
            {suPhase === "request" ? (
              <>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-sm font-medium mb-1">
                      First name
                    </label>
                    <input
                      className="w-full border rounded-lg px-3 py-2"
                      value={firstName}
                      onChange={(e) => setFirstName(e.target.value)}
                      placeholder="Jane"
                      autoFocus
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-1">
                      Last name
                    </label>
                    <input
                      className="w-full border rounded-lg px-3 py-2"
                      value={lastName}
                      onChange={(e) => setLastName(e.target.value)}
                      placeholder="Doe"
                      required
                    />
                  </div>
                </div>

                <div className="mt-3">
                  <label className="block text-sm font-medium mb-1">
                    Email
                  </label>
                  <input
                    className="w-full border rounded-lg px-3 py-2"
                    type="email"
                    value={suEmail}
                    onChange={(e) => setSuEmail(e.target.value)}
                    placeholder="you@example.com"
                    required
                  />
                </div>

                <div className="mt-3">
                  <label className="block text-sm font-medium mb-1">
                    Country
                  </label>
                  <select
                    className="w-full border rounded-lg px-3 py-2"
                    value={country.code}
                    onChange={(e) => onCountryChange(e.target.value)}
                  >
                    {countries.map((c) => (
                      <option key={c.code} value={c.code}>
                        {c.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="mt-3">
                  <label className="block text-sm font-medium mb-1">
                    Phone
                  </label>
                  <input
                    className={`w-full border rounded-lg px-3 py-2 ${
                      phone && !phoneValid ? "border-red-400" : ""
                    }`}
                    value={phone}
                    onChange={(e) => onPhoneChange(e.target.value)}
                    placeholder={`${country.dial} 5551234567`}
                    inputMode="tel"
                  />
                </div>

                {suError && (
                  <p className="text-sm text-red-500 mt-2">{suError}</p>
                )}

                {!suError && phone && !phoneValid && (
                  <p className="text-sm text-red-500 mt-2">
                    Please enter a valid phone number for {country.name}.
                  </p>
                )}

                <button
                  onClick={sendSignUpOtp}
                  disabled={
                    suLoading ||
                    !firstName.trim() ||
                    !lastName.trim() ||
                    !suEmail.trim() ||
                    !phoneValid
                  }
                  className="w-full mt-3 bg-orange-500 text-white rounded-lg py-2 hover:bg-orange-600 disabled:opacity-60"
                >
                  {suLoading ? "Sending code..." : "Sign up"}
                </button>

                <div className="mt-3 text-center text-sm">
                  Already have an account?{" "}
                  <button
                    className="underline text-orange-600"
                    onClick={() => setActiveTab("signin")}
                  >
                    Sign in
                  </button>
                </div>
              </>
            ) : (
              <>
                <p className="text-sm text-gray-700 mb-3">
                  We emailed a 6-digit code to <strong>{suEmail}</strong>.
                </p>
                <input
                  id="signup-code"
                  className="w-full border rounded-lg px-3 py-2 mb-2 tracking-widest text-center"
                  placeholder="123456"
                  value={suCode}
                  onChange={(e) => setSuCode(e.target.value)}
                  inputMode="numeric"
                  autoComplete="one-time-code"
                  maxLength={6}
                />
                {suError && (
                  <p className="text-sm text-red-500 mb-2">{suError}</p>
                )}
                <button
                  onClick={verifySignUpOtp}
                  disabled={suLoading || suCode.trim().length < 6}
                  className="w-full bg-orange-500 text-white rounded-lg py-2 hover:bg-orange-600 disabled:opacity-60"
                >
                  {suLoading ? "Verifying..." : "Verify & Create account"}
                </button>
                <button
                  onClick={sendSignUpOtp}
                  disabled={suLoading}
                  className="w-full mt-2 text-sm underline"
                >
                  Resend code
                </button>
              </>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
