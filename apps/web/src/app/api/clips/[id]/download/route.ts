import { NextResponse } from "next/server";

import { requireUser } from "@/lib/api/auth";
import { AppError } from "@/lib/api/errors";
import { handleRoute } from "@/lib/api/response";
import { isUuid } from "@/lib/ids";
import { presignDownload } from "@/lib/r2";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type ClipRow = {
  id: string;
  title: string;
  storage_path: string | null;
  render_status: string;
};

function downloadName(title: string, clipId: string): string {
  const base =
    title
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "")
      .slice(0, 64) || `clip-${clipId.slice(0, 8)}`;
  return `${base}.mp4`;
}

export async function GET(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  return handleRoute(async () => {
    const { supabase } = await requireUser();
    const { id: clipId } = await params;

    if (!isUuid(clipId)) {
      throw new AppError("NOT_FOUND", "Clip not found.");
    }

    const { data: clip, error } = await supabase
      .from("clips")
      .select("id, title, storage_path, render_status")
      .eq("id", clipId)
      .maybeSingle<ClipRow>();

    if (error) {
      throw new AppError("INTERNAL_ERROR", "Could not load the clip.", {
        details: error.message,
      });
    }

    if (!clip) {
      throw new AppError("NOT_FOUND", "Clip not found.");
    }

    if (clip.render_status !== "rendered" || !clip.storage_path) {
      throw new AppError("RENDER_IN_PROGRESS", "This clip has not finished rendering yet.");
    }

    const url = await presignDownload(clip.storage_path, downloadName(clip.title, clip.id));

    return NextResponse.redirect(url, {
      status: 302,
      headers: { "Cache-Control": "no-store" },
    });
  });
}
