"use client";

import { useEffect, useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { FormField } from "@/components/ui/form-field";
import { Input, Textarea } from "@/components/ui/input";
import { Spinner, StudioFormSkeleton } from "@/components/ui/loading";
import type { HostStudio, StudioCategory } from "@/lib/studio-types";
import { studioCategoryLabels } from "@/lib/studio-types";

const categories: StudioCategory[] = ["photo", "sound-stage", "podcast", "music", "art"];

type StudioFormProps = { studioId?: string; hostName?: string; hostEmail?: string };
type StudioResponse = { studio?: HostStudio; message?: string };

function lines(value: FormDataEntryValue | null): string[] {
  return typeof value === "string" ? value.split(/\r?\n/).map((item) => item.trim()).filter(Boolean) : [];
}

export function StudioForm({ studioId, hostName = "", hostEmail = "" }: StudioFormProps) {
  const router = useRouter();
  const [studio, setStudio] = useState<HostStudio | null>(null);
  const [loading, setLoading] = useState(Boolean(studioId));
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!studioId) return;
    const controller = new AbortController();

    async function loadStudio() {
      try {
        const endpoint = `/api/host/studios/${studioId}`;
        const response = await fetch(endpoint, {
          cache: "no-store",
          signal: controller.signal,
        });
        const result = (await response.json()) as StudioResponse;
        if (!response.ok || !result.studio) throw new Error(result.message || "Could not load this studio.");
        setStudio(result.studio);
      } catch (cause) {
        if (!controller.signal.aborted) {
          setError(cause instanceof Error ? cause.message : "Could not load this studio.");
        }
      } finally {
        if (!controller.signal.aborted) setLoading(false);
      }
    }

    void loadStudio();
    return () => controller.abort();
  }, [studioId]);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    setSubmitting(true);
    const form = new FormData(event.currentTarget);
    const coverUrl = String(form.get("image") ?? "").trim();
    if (!coverUrl) {
      setError("Enter a studio image URL.");
      setSubmitting(false);
      return;
    }
    const payload = {
      title: form.get("title"),
      category: form.get("category"),
      hourlyRate: Number(form.get("hourlyRate")),
      securityDeposit: Number(form.get("securityDeposit")),
      maxCapacity: Number(form.get("maxCapacity")),
      location: form.get("location"),
      image: coverUrl,
      amenities: lines(form.get("amenities")),
      overview: form.get("overview"),
    };

    try {
      const endpoint = studioId ? `/api/host/studios/${studioId}` : "/api/host/studios";
      const response = await fetch(endpoint, {
        method: studioId ? "PATCH" : "POST",
        headers: { "content-type": "application/json" },
        credentials: "same-origin",
        body: JSON.stringify(payload),
      });
      const result = (await response.json()) as StudioResponse;
      if (!response.ok) throw new Error(result.message || "Could not save this studio.");
      toast.success(studioId ? "Studio listing updated." : "Studio listing created.");
      router.push("/dashboard");
      router.refresh();
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Could not connect to StudioSpace.");
    } finally {
      setSubmitting(false);
    }
  }

  if (loading) return <StudioFormSkeleton />;
  if (studioId && error && !studio) {
    return <div className="rounded-2xl border border-red-200 bg-white p-5 text-sm text-red-800" role="alert">{error}</div>;
  }

  return (
    <form onSubmit={handleSubmit} aria-busy={submitting} className="space-y-6">
      {error ? <div className="rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800" role="alert">{error}</div> : null}

      <div className="grid gap-5 sm:grid-cols-2">
        <FormField label="Studio name" htmlFor="title" required>
          <Input id="title" name="title" required maxLength={120} defaultValue={studio?.title ?? ""} placeholder="e.g. Sunlit Photo Loft" />
        </FormField>
        <FormField label="Category" htmlFor="category" required>
          <select id="category" name="category" required defaultValue={studio?.category ?? "photo"} className="min-h-12 w-full rounded-2xl border border-line bg-white px-4 text-sm text-ink outline-none focus:border-focus focus:ring-4 focus:ring-focus/10">
            {categories.map((category) => <option key={category} value={category}>{studioCategoryLabels[category]}</option>)}
          </select>
        </FormField>
        <FormField label="Hourly rate (USD)" htmlFor="hourlyRate" required>
          <Input id="hourlyRate" name="hourlyRate" type="number" min="0" step="0.01" required defaultValue={studio?.hourlyRate ?? ""} placeholder="45" />
        </FormField>
        <FormField label="Security deposit (USD)" htmlFor="securityDeposit" required>
          <Input id="securityDeposit" name="securityDeposit" type="number" min="0" step="0.01" required defaultValue={studio?.securityDeposit ?? 0} />
        </FormField>
        <FormField label="Maximum capacity" htmlFor="maxCapacity" required>
          <Input id="maxCapacity" name="maxCapacity" type="number" min="1" step="1" required defaultValue={studio?.maxCapacity ?? ""} placeholder="8" />
        </FormField>
        <FormField label="Location" htmlFor="location" required>
          <Input id="location" name="location" required maxLength={180} defaultValue={studio?.location ?? ""} placeholder="City, neighborhood" />
        </FormField>
      </div>

      <FormField label="Studio image URL" htmlFor="image" required hint="Paste one public image URL for this studio.">
        <Input id="image" name="image" type="url" required defaultValue={studio?.image ?? ""} placeholder="https://example.com/studio.jpg" />
      </FormField>

      <FormField label="Amenities" htmlFor="amenities" hint="Optional. Add one amenity per line, up to 20.">
        <Textarea id="amenities" name="amenities" defaultValue={studio?.amenities.join("\n") ?? ""} placeholder={"Natural light\nSoundproofing\nWi-Fi"} />
      </FormField>

      <FormField label="About this studio" htmlFor="overview" required hint="Describe the space, equipment, and what creators can make here.">
        <Textarea id="overview" name="overview" required maxLength={5000} defaultValue={studio?.overview ?? ""} placeholder="Tell creators what makes this space a good fit for their project." />
      </FormField>

      <div className="grid gap-5 border-t border-line pt-5 sm:grid-cols-2">
        <FormField label="Host name" htmlFor="hostName" hint="This is taken from your account and cannot be changed here.">
          <Input id="hostName" value={hostName} readOnly className="bg-sand/70" />
        </FormField>
        <FormField label="Host email" htmlFor="hostEmail" hint="This is taken from your account and cannot be changed here.">
          <Input id="hostEmail" type="email" value={hostEmail} readOnly className="bg-sand/70" />
        </FormField>
      </div>

      <div className="flex flex-col-reverse gap-3 border-t border-line pt-5 sm:flex-row sm:justify-end">
        <Button type="button" variant="outline" onClick={() => router.push("/dashboard")}>Cancel</Button>
        <Button type="submit" size="lg" disabled={submitting}>{submitting ? <><Spinner className="size-4" label="Saving studio listing" />Saving listing…</> : studioId ? "Save changes" : "Create studio listing"}</Button>
      </div>
    </form>
  );
}
