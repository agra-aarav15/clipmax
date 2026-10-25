import { CaptionsIcon, PlayIcon } from "lucide-react";

import { cn } from "@/lib/utils";

export type SampleScene = "amber" | "teal" | "rust";

export interface SampleClipData {
  id: string;
  scene: SampleScene;
  platform: string;
  duration: string;
  score: number;
  lines: readonly string[];
  highlight: number;
  progress: string;
}

const SCENES: Record<
  SampleScene,
  { stage: string; light: string; wash: string; slats: string }
> = {
  amber: {
    stage:
      "bg-[radial-gradient(ellipse_at_68%_16%,#6b4a26_0%,#2c1e11_38%,#0b0a08_80%)]",
    light: "bg-amber-200/20",
    wash: "bg-amber-400/[0.07]",
    slats:
      "[background-image:repeating-linear-gradient(90deg,transparent_0,transparent_22px,rgba(255,255,255,0.08)_22px,rgba(255,255,255,0.08)_23px)]",
  },
  teal: {
    stage: "bg-[radial-gradient(ellipse_at_34%_14%,#2f6a72_0%,#10282b_40%,#07090a_82%)]",
    light: "bg-cyan-200/15",
    wash: "bg-cyan-400/[0.06]",
    slats:
      "[background-image:repeating-linear-gradient(90deg,transparent_0,transparent_18px,rgba(255,255,255,0.07)_18px,rgba(255,255,255,0.07)_19px)]",
  },
  rust: {
    stage: "bg-[radial-gradient(ellipse_at_58%_18%,#7a3a20_0%,#2c150d_42%,#0a0808_82%)]",
    light: "bg-orange-200/15",
    wash: "bg-orange-400/[0.06]",
    slats:
      "[background-image:repeating-linear-gradient(90deg,transparent_0,transparent_26px,rgba(255,255,255,0.07)_26px,rgba(255,255,255,0.07)_27px)]",
  },
};

function SceneFigure({ side }: { side: "left" | "right" }) {
  const left = side === "left";

  return (
    <div
      className={cn(
        "absolute bottom-[17%] h-[36%] w-[42%]",
        left ? "left-[5%]" : "right-[5%] -scale-x-100",
      )}
    >
      <div className="absolute bottom-0 left-0 h-[88%] w-[86%] rounded-t-[52%] bg-[#040505]" />
      <div
        className={cn(
          "absolute top-[4%] size-[38%] rounded-[46%] bg-[#050606]",
          left ? "left-[26%]" : "left-[34%]",
        )}
      />
      <div
        className={cn(
          "absolute top-[10%] left-[34%] h-[26%] w-px rotate-[14deg] blur-[1.5px]",
          left ? "bg-amber-100/25" : "bg-white/20",
        )}
      />
      <div
        className={cn(
          "absolute top-[18%] left-[58%] h-[44%] w-px opacity-60 blur-[2px]",
          left ? "bg-amber-100/15" : "bg-white/10",
        )}
      />
    </div>
  );
}

export function SampleClipPoster({
  clip,
  className,
}: {
  clip: SampleClipData;
  className?: string;
}) {
  const scene = SCENES[clip.scene];

  return (
    <div
      className={cn(
        "group relative isolate aspect-[9/16] overflow-hidden rounded-2xl border border-white/10 bg-[#08090a] shadow-[0_40px_90px_-50px_rgba(0,0,0,0.95)] transition-[border-color,transform,box-shadow] duration-500 hover:border-signal/35 hover:shadow-[0_50px_110px_-50px_rgba(21,94,239,0.5)]",
        className,
      )}
    >
      <div aria-hidden="true" className="absolute inset-0">
        <div className={cn("absolute inset-0", scene.stage)} />
        <div
          className={cn(
            "absolute -top-[12%] left-1/2 h-[46%] w-[86%] -translate-x-1/2 rounded-full blur-3xl",
            scene.light,
          )}
        />
        <div className={cn("absolute inset-0 opacity-25", scene.slats)} />
        <div className={cn("absolute inset-0", scene.wash)} />

        <div className="absolute top-[9%] right-[10%] h-[32%] w-[36%] rounded-t-full border border-white/10 bg-white/[0.035]">
          <div className="absolute inset-x-[22%] top-0 bottom-0 border-x border-white/[0.06]" />
          <div className="absolute inset-x-0 top-[48%] border-t border-white/[0.06]" />
        </div>

        <SceneFigure side="left" />
        <SceneFigure side="right" />

        <div className="absolute bottom-[15%] left-[38%] h-[17%] w-[2px] bg-white/20" />
        <div className="absolute bottom-[31%] left-[35.5%] h-[6%] w-[9%] rounded-full bg-[#0d0d0d] ring-1 ring-white/15" />
        <div className="absolute bottom-[13%] left-[30%] h-[10%] w-[16%] rounded-full bg-black/60 blur-[6px]" />

        <div className="absolute inset-x-0 bottom-[12%] h-px bg-white/10" />
        <div className="absolute inset-x-0 bottom-0 h-[46%] bg-gradient-to-t from-black via-black/80 to-transparent" />
        <div className="absolute inset-0 shadow-[inset_0_0_90px_30px_rgba(0,0,0,0.55)]" />
        <div className="absolute inset-0 film-grain opacity-[0.16] mix-blend-overlay" />
      </div>

      <div className="absolute inset-x-0 top-0 z-10 flex items-start justify-between gap-2 p-3">
        <span className="rounded-full border border-white/15 bg-black/35 px-2 py-1 font-mono text-[7px] tracking-[0.14em] text-white/70 uppercase backdrop-blur-sm">
          Sample {clip.id}
        </span>
        <span className="flex items-center gap-1 rounded-full border border-signal/40 bg-signal/15 px-2 py-1 font-mono text-[7px] font-medium text-signal backdrop-blur-sm">
          <span className="size-1 rounded-full bg-signal" />
          {clip.score}
        </span>
      </div>

      <div className="absolute top-[38%] left-1/2 z-10 grid size-9 -translate-x-1/2 place-items-center rounded-full border border-white/15 bg-black/25 backdrop-blur-md">
        <PlayIcon className="ml-0.5 size-3 fill-white/90 text-white/90" aria-hidden="true" />
      </div>

      <div className="absolute inset-x-0 bottom-0 z-10 p-3.5">
        <div className="flex items-center justify-between font-mono text-[7px] tracking-[0.14em] text-white/70 uppercase">
          <span>{clip.platform}</span>
          <span className="flex items-center gap-1">
            <CaptionsIcon className="size-2.5" aria-hidden="true" />
            Burned in
          </span>
        </div>

        <div className="mt-2 space-y-0.5 text-[clamp(0.9rem,1.35vw,1.15rem)] leading-[1.02] font-black tracking-[-0.035em] text-white uppercase">
          {clip.lines.map((line, index) => (
            <span key={line} className="block">
              {index === clip.highlight ? (
                <span className="inline-block bg-primary px-[0.18em] py-[0.04em] text-primary-foreground">
                  {line}
                </span>
              ) : (
                line
              )}
            </span>
          ))}
        </div>

        <div className="mt-3 flex items-center gap-2">
          <div className="h-[2px] flex-1 overflow-hidden rounded-full bg-white/15">
            <div className="h-full rounded-full bg-signal" style={{ width: clip.progress }} />
          </div>
          <span className="font-mono text-[7px] tracking-[0.08em] text-white/70">
            {clip.duration}
          </span>
        </div>
      </div>
    </div>
  );
}
