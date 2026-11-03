import React from 'react';
import Sidebar from '../components/navigation/Sidebar';
import ChatArea from '../components/chat/ChatArea';
import PromptOptimizerModal from '../components/optimizer/PromptOptimizerModal';
import ArenaModal from '../components/features/ArenaModal';
import StudyModal from '../components/features/StudyModal';
import DailyChallengeModal from '../components/features/DailyChallengeModal';
import RetroOptimizeModal from '../components/features/RetroOptimizeModal';
import HandsFreeVoiceModal from '../components/voice/HandsFreeVoiceModal';
import CommandPalette from '../components/navigation/CommandPalette';

export default function Chat() {
  return (
    <div className="flex h-screen w-screen overflow-hidden bg-white dark:bg-[#090d16]">
      {/* Left Sidebar */}
      <Sidebar />

      {/* Center Chat Area */}
      <ChatArea />

      {/* Global Modals & Command Palette */}
      <PromptOptimizerModal />
      <ArenaModal />
      <StudyModal />
      <DailyChallengeModal />
      <RetroOptimizeModal />
      <HandsFreeVoiceModal />
      <CommandPalette />
    </div>
  );
}

