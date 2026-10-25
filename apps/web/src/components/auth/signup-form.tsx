"use client";

import { ArrowRightIcon, CheckIcon, Link2Icon, MailIcon, TriangleAlertIcon } from "lucide-react";
import Link from "next/link";
import { useId, useState, type FormEvent } from "react";

import { isSupabaseConfigured } from "@/lib/public-env";
import { getSupabaseBrowserClient } from "@/lib/supabase/client";
import { cn } from "@/lib/utils";

type Status = "idle" | "sending" | "sent" | "error";

interface SignupFormProps {
  mode: "signup" | "signin";
  nextPath: string;
  sourceLabel: string | null;
  switchHref: string;
  initialError: string | null;
}

function GoogleIcon() {
  return (
    <svg viewBox="0 0 24 24" className="size-4" aria-hidden="true">
      <path
        fill="#4285F4"
        d="M23.49 12.27c0-.79-.07-1.54-.19-2.27H12v4.51h6.47a5.57 5.57 0 0 1-2.4 3.58v3h3.86c2.26-2.09 3.56-5.17 3.56-8.82Z"
      />
      <path
        fill="#34A853"
        d="M12 24c3.24 0 5.95-1.08 7.93-2.91l-3.86-3c-1.08.72-2.45 1.16-4.07 1.16-3.13 0-5.78-2.11-6.73-4.96H1.29v3.09A11.99 11.99 0 0 0 12 24Z"
      />
      <path
        fill="#FBBC05"
        d="M5.27 14.29a7.2 7.2 0 0 1 0-4.58V6.62H1.29a11.99 11.99 0 0 0 0 10.76l3.98-3.09Z"
      />
      <path
        fill="#EA4335"
        d="M12 4.75c1.77 0 3.35.61 4.6 1.8l3.42-3.42C17.95 1.19 15.24 0 12 0 7.7 0 3.99 2.47 1.29 6.62l3.98 3.09C6.22 6.86 8.87 4.75 12 4.75Z"
      />
    </svg>
  );
}

const CONFIG_MESSAGE =
  "Auth is not configured in this build. Add NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY to enable Google and email sign-in.";

function callbackUrl(nextPath: string): string {
  return `${window.location.origin}/auth/callback?next=${encodeURIComponent(nextPath)}`;
}

export function SignupForm({
  mode,
  nextPath,
  sourceLabel,
  switchHref,
  initialError,
}: SignupFormProps) {
  const emailId = useId();
  const errorId = useId();
  const configured = isSupabaseConfigured();

  const [email, setEmail] = useState("");
  const [status, setStatus] = useState<Status>(initialError ? "error" : "idle");
  const [message, setMessage] = useState<string | null>(initialError);
  const [fieldError, setFieldError] = useState<string | null>(null);

  const isSignin = mode === "signin";
  const busy = status === "sending";

  function setFailure(nextMessage: string) {
    setStatus("error");
    setMessage(nextMessage);
  }

  async function handleGoogle() {
    setMessage(null);

    try {
      const supabase = getSupabaseBrowserClient();
      if (!supabase) {
        setFailure(CONFIG_MESSAGE);
        return;
      }

      setStatus("sending");

      const { error } = await supabase.auth.signInWithOAuth({
        provider: "google",
        options: { redirectTo: callbackUrl(nextPath) },
      });

      if (error) setFailure(error.message);
    } catch (cause) {
      setFailure(
        cause instanceof Error
          ? cause.message
          : "Could not reach the auth service. Try again in a moment.",
      );
    }
  }

  async function handleEmail(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setFieldError(null);
    setMessage(null);

    const trimmed = email.trim();
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(trimmed)) {
      setFieldError("Enter a valid email address.");
      setStatus("idle");
      return;
    }

    try {
      const supabase = getSupabaseBrowserClient();
      if (!supabase) {
        setFailure(CONFIG_MESSAGE);
        return;
      }

      setStatus("sending");

      const { error } = await supabase.auth.signInWithOtp({
        email: trimmed,
        options: {
          emailRedirectTo: callbackUrl(nextPath),
          shouldCreateUser: !isSignin,
        },
      });

      if (error) {
        setFailure(error.message);
        return;
      }

      setStatus("sent");
    } catch (cause) {
      setFailure(
        cause instanceof Error
          ? cause.message
          : "Could not reach the auth service. Try again in a moment.",
      );
    }
  }

  if (status === "sent") {
    return (
      <div className="rounded-2xl border border-white/10 bg-[#0c0d0e]/85 p-6 shadow-2xl backdrop-blur-xl sm:p-8">
        <span className="grid size-11 place-items-center rounded-full border border-signal/30 bg-signal/10 text-signal">
          <CheckIcon className="size-5" />
        </span>
        <h1 className="mt-5 text-2xl font-semibold tracking-[-0.04em]">Check your inbox.</h1>
        <p className="mt-2 text-sm leading-relaxed text-zinc-400">
          We sent a sign-in link to <span className="text-zinc-200">{email}</span>. Open it on this
          device to finish {isSignin ? "signing in" : "creating your studio"}.
        </p>
        <button
          type="button"
          onClick={() => {
            setStatus("idle");
            setMessage(null);
          }}
          className="mt-6 text-xs text-zinc-400 underline decoration-white/20 underline-offset-4 transition-colors hover:text-foreground"
        >
          Use a different email
        </button>
      </div>
    );
  }

  return (
    <div className="rounded-2xl border border-white/10 bg-[#0c0d0e]/85 p-6 shadow-[0_40px_120px_-40px_rgba(0,0,0,1)] backdrop-blur-xl sm:p-8">
      {sourceLabel ? (
        <div className="mb-5 flex items-center gap-2 rounded-lg border border-white/[0.08] bg-white/[0.03] px-3 py-2 font-mono text-[9px] tracking-[0.1em] text-zinc-400 uppercase">
          <Link2Icon className="size-3.5 shrink-0 text-signal" />
          <span className="truncate">Starting point · {sourceLabel}</span>
        </div>
      ) : null}

      <div className="flex items-center justify-between gap-4">
        <span className="rounded-full border border-signal/25 bg-signal/[0.07] px-2.5 py-1 font-mono text-[8px] tracking-[0.14em] text-signal uppercase">
          {isSignin ? "Welcome back" : "Private beta"}
        </span>
        <span className="font-mono text-[8px] tracking-[0.14em] text-zinc-600 uppercase">
          30 free credits
        </span>
      </div>

      <h1 className="mt-4 text-[clamp(1.8rem,4vw,2.35rem)] leading-[1.02] font-semibold tracking-[-0.05em]">
        {isSignin ? "Sign in to your studio." : "Start your first cut."}
      </h1>
      <p className="mt-2 text-[13px] leading-relaxed text-zinc-400">
        {isSignin
          ? "Use the same Google account or email you signed up with."
          : "One upload becomes a week of captioned, vertical clips. No card required."}
      </p>

      {!configured && status !== "error" ? (
        <div className="mt-4 flex items-center gap-2 rounded-md border border-white/[0.08] bg-white/[0.02] px-2.5 py-1.5 font-mono text-[8.5px] tracking-[0.1em] text-zinc-500 uppercase">
          <span className="size-1 rounded-full bg-amber-300/80" />
          Preview build · auth keys not set
        </div>
      ) : null}

      {status === "error" && message ? (
        <div
          id={errorId}
          role="alert"
          className="mt-5 flex items-start gap-2.5 rounded-lg border border-destructive/25 bg-destructive/[0.07] px-3 py-2.5 text-[12px] leading-relaxed text-red-200"
        >
          <TriangleAlertIcon className="mt-0.5 size-3.5 shrink-0" />
          <p>{message}</p>
        </div>
      ) : null}

      <button
        type="button"
        onClick={handleGoogle}
        disabled={busy}
        className="mt-5 inline-flex h-11 w-full items-center justify-center gap-2.5 rounded-xl bg-white text-[13px] font-medium text-zinc-900 transition-[background-color,transform] hover:bg-zinc-100 active:scale-[0.995] disabled:cursor-not-allowed disabled:opacity-60"
      >
        <GoogleIcon />
        Continue with Google
      </button>

      <div className="my-5 flex items-center gap-3">
        <span className="h-px flex-1 bg-white/[0.08]" />
        <span className="font-mono text-[8px] tracking-[0.16em] text-zinc-600 uppercase">
          or continue with email
        </span>
        <span className="h-px flex-1 bg-white/[0.08]" />
      </div>

      <form onSubmit={handleEmail} noValidate>
        <label
          htmlFor={emailId}
          className="font-mono text-[9px] tracking-[0.14em] text-zinc-500 uppercase"
        >
          Email address
        </label>
        <div className="relative mt-2">
          <MailIcon className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-zinc-600" />
          <input
            id={emailId}
            name="email"
            type="email"
            inputMode="email"
            autoComplete="email"
            placeholder="you@studio.com"
            value={email}
            onChange={(event) => {
              setEmail(event.target.value);
              if (fieldError) setFieldError(null);
            }}
            aria-invalid={Boolean(fieldError)}
            aria-describedby={fieldError ? `${errorId}-field` : undefined}
            className={cn(
              "h-11 w-full rounded-xl border bg-black/25 pr-3 pl-10 text-[14px] text-foreground transition-colors outline-none placeholder:text-zinc-600",
              fieldError
                ? "border-destructive/50 focus:border-destructive"
                : "border-white/10 focus:border-signal/50",
            )}
          />
        </div>
        {fieldError ? (
          <p id={`${errorId}-field`} role="alert" className="mt-2 text-xs text-red-300">
            {fieldError}
          </p>
        ) : null}

        <button
          type="submit"
          disabled={busy}
          className="group mt-3 inline-flex h-11 w-full items-center justify-center gap-2 rounded-xl bg-primary text-[13px] font-semibold text-primary-foreground transition-[filter,transform] hover:brightness-105 active:scale-[0.995] disabled:cursor-not-allowed disabled:opacity-60"
        >
          {busy ? "Sending…" : isSignin ? "Send sign-in link" : "Send signup link"}
          <ArrowRightIcon className="size-4 transition-transform group-hover:translate-x-0.5" />
        </button>
      </form>

      <p className="mt-4 text-[10px] leading-relaxed text-zinc-600">
        Only upload or link content you have the rights to process. Magic links expire shortly after
        they are sent.
      </p>

      <div className="mt-6 border-t border-white/[0.07] pt-4 text-center text-[12px] text-zinc-500">
        {isSignin ? "New to ClipMax?" : "Already have an account?"}{" "}
        <Link
          href={switchHref}
          className="text-zinc-300 underline decoration-white/20 underline-offset-4 transition-colors hover:text-signal"
        >
          {isSignin ? "Create an account" : "Sign in"}
        </Link>
      </div>
    </div>
  );
}
