import { useEffect, useRef } from "react";
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";

gsap.registerPlugin(ScrollTrigger);

export function useScrollAnimation(
  animation: "fadeUp" | "fadeIn" | "slideLeft" | "slideRight" = "fadeUp"
) {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    const fromVars: gsap.TweenVars = {
      opacity: 0,
      y: animation === "fadeUp" ? 60 : 0,
      x: animation === "slideLeft" ? -80 : animation === "slideRight" ? 80 : 0,
    };

    gsap.fromTo(el, fromVars, {
      opacity: 1,
      y: 0,
      x: 0,
      duration: 0.9,
      ease: "power3.out",
      scrollTrigger: {
        trigger: el,
        start: "top 85%",
        toggleActions: "play none none none",
      },
    });

    return () => ScrollTrigger.getAll().forEach((t) => t.kill());
  }, [animation]);

  return ref;
}
