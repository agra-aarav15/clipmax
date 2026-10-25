import type { Metadata } from "next";

import { PreviewPage } from "../../components/preview-page";

export const metadata: Metadata = {
  title: "Studio preview",
  description: "The ClipMax studio requires the full Next.js app, Supabase, R2, and the worker.",
};

export default function DashboardPreviewPage() {
  return (
    <PreviewPage
      eyebrow="Studio · design preview"
      title="The studio needs a real pipeline."
      description="Uploads land in private R2, the Python worker claims a leased job, and every status comes from Postgres. None of that can run on GitHub Pages, so this route explains the boundary instead of inventing projects or clips."
    />
  );
}
