import { useEffect } from "react";
import { useNavigate } from "react-router-dom";

export default function SignUp() {
  const navigate = useNavigate();
  useEffect(() => {
    window.dispatchEvent(
      new CustomEvent("auth:open", { detail: { tab: "signup" } })
    );
    navigate("/", { replace: true });
  }, [navigate]);
  return null;
}
