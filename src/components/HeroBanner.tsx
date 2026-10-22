import React from 'react';
import { Play, Smartphone, Clock, TrendingUp } from 'lucide-react';
import { ProjectState } from '../types';
import { playNetflixTudum, playUiClick } from '../utils/audio';

interface HeroBannerProps {
  project: ProjectState;
  onContinue: () => void;
  onGoToStoryboard: () => void;
}

export const HeroBanner: React.FC<HeroBannerProps> = ({
  project,
  onContinue,
  onGoToStoryboard,
}) => {
  const heroImage =
    project.scenes[0]?.imageUrl ||
    project.characters[0]?.imageUrl ||
    'https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=1280&auto=format&fit=crop&q=80';

  return (
    <div className="relative w-full min-h-[380px] sm:min-h-[440px] overflow-hidden bg-[#232323] select-none border-b border-[#808080]/30">
      {/* Background Image with Ambient Overlay */}
      <div
        className="absolute inset-0 bg-cover bg-center transition-transform duration-700 ease-[cubic-bezier(0.4,0,0.68,0.06)] scale-100"
        style={{ backgroundImage: `url(${heroImage})` }}
      />

      {/* Cinematic Gradient Overlays in #232323 */}
      <div className="absolute inset-0 bg-gradient-to-t from-[#232323] via-[#232323]/80 to-transparent" />
      <div className="absolute inset-0 bg-gradient-to-r from-[#232323] via-[#232323]/90 to-transparent w-full lg:w-3/4" />
      <div className="absolute top-0 inset-x-0 h-20 bg-gradient-to-b from-[#232323]/80 to-transparent" />

      {/* Content Container */}
      <div className="relative max-w-7xl mx-auto h-full px-4 sm:px-6 lg:px-8 pt-8 pb-10 flex flex-col justify-end">
        {/* Eyebrow Label: single compact badge */}
        <div className="flex items-center space-x-2 mb-2">
          <span className="bg-[#e50914] text-white text-[11px] font-black px-1.5 py-0.5 rounded-[2px] tracking-wider">
            N
          </span>
          <span className="text-[11px] font-bold text-white uppercase tracking-wider">
            NURA VID • Studio Video Vertikal 9:16
          </span>
        </div>

        {/* Title: Max 2 lines */}
        <h1 className="text-2xl sm:text-4xl lg:text-5xl font-black text-white tracking-tight uppercase max-w-3xl leading-tight">
          {project.title || 'KONTEN VIDEO MGGNURA.AI'}
        </h1>

        {/* Subtext: Concise and under 20 words */}
        <p className="text-xs sm:text-sm text-[#b3b3b3] mt-2 max-w-xl line-clamp-2 leading-relaxed">
          {project.hook3s ? `Hook 3 Detik: "${project.hook3s}"` : 'Studio AI perancang video POV dan UGC TikTok relate untuk penjualan aplikasi edukasi anak.'}
        </p>

        {/* Status Strip */}
        <div className="flex flex-wrap items-center gap-2 mt-3 mb-5 text-[11px] text-[#b3b3b3]">
          <span className="bg-[#2d2d2d] border border-[#808080]/30 px-2 py-0.5 rounded-[2px] text-white font-semibold">
            9:16 Vertikal
          </span>
          <span className="bg-[#2d2d2d] border border-[#808080]/30 px-2 py-0.5 rounded-[2px] text-white">
            {project.marketingFormat || 'POV Drama'}
          </span>
          <span className="flex items-center text-[#b3b3b3] px-1">
            <Clock className="w-3.5 h-3.5 mr-1 text-[#808080]" />
            {project.scenes?.length || 5} Beats ({project.targetDuration || 30} detik)
          </span>
        </div>

        {/* Actions: Primary Red CTA + Secondary Border Button with exact Netflix Radii */}
        <div className="flex flex-wrap items-center gap-3">
          <button
            onClick={() => {
              playNetflixTudum();
              onContinue();
            }}
            className="netflix-btn-primary"
          >
            <Play className="w-4 h-4 fill-current mr-2" />
            <span>Mulai Buat Video Iklan</span>
          </button>

          <button
            onClick={() => {
              playUiClick();
              onGoToStoryboard();
            }}
            className="netflix-btn-secondary"
          >
            <Smartphone className="w-4 h-4 text-[#e50914] mr-2" />
            <span>Storyboard 9:16 ({project.scenes?.length || 0} Scene)</span>
          </button>
        </div>
      </div>
    </div>
  );
};
