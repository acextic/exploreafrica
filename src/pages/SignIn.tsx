import { useEffect } from "react";
import { useNavigate } from "react-router-dom";

export default function SignIn() {
  const navigate = useNavigate();
  useEffect(() => {
    window.dispatchEvent(
      new CustomEvent("auth:open", { detail: { tab: "signin" } })
    );
    navigate("/", { replace: true });
  }, [navigate]);
  return null;
}
