"use client";
import React from 'react'
import { useScrollAnimation } from '@/lib/useScrollAnimation'

const WhatWeOffer = () => {
  const engineersOffers = [
    "Lorem ipsum dolor sit amet consectetur.",
    "Lorem ipsum dolor sit amet consectetur.",
    "Lorem ipsum dolor sit amet consectetur. Praesent dolor habitasse massa volutpat at massa condimentum. Tempus interdum ornare diam nulla at nam velit. A interdum.",
    "Lorem ipsum dolor sit amet consectetur.",
    "Lorem ipsum dolor sit amet consectetur. Pellentesque tortor eu diam pharetra at. Risus id semper vitae mauris aliquet. Id sed.",
    "Lorem ipsum dolor sit amet consectetur.",
    "Lorem ipsum dolor sit amet consectetur.",
    "Lorem ipsum dolor sit amet consectetur.",
    "Lorem ipsum dolor sit amet consectetur."
  ]

  const clientsOffers = [
    "Lorem ipsum dolor sit amet consectetur.",
    "Lorem ipsum dolor sit amet consectetur.",
    "Lorem ipsum dolor sit amet consectetur. Praesent dolor habitasse massa volutpat at massa condimentum. Tempus interdum ornare diam nulla at nam velit. A interdum.",
    "Lorem ipsum dolor sit amet consectetur.",
    "Lorem ipsum dolor sit amet consectetur. Pellentesque tortor eu diam pharetra at. Risus id semper vitae mauris aliquet. Id sed.",
    "Lorem ipsum dolor sit amet consectetur.",
    "Lorem ipsum dolor sit amet consectetur.",
    "Lorem ipsum dolor sit amet consectetur."
  ]

  const titleRef = useScrollAnimation('fadeUp')
  const leftRef = useScrollAnimation('slideLeft')
  const rightRef = useScrollAnimation('slideRight')

  return (
    <section className="w-full bg-white py-20 px-6">
      <div className="mx-auto max-w-7xl">
        {/* Title */}
        <h2 ref={titleRef} className="text-[64px] font-semibold text-black font-id text-center mb-16">
          What we <span className="text-[#FFAE58] font-DMserif">offer?</span>
        </h2>

        {/* Main Content */}
        <div className="flex justify-between font-id gap-8 items-start">

          {/* Left Column - For Engineers */}
          <div ref={leftRef} className="flex items-stretch gap-0">
            {/* Vertical Label */}
            <div className="flex items-center pr-4">
              <p
                className="text-[#6F6F6F] font-medium text-[34px] border border-slate-300 py-5 px-2 h-full flex items-center justify-center"
                style={{ writingMode: 'vertical-rl', transform: 'rotate(180deg)' }}
              >
                For Engineers
              </p>
            </div>

            {/* Card */}
            <div className="border border-slate-300 p-8 ">
              <div className="space-y-6">
                {engineersOffers.map((offer, index) => (
                  <div key={index} className="pb-4 border-b border-slate-200 last:border-0">
                    <p className="text-[18px] text-black">
                      <span className="font-semibold">{index + 1}.</span> {offer}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Right Column - For Clients (offset to start at 2nd item) */}
          <div ref={rightRef} className="flex items-stretch gap-0 mt-[150px]">
            {/* Card */}
            <div className="border border-b-0 border-slate-300 p-8">
              <div className="space-y-6">
                {clientsOffers.map((offer, index) => (
                  <div key={index} className="pb-4 border-b border-slate-200 last:border-0">
                    <p className="text-[18px] text-black">
                      <span className="font-semibold">{index + 1}.</span> {offer}
                    </p>
                  </div>
                ))}
              </div>
            </div>

            {/* Vertical Label */}
            <div className="flex items-center pl-4">
              <p
                className="text-[#6F6F6F] font-medium text-[34px] border border-slate-300 py-5 px-2 h-full flex items-center justify-center"
                style={{ writingMode: 'vertical-rl' }}
              >
                For Clients
              </p>
            </div>
          </div>

        </div>
      </div>
    </section>
  )
}

export default WhatWeOffer