'use client';
import Image from "next/image";
import { useEffect, useRef } from "react";
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";

gsap.registerPlugin(ScrollTrigger);

const categories = [
  "Robotics",
  "Embedded System",
  "IoT",
  "AI / ML Projects",
  "Software Projects",
];

const BrowserCategory = () => {
  const headerRef = useRef<HTMLDivElement>(null);
  const listRef = useRef<HTMLDivElement>(null);
  const detailRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const ctx = gsap.context(() => {
      gsap.fromTo(headerRef.current, { y: 40, opacity: 0 }, {
        y: 0, opacity: 1, duration: 0.7, ease: "power3.out",
        scrollTrigger: { trigger: headerRef.current, start: "top 85%" },
      });

      gsap.fromTo(listRef.current!.children, { x: -50, opacity: 0 }, {
        x: 0, opacity: 1, duration: 0.5, ease: "power3.out", stagger: 0.1,
        scrollTrigger: { trigger: listRef.current, start: "top 85%" },
      });

      gsap.fromTo(detailRef.current, { x: 60, opacity: 0 }, {
        x: 0, opacity: 1, duration: 0.7, ease: "power3.out",
        scrollTrigger: { trigger: detailRef.current, start: "top 85%" },
      });
    });

    return () => ctx.revert();
  }, []);

  return (
    <section className="w-full bg-white py-20 px-6 font-id">
      <div className="max-w-[1140px] mx-auto">

        {/* Top header row */}
        <div ref={headerRef} className="flex items-start justify-between mb-12">
          {/* Left: Browse by Category */}
          <div>
            <p
              className="text-[64px] font-black leading-[1.0] text-black">
              Browse by
            </p>
            <div className="flex items-center gap-4">
              <div className="h-[3px] w-16 bg-black" />
              <p className="text-[64px] font-black leading-[1.0] text-black">
                Category
              </p>
            </div>
          </div>

          {/* Right: subtitle */}
          <p className="text-[30px] font-medium text-black text-right font-inter mt-4">
            Find projects and talent across key<br />engineering disciplines
          </p>
        </div>

        {/* Main two-column layout */}
        <div className="grid grid-cols-[520px_1fr] gap-10 items-start">

          {/* Left: category list */}
          <div ref={listRef} className="flex flex-col gap-3">
            {categories.map((cat, i) => {
              const active = cat === "Embedded System";
              return (
                <div
                  key={cat}
                  className={`flex items-center gap-5 px-6 py-5 border rounded-none cursor-pointer font-id ${active
                      ? "bg-black text-white border-black"
                      : "bg-white text-black border-gray-300"
                    }`}
                >
                  <span className="text-[30px] font-bold font-spacegrotesk">{i + 1}.</span>
                  <span className="text-[30px] font-medium font-id">{cat}</span>
                </div>
              );
            })}
          </div>

          {/* Right: detail panel */}
          <div ref={detailRef}>
            <h3 className="text-[50px] font-bold text-black text-right mb-4">
              Embedded System
            </h3>

            <div className="w-full overflow-hidden rounded-sm mb-6">
              <Image
                src="/embedded-system.jpg"
                alt="Embedded System"
                width={560}
                height={200}
                className="w-full h-[200px] object-cover"
                priority
              />
            </div>

            <p className="text-[15px] text-gray-600 text-right mb-4 font-inter">
              Lorem ipsum dolor sit amet consectetur. Egestas gravida donec
              dictum hendrerit sapien ut. Nulla erat nec amet donec. Et
              condimentum vel magna id in cursus netus nisi at. Sit ipsum cras
              leo senectus massa id a cursus. Dignissim malesuada viverra
              aliquam eget. Eros imperdiet id.
            </p>

            <p className="text-[15px] text-gray-600 text-right font-inter">
              Lorem ipsum dolor sit amet consectetur. Egestas gravida donec dictum
              hendrerit sapien ut. Nulla erat nec amet donec. Et condimentum vel
              magna id in cursus netus nisi at. Sit ipsum cras leo senectus massa id a
              cursus. Dignissim malesuada viverra aliquam eget. Eros imperdiet id.
            </p>
          </div>

        </div>
      </div>
    </section>
  );
};

export default BrowserCategory;
