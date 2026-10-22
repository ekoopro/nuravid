import React from 'react';
import { FolderOpen, RotateCcw, Volume2, Mic, Settings } from 'lucide-react';
import { playNetflixTudum, playUiClick } from '../utils/audio';

interface NavbarProps {
  setCurrentStep: (step: number) => void;
  projectTitle: string;
  voiceName?: string;
  onOpenVoiceModal: () => void;
  onOpenSampleModal: () => void;
  onOpenSettings: () => void;
  onResetProject: () => void;
  hasAiKey?: boolean | null;
}

export const Navbar: React.FC<NavbarProps> = ({
  setCurrentStep,
  projectTitle,
  voiceName = 'Bunda Rina (Kore)',
  onOpenVoiceModal,
  onOpenSampleModal,
  onOpenSettings,
  onResetProject,
  hasAiKey = null,
}) => {
  return (
    <header className="sticky top-0 z-50 bg-[#232323]/95 backdrop-blur-md border-b border-[#808080]/30 transition-colors">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
        {/* Brand Logo */}
        <div className="flex items-center space-x-4">
          <div
            onClick={() => {
              playNetflixTudum();
              setCurrentStep(1);
            }}
            className="flex items-center space-x-2.5 cursor-pointer group"
          >
            <div className="w-8 h-8 bg-[#e50914] rounded-[2px] flex items-center justify-center font-display text-xl font-black text-white tracking-widest shadow-md group-hover:scale-105 transition-transform">
              N
            </div>
            <div className="flex flex-col">
              <span className="text-lg font-black tracking-tight text-white flex items-center leading-tight">
                NURA <span className="text-[#e50914] ml-1">VID</span>
              </span>
              <span className="text-[10px] text-[#b3b3b3] font-semibold">
                mggnura.ai Studio
              </span>
            </div>
          </div>

          {/* Current Project Badge */}
          {projectTitle && (
            <div className="hidden xl:flex items-center space-x-2 bg-[#2d2d2d] border border-[#808080]/30 px-2.5 py-1 rounded-[4px] text-xs">
              <span className="w-1.5 h-1.5 rounded-full bg-[#e50914]" />
              <span className="text-[#ffffff] font-medium truncate max-w-[180px]">
                {projectTitle}
              </span>
            </div>
          )}
        </div>

        {/* Action Controls */}
        <div className="flex items-center space-x-2">
          {/* Voice Model Selector Button */}
          <button
            onClick={() => {
              playUiClick();
              onOpenVoiceModal();
            }}
            title="Pilih Model Suara Voiceover (6 Karakter AI Gemini)"
            className="flex items-center space-x-1.5 px-3 py-1.5 rounded-[4px] bg-[#2d2d2d] hover:bg-[#383838] text-xs font-bold text-white transition-all border border-[#808080]/40 hover:border-[#e50914]"
          >
            <Mic className="w-3.5 h-3.5 text-[#e50914]" />
            <span className="hidden sm:inline text-[#b3b3b3]">Suara:</span>
            <span className="text-white truncate max-w-[100px]">{voiceName.split('(')[0].trim()}</span>
          </button>

          <button
            onClick={playNetflixTudum}
            title="Putar Intro Audio Netflix 'Tu-Dum'"
            className="p-2 rounded-[4px] bg-[#2d2d2d] hover:bg-[#383838] text-[#ffffff] transition-colors border border-[#808080]/30"
          >
            <Volume2 className="w-4 h-4 text-[#e50914]" />
          </button>

          {/* AI API Settings */}
          <button
            onClick={() => {
              playUiClick();
              onOpenSettings();
            }}
            title={
              hasAiKey === false
                ? 'Pengaturan API AI — API key belum diisi!'
                : 'Pengaturan API AI (Google Gemini)'
            }
            className="relative p-2 rounded-[4px] bg-[#2d2d2d] hover:bg-[#383838] text-[#ffffff] transition-colors border border-[#808080]/30 hover:border-[#e50914]"
          >
            <Settings className="w-4 h-4 text-[#e50914]" />
            {hasAiKey === false && (
              <span className="absolute -top-1 -right-1 w-2.5 h-2.5 rounded-full bg-[#e50914] animate-pulse shadow-sm" />
            )}
          </button>

          <button
            onClick={() => {
              playUiClick();
              onOpenSampleModal();
            }}
            className="flex items-center space-x-1.5 px-3 py-1.5 rounded-[4px] bg-[#2d2d2d] hover:bg-[#383838] text-xs font-semibold text-white transition-colors border border-[#808080]/30"
          >
            <FolderOpen className="w-3.5 h-3.5 text-white" />
            <span className="hidden sm:inline">Template</span>
          </button>

          <button
            onClick={() => {
              playUiClick();
              onResetProject();
            }}
            title="Reset atau Buat Naskah Baru"
            className="p-2 rounded-[4px] bg-[#2d2d2d] hover:bg-[#383838] text-[#808080] hover:text-white transition-colors border border-[#808080]/30"
          >
            <RotateCcw className="w-4 h-4" />
          </button>
        </div>
      </div>
    </header>
  );
};
