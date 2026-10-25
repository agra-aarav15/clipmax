"use client";

import {
  ALLOWED_VIDEO_MIME_TYPES,
  EXTENSION_TO_MIME,
  MAX_SOURCE_BYTES,
  MAX_SOURCE_DURATION_MINUTES,
  MAX_SOURCE_DURATION_SECONDS,
  creditsForDurationSeconds,
  isSupportedSourceUrl,
  type InitiateProcessingResponse,
  type PresignResponse,
} from "@clipmax/shared";
import {
  AlertCircleIcon,
  ArrowRightIcon,
  CheckCircle2Icon,
  FileVideoIcon,
  Link2Icon,
  Loader2Icon,
  ShieldCheckIcon,
  UploadCloudIcon,
  XIcon,
} from "lucide-react";
import { useRouter } from "next/navigation";
import { useId, useRef, useState, type DragEvent } from "react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Progress } from "@/components/ui/progress";
import { cn } from "@/lib/utils";

type Mode = "upload" | "link";
type Phase = "idle" | "presigning" | "uploading" | "initiating" | "queued" | "error";

const MAX_CREDITS = creditsForDurationSeconds(MAX_SOURCE_DURATION_SECONDS);

function mimeForFile(file: File): string | null {
  if ((ALLOWED_VIDEO_MIME_TYPES as readonly string[]).includes(file.type)) return file.type;
  const extension = file.name.split(".").pop()?.toLowerCase();
  if (extension && extension in EXTENSION_TO_MIME) {
    return EXTENSION_TO_MIME[extension as keyof typeof EXTENSION_TO_MIME];
  }
  return null;
}

function formatBytes(bytes: number): string {
  if (bytes < 1024 * 1024) return `${Math.max(1, Math.round(bytes / 1024))} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

async function errorMessage(response: Response): Promise<string> {
  try {
    const body = (await response.json()) as { error?: { message?: string } };
    if (body.error?.message) return body.error.message;
  } catch {
    // fall through
  }
  return `Request failed (${response.status}).`;
}

function putWithProgress(
  url: string,
  file: File,
  headers: Record<string, string>,
  onProgress: (percent: number) => void,
  onXhr: (xhr: XMLHttpRequest) => void,
): Promise<void> {
  return new Promise((resolve, reject) => {
    const xhr = new XMLHttpRequest();
    onXhr(xhr);
    xhr.open("PUT", url);

    for (const [key, value] of Object.entries(headers)) {
      // Browsers own Content-Length; setting it is forbidden.
      if (key.toLowerCase() === "content-length") continue;
      xhr.setRequestHeader(key, value);
    }

    xhr.upload.onprogress = (event) => {
      if (event.lengthComputable) onProgress(Math.round((event.loaded / event.total) * 100));
    };
    xhr.onload = () => {
      if (xhr.status >= 200 && xhr.status < 300) {
        onProgress(100);
        resolve();
        return;
      }
      const detail = xhr.responseText.slice(0, 240);
      reject(new Error(`Storage rejected the upload (${xhr.status}). ${detail}`.trim()));
    };
    xhr.onerror = () => reject(new Error("Network error while uploading. Check your connection."));
    xhr.onabort = () => reject(new Error("Upload cancelled. No credits were charged."));
    xhr.send(file);
  });
}

const PHASE_LABEL: Record<Exclude<Phase, "idle" | "error" | "queued">, string> = {
  presigning: "Signing a private upload URL",
  uploading: "Uploading directly to Cloudflare R2",
  initiating: "Verifying the object and holding credits",
};

export function UploadPanel({
  configured,
  initialLink = "",
  initialMode = "upload",
  uploadIntent = false,
}: {
  configured: boolean;
  initialLink?: string;
  initialMode?: Mode;
  uploadIntent?: boolean;
}) {
  const router = useRouter();
  const inputRef = useRef<HTMLInputElement>(null);
  const xhrRef = useRef<XMLHttpRequest | null>(null);
  const errorId = useId();
  const [mode, setMode] = useState<Mode>(initialMode);
  const [file, setFile] = useState<File | null>(null);
  const [link, setLink] = useState(initialLink);
  const [phase, setPhase] = useState<Phase>("idle");
  const [progress, setProgress] = useState(0);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [dragOver, setDragOver] = useState(false);

  const busy = phase === "presigning" || phase === "uploading" || phase === "initiating";
  const progressLabel =
    phase === "presigning" || phase === "uploading" || phase === "initiating"
      ? PHASE_LABEL[phase]
      : "Queued for the worker";

  function resetState() {
    setPhase("idle");
    setProgress(0);
    setMessage(null);
    setError(null);
  }

  function chooseFile(next: File | null) {
    resetState();
    if (!next) {
      setFile(null);
      return;
    }

    const mime = mimeForFile(next);
    if (!mime) {
      setFile(null);
      setPhase("error");
      setError("Choose an MP4, MOV, or WebM video.");
      return;
    }
    if (next.size > MAX_SOURCE_BYTES) {
      setFile(null);
      setPhase("error");
      setError(`This file is ${formatBytes(next.size)}. The limit is 500 MB.`);
      return;
    }

    setFile(next);
  }

  function onDrop(event: DragEvent<HTMLDivElement>) {
    event.preventDefault();
    setDragOver(false);
    chooseFile(event.dataTransfer.files[0] ?? null);
  }

  async function startUpload() {
    if (!file) return;
    const mime = mimeForFile(file);
    if (!mime) {
      setPhase("error");
      setError("Choose an MP4, MOV, or WebM video.");
      return;
    }

    setPhase("presigning");
    setProgress(0);
    setMessage(null);
    setError(null);

    try {
      const presignResponse = await fetch("/api/uploads/presign", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ fileName: file.name, fileType: mime, fileSize: file.size }),
      });

      if (!presignResponse.ok) throw new Error(await errorMessage(presignResponse));
      const presign = (await presignResponse.json()) as PresignResponse;

      setPhase("uploading");
      await putWithProgress(presign.uploadUrl, file, presign.headers, setProgress, (xhr) => {
        xhrRef.current = xhr;
      });

      setPhase("initiating");
      const initiateResponse = await fetch(`/api/projects/${presign.projectId}/initiate`, {
        method: "POST",
      });

      if (!initiateResponse.ok) throw new Error(await errorMessage(initiateResponse));
      const initiated = (await initiateResponse.json()) as InitiateProcessingResponse;

      setPhase("queued");
      setMessage(
        initiated.jobId
          ? "Upload complete. The worker is queued to probe and transcribe it."
          : "Upload complete. Processing is queued.",
      );
      setFile(null);
      router.push(`/dashboard/projects/${initiated.projectId}`);
    } catch (uploadError) {
      setPhase("error");
      setError(uploadError instanceof Error ? uploadError.message : "The upload failed.");
    } finally {
      xhrRef.current = null;
    }
  }

  async function startLink() {
    if (!isSupportedSourceUrl(link)) {
      setPhase("error");
      setError(
        "Paste a public YouTube, Instagram, TikTok, Vimeo, X, Facebook, LinkedIn, or Twitch link.",
      );
      return;
    }

    setPhase("initiating");
    setProgress(0);
    setMessage(null);
    setError(null);

    try {
      const response = await fetch("/api/projects/link", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ url: link }),
      });

      if (!response.ok) throw new Error(await errorMessage(response));
      const initiated = (await response.json()) as InitiateProcessingResponse;

      setPhase("queued");
      setMessage(
        initiated.jobId
          ? "Link accepted. The worker will download it, probe it, and start transcription."
          : "Link accepted and queued.",
      );
      setLink("");
      router.push(`/dashboard/projects/${initiated.projectId}`);
    } catch (linkError) {
      setPhase("error");
      setError(linkError instanceof Error ? linkError.message : "The link could not be queued.");
    }
  }

  return (
    <section
      id="new-project"
      aria-labelledby="new-project-title"
      className="scroll-mt-24 overflow-hidden rounded-2xl border border-white/[0.08] bg-gradient-to-b from-white/[0.035] to-white/[0.012]"
    >
      <div className="flex flex-wrap items-start justify-between gap-3 border-b border-white/[0.06] px-5 py-4 sm:px-6">
        <div className="flex items-start gap-3">
          <span className="mt-0.5 grid size-7 shrink-0 place-items-center rounded-md border border-signal/20 bg-signal/[0.06] font-mono text-[9px] text-signal">
            01
          </span>
          <div>
            <h2 id="new-project-title" className="text-[17px] font-semibold tracking-[-0.025em]">
              Bring the long version.
            </h2>
            <p className="mt-1 text-[12px] leading-relaxed text-zinc-500">
              Upload a file or paste a public link. We probe the real duration before charging.
            </p>
          </div>
        </div>
        <span className="rounded-full border border-white/[0.08] bg-white/[0.02] px-2.5 py-1 font-mono text-[8px] tracking-[0.14em] text-zinc-400 uppercase">
          up to {MAX_SOURCE_DURATION_MINUTES} min
        </span>
      </div>

      <div className="px-5 py-5 sm:px-6">
        {initialLink || uploadIntent ? (
          <div className="mb-4 flex items-start gap-2.5 rounded-lg border border-signal/15 bg-signal/[0.04] px-3 py-2.5 text-[11.5px] leading-relaxed text-zinc-300">
            <CheckCircle2Icon className="mt-0.5 size-3.5 shrink-0 text-signal" />
            <p>
              {initialLink
                ? "Your link carried over from the landing page. Review it and queue the source."
                : "Your file was checked in the browser, not uploaded. Choose it again here so it goes straight to private storage."}
            </p>
          </div>
        ) : null}

        <div
          className="grid grid-cols-2 gap-1 rounded-xl border border-white/[0.07] bg-black/25 p-1"
          role="group"
          aria-label="Source type"
        >
          {(
            [
              { value: "upload" as const, label: "Upload a file", icon: UploadCloudIcon },
              { value: "link" as const, label: "Paste a link", icon: Link2Icon },
            ] as const
          ).map((item) => {
            const Icon = item.icon;
            const selected = mode === item.value;
            return (
              <button
                key={item.value}
                type="button"
                aria-pressed={selected}
                onClick={() => {
                  setMode(item.value);
                  resetState();
                }}
                className={cn(
                  "flex h-9 items-center justify-center gap-2 rounded-lg text-[12px] font-medium transition-[background-color,color,box-shadow]",
                  selected
                    ? "bg-white/[0.08] text-white shadow-[inset_0_0_0_1px_rgba(255,255,255,0.06)]"
                    : "text-zinc-500 hover:text-zinc-300",
                )}
              >
                <Icon className={cn("size-3.5", selected && "text-signal")} />
                {item.label}
              </button>
            );
          })}
        </div>

        {mode === "upload" ? (
          <div className="mt-4">
            <div
              onDragOver={(event) => {
                event.preventDefault();
                setDragOver(true);
              }}
              onDragLeave={() => setDragOver(false)}
              onDrop={onDrop}
              className={cn(
                "relative flex min-h-[210px] flex-col items-center justify-center rounded-xl border border-dashed px-5 py-7 text-center transition-colors",
                dragOver
                  ? "border-signal/60 bg-signal/[0.06]"
                  : "border-white/[0.12] bg-black/20 hover:border-signal/35 hover:bg-white/[0.02]",
              )}
            >
              <span
                aria-hidden="true"
                className="pointer-events-none absolute top-2 left-2 size-3 border-t border-l border-white/20"
              />
              <span
                aria-hidden="true"
                className="pointer-events-none absolute top-2 right-2 size-3 border-t border-r border-white/20"
              />
              <span
                aria-hidden="true"
                className="pointer-events-none absolute bottom-2 left-2 size-3 border-b border-l border-white/20"
              />
              <span
                aria-hidden="true"
                className="pointer-events-none absolute right-2 bottom-2 size-3 border-r border-b border-white/20"
              />

              <input
                ref={inputRef}
                type="file"
                accept=".mp4,.mov,.webm,video/mp4,video/quicktime,video/webm"
                className="sr-only"
                onChange={(event) => chooseFile(event.target.files?.[0] ?? null)}
                aria-label="Choose a source video"
              />

              <div className="grid size-12 place-items-center rounded-xl border border-signal/20 bg-signal/[0.06] shadow-[0_0_40px_-10px_rgba(155,231,255,0.3)]">
                <FileVideoIcon className="size-5 text-signal" />
              </div>
              <p className="mt-4 text-[13px] font-medium text-zinc-200">
                {file ? file.name : "Drop a video here"}
              </p>
              <p className="mt-1 max-w-[20rem] text-[11px] leading-relaxed text-zinc-500">
                MP4, MOV, or WebM · up to 500 MB · {MAX_SOURCE_DURATION_MINUTES} minute maximum
              </p>
              <Button
                type="button"
                variant="outline"
                size="sm"
                className="mt-4 border-white/10 bg-white/[0.03]"
                disabled={busy}
                onClick={() => inputRef.current?.click()}
              >
                {file ? "Choose a different file" : "Choose a file"}
              </Button>
            </div>

            {file ? (
              <div className="mt-3 flex items-center justify-between gap-3 rounded-xl border border-white/[0.08] bg-white/[0.025] px-3.5 py-3">
                <div className="flex min-w-0 items-center gap-3">
                  <span className="grid size-8 shrink-0 place-items-center rounded-lg bg-signal/[0.07]">
                    <FileVideoIcon className="size-4 text-signal" />
                  </span>
                  <div className="min-w-0">
                    <p className="truncate text-[12px] font-medium text-zinc-200">{file.name}</p>
                    <p className="mt-0.5 font-mono text-[8px] tracking-[0.12em] text-zinc-600 uppercase">
                      {formatBytes(file.size)} · private upload
                    </p>
                  </div>
                </div>
                <div className="flex shrink-0 items-center gap-1">
                  <button
                    type="button"
                    disabled={busy}
                    onClick={() => {
                      setFile(null);
                      if (inputRef.current) inputRef.current.value = "";
                      resetState();
                    }}
                    className="grid size-8 place-items-center rounded-lg text-zinc-500 transition-colors hover:bg-white/[0.06] hover:text-zinc-200 disabled:opacity-40"
                    aria-label="Remove selected file"
                  >
                    <XIcon className="size-3.5" />
                  </button>
                  <Button type="button" size="sm" disabled={busy} onClick={startUpload}>
                    {busy ? <Loader2Icon className="animate-spin" /> : <ArrowRightIcon />}
                    {phase === "presigning"
                      ? "Preparing"
                      : phase === "uploading"
                        ? "Uploading"
                        : phase === "initiating"
                          ? "Queuing"
                          : "Start processing"}
                  </Button>
                </div>
              </div>
            ) : null}
          </div>
        ) : (
          <form
            className="mt-4"
            onSubmit={(event) => {
              event.preventDefault();
              void startLink();
            }}
          >
            <label
              htmlFor="source-link"
              className="font-mono text-[8px] tracking-[0.18em] text-zinc-500 uppercase"
            >
              Public source link
            </label>
            <div className="mt-2 flex flex-col gap-2 sm:flex-row">
              <div className="relative min-w-0 flex-1">
                <Link2Icon className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-zinc-600" />
                <Input
                  id="source-link"
                  type="url"
                  inputMode="url"
                  placeholder="https://www.youtube.com/watch?v=…"
                  value={link}
                  disabled={busy}
                  onChange={(event) => {
                    setLink(event.target.value);
                    if (phase === "error") resetState();
                  }}
                  className="h-11 rounded-xl border-white/10 bg-black/25 pl-9"
                />
              </div>
              <Button
                type="submit"
                size="lg"
                className="h-11 rounded-xl px-5"
                disabled={busy || link.trim().length === 0}
              >
                {busy ? <Loader2Icon className="animate-spin" /> : null}
                Queue link
              </Button>
            </div>
            <p className="mt-2.5 text-[11px] leading-relaxed text-zinc-500">
              Public YouTube, Instagram, TikTok, Vimeo, X, Facebook, LinkedIn, or Twitch links only.
              Private and unsupported links fail honestly.
            </p>
          </form>
        )}

        {busy || phase === "queued" ? (
          <div className="mt-4 rounded-xl border border-white/[0.07] bg-black/20 p-3.5">
            <div className="flex items-center justify-between gap-3 text-[11px]">
              <span className="flex items-center gap-2 text-zinc-400">
                <Loader2Icon className="size-3.5 animate-spin text-signal" />
                {phase === "queued" ? "Queued for the worker" : progressLabel}
              </span>
              {phase === "uploading" ? (
                <span className="font-mono text-[10px] text-signal">{progress}%</span>
              ) : null}
            </div>
            {phase === "uploading" ? <Progress value={progress} className="mt-2.5" /> : null}
            {phase === "uploading" ? (
              <button
                type="button"
                onClick={() => xhrRef.current?.abort()}
                className="mt-2 font-mono text-[8px] tracking-[0.14em] text-zinc-500 uppercase underline-offset-4 hover:text-zinc-300 hover:underline"
              >
                Cancel upload
              </button>
            ) : null}
          </div>
        ) : null}

        {message ? (
          <div
            role="status"
            className="mt-4 flex items-start gap-2 rounded-xl border border-signal/20 bg-signal/[0.05] px-3 py-2.5 text-[11.5px] leading-relaxed text-signal"
          >
            <CheckCircle2Icon className="mt-0.5 size-3.5 shrink-0" />
            <span>{message}</span>
          </div>
        ) : null}

        {error ? (
          <div
            id={errorId}
            role="alert"
            className="mt-4 flex items-start gap-2 rounded-xl border border-destructive/25 bg-destructive/[0.08] px-3 py-2.5 text-[11.5px] leading-relaxed text-red-200"
          >
            <AlertCircleIcon className="mt-0.5 size-3.5 shrink-0" />
            <span>{error}</span>
          </div>
        ) : null}

        <div className="mt-4 flex items-start gap-2 border-t border-white/[0.05] pt-3.5 text-[10.5px] leading-relaxed text-zinc-600">
          <ShieldCheckIcon className="mt-0.5 size-3.5 shrink-0 text-zinc-600" />
          <p>
            {!configured
              ? "Preview build: auth and storage keys are not set, so this panel returns a real configuration error instead of pretending to upload."
              : `Up to ${MAX_CREDITS} credits are held until the worker probes the file. Unused credits return automatically.`}
          </p>
        </div>
      </div>
    </section>
  );
}
