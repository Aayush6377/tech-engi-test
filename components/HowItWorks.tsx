"use client";
import React from 'react'
import { Briefcase, Users, Rocket } from 'lucide-react'
import { useScrollAnimation } from '@/lib/useScrollAnimation'

const HowItWorks = () => {
    const steps = [
        {
            icon: Briefcase,
            title: "Post a Job",
            description: "Describe your robotics or tech project with requirements, timeline, and budget."
        },
        {
            icon: Users,
            title: "Get the Match",
            description: "Describe your robotics or tech project with requirements, timeline, and budget."
        },
        {
            icon: Rocket,
            title: "Collaborate & Deliver",
            description: "Describe your robotics or tech project with requirements, timeline, and budget."
        }
    ]

    const headerRef = useScrollAnimation('fadeUp')
    const cardsRef = useScrollAnimation('fadeUp')

    return (
        <section className="w-full bg-white py-20 px-6">
            <div className="mx-auto max-w-7xl">
                {/* Header */}
                <div ref={headerRef} className="text-center space-y-6 mb-16">
                    <div className="inline-flex items-center gap-2 justify-center text-[#FFAE58] ">
                        <span className="text-lg">•</span>
                        <p className="font-medium font-id text-[22px] tracking-wide">How it works</p>
                        <span className="text-lg">•</span>
                    </div>

                    <h2 className="text-5xl lg:text-7xl font-id font-semibold text-slate-950">
                        How we make everything<br />easy for you?
                    </h2>
                </div>

                {/* Cards Grid */}
                <div ref={cardsRef} className="flex justify-between gap-20">
                    {steps.map((step, index) => {
                        const Icon = step.icon
                        return (
                            <div key={index} className="relative gap-10 font-id">
                                {/* Main Card */}
                                <div className="relative z-10 h-[369px] w-[390px] bg-white rounded-3xl p-8 border border-slate-200">
                                    {/* Icon */}
                                    <div className="mt-10 relative flex justify-center items-center">
                                        <div className="border-4 border-gray-200 rounded-2xl">
                                            <div className="absolute inset-0 left-28 bottom-18 w-25 h-25 bg-gradient-to-b from-[#FFB05F] to-[#FF8400] rounded-2xl blur-lg opacity-40"></div>
                                            <div className="relative w-20 h-20 bg-gradient-to-b from-[#FFB05F] to-[#FF8400] rounded-2xl flex items-center justify-center">
                                                <Icon size={40} className="text-white" strokeWidth={1.5} />
                                            </div>
                                        </div>
                                    </div>

                                    {/* Content */}
                                    <div className='space-y-4 mt-18 flex flex-col items-center text-center'>
                                        <h3 className="text-[32px] font-semibold text-slate-950 mb-3">
                                            {step.title}
                                        </h3>
                                        <p className="text-slate-500 text-[17px] font-medium">
                                            {step.description}
                                        </p>
                                    </div>
                                </div>
                                <div className='gap-10'>
                                    <div className="absolute inset-0 top-40 -right-7 -left-7 h-50 rounded-3xl bg-[#FFAE58] scale-x-100 h-60"></div>
                                </div>
                            </div>
                        )
                    })}
                </div>
            </div>
        </section>
    )
}

export default HowItWorks
