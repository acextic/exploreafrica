import { useEffect, useMemo, useState } from "react";
import { supabase } from "../../lib/supabaseClient";

type Props = {
  open: boolean;
  onClose: () => void;
  defaultTab?: "signin" | "signup";
};

type Phase = "request" | "verify";

const AuthModal = ({ open, onClose, defaultTab = "signin" }: Props) => {
  const [activeTab, setActiveTab] = useState<"signin" | "signup">("signin");

  // ---- Sign in state ----
  const [siEmail, setSiEmail] = useState("");
  const [siPhase, setSiPhase] = useState<Phase>("request");
  const [siLoading, setSiLoading] = useState(false);
  const [siCode, setSiCode] = useState("");
  const [siError, setSiError] = useState<string | null>(null);
  const userNotFound = useMemo(
    () =>
      (siError || "").toLowerCase().includes("no account") ||
      (siError || "").toLowerCase().includes("not found"),
    [siError]
  );

  // ---- Sign up state ----
  const [suPhase, setSuPhase] = useState<Phase>("request");
  const [suLoading, setSuLoading] = useState(false);
  const [suCode, setSuCode] = useState("");
  const [suError, setSuError] = useState<string | null>(null);
  const [emailTaken, setEmailTaken] = useState(false);

  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [suEmail, setSuEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [country, setCountry] = useState("");

  // Close on ESC
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (!open) return;
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  // Reset state when modal opens
  useEffect(() => {
    if (open) {
      setActiveTab(defaultTab);
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
      setEmailTaken(false);
      setFirstName("");
      setLastName("");
      setSuEmail("");
      setPhone("");
      setCountry("");
    }
  }, [open, defaultTab]);

  if (!open) return null;

  // ---------- Sign in ----------
  const sendSignInOtp = async () => {
    setSiError(null);
    const email = siEmail.trim().toLowerCase();
    if (!email) return;
    setSiLoading(true);

    const { error } = await supabase.auth.signInWithOtp({
      email,
      options: {
        shouldCreateUser: false, // prevents creating new users from Sign in
      },
    });

    setSiLoading(false);
    if (error) {
      const msg =
        error.message.toLowerCase().includes("signups not allowed") ||
        error.message.toLowerCase().includes("for security reasons")
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
    const email = siEmail.trim().toLowerCase();
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

  // ---------- Sign up ----------
  // 1) definitive check via RPC (reads auth.users)
  const isEmailRegistered = async (email: string) => {
    const e = email.trim().toLowerCase();
    if (!e) return false;
    const { data, error } = await supabase.rpc("email_registered", {
      p_email: e,
    });
    if (error) {
      console.warn("email_registered RPC error:", error.message);
      return false;
    }
    return data === true;
  };

  // 2) optional soft fallback to your mirror table (non-blocking)
  const isInMirror = async (email: string) => {
    const e = email.trim().toLowerCase();
    if (!e) return false;
    const { data, error } = await supabase
      .from("users")
      .select("user_id")
      .eq("email", e)
      .maybeSingle();
    if (error) return false;
    return !!data;
  };

  const sendSignUpOtp = async () => {
    setSuError(null);
    setEmailTaken(false);
    const email = suEmail.trim().toLowerCase();

    if (!firstName.trim() || !lastName.trim() || !email) {
      setSuError("Please fill first name, last name, and email.");
      return;
    }

    setSuLoading(true);

    // Pre-checks to avoid sending an OTP to an already-registered email
    const exists = await isEmailRegistered(email);
    const existsMirror = !exists ? await isInMirror(email) : false;

    if (exists || existsMirror) {
      setSuLoading(false);
      setEmailTaken(true);
      return;
    }

    const { error } = await supabase.auth.signInWithOtp({
      email,
      options: {
        shouldCreateUser: true,
        data: { firstName, lastName, phone, country },
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
    const email = suEmail.trim().toLowerCase();
    if (!email || suCode.trim().length < 6) return;
    setSuLoading(true);

    const { error } = await supabase.auth.verifyOtp({
      email,
      token: suCode.trim(),
      type: "email",
    });

    if (error) {
      setSuLoading(false);
      setSuError(error.message);
      return;
    }

    setSuLoading(false);
    onClose();
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center"
      role="dialog"
      aria-modal="true"
    >
      {/* Overlay */}
      <div
        className="absolute inset-0 bg-black/40 backdrop-blur-sm"
        onClick={onClose}
      />
      {/* Panel */}
      <div className="relative bg-white rounded-2xl shadow-xl w-[92vw] max-w-md p-6">
        {/* Close */}
        <button
          onClick={onClose}
          className="absolute right-3 top-3 rounded-full w-8 h-8 flex items-center justify-center text-gray-500 hover:bg-gray-100"
          aria-label="Close"
          title="Close"
        >
          ✕
        </button>

        {/* Tabs */}
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

        {/* Content */}
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

                {userNotFound && (
                  <p className="text-sm text-gray-600 mt-3 text-center">
                    No account with that email.{" "}
                    <button
                      className="underline text-orange-600"
                      onClick={() => {
                        setActiveTab("signup");
                        setSuEmail(siEmail);
                      }}
                    >
                      Sign up?
                    </button>
                  </p>
                )}
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
                    Phone
                  </label>
                  <input
                    className="w-full border rounded-lg px-3 py-2"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder="+254 700 000 000"
                  />
                </div>

                <div className="mt-3">
                  <label className="block text-sm font-medium mb-1">
                    Country
                  </label>
                  <input
                    className="w-full border rounded-lg px-3 py-2"
                    value={country}
                    onChange={(e) => setCountry(e.target.value)}
                    placeholder="Kenya"
                  />
                </div>

                {emailTaken && (
                  <div className="text-sm bg-yellow-50 border border-yellow-200 rounded p-3 mt-2">
                    Looks like an account with <strong>{suEmail}</strong>{" "}
                    already exists.{" "}
                    <button
                      className="underline text-orange-600"
                      onClick={() => {
                        setActiveTab("signin");
                        setSiEmail(suEmail);
                      }}
                    >
                      Sign in instead
                    </button>
                    .
                  </div>
                )}

                {suError && (
                  <p className="text-sm text-red-500 mt-2">{suError}</p>
                )}

                <button
                  onClick={sendSignUpOtp}
                  disabled={
                    suLoading ||
                    !firstName.trim() ||
                    !lastName.trim() ||
                    !suEmail.trim()
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
                  We emailed a 6-digit code to <strong>{suEmail}</strong>. Enter
                  it below to finish creating your account.
                </p>
                <input
                  id="signup-code"
                  className="w-full border rounded-lg px-3 py-2 mb-2 tracking-widest text-center"
                  placeholder="123456"
                  value={suCode}
                  onChange={(e) => setSuCode(e.target.value)}
                  inputMode="numeric"
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
};

export default AuthModal;
