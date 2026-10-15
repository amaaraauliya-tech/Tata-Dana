'use client';

// ==============================================================================
// TataDana Admin AI Request Logs (/admin/ai-logs)
// Audit Log, Latency Performance, Prompt/Completion Tokens, Failover Tracking, & Cost
// ==============================================================================

import React, { useState } from 'react';
import { tataDanaDb } from '@/lib/mock-db';
import {
  FileCode,
  CheckCircle2,
  AlertTriangle,
  Clock,
  Sparkles,
  Coins,
  Cpu,
  Layers,
  Filter
} from 'lucide-react';

export default function AdminAILogsPage() {
  const [logs, setLogs] = useState(tataDanaDb.getAILogs());
  const [statusFilter, setStatusFilter] = useState<'all' | 'success' | 'fallback' | 'failed'>('all');

  const totalPromptTokens = logs.reduce((acc, l) => acc + l.prompt_tokens, 0);
  const totalCompletionTokens = logs.reduce((acc, l) => acc + l.completion_tokens, 0);
  const totalTokens = totalPromptTokens + totalCompletionTokens;
  const avgLatency =
    logs.length > 0 ? Math.round(logs.reduce((acc, l) => acc + l.latency_ms, 0) / logs.length) : 0;

  // Estimated cost in IDR (~ Rp250 / 1K tokens)
  const estimatedCostIDR = Math.round((totalTokens / 1000) * 250);
  const fallbackCount = logs.filter((l) => l.status === 'fallback').length;

  const filteredLogs = logs.filter((l) => {
    if (statusFilter === 'all') return true;
    return l.status === statusFilter;
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-slate-800">
        <div>
          <div className="flex items-center gap-2">
            <span className="px-2 py-0.5 rounded text-[10px] font-black uppercase font-mono bg-indigo-500/20 text-indigo-300 border border-indigo-500/40">
              AI INFERENCE AUDIT & PERFORMANCE
            </span>
            <span className="text-[11px] font-mono text-cyan-400">
              {logs.length} Total Eksekusi
            </span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-black text-white tracking-tight mt-1">
            AI Request Logs & Latency 📊
          </h1>
          <p className="text-xs text-slate-400 mt-0.5">
            Audit pemanggilan LLM multi-provider (Gemini, OpenAI, DeepSeek), token in/out, waktu respon milidetik, dan jejak failover.
          </p>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-slate-900/90 border border-slate-800 p-5 rounded-2xl shadow-xl flex flex-col justify-between">
          <span className="text-[11px] font-black uppercase text-slate-400 tracking-wider">Total Token AI</span>
          <div className="text-2xl sm:text-3xl font-black text-white mt-2">
            {totalTokens.toLocaleString('id-ID')}
          </div>
          <div className="text-xs text-slate-400 font-mono mt-1">
            In: {totalPromptTokens} • Out: {totalCompletionTokens}
          </div>
        </div>

        <div className="bg-slate-900/90 border border-slate-800 p-5 rounded-2xl shadow-xl flex flex-col justify-between">
          <span className="text-[11px] font-black uppercase text-slate-400 tracking-wider">Rata-Rata Latensi</span>
          <div className="text-2xl sm:text-3xl font-black text-emerald-400 mt-2">
            {avgLatency} <span className="text-sm font-bold text-slate-400">ms</span>
          </div>
          <div className="text-xs text-slate-400 mt-1">Sangat responsif &lt;1.5s</div>
        </div>

        <div className="bg-slate-900/90 border border-slate-800 p-5 rounded-2xl shadow-xl flex flex-col justify-between">
          <span className="text-[11px] font-black uppercase text-slate-400 tracking-wider">Failover Incidents</span>
          <div className="text-2xl sm:text-3xl font-black text-amber-400 mt-2">
            {fallbackCount} <span className="text-sm font-bold text-slate-400">kali</span>
          </div>
          <div className="text-xs text-slate-400 mt-1">Otomatis dialihkan mulus</div>
        </div>

        <div className="bg-slate-900/90 border border-slate-800 p-5 rounded-2xl shadow-xl flex flex-col justify-between">
          <span className="text-[11px] font-black uppercase text-slate-400 tracking-wider">Estimasi Biaya API</span>
          <div className="text-2xl sm:text-3xl font-black text-indigo-300 mt-2">
            Rp{estimatedCostIDR.toLocaleString('id-ID')}
          </div>
          <div className="text-xs text-slate-400 mt-1">Optimal & efisien</div>
        </div>
      </div>

      {/* Filter Tabs */}
      <div className="bg-slate-900/90 p-3 rounded-2xl border border-slate-800 shadow-xl flex items-center justify-between gap-3 text-xs">
        <div className="flex items-center gap-2 overflow-x-auto">
          <button
            onClick={() => setStatusFilter('all')}
            className={`px-3 py-1.5 rounded-xl font-bold transition whitespace-nowrap ${
              statusFilter === 'all'
                ? 'bg-indigo-600 text-white shadow'
                : 'bg-slate-800 text-slate-400 hover:text-white'
            }`}
          >
            Semua Log ({logs.length})
          </button>
          <button
            onClick={() => setStatusFilter('success')}
            className={`px-3 py-1.5 rounded-xl font-bold transition whitespace-nowrap ${
              statusFilter === 'success'
                ? 'bg-emerald-600 text-white shadow'
                : 'bg-slate-800 text-slate-400 hover:text-white'
            }`}
          >
            ✓ Sukses ({logs.filter((l) => l.status === 'success').length})
          </button>
          <button
            onClick={() => setStatusFilter('fallback')}
            className={`px-3 py-1.5 rounded-xl font-bold transition whitespace-nowrap ${
              statusFilter === 'fallback'
                ? 'bg-amber-600 text-white shadow'
                : 'bg-slate-800 text-slate-400 hover:text-white'
            }`}
          >
            ⚡ Failover Fallback ({fallbackCount})
          </button>
        </div>

        <span className="text-[11px] text-slate-400 font-mono hidden sm:inline">
          Menampilkan {filteredLogs.length} request
        </span>
      </div>

      {/* Logs Table */}
      <div className="bg-slate-900/90 rounded-2xl border border-slate-800 shadow-xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="bg-slate-800/80 border-b border-slate-700 text-slate-300 font-bold uppercase tracking-wider text-[11px]">
                <th className="p-3.5">Waktu WIB</th>
                <th className="p-3.5">Pengguna</th>
                <th className="p-3.5">Operasi</th>
                <th className="p-3.5">Provider Chain</th>
                <th className="p-3.5">Token (In/Out)</th>
                <th className="p-3.5">Latensi</th>
                <th className="p-3.5 text-right">Status Audit</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800 font-mono">
              {filteredLogs.map((log) => (
                <tr key={log.id} className="hover:bg-slate-800/50 transition">
                  <td className="p-3.5 whitespace-nowrap text-slate-400">
                    {new Date(log.created_at).toLocaleTimeString('id-ID')} WIB
                  </td>
                  <td className="p-3.5 font-bold text-white whitespace-nowrap font-sans">
                    {log.user_name || 'Telegram User'}
                  </td>
                  <td className="p-3.5 text-indigo-300 whitespace-nowrap">
                    <span className="bg-indigo-950/70 border border-indigo-800/60 px-2 py-0.5 rounded text-[11px]">
                      {log.operation_type}
                    </span>
                  </td>
                  <td className="p-3.5 text-slate-300 whitespace-nowrap font-sans">
                    {log.provider}
                  </td>
                  <td className="p-3.5 text-slate-400 whitespace-nowrap">
                    {log.prompt_tokens} / {log.completion_tokens}
                  </td>
                  <td className="p-3.5 whitespace-nowrap font-bold text-emerald-400">
                    {log.latency_ms} ms
                  </td>
                  <td className="p-3.5 text-right whitespace-nowrap">
                    <span
                      className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-black uppercase font-mono ${
                        log.status === 'success'
                          ? 'bg-emerald-950 text-emerald-300 border border-emerald-800'
                          : log.status === 'fallback'
                          ? 'bg-amber-950 text-amber-300 border border-amber-800'
                          : 'bg-red-950 text-red-300 border border-red-800'
                      }`}
                    >
                      {log.status === 'success' ? '✓ SUCCESS' : log.status === 'fallback' ? '⚡ FAILOVER' : '✕ FAILED'}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
