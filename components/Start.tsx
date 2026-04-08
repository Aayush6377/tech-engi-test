"use client";
import Image from "next/image";
import { useEffect, useRef } from "react";
import { gsap } from "gsap";

const Start = () => {
  const navRef = useRef<HTMLElement>(null);
  const taglineRef = useRef<HTMLDivElement>(null);
  const headlineRef = useRef<HTMLHeadingElement>(null);
  const rightRef = useRef<HTMLDivElement>(null);
  const bannerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const tl = gsap.timeline({ defaults: { ease: "power3.out" } });
    tl.fromTo(navRef.current, { y: -40, opacity: 0 }, { y: 0, opacity: 1, duration: 0.6 })
      .fromTo(taglineRef.current, { y: 30, opacity: 0 }, { y: 0, opacity: 1, duration: 0.5 }, "-=0.2")
      .fromTo(headlineRef.current, { y: 50, opacity: 0 }, { y: 0, opacity: 1, duration: 0.7 }, "-=0.3")
      .fromTo(rightRef.current, { x: 40, opacity: 0 }, { x: 0, opacity: 1, duration: 0.6 }, "-=0.4")
      .fromTo(bannerRef.current, { scaleY: 0.8, opacity: 0, transformOrigin: "top" }, { scaleY: 1, opacity: 1, duration: 0.7 }, "-=0.3");
  }, []);
  return (
    <div className="min-h-screen p-5 bg-white font-sans">
      {/* Navbar */}
      <header ref={navRef} className="border border-2 border-gray-200">
        <div className="max-w-full mx-auto px-6 h-[64px] flex items-center justify-between">
          {/* Left: Logo + Nav */}
          <div className="flex items-center">
            <span className="text-[22px] font-benz tracking-tight text-black mr-4 border-r-2 border-gray-300 pr-4">
              TECH ENGI
            </span>
            <nav className="flex items-center gap-8 font-id tex-[14px] text-black">
              <a href="#">How it works?</a>
              <a href="#">Explore Projects</a>
              <a href="#">Blogs</a>
            </nav>
          </div>

          {/* Right: Social + Buttons */}
          <div className="flex items-center gap-5 border-l-2 border-gray-300 pl-5">
            {/* Social Icons */}
            <div className="flex items-center gap-4 border-r border-gray-200 pr-5">
              {/* LinkedIn */}
              <a href="#" aria-label="LinkedIn">
                <svg width="20" height="20" viewBox="0 0 24 24"  stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-black">
                  <path d="M16 8a6 6 0 0 1 6 6v7h-4v-7a2 2 0 0 0-2-2 2 2 0 0 0-2 2v7h-4v-7a6 6 0 0 1 6-6z"/>
                  <rect x="2" y="9" width="4" height="12"/><circle cx="4" cy="4" r="2"/>
                </svg>
              </a>
              {/* Instagram */}
              <a href="#" aria-label="Instagram">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-black">
                  <rect x="2" y="2" width="20" height="20" rx="5" ry="5"/>
                  <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z"/>
                  <line x1="17.5" y1="6.5" x2="17.51" y2="6.5"/>
                </svg>
              </a>
              {/* Facebook */}
              <a href="#" aria-label="Facebook">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-black">
                  <path d="M18 2h-3a5 5 0 0 0-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 0 1 1-1h3z"/>
                </svg>
              </a>
            </div>
            <button className="px-4 py-1 text-[16px] font-spacegrotesk border-2 border-gray-300 text-[#050A30] hover:bg-gray-50">
              BECOME BUILDER
            </button>
            <button className="px-4 py-1 text-[16px] font-inter bg-black text-white flex items-center gap-2 hover:bg-gray-800">
              GOT A PROJECT <span className="text-base">↗</span>
            </button>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <main className="max-w-full mx-auto px-6 pt-25 pb-0">
        {/* Top row: headline left, description + buttons right */}
        <div className="flex items-start justify-between gap-8 mb-8">
          {/* Left */}
          <div className="flex-1">
            <div ref={taglineRef} className="flex items-center gap-2 mb-4 font-id text-[#FFAE58]">
              <span className="text-[16px] uppercase">STRESS LESS</span>
              <span className="">|</span>
              <span className="text-[16px] uppercase">TIMELY DELIVERY</span>
            </div>
            <h1
              ref={headlineRef}
              className="text-[94px] font-benz leading-[1.0] text-black uppercase"
              style={{ letterSpacing: "-1px" }}
            >
              BUILD FASTER,<br />SUBMIT SMARTER
            </h1>
          </div>

          {/* Right */}
          <div ref={rightRef} className="flex flex-col items-end justify-between gap-6 pt-2 max-w-[41%] text-right">
            <p className="text-[26px] font-medium font-id text-black ">
              Tech-ENGI connects students with skilled builders who turns your ideas, assignments and projects into ready-to-submit work fast!
            </p>
            <div className="flex items-center font-inter gap-3">
              <button className="px-6 py-4 text-[16px] font-bold text-gray-900 bg-[#F4F4F4] whitespace-nowrap">
                BECOME BUILDER
              </button>
              <button className="px-6 py-4 text-[16px] font-bold bg-black text-white flex items-center gap-2 hover:bg-gray-800 whitespace-nowrap">
                START MY PROJECT <span>↗</span>
              </button>
            </div>
          </div>
        </div>

        {/* Orange Banner */}
        <div className="rounded-2xl overflow-hidden" style={{ backgroundColor: "#FFAE58", minHeight: "418px" }}>
          {/* Two guys image — centered/left */}
          <div  ref={bannerRef}  className="absolute top-75 -right-5 -translate-x-1/2" style={{ width: "850px" }}>
            <Image
              src="/two-guys.png"
              alt="Student and builder shaking hands"
              width={560}
              height={480}
              className="w-full h-auto object-contain"
              priority
            />
          </div>

          {/* Bottom-left: Avatars + Trusted */}
          <div className="absolute -bottom-35 left-20 flex flex-col items-center gap-3">
            <div className="flex flex-start -space-x-3">
              {[
                { bg: "#c0392b" },
                { bg: "#27ae60" },
                { bg: "#2980b9" },
                { bg: "#8e44ad" },
                { bg: "#e67e22" },
              ].map((a, i) => (
                <div
                  key={i}
                  className="w-9 h-9 rounded-full border-2 border-white"
                  style={{ backgroundColor: a.bg }}
                />
              ))}
            </div>
            <span className="text-white font-semibold font-id text-[24px]">Trusted by 1M+ Students</span>
          </div>

          {/* Top-right: Testimonial card */}
          <div className="absolute bottom-15 right-20 max-w-[320px] font-inter">
            <p className="text-white font-bold text-[18px] mb-0.5">Tarun</p>
            <p className="text-white/70 text-[10px] mb-2">student at XYZ college</p>
            <div className="border-t border-white/40 pt-2">
              <p className="text-white/90 text-[14px] leading-relaxed">
                Lorem ipsum dolor sit amet consectetur. Viverra imperdiet sit viverra sed fusca aliquet eget. Amet faucibus amet sapien dui. Est a at viverra cursus montes libero massa a. Urna.
              </p>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};

export default Start;
