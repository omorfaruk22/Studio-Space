"use client";

import { useEffect, useState, type FormEvent } from "react";
import { ShieldCheck } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { FormField } from "@/components/ui/form-field";
import { Input } from "@/components/ui/input";
import { Spinner } from "@/components/ui/loading";

type Verification = { id: string; status: "pending" | "approved" | "rejected"; businessName?: string; website?: string; message?: string; adminNote?: string };
type ApiResult = { verification?: Verification | null; message?: string };

export function HostVerificationPanel() {
  const [verification, setVerification] = useState<Verification | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [businessName, setBusinessName] = useState("");
  const [website, setWebsite] = useState("");
  const [message, setMessage] = useState("");

  useEffect(() => {
    let active = true;
    void fetch("/api/host/verification", { cache: "no-store", credentials: "same-origin" })
      .then(async (response) => {
        const data = await response.json() as ApiResult;
        if (!response.ok) throw new Error(data.message || "Could not load host verification.");
        if (active && data.verification) {
          setVerification(data.verification);
          setBusinessName(data.verification.businessName ?? "");
          setWebsite(data.verification.website ?? "");
          setMessage(data.verification.message ?? "");
        }
      })
      .catch((error: unknown) => { if (active) toast.error(error instanceof Error ? error.message : "Could not load host verification."); })
      .finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, []);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSaving(true);
    try {
      const response = await fetch("/api/host/verification", {
        method: "POST",
        headers: { "content-type": "application/json" },
        credentials: "same-origin",
        body: JSON.stringify({ businessName, website, message }),
      });
      const data = await response.json() as ApiResult;
      if (!response.ok || !data.verification) throw new Error(data.message || "Could not send the verification request.");
      setVerification(data.verification);
      toast.success("Your host verification request was sent for review.");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Could not send the verification request.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <section className="mt-10" aria-labelledby="host-verification-heading">
      <Card>
        <CardContent className="p-5 sm:p-7">
          <div className="flex items-start gap-3">
            <span className="grid size-11 shrink-0 place-items-center rounded-2xl bg-accent-green-soft text-accent-green-strong"><ShieldCheck size={21} aria-hidden="true" /></span>
            <div><h2 id="host-verification-heading" className="font-serif text-2xl text-ink">Host verification</h2><p className="mt-1 text-sm leading-6 text-muted">Tell us about your studio business. We review requests manually and never ask you to upload identity documents here.</p></div>
          </div>
          {loading ? <p className="mt-5 text-sm text-muted" role="status">Checking verification status…</p> : null}
          {!loading && verification?.status === "approved" ? <p className="mt-5 rounded-2xl bg-accent-green-soft px-4 py-3 text-sm font-semibold text-accent-green-strong">Your host profile is verified. This badge appears on your public studio pages.</p> : null}
          {!loading && verification?.status === "pending" ? <div className="mt-5 rounded-2xl bg-accent-yellow-soft px-4 py-3 text-sm text-accent-yellow-strong"><p className="font-semibold">Request under review</p><p className="mt-1">We will update this panel after an admin reviews your details.</p></div> : null}
          {!loading && verification?.status === "rejected" && verification.adminNote ? <p className="mt-5 rounded-2xl bg-sand px-4 py-3 text-sm text-ink"><span className="font-semibold">Admin note: </span>{verification.adminNote}</p> : null}
          {!loading && verification?.status !== "approved" && verification?.status !== "pending" ? (
            <form onSubmit={submit} aria-busy={saving} className="mt-5 grid gap-4 sm:grid-cols-2">
              <FormField label="Studio or business name" htmlFor="host-business-name"><Input id="host-business-name" maxLength={120} value={businessName} onChange={(event) => setBusinessName(event.target.value)} placeholder="Optional" /></FormField>
              <FormField label="Public website" htmlFor="host-website" hint="Optional; include https://"><Input id="host-website" type="url" maxLength={2048} value={website} onChange={(event) => setWebsite(event.target.value)} placeholder="https://example.com" /></FormField>
              <div className="sm:col-span-2"><FormField label="About your space and hosting" htmlFor="host-verification-message" hint="At least 30 characters; include a public listing or portfolio if available." required><textarea id="host-verification-message" required minLength={30} maxLength={1200} rows={4} value={message} onChange={(event) => setMessage(event.target.value)} className="w-full rounded-2xl border border-line bg-white px-4 py-3 text-sm text-ink focus:border-focus focus:outline-none focus:ring-4 focus:ring-focus/10" placeholder="Describe the studio, how it is operated, and how guests can contact you." /></FormField></div>
              <div className="sm:col-span-2"><Button type="submit" disabled={saving || message.trim().length < 30}>{saving ? <><Spinner className="size-4" label="Sending verification request" />Sending…</> : verification?.status === "rejected" ? "Send updated request" : "Request verification"}</Button></div>
            </form>
          ) : null}
        </CardContent>
      </Card>
    </section>
  );
}
