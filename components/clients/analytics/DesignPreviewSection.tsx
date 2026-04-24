'use client';

import { useEffect, useState } from 'react';
import Image from 'next/image';
import { Loader2 } from 'lucide-react';
import { appConfig } from '@/config/appConfig';

const PreviewCard = ({ title, buttonText, buttonColor, imageUrl, onClick }: {
  title: string; buttonText: string; buttonColor: string; imageUrl: string; onClick?: () => void;
}) => (
  <div className="bg-gray-100 dark:bg-gray-800 p-5 rounded-2xl border border-gray-200 dark:border-gray-700 overflow-hidden shadow-sm hover:shadow-md transition-all duration-200 w-full h-full">
    <div className="w-full h-80 relative">
      <Image src={imageUrl} alt={title} fill className="object-fill border border-gray-200 dark:border-gray-800 rounded-2xl" />
    </div>
    <button onClick={onClick} className="w-full py-3 border border-gray-200 dark:border-gray-700 rounded-xl mt-5 text-white text-lg font-semibold" style={{ backgroundColor: buttonColor }}>
      {buttonText}
    </button>
  </div>
);

const DesignPreviewSection = ({ projectId }: { projectId: string }) => {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [iframeUrl, setIframeUrl] = useState<string | null>(null);

  useEffect(() => {
    fetch(`/api/client/analytics/design-preview?projectId=${projectId}`)
      .then(r => r.json())
      .then(res => { if (res.success) setData(res.data); })
      .finally(() => setLoading(false));
  }, [projectId]);

  const handleClick = (item: any) => {
    if (!item) return;
    let url = (item.liveUrl || item.imageUrl || '').trim();
    if (!url) return;
    if (!url.startsWith('http://') && !url.startsWith('https://')) url = 'https://' + url;
    try {
      new URL(url);
      if (/\.(jpg|jpeg|png|gif|webp|svg)$/i.test(url)) { window.open(url, '_blank'); return; }
      setIframeUrl(url);
    } catch { window.open(url, '_blank'); }
  };

  if (loading) return (
    <div className="flex justify-center py-16">
      <Loader2 className="animate-spin text-blue-500" size={32} />
    </div>
  );

  if (!data) return null;

  return (
    <div>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 py-6">
        <PreviewCard title="View Design" buttonText="View Design" buttonColor="#55b8ff" imageUrl={data?.design?.imageUrl || appConfig.logo} onClick={() => handleClick(data?.design)} />
        <PreviewCard title="Live Preview" buttonText="Live Preview" buttonColor="#A855F7" imageUrl={data?.preview?.imageUrl || appConfig.logo} onClick={() => handleClick(data?.preview)} />
      </div>

      {iframeUrl && (
        <div className="w-full h-[600px] mt-6 rounded-xl overflow-hidden border border-gray-300 dark:border-gray-700 relative">
          <button onClick={() => setIframeUrl(null)} className="absolute top-2 right-2 z-10 bg-red-500 hover:bg-red-600 text-white rounded-full w-8 h-8 flex items-center justify-center text-lg font-bold">×</button>
          <iframe src={iframeUrl} className="w-full h-full" allowFullScreen />
        </div>
      )}
    </div>
  );
};

export default DesignPreviewSection;
