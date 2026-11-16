import React, { useEffect, useMemo, useState } from 'react';
import {
  AlertTriangle,
  Calculator,
  CheckCircle2,
  FlaskConical,
  Plus,
  RotateCcw,
  Scale,
  Trash2,
} from 'lucide-react';
import { ElementData } from '../../types';
import {
  getElementIsotopes,
  getPresetsForElement,
  ISOTOPE_COLORS,
} from '../../data/isotopesData';

interface IsotopeRowState {
  id: string;
  massNumber: number;
  exactMass: number;
  abundance: number;
  isCustom: boolean;
  color: string;
}

interface IsotopeCalculatorProps {
  element: ElementData;
}

export const IsotopeCalculator: React.FC<IsotopeCalculatorProps> = ({ element }) => {
  const presets = useMemo(
    () => getPresetsForElement(element.atomicNumber, element.symbol, element.atomicMass),
    [element.atomicNumber, element.symbol, element.atomicMass]
  );

  const buildNaturalRows = (): IsotopeRowState[] => {
    const base = getElementIsotopes(element.atomicNumber, element.atomicMass);
    return base.map((iso, idx) => ({
      id: `nat-${element.atomicNumber}-${iso.massNumber}-${idx}`,
      massNumber: iso.massNumber,
      exactMass: iso.exactMass,
      abundance: iso.abundance,
      isCustom: false,
      color: ISOTOPE_COLORS[idx % ISOTOPE_COLORS.length],
    }));
  };

  const [rows, setRows] = useState<IsotopeRowState[]>(buildNaturalRows);
  const [autoNormalize, setAutoNormalize] = useState<boolean>(true);
  const [activePresetId, setActivePresetId] = useState<string>('natural-ciaaw');

  // Custom isotope form state
  const [showAddForm, setShowAddForm] = useState(false);
  const [customMassNumber, setCustomMassNumber] = useState<string>('');
  const [customExactMass, setCustomExactMass] = useState<string>('');
  const [customAbundance, setCustomAbundance] = useState<string>('5');
  const [formError, setFormError] = useState<string | null>(null);

  // Sync cleanly whenever user switches inspected element
  useEffect(() => {
    const base = getElementIsotopes(element.atomicNumber, element.atomicMass);
    setRows(
      base.map((iso, idx) => ({
        id: `nat-${element.atomicNumber}-${iso.massNumber}-${idx}`,
        massNumber: iso.massNumber,
        exactMass: iso.exactMass,
        abundance: iso.abundance,
        isCustom: false,
        color: ISOTOPE_COLORS[idx % ISOTOPE_COLORS.length],
      }))
    );
    setActivePresetId('natural-ciaaw');
    setShowAddForm(false);
    setFormError(null);
    const maxA = base.reduce((acc, item) => Math.max(acc, item.massNumber), Math.round(element.atomicMass));
    setCustomMassNumber(String(maxA + 1));
    setCustomExactMass((maxA + 1.003).toFixed(4));
  }, [element.atomicNumber, element.atomicMass]);

  const applyPreset = (presetId: string) => {
    const found = presets.find((p) => p.id === presetId);
    if (!found) return;
    setActivePresetId(found.id);
    setRows(
      found.isotopes.map((iso, idx) => ({
        id: `preset-${found.id}-${iso.massNumber}-${idx}`,
        massNumber: iso.massNumber,
        exactMass: iso.exactMass,
        abundance: iso.abundance,
        isCustom: false,
        color: ISOTOPE_COLORS[idx % ISOTOPE_COLORS.length],
      }))
    );
  };

  const handleAbundanceChange = (id: string, rawValue: number) => {
    const clamped = Number.isFinite(rawValue) ? Math.max(0, Math.min(100, rawValue)) : 0;
    setActivePresetId('custom');

    setRows((prev) => {
      if (!autoNormalize || prev.length <= 1) {
        return prev.map((r) => (r.id === id ? { ...r, abundance: Number(clamped.toFixed(4)) } : r));
      }

      const targetRemainder = Math.max(0, 100 - clamped);
      const others = prev.filter((r) => r.id !== id);
      const othersSum = others.reduce((acc, r) => acc + r.abundance, 0);

      if (othersSum <= 0.00001) {
        const evenShare = targetRemainder / others.length;
        return prev.map((r) =>
          r.id === id
            ? { ...r, abundance: Number(clamped.toFixed(4)) }
            : { ...r, abundance: Number(evenShare.toFixed(4)) }
        );
      }

      return prev.map((r) => {
        if (r.id === id) {
          return { ...r, abundance: Number(clamped.toFixed(4)) };
        }
        const scaled = (r.abundance / othersSum) * targetRemainder;
        return { ...r, abundance: Number(scaled.toFixed(4)) };
      });
    });
  };

  const handleExactMassChange = (id: string, rawValue: number) => {
    if (!Number.isFinite(rawValue) || rawValue <= 0) return;
    setActivePresetId('custom');
    setRows((prev) => prev.map((r) => (r.id === id ? { ...r, exactMass: rawValue } : r)));
  };

  const handleNormalizeAll = () => {
    setRows((prev) => {
      const sum = prev.reduce((acc, r) => acc + Math.max(0, r.abundance), 0);
      if (sum <= 0) {
        const even = Number((100 / Math.max(1, prev.length)).toFixed(4));
        return prev.map((r) => ({ ...r, abundance: even }));
      }
      return prev.map((r) => ({
        ...r,
        abundance: Number(((Math.max(0, r.abundance) / sum) * 100).toFixed(4)),
      }));
    });
  };

  const handleAddCustomIsotope = (e: React.FormEvent) => {
    e.preventDefault();
    const massNum = parseInt(customMassNumber, 10);
    const exactM = parseFloat(customExactMass);
    const abund = parseFloat(customAbundance);

    if (!Number.isFinite(massNum) || massNum < element.atomicNumber) {
      setFormError(`Mass number A must be at least Z (${element.atomicNumber}).`);
      return;
    }
    if (!Number.isFinite(exactM) || exactM <= 0) {
      setFormError('Enter a valid positive isotopic mass in u.');
      return;
    }
    if (!Number.isFinite(abund) || abund < 0 || abund > 100) {
      setFormError('Abundance must be between 0% and 100%.');
      return;
    }
    if (rows.some((r) => r.massNumber === massNum)) {
      setFormError(`${element.symbol}-${massNum} is already in the table.`);
      return;
    }

    setFormError(null);
    setActivePresetId('custom');

    setRows((prev) => {
      const nextColor = ISOTOPE_COLORS[prev.length % ISOTOPE_COLORS.length];
      const newRow: IsotopeRowState = {
        id: `custom-${element.atomicNumber}-${massNum}-${Date.now()}`,
        massNumber: massNum,
        exactMass: exactM,
        abundance: Number(abund.toFixed(4)),
        isCustom: true,
        color: nextColor,
      };

      if (!autoNormalize || prev.length === 0) {
        return [...prev, newRow];
      }

      const remainder = Math.max(0, 100 - abund);
      const prevSum = prev.reduce((acc, r) => acc + r.abundance, 0);
      const rescaled =
        prevSum > 0
          ? prev.map((r) => ({
              ...r,
              abundance: Number(((r.abundance / prevSum) * remainder).toFixed(4)),
            }))
          : prev;
      return [...rescaled, newRow];
    });

    setShowAddForm(false);
  };

  const handleRemoveRow = (id: string) => {
    setActivePresetId('custom');
    setRows((prev) => {
      const remaining = prev.filter((r) => r.id !== id);
      if (autoNormalize && remaining.length > 0) {
        const sum = remaining.reduce((acc, r) => acc + r.abundance, 0);
        if (sum > 0) {
          return remaining.map((r) => ({
            ...r,
            abundance: Number(((r.abundance / sum) * 100).toFixed(4)),
          }));
        }
      }
      return remaining;
    });
  };

  const metrics = useMemo(() => {
    const totalAbundance = rows.reduce((acc, r) => acc + Math.max(0, r.abundance), 0);
    const rawWeightedSum = rows.reduce(
      (acc, r) => acc + (Math.max(0, r.abundance) / 100) * r.exactMass,
      0
    );
    const normalizedWeightedMass =
      totalAbundance > 0 ? (rawWeightedSum / totalAbundance) * 100 : 0;

    const isValidSum = Math.abs(totalAbundance - 100) <= 0.05;
    const displayedMass = isValidSum ? rawWeightedSum : normalizedWeightedMass;
    const standardMass = element.atomicMass;
    const deltaMass = displayedMass - standardMass;
    const percentDeviation = standardMass > 0 ? (deltaMass / standardMass) * 100 : 0;

    return {
      totalAbundance,
      rawWeightedSum,
      normalizedWeightedMass,
      displayedMass,
      standardMass,
      deltaMass,
      percentDeviation,
      isValidSum,
    };
  }, [rows, element.atomicMass]);

  const activePresetMeta = presets.find((p) => p.id === activePresetId);

  return (
    <div className="p-4 sm:p-5 rounded-2xl bg-slate-900/80 border border-slate-800 shadow-lg space-y-4">
      {/* Header Row */}
      <div className="flex flex-wrap items-start justify-between gap-3 border-b border-slate-800/80 pb-3.5">
        <div>
          <h4 className="text-xs font-extrabold text-cyan-400 uppercase tracking-wider flex items-center gap-2">
            <Calculator className="w-4 h-4" /> Weighted Atomic Mass &amp; Enrichment Calculator
          </h4>
          <p className="text-xs text-slate-400 mt-1">
            Computes <span className="font-mono text-slate-300">Ar = Σ (fᵢ × mᵢ)</span> using exact IUPAC / AME2020 isotopic masses for {element.name}.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <label className="flex items-center gap-2 px-2.5 py-1.5 rounded-xl bg-slate-950 border border-slate-800 text-xs font-semibold text-slate-300 cursor-pointer select-none">
            <input
              type="checkbox"
              checked={autoNormalize}
              onChange={(e) => setAutoNormalize(e.target.checked)}
              className="accent-cyan-500 cursor-pointer"
            />
            <span>Auto-Normalize 100%</span>
          </label>
          <button
            type="button"
            onClick={() => applyPreset('natural-ciaaw')}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-950 hover:bg-slate-800 border border-slate-800 text-xs font-bold text-slate-300 transition-colors cursor-pointer"
          >
            <RotateCcw className="w-3.5 h-3.5" /> Reset Natural
          </button>
        </div>
      </div>

      {/* Presets Strip */}
      <div className="space-y-2">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
            <FlaskConical className="w-3.5 h-3.5 text-purple-400" /> Enrichment &amp; Calibration Presets
          </span>
          {activePresetMeta && (
            <span className="text-[11px] text-slate-400">{activePresetMeta.description}</span>
          )}
        </div>
        <div className="flex flex-wrap gap-1.5">
          {presets.map((preset) => {
            const active = activePresetId === preset.id;
            return (
              <button
                key={preset.id}
                type="button"
                onClick={() => applyPreset(preset.id)}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold border transition-all cursor-pointer ${
                  active
                    ? 'bg-cyan-500 text-slate-950 border-cyan-400 shadow-sm'
                    : 'bg-slate-950 text-slate-300 border-slate-800 hover:border-cyan-500/40'
                }`}
              >
                {preset.label}
              </button>
            );
          })}
        </div>
      </div>

      {/* Live Weighted Atomic Mass Readout */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <div className="p-3.5 rounded-xl bg-slate-950 border border-cyan-500/30 space-y-1">
          <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">
            Calculated Atomic Mass (Ar)
          </span>
          <div className="flex items-baseline gap-1.5">
            <span className="text-2xl font-mono font-black tabular-nums text-cyan-300">
              {metrics.displayedMass.toFixed(4)}
            </span>
            <span className="text-xs font-mono text-slate-400">u</span>
          </div>
          {!metrics.isValidSum && (
            <span className="text-[10px] font-mono text-amber-400 block">
              Normalized projection (raw sum {metrics.rawWeightedSum.toFixed(4)} u)
            </span>
          )}
        </div>

        <div className="p-3.5 rounded-xl bg-slate-950 border border-slate-800 space-y-1">
          <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">
            IUPAC Standard Mass · Δm
          </span>
          <div className="flex items-baseline gap-2">
            <span className="text-lg font-mono font-bold tabular-nums text-slate-200">
              {metrics.standardMass.toFixed(4)} u
            </span>
            <span
              className={`text-xs font-mono font-bold tabular-nums ${
                Math.abs(metrics.deltaMass) < 0.005
                  ? 'text-emerald-400'
                  : metrics.deltaMass > 0
                    ? 'text-amber-400'
                    : 'text-cyan-400'
              }`}
            >
              {metrics.deltaMass >= 0 ? '+' : ''}
              {metrics.deltaMass.toFixed(4)} u ({metrics.percentDeviation >= 0 ? '+' : ''}
              {metrics.percentDeviation.toFixed(2)}%)
            </span>
          </div>
        </div>

        <div
          className={`p-3.5 rounded-xl bg-slate-950 border space-y-1 ${
            metrics.isValidSum ? 'border-emerald-500/30' : 'border-amber-500/40'
          }`}
        >
          <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">
            Total Abundance Validation
          </span>
          <div className="flex items-center justify-between gap-2">
            <span
              className={`text-lg font-mono font-extrabold tabular-nums flex items-center gap-1.5 ${
                metrics.isValidSum ? 'text-emerald-400' : 'text-amber-400'
              }`}
            >
              {metrics.isValidSum ? (
                <CheckCircle2 className="w-4 h-4 shrink-0" />
              ) : (
                <AlertTriangle className="w-4 h-4 shrink-0" />
              )}
              {metrics.totalAbundance.toFixed(3)}%
            </span>
            {!metrics.isValidSum && (
              <button
                type="button"
                onClick={handleNormalizeAll}
                className="px-2.5 py-1 rounded-lg bg-amber-500 hover:bg-amber-400 text-slate-950 text-[11px] font-extrabold transition-colors cursor-pointer"
              >
                Normalize
              </button>
            )}
          </div>
          <span className="text-[10px] text-slate-400 block">
            {metrics.isValidSum ? 'Exact 100.0% stoichiometric balance' : 'Sum differs from 100.000%'}
          </span>
        </div>
      </div>

      {/* Isotope Rows Table */}
      <div className="space-y-2.5">
        {rows.map((row) => {
          const effectiveFraction =
            metrics.totalAbundance > 0
              ? Math.max(0, row.abundance) / (metrics.isValidSum ? 100 : metrics.totalAbundance)
              : 0;
          const contribution = effectiveFraction * row.exactMass;

          return (
            <div
              key={row.id}
              className="p-3 rounded-xl bg-slate-950 border border-slate-800 space-y-2"
            >
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div className="flex items-center gap-2.5">
                  <span
                    className="w-3 h-3 rounded-sm shrink-0"
                    style={{ backgroundColor: row.color }}
                  />
                  <span className="font-mono font-extrabold text-sm text-white">
                    {element.symbol}-{row.massNumber}
                  </span>
                  {row.isCustom && (
                    <span className="text-[10px] font-bold uppercase text-purple-300">
                      Custom Nuclide
                    </span>
                  )}
                </div>

                <div className="flex flex-wrap items-center gap-3 text-xs font-mono tabular-nums">
                  <label className="flex items-center gap-1.5 text-slate-400">
                    <span>Mass (u):</span>
                    <input
                      type="number"
                      step="0.0001"
                      min="0.5"
                      value={row.exactMass}
                      onChange={(e) => handleExactMassChange(row.id, parseFloat(e.target.value))}
                      className="w-24 px-2 py-1 rounded-lg bg-slate-900 border border-slate-700 text-slate-100 text-right font-mono text-xs focus:outline-none focus:border-cyan-500"
                    />
                  </label>

                  <label className="flex items-center gap-1.5 text-slate-400">
                    <span>Abund (%):</span>
                    <input
                      type="number"
                      step="0.01"
                      min="0"
                      max="100"
                      value={Number(row.abundance.toFixed(4))}
                      onChange={(e) => handleAbundanceChange(row.id, parseFloat(e.target.value))}
                      className="w-22 px-2 py-1 rounded-lg bg-slate-900 border border-slate-700 text-cyan-300 font-bold text-right font-mono text-xs focus:outline-none focus:border-cyan-500"
                    />
                  </label>

                  <span className="text-slate-300 min-w-[105px] text-right">
                    Contrib: <strong className="text-emerald-400">{contribution.toFixed(4)} u</strong>
                  </span>

                  {(row.isCustom || rows.length > 1) && (
                    <button
                      type="button"
                      onClick={() => handleRemoveRow(row.id)}
                      title={`Remove ${element.symbol}-${row.massNumber}`}
                      className="p-1 rounded-lg text-slate-400 hover:text-rose-400 hover:bg-slate-800 transition-colors cursor-pointer"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>
              </div>

              <input
                type="range"
                min="0"
                max="100"
                step="0.05"
                value={row.abundance}
                onChange={(e) => handleAbundanceChange(row.id, parseFloat(e.target.value))}
                aria-label={`${element.symbol}-${row.massNumber} abundance percentage`}
                className="w-full accent-cyan-400 cursor-pointer"
              />
            </div>
          );
        })}
      </div>

      {/* Add Custom Nuclide Row */}
      <div className="pt-1 flex flex-col gap-3">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <button
            type="button"
            onClick={() => setShowAddForm((v) => !v)}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-950 hover:bg-slate-800 border border-slate-800 text-xs font-bold text-cyan-300 transition-colors cursor-pointer"
          >
            <Plus className="w-3.5 h-3.5" />
            {showAddForm ? 'Cancel Custom Nuclide' : `Add Custom ${element.symbol} Isotope`}
          </button>

          <span className="text-[11px] text-slate-400 flex items-center gap-1.5 font-mono">
            <Scale className="w-3.5 h-3.5 text-slate-400" />
            Formula: Ar = Σ (Abundance% / 100) × Isotopic Mass (u)
          </span>
        </div>

        {showAddForm && (
          <form
            onSubmit={handleAddCustomIsotope}
            className="p-3.5 rounded-xl bg-slate-950 border border-cyan-500/30 grid grid-cols-1 sm:grid-cols-4 gap-3 items-end"
          >
            <div>
              <label className="text-[10px] font-bold uppercase text-slate-400 block mb-1">
                Mass Number (A)
              </label>
              <input
                type="number"
                value={customMassNumber}
                onChange={(e) => setCustomMassNumber(e.target.value)}
                min={element.atomicNumber}
                className="w-full px-2.5 py-1.5 rounded-lg bg-slate-900 border border-slate-700 text-xs font-mono text-white focus:outline-none focus:border-cyan-500"
                required
              />
            </div>
            <div>
              <label className="text-[10px] font-bold uppercase text-slate-400 block mb-1">
                Exact Mass (u)
              </label>
              <input
                type="number"
                step="0.0001"
                value={customExactMass}
                onChange={(e) => setCustomExactMass(e.target.value)}
                className="w-full px-2.5 py-1.5 rounded-lg bg-slate-900 border border-slate-700 text-xs font-mono text-white focus:outline-none focus:border-cyan-500"
                required
              />
            </div>
            <div>
              <label className="text-[10px] font-bold uppercase text-slate-400 block mb-1">
                Abundance (%)
              </label>
              <input
                type="number"
                step="0.01"
                min="0"
                max="100"
                value={customAbundance}
                onChange={(e) => setCustomAbundance(e.target.value)}
                className="w-full px-2.5 py-1.5 rounded-lg bg-slate-900 border border-slate-700 text-xs font-mono text-white focus:outline-none focus:border-cyan-500"
                required
              />
            </div>
            <button
              type="submit"
              className="px-3 py-2 rounded-lg bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-extrabold text-xs transition-colors cursor-pointer"
            >
              Add Nuclide
            </button>
            {formError && (
              <p className="sm:col-span-4 text-xs text-rose-400 font-semibold">{formError}</p>
            )}
          </form>
        )}
      </div>
    </div>
  );
};
