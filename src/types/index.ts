export type MarketingFormat = 
  | 'POV Drama Relatable'
  | 'UGC Review & Testimoni'
  | 'Edukasi Parenting Soft-Selling'
  | 'Promo Diskon & Hard-Selling';

export type VisualStyle = 
  | 'Real Smartphone UGC Vlog'
  | 'Warm Parenting Home Aesthetic'
  | 'Modern 3D Animated Kids'
  | 'Clean Studio Product Review'
  | 'Cinematic Documentary';

export interface Character {
  id: string;
  name: string;
  role: string;
  visualDescription: string;
  imageUrl?: string;
  isAiGenerated?: boolean;
}

export interface BackgroundAsset {
  id: string;
  name: string;
  timeOfDay: string;
  visualDescription: string;
  imageUrl?: string;
  isAiGenerated?: boolean;
}

export interface ObjectAsset {
  id: string;
  name: string;
  significance: string;
  visualDescription: string;
  imageUrl?: string;
  isAiGenerated?: boolean;
}

export type CameraMovement = 
  | 'Handheld Phone Vlog'
  | 'Slow Zoom In'
  | 'Close-Up Screen Tap'
  | 'Over-The-Shoulder POV'
  | 'Gentle Pan Right'
  | 'Gentle Pan Left'
  | 'Low Angle Toddler Eye-Level'
  | 'Static Clean Framing';

export type SceneMarketingBeat = 
  | '01. Hook 3 Detik (Stop Scrolling)'
  | '02. Problem & Agitasi Relate'
  | '03. Solusi mggnura.ai'
  | '04. Transformasi & Bukti'
  | '05. Strong Call To Action (CTA)';

export interface Scene {
  sceneNumber: number;
  sceneTitle: string;
  durationSeconds: number;
  marketingBeat?: SceneMarketingBeat;
  narrationSegment: string;
  onScreenText?: string; // Text caption popping on screen like TikTok
  visualDescription: string;
  cameraMovement: CameraMovement;
  characterNames: string[];
  backgroundSetting: string;
  soundEffectCue: string;
  transition: string;
  imageUrl?: string;
  isGenerated?: boolean;
  videoBlobUrl?: string;
  isAiVideo?: boolean; // true bila videoBlobUrl berasal dari Google Veo (MP4 asli)
  aiVideoModel?: string;
  audioBlobUrl?: string;
}

export type VoiceId = 'Kore' | 'Zephyr' | 'Aoede' | 'Puck' | 'Fenrir' | 'Charon';

export interface VoiceOption {
  id: VoiceId;
  name: string;
  role: string;
  gender: 'Wanita' | 'Pria';
  tone: string;
  recommendedFor: string;
  avatarIcon: string;
  samplePhrase: string;
}

export interface VoiceConfig {
  voiceId: VoiceId;
  voiceName: string;
  style: string;
  speed: number;
  pitch: number;
}

export interface ProjectState {
  id: string;
  title: string;
  tagline: string;
  logline: string;
  synopsis: string;
  idea: string;
  marketingFormat: MarketingFormat;
  targetPainPoint: string;
  hook3s: string;
  ctaText: string;
  targetDuration: number;
  language: string;
  audience: string;
  visualStyle: VisualStyle;
  aspectRatio: '9:16' | '16:9';
  narration: string;
  captionSocialMedia?: string;
  targetHashtags?: string[];
  voiceConfig?: VoiceConfig;
  characters: Character[];
  backgrounds: BackgroundAsset[];
  objects: ObjectAsset[];
  scenes: Scene[];
  pacingReason?: string;
  totalScenes?: number;
  createdAt: number;
  updatedAt: number;
}
