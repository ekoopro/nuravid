import React, { useEffect, useState } from 'react';
import {
  X,
  KeyRound,
  ExternalLink,
  Eye,
  EyeOff,
  PlugZap,
  Save,
  ShieldCheck,
  Trash2,
  Loader2,
} from 'lucide-react';
import { playUiClick } from '../utils/audio';

interface AiProviderSetting {
  id: string;
  label: string;
  required: boolean;
  purpose: string;
  docsUrl: string;
  configured: boolean;
  maskedValue: string | null;
}

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSaved?: (hasRequiredKey: boolean) => void;
}

interface Feedback {
  type: 'success' | 'error' | 'info';
  message: string;
}

export const SettingsModal: React.FC<SettingsModalProps> = ({ isOpen, onClose, onSaved }) => {
  const [providers, setProviders] = useState<AiProviderSetting[]>([]);
  const [drafts, setDrafts] = useState<Record<string, string>>({});
  const [clearIds, setClearIds] = useState<Record<string, boolean>>({});
  const [visible, setVisible] = useState<Record<string, boolean>>({});
  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [testingId, setTestingId] = useState<string | null>(null);
  const [feedback, setFeedback] = useState<Feedback | null>(null);

  const loadSettings = async () => {
    setIsLoading(true);
    setFeedback(null);
    try {
      const response = await fetch('/api/settings');
      const data = await response.json();
      if (!response.ok || !data.success) {
        throw new Error(data.error || 'Gagal memuat pengaturan API AI.');
      }
      setProviders(data.providers || []);
      setDrafts({});
      setClearIds({});
    } catch (err: any) {
      setFeedback({
        type: 'error',
        message: err?.message || 'Gagal memuat pengaturan API AI. Pastikan server berjalan.',
      });
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (isOpen) void loadSettings();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen]);

  const handleSave = async () => {
    const payload: Record<string, string> = {};
    for (const provider of providers) {
      const draft = (drafts[provider.id] || '').trim();
      if (draft) payload[provider.id] = draft;
      else if (clearIds[provider.id]) payload[provider.id] = '';
    }

    if (Object.keys(payload).length === 0) {
      setFeedback({ type: 'info', message: 'Belum ada perubahan untuk disimpan.' });
      return;
    }

    setIsSaving(true);
    setFeedback(null);
    try {
      const response = await fetch('/api/settings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      const data = await response.json();
      if (!response.ok || !data.success) {
        throw new Error(data.error || 'Gagal menyimpan pengaturan.');
      }
      setProviders(data.providers || []);
      setDrafts({});
      setClearIds({});
      setFeedback({ type: 'success', message: data.message || 'Pengaturan tersimpan.' });
      onSaved?.(Boolean(data.hasRequiredKey));
    } catch (err: any) {
      setFeedback({ type: 'error', message: err?.message || 'Gagal menyimpan pengaturan.' });
    } finally {
      setIsSaving(false);
    }
  };

  const handleTest = async (provider: AiProviderSetting) => {
    const draft = (drafts[provider.id] || '').trim();
    setTestingId(provider.id);
    setFeedback(null);
    try {
      const response = await fetch('/api/settings/test', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: provider.id, ...(draft ? { key: draft } : {}) }),
      });
      const data = await response.json();
      setFeedback({
        type: data.success ? 'success' : 'error',
        message: data.message || 'Hasil uji koneksi tidak tersedia.',
      });
    } catch (err: any) {
      setFeedback({ type: 'error', message: err?.message || 'Uji koneksi gagal dijalankan.' });
    } finally {
      setTestingId(null);
    }
  };

  if (!isOpen) return null;

  const feedbackStyles: Record<Feedback['type'], string> = {
    success: 'border-[#10b981]/50 bg-[#10b981]/10 text-[#10b981]',
    error: 'border-[#e50914]/50 bg-[#e50914]/10 text-[#ff6b6b]',
    info: 'border-[#808080]/40 bg-[#2d2d2d] text-[#b3b3b3]',
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-sm">
      <div className="relative w-full max-w-2xl max-h-[90vh] overflow-y-auto bg-[#232323] border border-[#808080]/40 rounded-[8px] shadow-2xl p-6 text-white">
        {/* Close Button */}
        <button
          onClick={() => {
            playUiClick();
            onClose();
          }}
          className="absolute top-4 right-4 p-2 rounded-[4px] bg-[#2d2d2d] hover:bg-[#383838] text-[#b3b3b3] hover:text-white transition-colors"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Modal Header */}
        <div className="mb-5 pr-10">
          <div className="flex items-center space-x-2 text-[#e50914] text-xs font-bold uppercase tracking-wider mb-1">
            <KeyRound className="w-4 h-4" />
            <span>Pengaturan API AI</span>
          </div>
          <h2 className="text-xl font-black text-white">Masukkan API Key yang Dibutuhkan</h2>
          <p className="text-xs text-[#b3b3b3] mt-1 leading-relaxed">
            Aplikasi ini memakai API AI untuk membuat naskah, gambar aset, dan voiceover. Isi key
            di bawah lalu tekan <span className="text-white font-semibold">Simpan Pengaturan</span>{' '}
            — key langsung aktif tanpa restart server dan tersimpan di berkas{' '}
            <code className="text-[#e50914]">.env</code> proyek.
          </p>
        </div>

        {/* Loading State */}
        {isLoading && (
          <div className="flex items-center justify-center gap-2 py-10 text-[#b3b3b3] text-xs">
            <Loader2 className="w-4 h-4 animate-spin" />
            <span>Memuat daftar API AI...</span>
          </div>
        )}

        {/* Provider Cards */}
        {!isLoading && (
          <div className="space-y-4">
            {providers.length === 0 && (
              <div className="text-xs text-[#808080] bg-[#2d2d2d] border border-[#808080]/30 rounded-[4px] p-4">
                Tidak ada API AI yang terdaftar di server.
              </div>
            )}

            {providers.map((provider) => {
              const draft = drafts[provider.id] || '';
              const willClear = Boolean(clearIds[provider.id]);
              const isTesting = testingId === provider.id;
              const isConfigured = provider.configured && !willClear;

              return (
                <div
                  key={provider.id}
                  className="bg-[#2d2d2d] border border-[#808080]/30 rounded-[8px] p-4"
                >
                  <div className="flex flex-wrap items-center justify-between gap-2 mb-1">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-bold text-white">{provider.label}</span>
                      <span
                        className={`text-[10px] font-black px-1.5 py-0.5 rounded-[2px] uppercase tracking-wider ${
                          provider.required
                            ? 'bg-[#e50914] text-white'
                            : 'bg-[#383838] text-[#b3b3b3]'
                        }`}
                      >
                        {provider.required ? 'Wajib' : 'Opsional'}
                      </span>
                    </div>
                    <span
                      className={`text-[11px] font-bold px-2 py-0.5 rounded-[2px] border ${
                        isConfigured
                          ? 'text-[#10b981] border-[#10b981]/40 bg-[#10b981]/10'
                          : 'text-[#ffd166] border-[#ffd166]/40 bg-[#ffd166]/10'
                      }`}
                    >
                      {isConfigured
                        ? `Terpasang${provider.maskedValue ? ` (${provider.maskedValue})` : ''}`
                        : willClear
                        ? 'Akan dihapus saat disimpan'
                        : 'Belum diisi'}
                    </span>
                  </div>

                  <p className="text-[11px] text-[#b3b3b3] mb-3 leading-relaxed">
                    {provider.purpose} · env: <code className="text-[#808080]">{provider.id}</code>
                  </p>
                  <div className="flex flex-col sm:flex-row gap-2">
                    <div className="relative flex-1">
                      <input
                        type={visible[provider.id] ? 'text' : 'password'}
                        value={draft}
                        onChange={(e) => {
                          setDrafts((prev) => ({ ...prev, [provider.id]: e.target.value }));
                          setClearIds((prev) => ({ ...prev, [provider.id]: false }));
                        }}
                        placeholder={
                          provider.configured && provider.maskedValue
                            ? `${provider.maskedValue} — tempel key baru untuk mengganti`
                            : `Tempel ${provider.id} di sini`
                        }
                        autoComplete="off"
                        spellCheck={false}
                        className="w-full bg-[#1e1e1e] border border-[#808080]/40 focus:border-[#e50914] outline-none rounded-[4px] px-3 py-2 pr-9 text-xs text-white placeholder:text-[#808080] font-mono transition-colors"
                      />
                      <button
                        type="button"
                        onClick={() =>
                          setVisible((prev) => ({ ...prev, [provider.id]: !prev[provider.id] }))
                        }
                        title={visible[provider.id] ? 'Sembunyikan key' : 'Tampilkan key'}
                        className="absolute right-2 top-1/2 -translate-y-1/2 text-[#808080] hover:text-white transition-colors"
                      >
                        {visible[provider.id] ? (
                          <EyeOff className="w-4 h-4" />
                        ) : (
                          <Eye className="w-4 h-4" />
                        )}
                      </button>
                    </div>

                    <div className="flex gap-2">
                      <button
                        onClick={() => {
                          playUiClick();
                          void handleTest(provider);
                        }}
                        disabled={isTesting}
                        className="flex items-center space-x-1 px-3 py-2 rounded-[4px] bg-[#383838] hover:bg-[#454545] text-xs font-semibold text-white border border-[#808080]/40 transition-colors disabled:opacity-50"
                      >
                        {isTesting ? (
                          <Loader2 className="w-3.5 h-3.5 animate-spin" />
                        ) : (
                          <PlugZap className="w-3.5 h-3.5 text-[#e50914]" />
                        )}
                        <span>Uji</span>
                      </button>

                      {provider.configured && (
                        <button
                          onClick={() => {
                            playUiClick();
                            setDrafts((prev) => ({ ...prev, [provider.id]: '' }));
                            setClearIds((prev) => ({ ...prev, [provider.id]: true }));
                          }}
                          title={`Hapus ${provider.label} dari .env`}
                          className="flex items-center px-3 py-2 rounded-[4px] bg-[#383838] hover:bg-[#e50914] text-[#b3b3b3] hover:text-white border border-[#808080]/40 transition-colors"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      )}
                    </div>
                  </div>

                  <a
                    href={provider.docsUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex items-center space-x-1 mt-2 text-[11px] text-[#e50914] hover:underline"
                  >
                    <ExternalLink className="w-3 h-3" />
                    <span>Dapatkan API key: {new URL(provider.docsUrl).hostname}</span>
                  </a>
                </div>
              );
            })}
          </div>
        )}

        {/* Feedback */}
        {feedback && (
          <div
            className={`mt-4 px-3 py-2 rounded-[4px] border text-xs leading-relaxed ${feedbackStyles[feedback.type]}`}
          >
            {feedback.message}
          </div>
        )}

        {/* Security Note */}
        <div className="mt-4 flex items-start space-x-2 text-[11px] text-[#808080] bg-[#1e1e1e] border border-[#808080]/20 rounded-[4px] p-3">
          <ShieldCheck className="w-4 h-4 text-[#10b981] flex-shrink-0 mt-0.5" />
          <span>
            Key hanya disimpan di berkas <code className="text-[#b3b3b3]">.env</code> proyek lokal
            dan dipakai oleh server Express untuk memanggil API provider AI. Jangan bagikan key atau
            simpan key di dalam kode sumber.
          </span>
        </div>

        {/* Modal Footer */}
        <div className="mt-5 pt-4 border-t border-[#808080]/20 flex flex-col-reverse sm:flex-row items-stretch sm:items-center justify-end gap-2">
          <button
            onClick={() => {
              playUiClick();
              onClose();
            }}
            className="px-4 py-2 rounded-[4px] bg-[#2d2d2d] hover:bg-[#383838] text-xs font-semibold text-[#b3b3b3] hover:text-white border border-[#808080]/40 transition-colors"
          >
            Tutup
          </button>
          <button
            onClick={() => {
              playUiClick();
              void handleSave();
            }}
            disabled={isSaving || isLoading}
            className="netflix-btn-primary flex items-center justify-center space-x-1.5 disabled:opacity-50 disabled:pointer-events-none"
          >
            {isSaving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
            <span>{isSaving ? 'Menyimpan...' : 'Simpan Pengaturan'}</span>
          </button>
        </div>
      </div>
    </div>
  );
};
