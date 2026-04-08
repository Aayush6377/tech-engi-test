"use client";
import React from 'react'
import { CalendarCheck, Users, Award, Shield, Zap, Globe } from 'lucide-react'
import { useScrollAnimation } from '@/lib/useScrollAnimation'

const stats = [
  { value: '10K+', label: 'Project Delivered on Time' },
  { value: '1.2K+', label: 'Engineers onboard' },
  { value: '95%', label: 'Clients satisfaction' },
  { value: '10K+', label: 'Project Delivered on Time' },
  { value: '1.2K+', label: 'Engineers onboard' },
  { value: '95%', label: 'Clients satisfaction' },
]

const companyIcons = [
  { icon: Shield, label: 'Secure' },
  { icon: Globe, label: 'Global' },
  { icon: Award, label: 'Premium' },
  { icon: Zap, label: 'Fast' },
  { icon: CalendarCheck, label: 'Reliable' },
]

const Stats = () => {
  const headingRef = useScrollAnimation('fadeUp')
  const gridRef = useScrollAnimation('fadeUp')
  const iconsRef = useScrollAnimation('fadeUp')

  return (
    <section className="w-full bg-white py-20 px6 font-inter">
      <div className="mx-auto">
        <div ref={headingRef} className="text-center mb-26">
          <h2 className="text-[74px] font-semibold leading-tight text-slate-950">
            Trusted by <span className="italic">builders,</span><br /> startups &amp; growing teams
          </h2>
        </div>

        <div ref={gridRef} className="grid grid-cols-1 sm:grid-cols-3 gap-8 text-center">
          {stats.map((item, index) => (
            <div key={index} >
              <p className="text-[74px] font-semibold bg-[linear-gradient(106.71deg,#00BBFF_16.24%,#C15DFF_53.84%,#FFAE58_69.09%)] bg-clip-text text-transparent">
                {item.value}
              </p>
              <p className="text-[24px] text-[#4B4B4B] font-id">{item.label}</p>
            </div>
          ))}
        </div>

        <div ref={iconsRef} className="mt-26 border border-slate-200 py-8 w-full">
          <div className="flex flex-wrap items-center justify-between gap-28 px-6">
            {companyIcons.map((company, index) => {
              const Icon = company.icon
              return (
                <div key={index} className="flex flex-col items-center gap-3 text-slate-600">
                  <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-white shadow-sm">
                    <Icon size={28} className="text-slate-900" />
                  </div>
                  <span className="text-xs uppercase tracking-[0.2em] text-slate-500">
                    {company.label}
                  </span>
                </div>
              )
            })}
          </div>
        </div>
      </div>
    </section>
  )
}

export default Stats