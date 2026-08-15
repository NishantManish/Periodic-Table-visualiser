import React from 'react';
import { motion } from 'motion/react';

export interface TabItem {
  id: string;
  label: React.ReactNode;
  icon?: React.ReactNode;
  badge?: string | number;
}

export interface TabsProps {
  tabs: TabItem[];
  activeTab: string;
  onChange: (id: string) => void;
  variant?: 'pills' | 'underline' | 'segmented';
  className?: string;
}

export const Tabs: React.FC<TabsProps> = ({
  tabs,
  activeTab,
  onChange,
  variant = 'pills',
  className = '',
}) => {
  if (variant === 'segmented') {
    return (
      <div className={`flex p-1 bg-slate-900/90 border border-slate-800 rounded-xl ${className}`}>
        {tabs.map((tab) => {
          const isActive = tab.id === activeTab;
          return (
            <button
              key={tab.id}
              onClick={() => onChange(tab.id)}
              className={`relative flex-1 flex items-center justify-center gap-2 py-2 px-3 text-xs sm:text-sm font-medium rounded-lg transition-colors cursor-pointer ${
                isActive ? 'text-slate-100 font-semibold' : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              {isActive && (
                <motion.div
                  layoutId="segmented-tab-active"
                  className="absolute inset-0 bg-slate-800 border border-slate-700/80 rounded-lg shadow-sm"
                  transition={{ type: 'spring', duration: 0.3 }}
                />
              )}
              <span className="relative z-10 flex items-center gap-1.5">
                {tab.icon}
                {tab.label}
                {tab.badge !== undefined && (
                  <span className="px-1.5 py-0.2 text-[10px] rounded-full bg-slate-700 text-slate-300">
                    {tab.badge}
                  </span>
                )}
              </span>
            </button>
          );
        })}
      </div>
    );
  }

  return (
    <div className={`flex gap-1 overflow-x-auto no-scrollbar border-b border-slate-800/80 ${className}`}>
      {tabs.map((tab) => {
        const isActive = tab.id === activeTab;
        return (
          <button
            key={tab.id}
            onClick={() => onChange(tab.id)}
            className={`relative flex items-center gap-2 py-2.5 px-4 text-sm font-medium transition-colors cursor-pointer whitespace-nowrap ${
              isActive ? 'text-sky-400 font-semibold' : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            {tab.icon}
            {tab.label}
            {isActive && (
              <motion.div
                layoutId="underline-tab-active"
                className="absolute bottom-0 left-0 right-0 h-0.5 bg-sky-500 rounded-full"
                transition={{ type: 'spring', duration: 0.3 }}
              />
            )}
          </button>
        );
      })}
    </div>
  );
};
