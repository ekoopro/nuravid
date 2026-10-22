import React, { useState, useEffect } from 'react';
import { ProjectState } from './types';
import { SAMPLE_PROJECTS } from './utils/presets';
import { Navbar } from './components/Navbar';
import { HeroBanner } from './components/HeroBanner';
import { StepNavigator } from './components/StepNavigator';
import { Step1IdeaNarration } from './components/Step1IdeaNarration';
import { Step2AssetsStudio } from './components/Step2AssetsStudio';
import { Step3Storyboard } from './components/Step3Storyboard';
import { Step4VideoStudio } from './components/Step4VideoStudio';
import { Step5ReviewExport } from './components/Step5ReviewExport';
import { SampleProjectsModal } from './components/SampleProjectsModal';
import { VoiceModal } from './components/VoiceModal';
import { SettingsModal } from './components/SettingsModal';

const STORAGE_KEY = 'NURA_VID_MGGNURA_PROJECT_V2';

export default function App() {
  const [currentStep, setCurrentStep] = useState<number>(1);
  const [isSampleModalOpen, setIsSampleModalOpen] = useState(false);
  const [isVoiceModalOpen, setIsVoiceModalOpen] = useState(false);
  const [isSettingsModalOpen, setIsSettingsModalOpen] = useState(false);
  // null = status belum diketahui, false = API key belum diisi
  const [hasAiKey, setHasAiKey] = useState<boolean | null>(null);

  // Initialize with saved project or default mggnura.ai POV project
  const [project, setProject] = useState<ProjectState>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (parsed?.aspectRatio === '9:16') {
          return parsed;
        }
      }
    } catch {}
    return SAMPLE_PROJECTS[0];
  });

  // Save to local storage on change
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(project));
    } catch {}
  }, [project]);

  // Cek status API AI saat aplikasi dibuka (untuk indikator tombol Settings)
  useEffect(() => {
    let isMounted = true;
    fetch('/api/health')
      .then((res) => res.json())
      .then((data) => {
        if (isMounted) setHasAiKey(Boolean(data.hasGeminiKey));
      })
      .catch(() => {
        if (isMounted) setHasAiKey(null);
      });
    return () => {
      isMounted = false;
    };
  }, []);

  const updateProject = (updates: Partial<ProjectState>) => {
    setProject((prev) => ({
      ...prev,
      ...updates,
      updatedAt: Date.now(),
    }));
  };

  const handleResetProject = () => {
    if (window.confirm('Mulai konsep video marketing mggnura.ai baru? Ide saat ini akan direset.')) {
      const newEmptyProject: ProjectState = {
        id: `proj-${Date.now()}`,
        title: 'KONTEN VIDEO MGGNURA.AI BARU',
        tagline: 'Solusi Screen Time Pintar Balita 2-3 Tahun',
        logline: '',
        synopsis: '',
        idea: '',
        marketingFormat: 'POV Drama Relatable',
        targetPainPoint: 'Anak 2 tahun tantrum kalau HP diambil',
        hook3s: '',
        ctaText: 'Yuk selamatkan golden age si kecil! Klik link di bio buat klaim Free Trial 7 Hari ya!',
        targetDuration: 30,
        language: 'Indonesian',
        audience: 'Orang Tua Balita Usia 2-3 Tahun',
        visualStyle: 'Real Smartphone UGC Vlog',
        aspectRatio: '9:16',
        narration: '',
        characters: [],
        backgrounds: [],
        objects: [],
        scenes: [],
        createdAt: Date.now(),
        updatedAt: Date.now(),
      };
      setProject(newEmptyProject);
      setCurrentStep(1);
    }
  };

  return (
    <div className="min-h-screen bg-[#232323] text-white flex flex-col selection:bg-[#e50914] selection:text-white">
      {/* Top Navigation */}
      <Navbar
        setCurrentStep={setCurrentStep}
        projectTitle={project.title}
        voiceName={project.voiceConfig?.voiceName || 'Bunda Rina (Kore)'}
        onOpenVoiceModal={() => setIsVoiceModalOpen(true)}
        onOpenSampleModal={() => setIsSampleModalOpen(true)}
        onOpenSettings={() => setIsSettingsModalOpen(true)}
        onResetProject={handleResetProject}
        hasAiKey={hasAiKey}
      />

      {/* Hero Banner (Shown when on step 1) */}
      {currentStep === 1 && (
        <HeroBanner
          project={project}
          onContinue={() => {
            const nextEl = document.getElementById('step-content');
            nextEl?.scrollIntoView({ behavior: 'smooth' });
          }}
          onGoToStoryboard={() => {
            if (project.scenes.length > 0) {
              setCurrentStep(3);
            } else {
              setCurrentStep(1);
            }
          }}
        />
      )}

      {/* Step Navigator (below Hero Banner) */}
      <StepNavigator currentStep={currentStep} setCurrentStep={setCurrentStep} />

      {/* Main Studio Workspace Content */}
      <main id="step-content" className="flex-1 pb-16">
        {currentStep === 1 && (
          <Step1IdeaNarration
            project={project}
            updateProject={updateProject}
            onNext={() => setCurrentStep(2)}
          />
        )}

        {currentStep === 2 && (
          <Step2AssetsStudio
            project={project}
            updateProject={updateProject}
            onNext={() => setCurrentStep(3)}
            onPrev={() => setCurrentStep(1)}
          />
        )}

        {currentStep === 3 && (
          <Step3Storyboard
            project={project}
            updateProject={updateProject}
            onNext={() => setCurrentStep(4)}
            onPrev={() => setCurrentStep(2)}
          />
        )}

        {currentStep === 4 && (
          <Step4VideoStudio
            project={project}
            updateProject={updateProject}
            onNext={() => setCurrentStep(5)}
            onPrev={() => setCurrentStep(3)}
          />
        )}

        {currentStep === 5 && (
          <Step5ReviewExport
            project={project}
            updateProject={updateProject}
            onPrev={() => setCurrentStep(4)}
            onGoToStep={(step) => setCurrentStep(step)}
          />
        )}
      </main>

      {/* Sample Projects Selector Modal */}
      <SampleProjectsModal
        isOpen={isSampleModalOpen}
        onClose={() => setIsSampleModalOpen(false)}
        onSelectProject={(sample) => {
          setProject(sample);
          setCurrentStep(1);
        }}
      />

      {/* Global Voice Models Selector Modal */}
      <VoiceModal
        isOpen={isVoiceModalOpen}
        onClose={() => setIsVoiceModalOpen(false)}
        voiceConfig={project.voiceConfig}
        onChangeVoice={(newVoiceConfig) => {
          updateProject({ voiceConfig: newVoiceConfig });
        }}
      />

      {/* AI API Key Settings Modal */}
      <SettingsModal
        isOpen={isSettingsModalOpen}
        onClose={() => setIsSettingsModalOpen(false)}
        onSaved={(hasRequiredKey) => setHasAiKey(hasRequiredKey)}
      />

      {/* Minimal Netflix Footer */}
      <footer className="border-t border-[#808080]/30 bg-[#1e1e1e] py-6 px-4 text-center text-xs text-[#b3b3b3]">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="flex items-center space-x-2">
            <span className="text-base text-white font-black tracking-tight">
              NURA <span className="text-[#e50914]">VID</span>
            </span>
            <span className="text-[11px] text-[#b3b3b3]">
              • Video Studio mggnura.ai
            </span>
          </div>

          <div className="flex items-center space-x-2 text-[11px] text-[#808080]">
            <span>1. Ide &amp; Hook</span>
            <span>➔</span>
            <span>2. Aset &amp; Mockup</span>
            <span>➔</span>
            <span>3. Storyboard</span>
            <span>➔</span>
            <span>4. Video Studio</span>
            <span>➔</span>
            <span>5. Review &amp; Download</span>
          </div>
        </div>
      </footer>
    </div>
  );
}
