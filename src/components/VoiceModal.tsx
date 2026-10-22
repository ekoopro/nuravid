import React from 'react';
import { X, Volume2 } from 'lucide-react';
import { VoiceConfig } from '../types';
import { VoiceSelector } from './VoiceSelector';
import { playUiClick } from '../utils/audio';

interface VoiceModalProps {
  isOpen: boolean;
  onClose: () => void;
  voiceConfig?: VoiceConfig;
  onChangeVoice: (config: VoiceConfig) => void;
}

export const VoiceModal: React.FC<VoiceModalProps> = ({
  isOpen,
  onClose,
  voiceConfig,
  onChangeVoice,
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
      <div className="relative w-full max-w-4xl max-h-[90vh] overflow-y-auto bg-[#232323] border border-[#808080]/40 rounded-[8px] shadow-2xl p-6 text-white">
        {/* Close Button */}
        <button
          onClick={() => {
            playUiClick();
            onClose();
          }}
          className="absolute top-4 right-4 p-2 rounded-[4px] bg-[#2d2d2d] hover:bg-[#383838] text-[#b3b3b3] hover:text-white transition-colors"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Modal Header */}
        <div className="mb-4">
          <div className="flex items-center space-x-2 text-[#e50914] text-xs font-bold uppercase tracking-wider mb-1">
            <Volume2 className="w-4 h-4" />
            <span>Studio Voiceover Manager</span>
          </div>
          <h2 className="text-xl font-black text-white">
            Pilih Model Suara Voiceover untuk Video Marketing
          </h2>
          <p className="text-xs text-[#b3b3b3] mt-1">
            Pilih dari 6 model suara AI Gemini untuk membacakan narasi video mggnura.ai. Dilengkapi koreksi pelafalan otomatis agar "mggnura.ai" diucapkan secara akurat sebagai "emjijinura dot e ay".
          </p>
        </div>

        {/* Voice Selector Embed */}
        <VoiceSelector
          currentConfig={voiceConfig}
          onChange={(newCfg) => {
            onChangeVoice(newCfg);
          }}
        />

        {/* Modal Footer */}
        <div className="mt-5 pt-4 border-t border-[#808080]/20 flex justify-end">
          <button
            onClick={() => {
              playUiClick();
              onClose();
            }}
            className="netflix-btn-primary"
          >
            Selesai &amp; Gunakan Suara Ini
          </button>
        </div>
      </div>
    </div>
  );
};
