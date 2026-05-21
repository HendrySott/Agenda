import React from 'react';

interface AppFooterProps {
  className?: string;
  variant?: 'light' | 'dark';
}

export function AppFooter({ className = '', variant = 'light' }: AppFooterProps) {
  const isDark = variant === 'dark';

  return (
    <footer className={className}>
      <div className={`text-center text-sm ${isDark ? 'text-white/80' : 'text-gray-500'}`}>
        <span>Creado por </span>
        <a
          href="https://hsott.dev"
          target="_blank"
          rel="noopener noreferrer"
          className={`font-medium underline-offset-4 hover:underline ${
            isDark ? 'text-white' : 'text-blue-600'
          }`}
        >
          HSott
        </a>
        <span> · </span>
        <a
          href="https://hsott.dev"
          target="_blank"
          rel="noopener noreferrer"
          className={`underline-offset-4 hover:underline ${isDark ? 'text-white' : 'text-blue-600'}`}
        >
          hsott.dev
        </a>
      </div>
    </footer>
  );
}
