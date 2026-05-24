'use client';
import { useRef } from 'react';
import { UploadCloud, Scan, ShieldAlert, CheckCircle, Inbox, Archive, FileText, Image, PlusCircle, Trash2, Activity, FileBarChart } from 'lucide-react';
import type { ScannedDocument } from '@/lib/types';

interface ScanReport {
  unrecorded: number;
  pendingUSD: number;
  pendingZiG: number;
}

interface Props {
  documents: ScannedDocument[];
  isDragging: boolean;
  setIsDragging: (v: boolean) => void;
  uploadStatus: 'scanning' | 'verify' | 'done' | null;
  scanLog: string;
  scanReport: ScanReport;
  isViewer: boolean;
  onFileSelected: (file: File) => void;
  onPostDoc: (doc: ScannedDocument) => void;
  onDeleteDoc: (id: string) => void;
}

export default function VaultTab({
  documents, isDragging, setIsDragging, uploadStatus, scanLog,
  scanReport, isViewer, onFileSelected, onPostDoc, onDeleteDoc,
}: Props) {
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    if (isViewer) return;
    if (e.dataTransfer.files?.[0]) onFileSelected(e.dataTransfer.files[0]);
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
      {/* Upload panel */}
      <div className="lg:col-span-5 space-y-6">
        <div className={`glass-panel p-8 rounded-[2rem] ${isViewer ? 'opacity-70 pointer-events-none' : ''}`}>
          <h2 className="font-display font-black text-xl text-blue-300 uppercase mb-2 flex items-center gap-2">
            <UploadCloud size={24} /> Document Upload
          </h2>
          <p className="text-xs text-slate-400 mb-6">Upload receipts, invoices, or SI-60 declarations for AI scanning.</p>

          <div
            className={`relative w-full h-48 border-2 border-dashed rounded-2xl flex flex-col items-center justify-center cursor-pointer transition-all duration-300 overflow-hidden ${isDragging ? 'drop-zone-active' : 'border-blue-500/40 bg-blue-900/10 hover:border-blue-400 hover:bg-blue-900/20'} ${uploadStatus === 'scanning' ? 'scanning' : ''}`}
            onDragOver={e => { e.preventDefault(); if (!isViewer) setIsDragging(true); }}
            onDragLeave={() => setIsDragging(false)}
            onDrop={handleDrop}
            onClick={() => { if (!isViewer) fileInputRef.current?.click(); }}
          >
            <div className="scan-line" />
            <input
              ref={fileInputRef}
              type="file"
              className="hidden"
              accept=".pdf,.png,.jpg,.jpeg"
              disabled={isViewer}
              onChange={e => { if (e.target.files?.[0]) onFileSelected(e.target.files[0]); }}
            />

            {uploadStatus === 'scanning' && (
              <div className="text-center space-y-3 z-10">
                <Scan size={40} className="text-blue-400 mx-auto animate-pulse" />
                <p className="font-mono text-xs text-blue-300">Processing Document...</p>
              </div>
            )}
            {uploadStatus === 'verify' && (
              <div className="text-center space-y-3 z-10">
                <ShieldAlert size={40} className="text-amber-400 mx-auto animate-pulse" />
                <p className="font-mono text-xs text-amber-400 font-bold">Verification Required</p>
              </div>
            )}
            {uploadStatus === 'done' && (
              <div className="text-center space-y-3 z-10">
                <CheckCircle size={40} className="text-emerald-400 mx-auto" />
                <p className="font-mono text-xs text-emerald-400 font-bold">Successfully Verified</p>
              </div>
            )}
            {!uploadStatus && (
              <div className="text-center space-y-3 z-10 pointer-events-none">
                <div className="bg-blue-500/20 p-3 rounded-full inline-block">
                  <FileText size={32} className="text-blue-400" />
                </div>
                <div>
                  <p className="text-sm font-bold text-white">Click or drag file here</p>
                  <p className="text-[10px] text-slate-400 mt-1">PDF, JPG, PNG up to 10MB</p>
                </div>
              </div>
            )}
          </div>

          {uploadStatus && (
            <div className="mt-6 p-4 bg-slate-900/50 border border-blue-500/20 rounded-xl">
              <p className="font-mono text-[10px] text-blue-400 mb-2 uppercase tracking-wider flex items-center gap-2">
                <Activity size={12} /> Live Scan Log
              </p>
              <p className={`font-mono text-xs ${uploadStatus === 'done' ? 'text-emerald-300 font-bold' : 'text-slate-300 animate-pulse'}`}>
                {scanLog}
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Vault list */}
      <div className="lg:col-span-7">
        <div className="glass-panel p-8 rounded-[2rem] h-full min-h-[500px] flex flex-col">
          <div className="flex justify-between items-center mb-6">
            <h2 className="font-display font-black text-xl text-blue-300 uppercase flex items-center gap-2">
              <Archive size={24} /> Smart Vault
            </h2>
            <span className="bg-blue-600/30 text-blue-300 text-[10px] font-mono px-3 py-1 rounded-full">{documents.length} Files</span>
          </div>

          <div className="mb-6 p-5 bg-gradient-to-r from-blue-900/40 to-blue-800/20 border border-blue-500/30 rounded-2xl">
            <h3 className="font-mono text-sm text-blue-300 mb-3 flex items-center gap-2"><FileBarChart size={16} /> OCR Scan Analysis Report</h3>
            <div className="grid grid-cols-3 gap-4">
              <div>
                <p className="text-[10px] text-slate-400 uppercase">Pending Review</p>
                <p className="text-xl font-black text-amber-400">{scanReport.unrecorded} Docs</p>
              </div>
              <div>
                <p className="text-[10px] text-slate-400 uppercase">Unrecorded USD</p>
                <p className="text-xl font-black text-emerald-400">${scanReport.pendingUSD.toFixed(2)}</p>
              </div>
              <div>
                <p className="text-[10px] text-slate-400 uppercase">Unrecorded ZiG</p>
                <p className="text-xl font-black text-amber-400">Zg {scanReport.pendingZiG.toFixed(2)}</p>
              </div>
            </div>
          </div>

          <div className="flex-1 overflow-y-auto space-y-4 pr-2">
            {documents.length === 0 ? (
              <div className="h-full flex flex-col items-center justify-center text-slate-500 space-y-4">
                <Inbox size={48} className="opacity-50" />
                <p className="font-mono text-sm">Vault is empty. Upload documents to scan.</p>
              </div>
            ) : documents.map(doc => (
              <div key={doc.id} className="p-4 bg-blue-900/20 border border-blue-500/20 rounded-xl hover:border-blue-500/50 transition-colors flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className="p-3 bg-blue-500/10 rounded-lg text-blue-400">
                    {doc.type === 'PDF' ? <FileText size={24} /> : <Image size={24} />}
                  </div>
                  <div>
                    <p className="font-bold text-sm text-slate-200 line-clamp-1">{doc.name}</p>
                    <div className="flex items-center gap-3 mt-1 font-mono text-[9px] text-slate-400">
                      <span>{doc.date}</span><span>•</span><span>{doc.size}</span>
                    </div>
                    {!doc.isRecorded ? (
                      <div className="flex gap-2 mt-2">
                        <button disabled={isViewer} onClick={() => onPostDoc(doc)}
                          className="bg-emerald-600/20 hover:bg-emerald-600/40 text-emerald-400 border border-emerald-500/30 px-3 py-1.5 rounded-lg text-[10px] font-mono uppercase font-bold flex items-center gap-1 transition-colors disabled:opacity-50 disabled:cursor-not-allowed">
                          <PlusCircle size={12} /> Post
                        </button>
                        <button disabled={isViewer} onClick={() => onDeleteDoc(doc.id)}
                          className="bg-rose-600/20 hover:bg-rose-600/40 text-rose-400 border border-rose-500/30 px-3 py-1.5 rounded-lg text-[10px] font-mono uppercase font-bold flex items-center gap-1 transition-colors disabled:opacity-50 disabled:cursor-not-allowed">
                          <Trash2 size={12} /> Clear
                        </button>
                      </div>
                    ) : (
                      <div className="flex items-center gap-2 mt-2">
                        <span className="inline-flex items-center gap-1 px-2 py-1.5 bg-blue-500/20 text-blue-300 rounded text-[9px] font-mono uppercase border border-blue-500/20">
                          <CheckCircle size={10} /> Logged
                        </span>
                        <button disabled={isViewer} onClick={() => onDeleteDoc(doc.id)}
                          className="bg-rose-600/20 hover:bg-rose-600/40 text-rose-400 border border-rose-500/30 px-2 py-1.5 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed">
                          <Trash2 size={12} />
                        </button>
                      </div>
                    )}
                  </div>
                </div>
                {doc.extractedData && (
                  <div className="text-right shrink-0 ml-4">
                    <p className="font-mono text-[8px] text-amber-400 uppercase tracking-widest mb-1">Verified Data</p>
                    <p className="font-mono font-black text-lg text-emerald-400">{doc.extractedData.currency} {doc.extractedData.amount}</p>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
