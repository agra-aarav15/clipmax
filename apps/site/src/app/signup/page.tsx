import type { Metadata } from "next";

import { PreviewPage } from "../../components/preview-page";

export const metadata: Metadata = {
  title: "Signup preview",
  description: "Sign-in and signup require the full ClipMax app and hosted Supabase credentials.",
};

export default function SignupPreviewPage() {
  return (
    <PreviewPage
      eyebrow="Signup · design preview"
      title="Sign-in lives in the full studio."
      description="The production signup uses Supabase magic links and Google OAuth, then lands in the real dashboard. This static preview stops short rather than showing a form that cannot authenticate."
    />
  );
}
