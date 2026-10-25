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
  CheckCircle2Icon,
  FileVideoIcon,
  LinkIcon,
  Loader2Icon,
  UploadCloudIcon,
} from "lucide-react";
import { useRouter } from "next/navigation";
import { useRef, useState, type DragEvent } from "react";

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
): Promise<void> {
  return new Promise((resolve, reject) => {
    const xhr = new XMLHttpRequest();
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
    xhr.onabort = () => reject(new Error("Upload cancelled."));
    xhr.send(file);
  });
}

export function UploadPanel({ configured }: { configured: boolean }) {
  const router = useRouter();
  const inputRef = useRef<HTMLInputElement>(null);
  const [mode, setMode] = useState<Mode>("upload");
  const [file, setFile] = useState<File | null>(null);
  const [link, setLink] = useState("");
  const [phase, setPhase] = useState<Phase>("idle");
  const [progress, setProgress] = useState(0);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [dragOver, setDragOver] = useState(false);

  const busy = phase === "presigning" || phase === "uploading" || phase === "initiating";

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
      await putWithProgress(presign.uploadUrl, file, presign.headers, setProgress);

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
      className="rounded-xl border border-border bg-card p-5 shadow-xs sm:p-6"
    >
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className="font-mono text-[0.625rem] tracking-[0.2em] text-signal uppercase">
            New project
          </p>
          <h2 id="new-project-title" className="mt-1.5 text-xl font-semibold tracking-tight">
            Bring the long version.
          </h2>
          <p className="mt-1 text-sm text-muted-foreground">
            Upload a file or paste a public link. We probe the real duration before charging.
          </p>
        </div>
        <span className="rounded-full border border-signal/20 bg-signal/[0.06] px-2.5 py-1 font-mono text-[0.625rem] text-signal">
          up to {MAX_SOURCE_DURATION_MINUTES} min
        </span>
      </div>

      <div className="mt-5 grid grid-cols-2 gap-1 rounded-lg border border-border bg-background/60 p-1">
        <button
          type="button"
          aria-pressed={mode === "upload"}
          onClick={() => {
            setMode("upload");
            resetState();
          }}
          className={cn(
            "flex h-9 items-center justify-center gap-2 rounded-md text-sm font-medium transition-colors",
            mode === "upload"
              ? "bg-primary text-primary-foreground"
              : "text-muted-foreground hover:text-foreground",
          )}
        >
          <UploadCloudIcon className="size-4" />
          Upload
        </button>
        <button
          type="button"
          aria-pressed={mode === "link"}
          onClick={() => {
            setMode("link");
            resetState();
          }}
          className={cn(
            "flex h-9 items-center justify-center gap-2 rounded-md text-sm font-medium transition-colors",
            mode === "link"
              ? "bg-primary text-primary-foreground"
              : "text-muted-foreground hover:text-foreground",
          )}
        >
          <LinkIcon className="size-4" />
          Paste link
        </button>
      </div>

      {mode === "upload" ? (
        <div className="mt-5">
          <div
            onDragOver={(event) => {
              event.preventDefault();
              setDragOver(true);
            }}
            onDragLeave={() => setDragOver(false)}
            onDrop={onDrop}
            className={cn(
              "rounded-lg border border-dashed p-5 text-center transition-colors",
              dragOver
                ? "border-signal bg-signal/[0.06]"
                : "border-border bg-background/40 hover:border-signal/40",
            )}
          >
            <input
              ref={inputRef}
              type="file"
              accept=".mp4,.mov,.webm,video/mp4,video/quicktime,video/webm"
              className="sr-only"
              onChange={(event) => chooseFile(event.target.files?.[0] ?? null)}
            />
            <div className="mx-auto grid size-11 place-items-center rounded-full border border-signal/20 bg-signal/[0.06]">
              <FileVideoIcon className="size-5 text-signal" />
            </div>
            <p className="mt-3 text-sm font-medium">
              {file ? file.name : "Drop a video here, or choose a file"}
            </p>
            <p className="mt-1 text-xs text-muted-foreground">
              MP4, MOV, or WebM · up to 500 MB · max {MAX_SOURCE_DURATION_MINUTES} minutes
            </p>
            <Button
              type="button"
              variant="outline"
              size="sm"
              className="mt-4"
              disabled={busy}
              onClick={() => inputRef.current?.click()}
            >
              Choose file
            </Button>
          </div>

          {file ? (
            <div className="mt-4 flex items-center justify-between gap-3 rounded-lg border border-border bg-background/60 px-3 py-2.5">
              <div className="min-w-0">
                <p className="truncate text-xs font-medium">{file.name}</p>
                <p className="mt-0.5 font-mono text-[0.625rem] text-muted-foreground">
                  {formatBytes(file.size)}
                </p>
              </div>
              <Button type="button" size="sm" disabled={busy} onClick={startUpload}>
                {busy ? <Loader2Icon className="animate-spin" /> : null}
                {phase === "presigning"
                  ? "Preparing"
                  : phase === "uploading"
                    ? "Uploading"
                    : phase === "initiating"
                      ? "Queuing"
                      : "Start processing"}
              </Button>
            </div>
          ) : null}
        </div>
      ) : (
        <form
          className="mt-5"
          onSubmit={(event) => {
            event.preventDefault();
            void startLink();
          }}
        >
          <label htmlFor="source-link" className="text-xs font-medium text-muted-foreground">
            Public source link
          </label>
          <div className="mt-2 flex flex-col gap-2 sm:flex-row">
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
              className="h-10"
            />
            <Button
              type="submit"
              size="lg"
              className="h-10"
              disabled={busy || link.trim().length === 0}
            >
              {busy ? <Loader2Icon className="animate-spin" /> : null}
              Queue link
            </Button>
          </div>
          <p className="mt-2 text-xs leading-relaxed text-muted-foreground">
            Public YouTube, Instagram, TikTok, Vimeo, X, Facebook, LinkedIn, or Twitch links only.
            Private and unsupported links fail honestly.
          </p>
        </form>
      )}

      {busy || phase === "queued" ? (
        <div className="mt-4 rounded-lg border border-border bg-background/60 p-3">
          <div className="flex items-center justify-between gap-3 text-xs">
            <span className="text-muted-foreground">
              {phase === "presigning"
                ? "Signing a private upload URL"
                : phase === "uploading"
                  ? "Uploading directly to R2"
                  : phase === "initiating"
                    ? "Verifying the object and reserving credits"
                    : "Queued"}
            </span>
            {phase === "uploading" ? (
              <span className="font-mono text-signal">{progress}%</span>
            ) : null}
          </div>
          {phase === "uploading" ? <Progress value={progress} className="mt-2" /> : null}
        </div>
      ) : null}

      {message ? (
        <div className="mt-4 flex items-start gap-2 rounded-lg border border-signal/20 bg-signal/[0.05] px-3 py-2.5 text-xs leading-relaxed text-signal">
          <CheckCircle2Icon className="mt-0.5 size-4 shrink-0" />
          <span>{message}</span>
        </div>
      ) : null}

      {error ? (
        <div
          role="alert"
          className="mt-4 flex items-start gap-2 rounded-lg border border-destructive/25 bg-destructive/10 px-3 py-2.5 text-xs leading-relaxed text-destructive"
        >
          <AlertCircleIcon className="mt-0.5 size-4 shrink-0" />
          <span>{error}</span>
        </div>
      ) : null}

      {!configured ? (
        <p className="mt-4 text-xs leading-relaxed text-muted-foreground">
          Preview build. Auth and storage keys are not set, so this panel will return a real
          configuration error instead of pretending to upload.
        </p>
      ) : (
        <p className="mt-4 text-xs leading-relaxed text-muted-foreground">
          Up to {MAX_CREDITS} credits are held until the worker probes the file. Unused credits are
          returned automatically.
        </p>
      )}
    </section>
  );
}
