import React from 'react';

export type View = 'home' | 'features' | 'models' | 'pricing' | 'enterprise' | 'chat' | 'dashboard';

export type CodingCapability = 'none' | 'partial' | 'half' | 'full';

export type SecurityLevel = 'none' | 'low' | 'medium' | 'high' | 'advance';

export type VoiceCapability = 'none' | 'basic' | 'neural'; // v2.5 Feature

export type Tone = 'precise' | 'balanced' | 'creative' | 'god'; // v2.5 Feature

export interface UserProfile {
  id: string;
  email: string;
  name: string;
  planId: string;
  avatarUrl?: string;
  createdAt: number;
  // Enterprise Fields
  enterpriseConfig?: CustomPlanConfig;
  teamMembers?: string[]; // List of emails
}

export interface UserAnalytics {
  totalTokens: number;
  totalMessages: number;
  totalCost: number;
  activeChats: number;
  modelUsage: Record<string, number>; // modelId -> count
  history: number[]; // 24h usage history
}

export interface Plan {
  id: string;
  name: string;
  price: number;
  currency: string;
  period: string;
  description: string;
  features: string[];
  highlightFeature?: string; 
  buttonText: string;
  color: string;
  allowedModels: string[]; 
  codingCapability: CodingCapability;
  trialDuration?: string;
  trialDurationMs?: number;
  // v2 Features
  isGodModeEligible?: boolean;
  isVaultEligible?: boolean;
  maxTokensOutput: number;
  // v2.5 Features
  imageLimit: number | 'unlimited';
  voiceCapability: VoiceCapability;
  canExport?: boolean;
}

export interface CustomPlanConfig {
  allowedModels: string[];
  codingCapability: CodingCapability;
  totalPrice: number;
  teamName?: string;
  removeBranding: boolean;
  securityLevel: SecurityLevel;
  companyContext?: string; 
}

export interface PricingCardProps {
  plan: Plan;
  onSelect: (planId: string) => void;
  onStartTrial: (planId: string) => void;
  trialStatus: 'available' | 'active' | 'used' | 'current';
  icon: React.ReactNode;
  isPopular?: boolean;
}

export interface NavbarProps {
  currentView: View;
  onNavigate: (view: View) => void;
  onRedeemClick: () => void;
  onAddCreditsClick: () => void;
  trialExpiry?: number | null;
  credits?: number;
  planName?: string;
  customTitle?: string;
  isGodModeActive?: boolean;
  user: UserProfile | null;
  onLoginClick: () => void;
  onLogoutClick: () => void;
  // New props for account switching
  activeProfileMode: 'personal' | 'enterprise';
  onSwitchProfileMode: () => void;
  onManageSubscription: () => void;
}

export interface AIModel {
  id: string;
  name: string;
  description: string;
  geminiModel: string;
  tier: string;
  isNew?: boolean;
  isThinking?: boolean;
  creditCost: number; 
  builderPrice: number; 
  supportsVision?: boolean; 
  supportsAudio?: boolean; // v2.5
}

export interface Attachment {
  type: 'image' | 'audio';
  data: string; // Base64
  mimeType: string;
}

export interface Message {
  id: string;
  role: 'user' | 'model';
  text: string;
  timestamp: number;
  isStreaming?: boolean;
  attachments?: Attachment[];
  suggestions?: string[]; // v2.5
}

export interface ChatSession {
  id: string;
  title: string;
  messages: Message[];
  modelId: string;
  lastModified: number;
  isGodModeSession?: boolean;
  tone?: Tone; // v2.5
}

export interface ChatInterfaceProps {
  selectedPlanId: string;
  customPlanConfig?: CustomPlanConfig;
  credits: number;
  onDeductCredits: (amount: number) => void;
  botName?: string;
  onUsageUpdate?: (tokens: number, costEstimate: number, modelId: string) => void;
  user: UserProfile | null;
  cloudSessions: ChatSession[] | null;
}