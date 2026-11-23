import React from 'react';
import { Sparkles } from 'lucide-react';

export function formatChemistryTypography(text: string): string {
  return text
    .replace(/\bH2O\b/g, 'H₂O')
    .replace(/\bCO2\b/g, 'CO₂')
    .replace(/\bNH3\b/g, 'NH₃')
    .replace(/\bCH4\b/g, 'CH₄')
    .replace(/\bC2H4\b/g, 'C₂H₄')
    .replace(/\bC2H6\b/g, 'C₂H₆')
    .replace(/\bC6H6\b/g, 'C₆H₆')
    .replace(/\bSO2\b/g, 'SO₂')
    .replace(/\bSO3\b/g, 'SO₃')
    .replace(/\bNO2\b/g, 'NO₂')
    .replace(/\bH2SO4\b/g, 'H₂SO₄')
    .replace(/\bHNO3\b/g, 'HNO₃')
    .replace(/\bH2O2\b/g, 'H₂O₂')
    .replace(/\bO2\b/g, 'O₂')
    .replace(/\bO3\b/g, 'O₃')
    .replace(/\bN2\b/g, 'N₂')
    .replace(/\bH2\b/g, 'H₂')
    .replace(/\bF2\b/g, 'F₂')
    .replace(/\bCl2\b/g, 'Cl₂')
    .replace(/\bBr2\b/g, 'Br₂')
    .replace(/\bI2\b/g, 'I₂')
    .replace(/\bsp3d2\b/g, 'sp³d²')
    .replace(/\bsp3d\b/g, 'sp³d')
    .replace(/\bsp3\b/g, 'sp³')
    .replace(/\bsp2\b/g, 'sp²');
}

interface FormattedChemMarkdownProps {
  text: string;
  /** 'adaptive' uses light/dark semantic Tailwind classes; 'dark' is optimized for dark chat surfaces */
  variant?: 'adaptive' | 'dark';
}

export const FormattedChemMarkdown: React.FC<FormattedChemMarkdownProps> = ({
  text,
  variant = 'adaptive',
}) => {
  const isDarkSurface = variant === 'dark';

  const renderInlineNodes = (rawText: string): React.ReactNode[] => {
    const formatted = formatChemistryTypography(rawText);
    const tokens = formatted.split(/(\*\*[^*]+\*\*|`[^`]+`|\*[^*\n]+\*)/g);

    return tokens.map((token, i) => {
      if (token.startsWith('**') && token.endsWith('**') && token.length > 4) {
        return (
          <strong
            key={i}
            className={
              isDarkSurface
                ? 'font-bold text-white'
                : 'font-bold text-slate-950 dark:text-white'
            }
          >
            {token.slice(2, -2)}
          </strong>
        );
      }

      if (token.startsWith('`') && token.endsWith('`') && token.length > 2) {
        return (
          <code
            key={i}
            className={
              isDarkSurface
                ? 'px-1.5 py-0.5 rounded bg-purple-950/60 text-purple-200 font-mono text-[11px] border border-purple-500/30'
                : 'px-1.5 py-0.5 rounded bg-purple-100 dark:bg-purple-950/70 text-purple-800 dark:text-purple-200 font-mono text-[11px] border border-purple-300 dark:border-purple-500/30'
            }
          >
            {token.slice(1, -1)}
          </code>
        );
      }

      if (token.startsWith('*') && token.endsWith('*') && token.length > 2) {
        return (
          <em key={i} className="italic">
            {token.slice(1, -1)}
          </em>
        );
      }

      return <React.Fragment key={i}>{token}</React.Fragment>;
    });
  };

  const lines = String(text ?? '').split('\n');

  return (
    <div
      className={`space-y-2 text-[13px] leading-relaxed ${
        isDarkSurface ? 'text-white/90' : 'text-slate-800 dark:text-slate-200'
      }`}
    >
      {lines.map((line, idx) => {
        const trimmed = line.trim();
        if (!trimmed) return <div key={idx} className="h-1.5" />;

        if (/^#{3,6}\s+/.test(trimmed)) {
          return (
            <h4
              key={idx}
              className={`text-sm font-extrabold pt-2 pb-0.5 flex items-center gap-1.5 ${
                isDarkSurface ? 'text-purple-300' : 'text-purple-700 dark:text-purple-300'
              }`}
            >
              <Sparkles
                className={`w-3.5 h-3.5 shrink-0 ${
                  isDarkSurface ? 'text-purple-400' : 'text-purple-500 dark:text-purple-400'
                }`}
              />
              <span>{renderInlineNodes(trimmed.replace(/^#{3,6}\s+/, ''))}</span>
            </h4>
          );
        }

        if (trimmed.startsWith('## ') || trimmed.startsWith('# ')) {
          return (
            <h3
              key={idx}
              className={`text-base font-extrabold pt-2 pb-1 border-b ${
                isDarkSurface
                  ? 'text-white border-white/10'
                  : 'text-slate-950 dark:text-white border-slate-200 dark:border-white/10'
              }`}
            >
              {renderInlineNodes(trimmed.replace(/^#+\s+/, ''))}
            </h3>
          );
        }

        const numberedMatch = trimmed.match(/^(\d+)\.\s+(.*)$/);
        if (numberedMatch) {
          return (
            <div key={idx} className="flex items-start gap-2 pl-1">
              <span
                className={`font-mono text-xs font-bold mt-0.5 shrink-0 ${
                  isDarkSurface ? 'text-purple-400' : 'text-purple-600 dark:text-purple-400'
                }`}
              >
                {numberedMatch[1]}.
              </span>
              <span>{renderInlineNodes(numberedMatch[2])}</span>
            </div>
          );
        }

        if (trimmed.startsWith('* ') || trimmed.startsWith('- ') || trimmed.startsWith('• ')) {
          const itemText = trimmed.replace(/^[*•-]\s+/, '');
          return (
            <div
              key={idx}
              className={`flex items-start gap-2 pl-1 ${
                isDarkSurface ? 'text-white/85' : ''
              }`}
            >
              <span
                className={`w-1.5 h-1.5 rounded-full mt-2 shrink-0 ${
                  isDarkSurface ? 'bg-purple-400' : 'bg-purple-500 dark:bg-purple-400'
                }`}
              />
              <span>{renderInlineNodes(itemText)}</span>
            </div>
          );
        }

        return <p key={idx}>{renderInlineNodes(trimmed)}</p>;
      })}
    </div>
  );
};
