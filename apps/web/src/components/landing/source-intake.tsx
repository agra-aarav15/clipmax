"use client";

import {
  ALLOWED_VIDEO_EXTENSIONS,
  ALLOWED_VIDEO_MIME_TYPES,
  MAX_SOURCE_BYTES,
} from "@clipmax/shared";
import { ArrowRightIcon, Link2Icon, UploadIcon, XIcon } from "lucide-react";
import { useRouter } from "next/navigation";
import { useId, useRef, useState, type ChangeEvent, type FormEvent } from "react";

import { cn } from "@/lib/utils";

type IntakeMode = "link" | "upload";

const ACCEPT = [
  ...ALLOWED_VIDEO_EXTENSIONS.map((extension) => `.${extension}`),
  ...ALLOWED_VIDEO_MIME_TYPES,
].join(",");

function formatBytes(bytes: number): string {
  if (bytes < 1024 * 1024) return `${Math.max(1, Math.round(bytes / 1024))} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(bytes < 10 * 1024 * 1024 ? 1 : 0)} MB`;
}

function parseSourceUrl(raw: string): string | null {
  const candidate = /^[a-z][a-z0-9+.-]*:\/\//i.test(raw) ? raw : `https://${raw}`;

  try {
    const url = new URL(candidate);
    if (url.protocol !== "http:" && url.protocol !== "https:") return null;
    if (!url.hostname.includes(".")) return null;
    return url.toString();
  } catch {
    return null;
  }
}

export function SourceIntake() {
  const router = useRouter();
  const inputRef = useRef<HTMLInputElement>(null);
  const fileRef = useRef<HTMLInputElement>(null);
  const errorId = useId();
  const hintId = useId();

  const [mode, setMode] = useState<IntakeMode>("link");
  const [value, setValue] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [error, setError] = useState<string | null>(null);

  function selectMode(next: IntakeMode) {
    setMode(next);
    setError(null);
  }

  function handleFile(event: ChangeEvent<HTMLInputElement>) {
    const selected = event.target.files?.[0] ?? null;
    if (!selected) return;

    const extension = selected.name.split(".").pop()?.toLowerCase() ?? "";
    const extensionAllowed = ALLOWED_VIDEO_EXTENSIONS.some((item) => item === extension);
    const typeAllowed = ALLOWED_VIDEO_MIME_TYPES.some((item) => item === selected.type);

    if (!extensionAllowed && !typeAllowed) {
      setFile(null);
      setError("Use an MP4, MOV, or WebM file.");
      event.target.value = "";
      return;
    }

    if (selected.size > MAX_SOURCE_BYTES) {
      setFile(null);
      setError(
        `That file is ${formatBytes(selected.size)}. The limit is ${formatBytes(MAX_SOURCE_BYTES)}.`,
      );
      event.target.value = "";
      return;
    }

    setFile(selected);
    setError(null);
  }

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (mode === "link") {
      const source = parseSourceUrl(value.trim());
      if (!source) {
        setError("Paste a full video link, or switch to Upload.");
        inputRef.current?.focus();
        return;
      }

      setError(null);
      router.push(`/signup?source=${encodeURIComponent(source)}`);
      return;
    }

    if (!file) {
      setError("Choose a video file first.");
      fileRef.current?.click();
      return;
    }

    setError(null);
    router.push("/signup?intent=upload");
  }

  return (
    <form
      onSubmit={handleSubmit}
      noValidate
      className="mx-auto w-full max-w-[760px] animate-rise [animation-delay:240ms]"
    >
      <div className="rounded-2xl bg-gradient-to-r from-white/15 via-white/[0.06] to-signal/35 p-px shadow-[0_28px_100px_-40px_rgba(0,0,0,1)]">
        <div
          className={cn(
            "flex flex-col gap-2 rounded-[calc(1rem-1px)] bg-[#0b0c0d]/95 p-2 backdrop-blur-xl sm:flex-row sm:items-center",
            error && "ring-1 ring-destructive/40",
          )}
        >
          <div
            className="flex shrink-0 rounded-xl border border-white/[0.08] bg-black/20 p-0.5"
            role="group"
            aria-label="Source type"
          >
            <button
              type="button"
              onClick={() => selectMode("link")}
              aria-pressed={mode === "link"}
              className={cn(
                "flex h-10 flex-1 items-center justify-center gap-1.5 rounded-[10px] px-3 text-[12px] font-medium transition-colors sm:flex-none",
                mode === "link"
                  ? "bg-white/[0.08] text-foreground"
                  : "text-zinc-500 hover:text-zinc-300",
              )}
            >
              <Link2Icon className="size-3.5" />
              Link
            </button>
            <button
              type="button"
              onClick={() => selectMode("upload")}
              aria-pressed={mode === "upload"}
              className={cn(
                "flex h-10 flex-1 items-center justify-center gap-1.5 rounded-[10px] px-3 text-[12px] font-medium transition-colors sm:flex-none",
                mode === "upload"
                  ? "bg-white/[0.08] text-foreground"
                  : "text-zinc-500 hover:text-zinc-300",
              )}
            >
              <UploadIcon className="size-3.5" />
              Upload
            </button>
          </div>

          {mode === "link" ? (
            <div className="flex min-w-0 flex-1 items-center gap-2.5 px-2.5">
              <Link2Icon className="hidden size-4 shrink-0 text-signal/70 sm:block" />
              <label htmlFor="source-link" className="sr-only">
                Video or share link
              </label>
              <input
                ref={inputRef}
                id="source-link"
                name="source-link"
                type="text"
                inputMode="url"
                autoComplete="url"
                spellCheck={false}
                placeholder="Paste a video link"
                value={value}
                onChange={(event) => {
                  setValue(event.target.value);
                  if (error) setError(null);
                }}
                aria-invalid={Boolean(error)}
                aria-describedby={`${hintId}${error ? ` ${errorId}` : ""}`}
                className="h-11 w-full min-w-0 bg-transparent text-[15px] text-foreground outline-none placeholder:text-zinc-500"
              />
            </div>
          ) : (
            <div className="flex min-w-0 flex-1 items-center gap-2.5 px-2.5">
              <input
                ref={fileRef}
                type="file"
                accept={ACCEPT}
                onChange={handleFile}
                className="sr-only"
                aria-label="Choose a video file"
              />
              <UploadIcon className="hidden size-4 shrink-0 text-signal/70 sm:block" />
              <button
                type="button"
                onClick={() => fileRef.current?.click()}
                className="flex h-11 min-w-0 flex-1 items-center gap-2 text-left text-[14px] text-zinc-400 transition-colors hover:text-foreground"
              >
                <span className="truncate">{file ? file.name : "Choose an MP4, MOV, or WebM"}</span>
                {file ? (
                  <span className="shrink-0 font-mono text-[9px] tracking-[0.1em] text-zinc-600 uppercase">
                    {formatBytes(file.size)}
                  </span>
                ) : null}
              </button>
              {file ? (
                <button
                  type="button"
                  onClick={() => {
                    setFile(null);
                    if (fileRef.current) fileRef.current.value = "";
                  }}
                  className="grid size-7 shrink-0 place-items-center rounded-md text-zinc-500 transition-colors hover:bg-white/[0.06] hover:text-foreground"
                  aria-label="Remove selected file"
                >
                  <XIcon className="size-3.5" />
                </button>
              ) : null}
            </div>
          )}

          <button
            type="submit"
            className="group inline-flex h-11 shrink-0 items-center justify-center gap-2 rounded-xl bg-primary px-5 text-[14px] font-semibold text-primary-foreground transition-[filter,transform] hover:brightness-105 focus-visible:ring-2 focus-visible:ring-signal/70 focus-visible:ring-offset-2 focus-visible:ring-offset-[#0b0c0d] focus-visible:outline-none active:scale-[0.99]"
          >
            {mode === "link" ? "Get clips" : "Continue"}
            <ArrowRightIcon className="size-4 transition-transform group-hover:translate-x-0.5" />
          </button>
        </div>
      </div>

      <div
        id={hintId}
        className="mt-3 flex flex-wrap items-center justify-center gap-x-3.5 gap-y-1.5 font-mono text-[9px] tracking-[0.14em] text-zinc-500 uppercase"
      >
        <span>30 free credits</span>
        <span className="hidden size-0.5 rounded-full bg-zinc-700 sm:block" />
        <span>No card required</span>
      </div>

      {mode === "upload" && file ? (
        <p className="mt-2 text-center text-[11px] text-zinc-500">
          File checked locally. You’ll confirm it in the studio after sign-in.
        </p>
      ) : null}

      {error ? (
        <p id={errorId} role="alert" className="mt-2 text-center text-xs text-destructive">
          {error}
        </p>
      ) : null}
    </form>
  );
}
