"use client";
import Image from "next/image";
import { useState } from "react";
import { ChevronLeft, ChevronRight, ChevronDown } from "lucide-react";
import { useScrollAnimation } from "@/lib/useScrollAnimation";

const faqs = [
  {
    question: "How is Uvodo different from other eCommerce platforms?",
    answer: null,
  },
  {
    question: "Can I use my own domain with Uvodo?",
    answer:
      "Yes, you can connect your existing domain. Uvodo also provides a forever free uvo.do domain suffix to all sellers upon creating an account.",
  },
  {
    question: "Can I sell my products with Uvodo without creating an online store?",
    answer: null,
  },
  {
    question: "Is there a setup fee for using Uvodo?",
    answer: null,
  },
  {
    question: "In what countries can I use Uvodo?",
    answer: null,
  },
];

const AboutUs = () => {
  const [openIndex, setOpenIndex] = useState<number | null>(1);
  const testimonialRef = useScrollAnimation('fadeUp')
  const faqRef = useScrollAnimation('fadeUp')

  return (
    <div className="w-full h-full font-id">

      {/* ── Section 1: Testimonial ── */}
      <section ref={testimonialRef} className="relative bg-white overflow-hidden border-b border-gray-200 h-full">
        {/* Orange circle top-left */}
        {/* <div
          className="absolute -top-16 -left-16 w-[30%] h-[280px] rounded-full"
          style={{ backgroundColor: "#F5A623", opacity: 0.85 }}
        /> */}
        <div className="w-[1275px] h-[1275px] p-[200px] rounded-full bg-[#FFAE58] absolute -top-60 -left-230">
          <div className="w-full h-full rounded-full bg-white"></div>
        </div>

        <div className="max-w-full mx-auto px-18 py-16 relative z-10">
          <div className="flex items-start gap-10">

            {/* Left: person image */}
            <div className="relative flex-shrink-0 w-[434px]">

              <Image
                src="/white-guy.jpg"
                alt="Cecilia Pouros"
                width={434}
                height={631}
                className="w-full h-[631px] object-cover object-top"
                priority
              />

            </div>


            {/* Middle: testimonial card */}
            <div className="flex-1 max-w-[569px] border border-gray-200 font-inter bg-white shadow-lg p-6 absolute left-100 top-60 mt-8">
              <h3 className="text-[40px] font-bold text-black">Cecilia Pouros</h3>
              <p className="text-[14px] text-gray-400 mb-4">Regional Markets Executive</p>
              <p className="text-[20px] text-black leading-relaxed">
                Amet minim mollit non deserunt ullamco est sit aliqua dolor do amet sint.
                Velit officia consequat duis enim velit mollit. Exercitation veniam
                consequat sunt nostrud amet.
              </p>
            </div>
            {/* Stars */}
            <div className="mt-6 absolute left-160 bottom-20 flex items-center border border-gray-200 gap-4 bg-white px-6 py-4 shadow-lg">
              {[...Array(5)].map((_, i) => (
                <span key={i} className="text-[#F7871B] text-[28px]">★</span>
              ))}
            </div>

            {/* Right: heading */}
            <div className="flex-1 text-[55px] text-right pt-4 font-id font-bold">
              <h2 className="leading-tight text-black">
                What others{" "}
                <span className="text-orange-400">think</span>
                <br />about us?
              </h2>

              {/* Big quote decoration */}
              <div
                className="mt-6 ml-auto w-fit text-[100px] leading-none font-black text-gray-100 select-none"
                style={{ fontFamily: "Georgia, serif" }}
              >
                "
              </div>

              {/* Nav arrows */}
              <div className="flex items-end justify-end mt-64 ">
                <button className="w-20 h-20 border-2 border-gray-300 flex items-center justify-center hover:bg-gray-50">
                  <ChevronLeft size={20} />
                </button>
                <button className="w-20 h-20 text-black  border-2 border-gray-300 flex items-center justify-center hover:bg-gray-50">
                  <ChevronRight size={20} />
                </button>
              </div>
            </div>

          </div>
        </div>
      </section>

      {/* ── Section 2: FAQ ── */}
      <section ref={faqRef} className="bg-white font-inter">
        <div className="max-w-full mx-auto">
          <div className="flex items-start justify-between gap-10 bg-orange-300/10 px-20 pt-10">

            {/* Left: heading */}
            <div className="flex">
              <h2 className="text-[60px] font-medium text-black leading-tight">
                Things,{" "}
                <span className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-[#FFAE58] text-white text-[20px] font-bold">
                  ?
                </span>{" "}
                you
                <br />probably wonder.
              </h2>
            </div>

            {/* Right: emoji */}
            <div className="flex">
              <Image
                src="/girl.png"
                alt="Emoji"
                width={218}
                height={218}
                className="w-full h-[218px] object-cover object-bottom"
              />
            </div>
          </div>

          {/* FAQ list */}
          <div className="mt-8 max-w-170 mx-auto px-20 space-y-4 font-inter">
            {faqs.map((faq, i) => (
              <div key={i} className="border border-gray-200">
                <button
                  className="w-full flex items-center justify-between space-y-5 py-6 px-5 text-left"
                  onClick={() => setOpenIndex(openIndex === i ? null : i)}
                >
                  <span
                    className={`text-[16px] ${openIndex === i ? "font-semibold text-black" : "text-gray-600"
                      }`}
                  >
                    {faq.question}
                  </span>
                  <ChevronDown
                    size={16}
                    className={`flex-shrink-0 text-gray-400 transition-transform ${openIndex === i ? "rotate-180" : ""
                      }`}
                  />
                </button>
                {openIndex === i && faq.answer && (
                  <p className="pb-4 px-5 text-[13px] text-gray-500">
                    {faq.answer}
                  </p>
                )}
              </div>
            ))}
          </div>

        </div>
      </section>

    </div>
  );
};

export default AboutUs;
