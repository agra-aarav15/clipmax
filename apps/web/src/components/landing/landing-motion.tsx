"use client";

import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import Lenis from "lenis";
import { useEffect } from "react";

gsap.registerPlugin(ScrollTrigger);

const REDUCED_MOTION = "(prefers-reduced-motion: reduce)";

/**
 * Landing-only motion layer: Lenis smooth scrolling wired into the GSAP ticker,
 * plus scroll reveals, the workflow rail fill, and the pricing credit ruler.
 * Every animation is skipped when the visitor asks for reduced motion.
 */
export function LandingMotion() {
  useEffect(() => {
    const reduceMotion = window.matchMedia(REDUCED_MOTION).matches;
    let lenis: Lenis | null = null;
    let tick: ((time: number) => void) | null = null;
    let cancelled = false;

    const context = gsap.context(() => {
      if (reduceMotion) return;

      gsap.utils.toArray<HTMLElement>("[data-reveal]").forEach((element) => {
        gsap.fromTo(
          element,
          { autoAlpha: 0, y: 24 },
          {
            autoAlpha: 1,
            y: 0,
            duration: 0.9,
            ease: "power3.out",
            scrollTrigger: { trigger: element, start: "top 90%", once: true },
          },
        );
      });

      gsap.utils.toArray<HTMLElement>("[data-parallax]").forEach((element) => {
        const depth = Number(element.dataset.parallax) || 5;
        gsap.fromTo(
          element,
          { yPercent: depth },
          {
            yPercent: -depth,
            ease: "none",
            scrollTrigger: {
              trigger: element.parentElement ?? element,
              start: "top bottom",
              end: "bottom top",
              scrub: true,
            },
          },
        );
      });

      const rail = document.querySelector<HTMLElement>("[data-workflow-rail]");
      const progress = document.querySelector<HTMLElement>("[data-workflow-progress]");
      if (rail && progress) {
        gsap.fromTo(
          progress,
          { scaleY: 0 },
          {
            scaleY: 1,
            ease: "none",
            scrollTrigger: {
              trigger: rail,
              start: "top 72%",
              end: "bottom 58%",
              scrub: 0.35,
            },
          },
        );
      }

      const ticks = gsap.utils.toArray<HTMLElement>("[data-credit-tick]");
      const firstTick = ticks[0];
      if (firstTick) {
        gsap.fromTo(
          ticks,
          { scaleY: 0.2, opacity: 0.35 },
          {
            scaleY: 1,
            opacity: 1,
            duration: 0.5,
            stagger: 0.035,
            ease: "power2.out",
            scrollTrigger: {
              trigger: firstTick.parentElement ?? firstTick,
              start: "top 90%",
              once: true,
            },
          },
        );
      }
    });

    if (!reduceMotion) {
      lenis = new Lenis({
        lerp: 0.1,
        smoothWheel: true,
        wheelMultiplier: 1,
        touchMultiplier: 1.4,
      });

      lenis.on("scroll", ScrollTrigger.update);
      tick = (time: number) => lenis?.raf(time * 1000);
      gsap.ticker.add(tick);
      gsap.ticker.lagSmoothing(0);
    }

    const onAnchorClick = (event: MouseEvent) => {
      const target = event.target;
      if (!(target instanceof Element)) return;
      const anchor = target.closest<HTMLAnchorElement>('a[href^="#"]');
      if (!anchor) return;

      const hash = anchor.getAttribute("href");
      if (!hash || hash === "#") return;

      const section = document.querySelector<HTMLElement>(hash);
      if (!section) return;

      event.preventDefault();
      if (lenis) {
        lenis.scrollTo(section, { offset: -84, duration: 1.15 });
      } else {
        section.scrollIntoView();
      }
      history.replaceState(null, "", hash);
    };

    document.addEventListener("click", onAnchorClick);

    const refresh = () => {
      if (!cancelled) ScrollTrigger.refresh();
    };
    document.fonts.ready.then(refresh).catch(() => undefined);

    return () => {
      cancelled = true;
      document.removeEventListener("click", onAnchorClick);
      if (tick) gsap.ticker.remove(tick);
      gsap.ticker.lagSmoothing(500, 33);
      lenis?.destroy();
      context.revert();
    };
  }, []);

  return null;
}
