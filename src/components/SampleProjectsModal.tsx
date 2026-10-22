import React from 'react';
import { X, Smartphone, Play } from 'lucide-react';
import { ProjectState } from '../types';
import { SAMPLE_PROJECTS } from '../utils/presets';
import { playNetflixTudum, playUiClick } from '../utils/audio';

interface SampleProjectsModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectProject: (project: ProjectState) => void;
}

export const SampleProjectsModal: React.FC<SampleProjectsModalProps> = ({
  isOpen,
  onClose,
  onSelectProject,
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-md flex items-center justify-center p-4">
      <div className="bg-[#232323] border border-[#808080]/40 rounded-[8px] max-w-2xl w-full p-6 shadow-2xl relative text-white">
        {/* Close Button */}
        <button
          onClick={() => {
            playUiClick();
            onClose();
          }}
          className="absolute top-4 right-4 p-2 text-[#b3b3b3] hover:text-white rounded-[4px] hover:bg-[#2d2d2d] transition-colors"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="flex items-center space-x-2 text-xs font-bold text-[#e50914] uppercase tracking-wider mb-1">
          <Smartphone className="w-4 h-4" />
          <span>Koleksi Template Iklan &amp; UGC mggnura.ai</span>
        </div>

        <h3 className="text-xl sm:text-2xl font-black text-white tracking-tight uppercase mb-1">
          PILIH CONTOH KONTEN SIAP PAKAI (9:16)
        </h3>
        <p className="text-xs text-[#b3b3b3] mb-6 leading-relaxed">
          Pilih salah satu template video direct-response di bawah untuk mencoba langsung alur pembuatan naskah, aset visual, storyboard, hingga video vertikal 9:16 untuk produk mggnura.ai.
        </p>

        <div className="space-y-4">
          {SAMPLE_PROJECTS.map((sample) => (
            <div
              key={sample.id}
              onClick={() => {
                playNetflixTudum();
                onSelectProject(sample);
                onClose();
              }}
              className="bg-[#2d2d2d] border border-[#808080]/30 hover:border-[#e50914] rounded-[8px] p-4 cursor-pointer transition-all hover:scale-[1.01] hover:shadow-xl group flex flex-col sm:flex-row gap-4"
            >
              {/* Thumbnail 9:16 aspect */}
              <div className="relative aspect-[9/12] sm:w-28 rounded-[4px] overflow-hidden bg-black flex-shrink-0">
                <img
                  src={sample.scenes[0]?.imageUrl}
                  alt={sample.title}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                />
                <div className="absolute top-1.5 left-1.5 bg-[#e50914] text-white text-[9px] font-black px-1.5 py-0.5 rounded-[2px]">
                  9:16 UGC
                </div>
              </div>

              {/* Info */}
              <div className="flex-1 flex flex-col justify-between">
                <div>
                  <h4 className="text-base font-bold text-white group-hover:text-[#e50914] transition-colors">
                    {sample.title}
                  </h4>
                  <p className="text-xs text-white font-semibold mt-0.5">
                    {sample.tagline}
                  </p>
                  <p className="text-xs text-[#b3b3b3] mt-1 line-clamp-2 leading-relaxed">
                    Hook: "{sample.hook3s}"
                  </p>
                </div>

                <div className="mt-3 flex flex-wrap items-center gap-2 text-[11px] text-[#b3b3b3]">
                  <span className="bg-[#232323] text-white px-2 py-0.5 rounded-[2px] border border-[#808080]/30">
                    {sample.scenes.length} Beat Scene
                  </span>
                  <span className="bg-[#232323] text-white px-2 py-0.5 rounded-[2px] border border-[#808080]/30">
                    {sample.marketingFormat}
                  </span>
                  <span className="bg-[#e50914]/20 text-[#e50914] px-2 py-0.5 rounded-[2px] font-bold border border-[#e50914]/30">
                    Suara: {sample.voiceConfig?.voiceName?.split('(')[0]?.trim() || 'Bunda Rina'}
                  </span>
                  <span className="text-white font-bold ml-auto flex items-center group-hover:text-[#e50914]">
                    <span>Buka Template</span>
                    <Play className="w-3 h-3 ml-1 fill-current" />
                  </span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
