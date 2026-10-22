import React from 'react';
import { Sparkles, Smartphone, Layers, Video, PlaySquare } from 'lucide-react';
import { playUiClick } from '../utils/audio';

interface StepNavigatorProps {
  currentStep: number;
  setCurrentStep: (step: number) => void;
}

export const StepNavigator: React.FC<StepNavigatorProps> = ({
  currentStep,
  setCurrentStep,
}) => {
  const steps = [
    { num: 1, label: 'Ide & Hook', icon: Sparkles },
    { num: 2, label: 'Aset & Mockup', icon: Layers },
    { num: 3, label: 'Storyboard 9:16', icon: Smartphone },
    { num: 4, label: 'Video Studio', icon: Video },
    { num: 5, label: 'Review & Download', icon: PlaySquare },
  ];

  return (
    <div className="bg-[#232323] border-b border-[#808080]/30">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3">
        {/* Steps Pipeline Bar on ONE single line (Desktop) */}
        <nav className="hidden lg:flex items-center justify-center space-x-1 bg-[#2d2d2d] p-1 rounded-[4px] border border-[#808080]/30 w-fit mx-auto">
          {steps.map((step) => {
            const Icon = step.icon;
            const isActive = currentStep === step.num;
            const isCompleted = currentStep > step.num;

            return (
              <button
                key={step.num}
                onClick={() => {
                  playUiClick();
                  setCurrentStep(step.num);
                }}
                className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-[2px] text-xs font-semibold transition-all ${
                  isActive
                    ? 'bg-[#e50914] text-white shadow-sm'
                    : isCompleted
                    ? 'text-white hover:bg-[#383838]'
                    : 'text-[#808080] hover:text-white hover:bg-[#333333]'
                }`}
              >
                <Icon
                  className={`w-3.5 h-3.5 ${
                    isActive ? 'text-white' : isCompleted ? 'text-[#e50914]' : 'text-[#808080]'
                  }`}
                />
                <span>
                  {step.num}. {step.label}
                </span>
              </button>
            );
          })}
        </nav>

        {/* Step Navigator (Mobile) */}
        <div className="lg:hidden flex items-center justify-around py-1 overflow-x-auto px-1">
          {steps.map((step) => {
            const isActive = currentStep === step.num;
            return (
              <button
                key={step.num}
                onClick={() => {
                  playUiClick();
                  setCurrentStep(step.num);
                }}
                className={`px-2.5 py-1 rounded-[2px] text-[11px] font-bold whitespace-nowrap transition-colors ${
                  isActive ? 'bg-[#e50914] text-white' : 'text-[#808080] hover:text-white'
                }`}
              >
                Step {step.num}
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
};
