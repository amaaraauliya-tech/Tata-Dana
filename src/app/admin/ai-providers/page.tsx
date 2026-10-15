'use client';

// ==============================================================================
// TataDana Admin AI Provider Engine (/admin/ai-providers)
// Manage Gemini, OpenAI, DeepSeek, Toggle Single vs Parallel Failover Mode,
// Configure API Keys & Priority Execution Flow
// ==============================================================================

import React, { useState } from 'react';
import { tataDanaDb } from '@/lib/mock-db';
import { AIProviderName, AIFailoverMode } from '@/types/database';
import {
  Cpu,
  ShieldCheck,
  Check,
  Key,
  Layers,
  Sparkles,
  Save,
  RefreshCw,
  Zap,
  Radio,
  CheckCircle2,
  AlertTriangle
} from 'lucide-react';

export default function AdminAIProvidersPage() {
  const [providers, setProviders] = useState(tataDanaDb.getAIProviders());
  const [settings, setSettings] = useState(tataDanaDb.getAISettings());
  const [savedSuccess, setSavedSuccess] = useState(false);

  const handleToggleActive = (providerName: AIProviderName) => {
    const prov = providers.find((p) => p.provider_name === providerName);
    if (prov) {
      prov.is_active = !prov.is_active;
      tataDanaDb.saveAIProvider(prov);
      setProviders([...tataDanaDb.getAIProviders()]);
    }
  };

  const handleUpdateKey = (providerName: AIProviderName, keyVal: string) => {
    const prov = providers.find((p) => p.provider_name === providerName);
    if (prov) {
      prov.api_key_enc = keyVal;
      tataDanaDb.saveAIProvider(prov);
      setProviders([...tataDanaDb.getAIProviders()]);
    }
  };

  const handleModeChange = (mode: AIFailoverMode) => {
    const updated = tataDanaDb.updateAISettings({ mode });
    setSettings({ ...updated });
    setSavedSuccess(true);
    setTimeout(() => setSavedSuccess(false), 2500);
  };

  const handlePrimaryChange = (provider: AIProviderName) => {
    const updated = tataDanaDb.updateAISettings({ primary_provider: provider });
    setSettings({ ...updated });
    setSavedSuccess(true);
    setTimeout(() => setSavedSuccess(false), 2500);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-slate-800">
        <div>
          <div className="flex items-center gap-2">
            <span className="px-2 py-0.5 rounded text-[10px] font-black uppercase font-mono bg-indigo-500/20 text-indigo-300 border border-indigo-500/40">
              AI ENGINE & FAILOVER ROUTING
            </span>
            <span className="text-[11px] font-mono text-emerald-400 flex items-center gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" /> 3 Providers Loaded
            </span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-black text-white tracking-tight mt-1">
            AI Provider Engine 🤖
          </h1>
          <p className="text-xs text-slate-400 mt-0.5">
            Konfigurasi multi-provider (Gemini, OpenAI, DeepSeek), switch mode single vs paralel failover, dan audit enkripsi kunci API.
          </p>
        </div>
      </div>

      {savedSuccess && (
        <div className="p-3.5 bg-emerald-950/80 border border-emerald-500/60 rounded-2xl text-xs font-bold text-emerald-300 flex items-center gap-2 animate-in fade-in">
          <CheckCircle2 className="w-4 h-4 text-emerald-400" />
          Konfigurasi AI Provider & mode failover berhasil disimpan dan diterapkan seketika ke seluruh instance sistem!
        </div>
      )}

      {/* Mode Selector Card */}
      <div className="bg-slate-900/90 p-6 rounded-2xl border border-slate-800 shadow-xl space-y-4">
        <div>
          <h2 className="text-sm font-bold text-white flex items-center gap-2">
            <Layers className="w-4 h-4 text-indigo-400" /> Mode Eksekusi Failover Multi-Provider (Part 2)
          </h2>
          <p className="text-xs text-slate-400 mt-1">
            Pilih strategi orkestrasinya: Mode single (hanya 1 provider hemat biaya) atau Mode paralel failover (auto-switch dalam &lt;1 detik jika provider utama rate-limited/down).
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-1">
          <button
            type="button"
            onClick={() => handleModeChange('single')}
            className={`p-4 rounded-xl border-2 text-left transition ${
              settings.mode === 'single'
                ? 'border-indigo-500 bg-indigo-950/40 text-white shadow-lg shadow-indigo-900/30'
                : 'border-slate-800 bg-slate-800/50 hover:border-slate-700 text-slate-400 hover:text-slate-200'
            }`}
          >
            <div className="flex items-center justify-between mb-1">
              <div className="font-black text-xs text-white">Mode Single (Provider Tunggal)</div>
              {settings.mode === 'single' && (
                <span className="text-[10px] font-mono font-bold bg-indigo-500 text-white px-2 py-0.5 rounded">
                  AKTIF
                </span>
              )}
            </div>
            <p className="text-[11px] text-slate-400 mt-1 leading-relaxed">
              Hanya mengeksekusi provider primer yang dipilih. Cocok untuk environment testing atau efisiensi biaya kuota API.
            </p>
          </button>

          <button
            type="button"
            onClick={() => handleModeChange('parallel')}
            className={`p-4 rounded-xl border-2 text-left transition ${
              settings.mode === 'parallel'
                ? 'border-indigo-500 bg-indigo-950/40 text-white shadow-lg shadow-indigo-900/30'
                : 'border-slate-800 bg-slate-800/50 hover:border-slate-700 text-slate-400 hover:text-slate-200'
            }`}
          >
            <div className="flex items-center justify-between mb-1">
              <div className="font-black text-xs text-white flex items-center gap-1.5">
                <span>⚡ Mode Paralel Failover</span>
                <span className="text-[10px] text-emerald-400 font-normal">(Rekomendasi Production)</span>
              </div>
              {settings.mode === 'parallel' && (
                <span className="text-[10px] font-mono font-bold bg-indigo-500 text-white px-2 py-0.5 rounded">
                  AKTIF
                </span>
              )}
            </div>
            <p className="text-[11px] text-slate-400 mt-1 leading-relaxed">
              Otomatis fallback seketika ke provider cadangan (OpenAI / DeepSeek) jika Gemini mengalami error/timeout. Menjamin uptime bot 99.9%.
            </p>
          </button>
        </div>
      </div>

      {/* Providers List & Key Config */}
      <div className="space-y-4">
        <h2 className="text-sm font-bold text-white flex items-center gap-2">
          <Key className="w-4 h-4 text-indigo-400" /> Daftar Provider AI & Enkripsi Kunci API
        </h2>

        <div className="grid grid-cols-1 gap-4">
          {providers.map((prov) => {
            const isPrimary = settings.primary_provider === prov.provider_name;
            return (
              <div
                key={prov.id}
                className={`bg-slate-900/90 p-5 rounded-2xl border shadow-xl flex flex-col md:flex-row md:items-center justify-between gap-4 transition ${
                  isPrimary
                    ? 'border-indigo-500/80 bg-gradient-to-r from-slate-900 via-indigo-950/20 to-slate-900'
                    : 'border-slate-800'
                }`}
              >
                <div className="space-y-1">
                  <div className="flex items-center gap-2.5">
                    <span className="text-base font-black uppercase text-white tracking-wider">
                      {prov.provider_name}
                    </span>
                    <span className="text-xs font-mono text-indigo-300 bg-indigo-950/70 border border-indigo-800/60 px-2 py-0.5 rounded-full">
                      Model: {prov.model_name}
                    </span>
                    {isPrimary && (
                      <span className="text-[10px] font-black bg-indigo-500 text-white px-2 py-0.5 rounded-full shadow">
                        ★ PRIMARY PROVIDER
                      </span>
                    )}
                  </div>
                  <div className="text-xs text-slate-400 font-mono">
                    Urutan Prioritas: #{prov.priority} • Status:{' '}
                    <strong className={prov.is_active ? 'text-emerald-400' : 'text-slate-500'}>
                      {prov.is_active ? '● Aktif Siap Eksekusi' : '○ Dinonaktifkan'}
                    </strong>
                  </div>
                </div>

                <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 w-full md:w-auto">
                  <div className="relative">
                    <input
                      type="password"
                      defaultValue={prov.api_key_enc}
                      onBlur={(e) => handleUpdateKey(prov.provider_name, e.target.value)}
                      placeholder="API Key terenkripsi..."
                      className="px-3 py-2 text-xs font-mono rounded-xl border border-slate-700 bg-slate-800 text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500 min-w-[220px]"
                    />
                  </div>

                  {!isPrimary && (
                    <button
                      onClick={() => handlePrimaryChange(prov.provider_name)}
                      className="px-3.5 py-2 text-xs font-bold rounded-xl border border-indigo-600/70 text-indigo-300 hover:bg-indigo-900/40 transition whitespace-nowrap"
                    >
                      Jadikan Primary
                    </button>
                  )}

                  <button
                    onClick={() => handleToggleActive(prov.provider_name)}
                    className={`px-3.5 py-2 text-xs font-bold rounded-xl transition whitespace-nowrap ${
                      prov.is_active
                        ? 'bg-emerald-950 text-emerald-300 border border-emerald-800 hover:bg-emerald-900'
                        : 'bg-slate-800 text-slate-400 border border-slate-700 hover:bg-slate-700'
                    }`}
                  >
                    {prov.is_active ? 'Nonaktifkan' : 'Aktifkan'}
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
