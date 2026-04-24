'use client';

import { useEffect, useState } from 'react';
import { Palette, ArrowRight, Code, Bug, Server, Loader2 } from 'lucide-react';

const phaseIcons: Record<string, JSX.Element> = {
  Design: <Palette className="w-4 h-4" />,
  Code: <Code className="w-4 h-4" />,
  Testing: <Bug className="w-4 h-4" />,
  Deployment: <Server className="w-4 h-4" />,
};

const DesignOverview = ({ projectId }: { projectId: string }) => {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [currentSlide, setCurrentSlide] = useState(0);

  useEffect(() => {
    fetch(`/api/client/analytics/design?projectId=${projectId}`)
      .then(r => r.json())
      .then(res => { if (res.success) setData(res.data); })
      .finally(() => setLoading(false));
  }, [projectId]);

  if (loading) return (
    <div className="flex justify-center py-16">
      <Loader2 className="animate-spin text-blue-500" size={32} />
    </div>
  );

  if (!data) return null;

  const val = (v: any) => Array.isArray(v) ? v.join(', ') : (typeof v === 'object' && v ? Object.keys(v).join(', ') : v) || 'Not set';

  const slides = [
    [{ label: 'Brand Name', value: val(data.brandName) }, { label: 'Design Type', value: val(data.designType) }, { label: 'Brand Feel', value: val(data.brandFeel) }],
    [{ label: 'Content Tone', value: val(data.contentTone) }, { label: 'Theme', value: val(data.theme) }, { label: 'Key Pages', value: val(data.keyPages) }],
    [{ label: 'Fonts', value: val(data.fonts) }, { label: 'Layout Style', value: val(data.layoutStyle) }, { label: 'Visual Guidelines', value: val(data.visualGuidelines) }],
    [{ label: 'Uniqueness', value: val(data.uniqueness) }],
  ];

  return (
    <div className="dark:bg-gray-900">
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

        {/* Design System Card */}
        <div className="bg-gray-100 dark:bg-gray-800 rounded-2xl p-6 border-2 border-blue-200 dark:border-blue-800 relative">
          <div className="absolute -top-3 left-45">
            <span className="bg-blue-500 text-white px-4 py-1 rounded-sm text-sm font-medium">Design System</span>
          </div>

          <div className="mt-4 space-y-6">
            <div>
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-3">Colors</h3>
              <div className="flex gap-2">
                {(data.colors ?? []).map((color: string, i: number) => (
                  <div
                    key={i}
                    className="group flex items-center h-8 w-8 hover:w-24 px-2 rounded-full border-2 border-gray-200 dark:border-gray-600 transition-all duration-300 ease-out cursor-pointer overflow-hidden"
                    style={{ backgroundColor: color }}
                  >
                    <span className="ml-2 text-xs font-semibold text-white opacity-0 group-hover:opacity-100 translate-x-[-6px] group-hover:translate-x-0 transition-all duration-300 whitespace-nowrap">
                      {color.toUpperCase()}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            <div className="overflow-hidden relative h-40">
              <div className="flex transition-transform duration-500 ease-out" style={{ transform: `translateX(-${currentSlide * 100}%)` }}>
                {slides.map((slide, i) => (
                  <div key={i} className="min-w-full space-y-4">
                    {slide.map((item, j) => (
                      <div key={j} className="flex items-center justify-between">
                        <span className="text-sm text-gray-600 dark:text-gray-400">{item.label}</span>
                        <span className="text-sm font-medium text-gray-900 dark:text-white max-w-32 truncate" title={item.value}>{item.value}</span>
                      </div>
                    ))}
                  </div>
                ))}
              </div>
            </div>

            <div className="flex justify-end">
              <button
                onClick={() => setCurrentSlide(p => (p + 1) % slides.length)}
                className="bg-blue-100 text-blue-600 dark:bg-blue-900 dark:text-blue-400 py-1 px-4 rounded-full flex items-center gap-2 hover:bg-blue-200 dark:hover:bg-blue-800 transition-colors"
              >
                <span className="font-medium">Fonts</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>

        {/* Right Unified Card */}
        <div className="lg:col-span-2 bg-gray-100 dark:bg-gray-800 rounded-2xl border-2 border-gray-300/50 dark:border-gray-700 flex overflow-hidden relative">

          {/* Days Remaining */}
          <div className="flex-1 p-6 flex flex-col justify-center">
            <div className="mb-4">
              <span className="inline-flex items-center gap-2 bg-green-100 dark:bg-green-900 text-green-700 dark:text-green-300 px-3 py-2 rounded-full text-xs font-medium">
                <span className="w-2 h-2 bg-green-500 rounded-full" />
                On Time
              </span>
            </div>
            <h2 className="text-4xl font-bold text-gray-900 dark:text-white mb-1">{data.projectPhase?.daysRemaining} Days</h2>
            <div className="mt-2 h-1 w-60 bg-purple-500 rounded-full" />
            <p className="text-sm text-right text-gray-500 dark:text-gray-400 mt-2">Days Remaining</p>
          </div>

          <div className="h-full w-1 bg-gray-300 dark:bg-gray-600" />

          {/* Current Phase */}
          <div className="flex-1 p-6 relative overflow-hidden">
            <div className="relative mb-5 flex flex-col items-start">
              <h3 className="text-xl text-gray-700/60 dark:text-gray-300 mb-4">Current Phase</h3>
              <div className="h-1 w-full absolute -left-10 top-8 bg-gray-300 dark:bg-gray-600" />
            </div>
            <div className="space-y-3 pb-8">
              {(data.projectPhase?.phases ?? []).map((phase: any) => {
                const isActive = phase.name === data.projectPhase?.current;
                return (
                  <div key={phase.name} className={`flex items-center gap-3 px-3 py-2 rounded-lg text-lg font-medium transition-all ${isActive ? 'bg-purple-500 text-white' : 'text-gray-600 dark:text-gray-400'}`}>
                    <span className={isActive ? 'text-white' : 'text-gray-400 dark:text-gray-500'}>{phaseIcons[phase.name]}</span>
                    {phase.name}
                  </div>
                );
              })}
            </div>
            <div className="pointer-events-none absolute inset-x-0 bottom-0 h-20 bg-gradient-to-t from-gray-300/60 dark:from-gray-700/40 to-transparent" />
          </div>

          <div className="h-full w-1 bg-gray-300 dark:bg-gray-600" />

          {/* Technology Used */}
          <div className="flex-1 p-6 relative overflow-hidden">
            <div className="relative flex flex-col mb-5 items-start">
              <h3 className="text-xl text-gray-700/60 dark:text-gray-300 mb-6">Technology Used</h3>
              <div className="h-1 w-[230px] absolute -left-10 top-8 bg-gray-300 dark:bg-gray-600" />
            </div>
            <div className="space-y-5 text-sm overflow-y-scroll max-h-64 no-scrollbar">
              {(data.technology ?? []).map((item: any) => (
                <div key={item.key} className="flex justify-between items-center">
                  <span className="text-gray-500 dark:text-gray-400">{item.key}</span>
                  <span className="font-medium ml-10 text-gray-900 dark:text-white">{item.value}</span>
                </div>
              ))}
            </div>
            <div className="pointer-events-none absolute inset-x-0 bottom-0 h-20 bg-gradient-to-t from-gray-300/60 dark:from-gray-700/40 to-transparent" />
          </div>
        </div>
      </div>
    </div>
  );
};

export default DesignOverview;
