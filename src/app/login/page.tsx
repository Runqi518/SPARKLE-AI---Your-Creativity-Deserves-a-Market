"use client";
import { useState } from "react";
import { request } from "@/components/studio/data";
import "@/components/studio/studio.css";
export default function LoginPage() {
  const [register, setRegister] = useState(false), [error, setError] = useState(""), [busy, setBusy] = useState(false);
  async function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault(); if (busy) return; setBusy(true); setError("");
    const fields = new FormData(event.currentTarget);
    try {
      await request(`/api/auth/${register ? "register" : "login"}`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ email: fields.get("email"), password: fields.get("password") }) });
      const next = new URLSearchParams(location.search).get("next") || "/";
      location.assign(next.startsWith("/") && !next.startsWith("//") && !next.includes("\\") ? next : "/");
    } catch (error) { setError((error as Error).message); setBusy(false); }
  }
  return <div className="dialog-backdrop"><section className="studio-dialog" aria-label="Account access"><h2>{register ? "Create your account" : "Welcome to Sparkle"}</h2><form className="dialog-form" onSubmit={submit}><label>Email<input name="email" type="email" autoComplete="email" required /></label><label>Password<input name="password" type="password" minLength={12} maxLength={200} autoComplete={register ? "new-password" : "current-password"} required /></label>{error && <p className="error-banner" role="alert">{error}</p>}<button className="primary-button" disabled={busy}>{busy ? "Please wait…" : register ? "Create account" : "Sign in"}</button><button className="secondary-button" type="button" disabled={busy} onClick={() => setRegister(!register)}>{register ? "Sign in instead" : "Create an account"}</button></form></section></div>;
}
