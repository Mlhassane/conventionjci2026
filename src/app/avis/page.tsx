import Footer from "@/components/Footer";
import PageHeader from "@/components/PageHeader";
import EmptyState from "@/components/EmptyState";
import { getEventSettings, getFeedbacks } from "@/lib/data";
import type { Feedback } from "@/lib/types";
import AvisForm from "./AvisForm";

export const dynamic = "force-dynamic";

export default async function AvisPage() {
  const [feedbacks, settings] = await Promise.all([getFeedbacks(), getEventSettings()]);
  const rated = feedbacks.filter((f) => f.rating !== null);
  const avg =
    rated.length > 0 ? rated.reduce((sum, f) => sum + (f.rating ?? 0), 0) / rated.length : null;

  return (
    <main>
      <PageHeader
        eyebrow={settings.event_name}
        title="Ils racontent la Convention"
        description="Vous y étiez ? Dites ce que vous avez aimé — ou pas — et aidez-nous à faire encore mieux."
      />

      <div className="container-edge pb-24 max-w-2xl">
        <AvisForm />

        <div className="mt-12">
          <p className="eyebrow">Retours des participants</p>
          <div className="mt-4 flex items-end justify-between gap-4">
            <h2 className="font-serif text-2xl">
              {feedbacks.length > 0
                ? `${feedbacks.length} avis publié${feedbacks.length > 1 ? "s" : ""}`
                : "Aucun avis pour le moment"}
            </h2>
            {avg !== null && avg > 0 && (
              <p className="shrink-0 text-sm text-ink/60">
                <span className="text-blue text-lg">★</span> {avg.toFixed(1)}/5
              </p>
            )}
          </div>

          {feedbacks.length === 0 ? (
            <div className="mt-6">
              <EmptyState title="Soyez le premier à laisser un avis." />
            </div>
          ) : (
            <div className="mt-6 space-y-4">
              {feedbacks.map((feedback) => (
                <FeedbackCard key={feedback.id} feedback={feedback} />
              ))}
            </div>
          )}
        </div>
      </div>
      <Footer />
    </main>
  );
}

function FeedbackCard({ feedback }: { feedback: Feedback }) {
  const meta = [feedback.organization, feedback.city].filter(Boolean).join(" · ");
  return (
    <article className="card p-6 transition-shadow hover:shadow-card">
      {feedback.rating !== null && (
        <p className="text-blue tracking-wide" aria-label={`Note : ${feedback.rating}/5`}>
          {"★".repeat(feedback.rating)}
          <span className="text-line">{"★".repeat(5 - feedback.rating)}</span>
        </p>
      )}
      <p className="mt-2 text-sm text-ink/75 leading-relaxed whitespace-pre-line">
        {feedback.message}
      </p>
      <div className="mt-4 flex items-center gap-3">
        <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-ink font-serif text-sm text-blue">
          {getInitials(feedback.name)}
        </span>
        <div className="min-w-0">
          <p className="font-medium leading-tight">{feedback.name}</p>
          {meta && <p className="mt-0.5 text-xs text-ink/50">{meta}</p>}
        </div>
      </div>
    </article>
  );
}

function getInitials(name: string): string {
  return name
    .split(" ")
    .slice(0, 2)
    .map((w) => w.charAt(0))
    .join("")
    .toUpperCase();
}
