"use client";

import { useEffect } from "react";
import { useGSAP } from "@gsap/react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";

gsap.registerPlugin(ScrollTrigger, useGSAP);

export default function ScrollFX() {
  // ScrollTrigger-driven effects (auto-reverted by useGSAP on unmount).
  useGSAP(() => {
    // 1) top scroll-progress bar
    gsap.to("#scroll-progress", {
      scaleX: 1,
      ease: "none",
      scrollTrigger: { trigger: document.body, start: "top top", end: "bottom bottom", scrub: 0.3 },
    });

    // 2) clip-path + rise reveal for tagged headings/blocks
    gsap.utils.toArray("[data-reveal]").forEach((el) => {
      gsap.from(el, {
        yPercent: 14,
        opacity: 0,
        clipPath: "inset(0 0 100% 0)",
        duration: 1,
        ease: "power3.out",
        scrollTrigger: { trigger: el, start: "top 88%" },
      });
    });

    // 3) depth parallax — elements drift at their own speed as you scroll
    gsap.utils.toArray("[data-parallax]").forEach((el) => {
      const speed = parseFloat(el.dataset.parallax) || 0.2;
      gsap.to(el, {
        yPercent: -speed * 100,
        ease: "none",
        scrollTrigger: { trigger: el, start: "top bottom", end: "bottom top", scrub: true },
      });
    });

    // 4) subtle scale-in for stat / step cards
    gsap.utils.toArray("[data-pop]").forEach((el, i) => {
      gsap.from(el, {
        y: 40,
        opacity: 0,
        scale: 0.96,
        duration: 0.8,
        ease: "power3.out",
        delay: (i % 3) * 0.08,
        scrollTrigger: { trigger: el, start: "top 90%" },
      });
    });
  });

  // Magnetic hover on .magnetic elements (manual listeners → manual cleanup).
  useEffect(() => {
    const els = Array.from(document.querySelectorAll(".magnetic"));
    const cleanups = els.map((el) => {
      const strength = 0.35;
      const move = (e) => {
        const r = el.getBoundingClientRect();
        const x = e.clientX - (r.left + r.width / 2);
        const y = e.clientY - (r.top + r.height / 2);
        gsap.to(el, { x: x * strength, y: y * strength, duration: 0.4, ease: "power3.out" });
      };
      const leave = () => gsap.to(el, { x: 0, y: 0, duration: 0.6, ease: "elastic.out(1, 0.4)" });
      el.addEventListener("mousemove", move);
      el.addEventListener("mouseleave", leave);
      return () => {
        el.removeEventListener("mousemove", move);
        el.removeEventListener("mouseleave", leave);
      };
    });
    return () => cleanups.forEach((fn) => fn());
  }, []);

  return (
    <div id="scroll-progress" className="fixed left-0 top-0 z-[60] h-[3px] w-full origin-left scale-x-0 bg-accent" />
  );
}
