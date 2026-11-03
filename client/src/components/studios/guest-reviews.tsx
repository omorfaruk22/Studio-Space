"use client";

import { useEffect, useState, type FormEvent } from "react";
import { Star } from "lucide-react";
import { toast } from "sonner";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Spinner } from "@/components/ui/loading";
import { FormField } from "@/components/ui/form-field";

type Review = { id: string; userName: string; rating: number; comment: string; createdAt: string };
type EligibleBooking = { id: string; studioId: string; bookingDate: string; status: string; reviewSubmitted?: boolean };
type ResponseShape = { reviews?: Review[]; bookings?: EligibleBooking[]; message?: string };

function reviewDate(value: string) {
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? "" : new Intl.DateTimeFormat(undefined, { dateStyle: "medium" }).format(date);
}

export function GuestReviews({ studioId, isAuthenticated }: { studioId: string; isAuthenticated: boolean }) {
  const [reviews, setReviews] = useState<Review[]>([]);
  const [eligible, setEligible] = useState<EligibleBooking[]>([]);
  const [loading, setLoading] = useState(true);
  const [rating, setRating] = useState("5");
  const [comment, setComment] = useState("");
  const [bookingId, setBookingId] = useState("");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    let active = true;
    const requests: Array<Promise<ResponseShape>> = [
      fetch(`/api/studios/${encodeURIComponent(studioId)}/reviews`, { cache: "no-store" }).then(async (res) => {
        const data = await res.json() as ResponseShape;
        if (!res.ok) throw new Error(data.message || "Could not load reviews.");
        return data;
      }),
    ];
    if (isAuthenticated) {
      requests.push(fetch("/api/my-bookings", { cache: "no-store", credentials: "same-origin" }).then(async (res) => {
        const data = await res.json() as ResponseShape;
        if (!res.ok) throw new Error(data.message || "Could not check completed bookings.");
        return data;
      }));
    }
    void Promise.all(requests)
      .then((responses) => {
        if (!active) return;
        setReviews(responses[0].reviews ?? []);
        const completed = (responses[1]?.bookings ?? []).filter((item) => item.studioId === studioId && item.status === "Completed" && !item.reviewSubmitted);
        setEligible(completed);
        if (completed.length) setBookingId(completed[0].id);
      })
      .catch((error: unknown) => { if (active) toast.error(error instanceof Error ? error.message : "Could not load reviews."); })
      .finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, [isAuthenticated, studioId]);

  async function submitReview(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSaving(true);
    try {
      const response = await fetch(`/api/bookings/${encodeURIComponent(bookingId)}/review`, {
        method: "POST",
        headers: { "content-type": "application/json" },
        credentials: "same-origin",
        body: JSON.stringify({ rating: Number(rating), comment }),
      });
      const data = await response.json() as { review?: Review; message?: string };
      if (!response.ok || !data.review) throw new Error(data.message || "Could not submit your review.");
      setReviews((current) => [data.review!, ...current]);
      setEligible((current) => current.filter((item) => item.id !== bookingId));
      setComment("");
      toast.success("Thanks for sharing your experience.");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Could not submit your review.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="mt-5 space-y-4">
      {loading ? <p className="text-sm text-muted" role="status">Loading reviews…</p> : null}
      {!loading && reviews.length === 0 ? <Card><CardContent className="p-5 text-sm text-muted">No guest reviews yet.</CardContent></Card> : null}
      {reviews.map((review) => (
        <Card key={review.id}>
          <CardContent className="p-5">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <p className="font-semibold text-ink">{review.userName}</p>
              <span className="text-xs text-muted">{reviewDate(review.createdAt)}</span>
            </div>
            <p className="mt-2 inline-flex items-center gap-1 text-sm font-semibold text-ink"><Star size={15} className="fill-[#d89d49] text-[#d89d49]" aria-hidden="true" />{review.rating} / 5</p>
            <p className="mt-2 whitespace-pre-line text-sm leading-6 text-muted">{review.comment}</p>
          </CardContent>
        </Card>
      ))}
      {isAuthenticated && eligible.length > 0 ? (
        <Card>
          <CardContent className="p-5 sm:p-6">
            <h3 className="font-serif text-xl text-ink">Review a completed visit</h3>
            <p className="mt-1 text-sm text-muted">Only completed bookings for this space can be reviewed, once per booking.</p>
            <form onSubmit={submitReview} className="mt-4 space-y-4" aria-busy={saving}>
              {eligible.length > 1 ? <FormField label="Completed booking" htmlFor={`review-booking-${studioId}`} required><select id={`review-booking-${studioId}`} value={bookingId} onChange={(event) => setBookingId(event.target.value)} className="min-h-12 w-full rounded-2xl border border-line bg-white px-4 text-sm text-ink"><option value="" disabled>Choose a visit</option>{eligible.map((item) => <option key={item.id} value={item.id}>{item.bookingDate}</option>)}</select></FormField> : null}
              <FormField label="Rating" htmlFor={`review-rating-${studioId}`} required><select id={`review-rating-${studioId}`} value={rating} onChange={(event) => setRating(event.target.value)} className="min-h-12 w-full rounded-2xl border border-line bg-white px-4 text-sm text-ink">{[5, 4, 3, 2, 1].map((value) => <option key={value} value={value}>{value} {value === 1 ? "star" : "stars"}</option>)}</select></FormField>
              <FormField label="Your review" htmlFor={`review-comment-${studioId}`} hint="10–1,200 characters." required><textarea id={`review-comment-${studioId}`} required minLength={10} maxLength={1200} value={comment} onChange={(event) => setComment(event.target.value)} rows={4} className="w-full rounded-2xl border border-line bg-white px-4 py-3 text-sm text-ink focus:border-focus focus:outline-none focus:ring-4 focus:ring-focus/10" placeholder="What should another creator know?" /></FormField>
              <Button type="submit" disabled={saving || !bookingId || comment.trim().length < 10}>{saving ? <><Spinner className="size-4" label="Submitting review" />Submitting…</> : "Post review"}</Button>
            </form>
          </CardContent>
        </Card>
      ) : null}
      {isAuthenticated && !loading && eligible.length === 0 ? <p className="text-sm text-muted">A review form appears here after a completed booking.</p> : null}
      {!isAuthenticated ? <p className="text-sm text-muted">Sign in and complete a booking to leave a review.</p> : null}
    </div>
  );
}
