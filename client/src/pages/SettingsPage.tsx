import React, { useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Settings,
  Shield,
  Calendar,
  BookOpen,
  Download,
  Upload,
  LogOut,
  RotateCcw,
  Check,
  AlertTriangle,
  FileCheck,
  RefreshCw,
  Database,
  Camera,
  Trash2,
} from 'lucide-react';
import { PlannerLayout } from '../components/layout/PlannerLayout';
import { useAuth } from '../context/AuthContext';
import { useLanguage } from '../context/LanguageContext';
import {
  WeekStartPreference,
  RestoreMode,
  RestorePreview,
  RestoreResult,
} from '@planner/shared';
import { exportJournalAsJsonFile } from '../utils/localStorageBackup';
import { syncManager } from '../services/syncManager';

export const SettingsPage: React.FC = () => {
  const { user, logout, refreshUser, updateUser, pendingSyncCount } = useAuth();
  const { language, setLanguage, t } = useLanguage();
  const navigate = useNavigate();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const avatarInputRef = useRef<HTMLInputElement>(null);

  // Avatar upload states
  const [avatarUploading, setAvatarUploading] = useState(false);
  const [avatarSuccess, setAvatarSuccess] = useState(false);
  const [avatarError, setAvatarError] = useState<string | null>(null);

  const handleAvatarUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      setAvatarError('Please select a valid image file (PNG, JPG, WEBP).');
      return;
    }

    setAvatarUploading(true);
    setAvatarError(null);

    try {
      const dataUrl = await new Promise<string>((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = (event) => {
          const img = document.createElement('img');
          img.onload = () => {
            const canvas = document.createElement('canvas');
            const maxDimension = 256;
            let width = img.width;
            let height = img.height;

            if (width > height) {
              if (width > maxDimension) {
                height = Math.round((height * maxDimension) / width);
                width = maxDimension;
              }
            } else {
              if (height > maxDimension) {
                width = Math.round((width * maxDimension) / height);
                height = maxDimension;
              }
            }

            canvas.width = width;
            canvas.height = height;
            const ctx = canvas.getContext('2d');
            if (!ctx) {
              resolve(event.target?.result as string);
              return;
            }
            ctx.drawImage(img, 0, 0, width, height);
            resolve(canvas.toDataURL('image/jpeg', 0.88));
          };
          img.onerror = reject;
          img.src = event.target?.result as string;
        };
        reader.onerror = reject;
        reader.readAsDataURL(file);
      });

      updateUser?.({ avatarUrl: dataUrl });

      await fetch('/api/v1/user/preferences', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'X-Planner-Client': 'WebApp',
        },
        credentials: 'include',
        body: JSON.stringify({ avatarUrl: dataUrl }),
      });

      setAvatarSuccess(true);
      setTimeout(() => setAvatarSuccess(false), 3000);
    } catch {
      setAvatarError('Failed to process and update profile image.');
    } finally {
      setAvatarUploading(false);
      if (avatarInputRef.current) {
        avatarInputRef.current.value = '';
      }
    }
  };

  const handleRemoveAvatar = async () => {
    setAvatarUploading(true);
    try {
      updateUser?.({ avatarUrl: undefined });
      await fetch('/api/v1/user/preferences', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'X-Planner-Client': 'WebApp',
        },
        credentials: 'include',
        body: JSON.stringify({ avatarUrl: '' }),
      });
      setAvatarSuccess(true);
      setTimeout(() => setAvatarSuccess(false), 3000);
    } finally {
      setAvatarUploading(false);
    }
  };

  // Preference states
  const [weekStart, setWeekStart] = useState<WeekStartPreference>(
    user?.preferences?.weekStart || 'monday'
  );
  const [theme, setTheme] = useState<'paper-warm' | 'paper-editorial'>(
    user?.preferences?.theme || 'paper-warm'
  );
  const [prefersReducedMotion, setPrefersReducedMotion] = useState<boolean>(
    user?.preferences?.prefersReducedMotion || false
  );
  const [saving, setSaving] = useState(false);
  const [savedSuccess, setSavedSuccess] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Phase 6 Server Backup & Restore states
  const [exportingServerBackup, setExportingServerBackup] = useState(false);
  const [serverExportSuccess, setServerExportSuccess] = useState(false);
  const [isValidatingBackup, setIsValidatingBackup] = useState(false);
  const [validationPreview, setValidationPreview] = useState<RestorePreview | null>(null);
  const [rawParsedBackup, setRawParsedBackup] = useState<any | null>(null);
  const [uploadedFileName, setUploadedFileName] = useState<string | null>(null);
  const [restoreMode, setRestoreMode] = useState<RestoreMode>('merge');
  const [confirmReplace, setConfirmReplace] = useState(false);
  const [isRestoring, setIsRestoring] = useState(false);
  const [restoreResult, setRestoreResult] = useState<RestoreResult | null>(null);
  const [restoreError, setRestoreError] = useState<string | null>(null);

  const handleSavePreferences = async () => {
    try {
      setSaving(true);
      setErrorMessage(null);
      setSavedSuccess(false);

      const res = await fetch('/api/v1/user/preferences', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'X-Planner-Client': 'WebApp',
        },
        credentials: 'include',
        body: JSON.stringify({
          weekStart,
          theme,
          prefersReducedMotion,
        }),
      });

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data?.error?.message || 'Failed to update preferences');
      }

      await refreshUser();
      setSavedSuccess(true);
      setTimeout(() => setSavedSuccess(false), 3000);
    } catch (err: unknown) {
      console.error('Failed to save preferences:', err);
      setErrorMessage(err instanceof Error ? err.message : 'Error updating preferences');
    } finally {
      setSaving(false);
    }
  };

  const handleRevisitOnboarding = () => {
    navigate('/onboarding');
  };

  // Phase 6: Server Snapshot Export
  const handleDownloadServerBackup = async () => {
    try {
      setExportingServerBackup(true);
      setErrorMessage(null);
      setServerExportSuccess(false);

      const res = await fetch('/api/v1/planner/backup/export', {
        method: 'GET',
        credentials: 'include',
      });

      if (!res.ok) {
        const errData = await res.json().catch(() => ({}));
        throw new Error(errData?.error?.message || 'Server backup export failed');
      }

      const blob = await res.blob();
      const contentDisposition = res.headers.get('content-disposition');
      let filename = `guided-annual-planner-backup-${new Date().toISOString().split('T')[0]}.json`;
      if (contentDisposition) {
        const match = contentDisposition.match(/filename="?([^"]+)"?/);
        if (match && match[1]) {
          filename = match[1];
        }
      }

      const downloadUrl = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = downloadUrl;
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(downloadUrl);
      document.body.removeChild(a);

      setServerExportSuccess(true);
      setTimeout(() => setServerExportSuccess(false), 4000);
    } catch (err: unknown) {
      console.error('Failed to export server backup:', err);
      setErrorMessage(err instanceof Error ? err.message : 'Failed to export server backup');
    } finally {
      setExportingServerBackup(false);
    }
  };

  // Secondary legacy/mirror export
  const handleExportLocalMirror = () => {
    if (user) {
      exportJournalAsJsonFile({
        id: user.id,
        name: user.name,
        email: user.email,
      });
    }
  };

  // Phase 6: File selection & Validation
  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setRestoreError(null);
    setRestoreResult(null);
    setUploadedFileName(file.name);

    // Reject files exceeding 5MB limit immediately
    const maxSizeBytes = 5 * 1024 * 1024;
    if (file.size > maxSizeBytes) {
      setRestoreError(`File size exceeds 5MB limit (${(file.size / 1024 / 1024).toFixed(1)}MB).`);
      return;
    }

    try {
      setIsValidatingBackup(true);
      const fileText = await file.text();
      let parsedJson: any;
      try {
        parsedJson = JSON.parse(fileText);
      } catch {
        throw new Error('Selected file is not valid JSON.');
      }

      setRawParsedBackup(parsedJson);

      const validateRes = await fetch('/api/v1/planner/backup/validate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Planner-Client': 'WebApp',
        },
        credentials: 'include',
        body: JSON.stringify(parsedJson),
      });

      const validateData = await validateRes.json();

      if (!validateRes.ok || !validateData.valid) {
        const msg =
          validateData?.error?.message ||
          (validateData?.error?.details?.[0]?.issue
            ? `${validateData.error.details[0].field}: ${validateData.error.details[0].issue}`
            : 'Backup validation failed. Please check format and schema.');
        throw new Error(msg);
      }

      setValidationPreview(validateData);
    } catch (err: unknown) {
      console.error('Validation error:', err);
      setRestoreError(err instanceof Error ? err.message : 'Validation failed');
      setValidationPreview(null);
      setRawParsedBackup(null);
    } finally {
      setIsValidatingBackup(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  const handleCancelRestore = () => {
    setValidationPreview(null);
    setRawParsedBackup(null);
    setUploadedFileName(null);
    setConfirmReplace(false);
    setRestoreError(null);
    setRestoreMode('merge');
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  // Phase 6: Execute Restore
  const handleExecuteRestore = async () => {
    if (!rawParsedBackup) return;

    if (restoreMode === 'replace' && !confirmReplace) {
      setRestoreError('Please confirm that you understand full replacement will overwrite existing planner records.');
      return;
    }

    try {
      setIsRestoring(true);
      setRestoreError(null);

      const res = await fetch('/api/v1/planner/backup/restore', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Planner-Client': 'WebApp',
        },
        credentials: 'include',
        body: JSON.stringify({
          mode: restoreMode,
          confirmReplace: restoreMode === 'replace' ? confirmReplace : undefined,
          backup: rawParsedBackup,
        }),
      });

      const data = await res.json();

      if (!res.ok || !data.success) {
        throw new Error(data?.error?.message || 'Restore process failed');
      }

      setRestoreResult(data);
      await refreshUser();
      setValidationPreview(null);
      setRawParsedBackup(null);
      setUploadedFileName(null);
      setConfirmReplace(false);
    } catch (err: unknown) {
      console.error('Restore failed:', err);
      setRestoreError(err instanceof Error ? err.message : 'Restore failed');
    } finally {
      setIsRestoring(false);
    }
  };

  return (
    <PlannerLayout>
      <div className="max-w-4xl mx-auto w-full px-4 sm:px-6 py-8 space-y-8">
        {/* Header */}
        <div className="border-b border-border-subtle pb-4">
          <div className="flex items-center gap-2.5">
            <Settings className="w-5 h-5 text-sage" />
            <h1 className="font-serif text-2xl sm:text-3xl font-semibold text-ink">
              Settings &amp; Backup
            </h1>
          </div>
          <p className="text-xs text-ink-muted font-serif mt-1">
            Customize your calendar preferences, switch themes, and save a backup copy of your planner.
          </p>
        </div>

        {errorMessage && (
          <div className="p-4 bg-terracotta/10 border border-terracotta/30 text-terracotta text-xs font-serif rounded-xl">
            {errorMessage}
          </div>
        )}

        {/* Profile Card */}
        <div className="bg-paper-alt border border-border-subtle rounded-2xl p-6 shadow-xs space-y-4">
          <div className="flex items-center justify-between border-b border-border-subtle pb-3">
            <div className="flex items-center gap-2">
              <Shield className="w-4 h-4 text-sage" />
              <h2 className="font-serif text-lg font-medium text-ink">
                Your Account
              </h2>
            </div>
            <span className="text-[10px] uppercase tracking-wider px-2 py-0.5 rounded-full bg-sage/10 text-sage font-serif font-medium">
              Signed in with Google
            </span>
          </div>

          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="flex items-center gap-3.5">
              <div className="relative group">
                {user?.avatarUrl ? (
                  <img
                    src={user.avatarUrl}
                    alt={user.name}
                    className="w-14 h-14 rounded-full border-2 border-sage/60 object-cover flex-shrink-0 shadow-xs"
                  />
                ) : (
                  <img
                    src="/images/gp-monogram.png"
                    alt="Avatar"
                    className="w-14 h-14 rounded-full object-contain bg-sage-surface/60 border border-sage/40 p-1 flex-shrink-0"
                  />
                )}
                <button
                  type="button"
                  onClick={() => avatarInputRef.current?.click()}
                  disabled={avatarUploading}
                  className="absolute inset-0 bg-ink/40 text-white rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer"
                  title="Change profile image"
                  aria-label="Change profile photo"
                >
                  <Camera className="w-5 h-5" />
                </button>
                <input
                  ref={avatarInputRef}
                  type="file"
                  accept="image/*"
                  onChange={handleAvatarUpload}
                  className="hidden"
                  aria-label="Upload profile image"
                />
              </div>
              <div>
                <span className="font-serif font-semibold text-ink text-base block">
                  {user?.name}
                </span>
                <span className="text-xs font-sans text-ink-muted block">
                  {user?.email}
                </span>
                <div className="flex items-center gap-2 mt-1.5">
                  <button
                    type="button"
                    onClick={() => avatarInputRef.current?.click()}
                    disabled={avatarUploading}
                    className="inline-flex items-center gap-1 text-[11px] font-serif text-sage hover:text-sage-dark font-medium transition-colors cursor-pointer"
                  >
                    <Camera className="w-3 h-3" />
                    <span>{user?.avatarUrl ? 'Change Photo' : 'Add Profile Photo'}</span>
                  </button>
                  {user?.avatarUrl && (
                    <>
                      <span className="text-ink-muted text-xs">&bull;</span>
                      <button
                        type="button"
                        onClick={handleRemoveAvatar}
                        disabled={avatarUploading}
                        className="inline-flex items-center gap-1 text-[11px] font-serif text-terracotta hover:underline transition-colors cursor-pointer"
                      >
                        <Trash2 className="w-3 h-3" />
                        <span>Remove</span>
                      </button>
                    </>
                  )}
                </div>
              </div>
            </div>

            <button
              type="button"
              onClick={logout}
              className="inline-flex items-center gap-2 px-4 py-2 bg-paper border border-border-subtle hover:bg-paper-alt text-ink rounded-xl text-xs font-serif transition-colors cursor-pointer self-start sm:self-auto"
            >
              <LogOut className="w-3.5 h-3.5 text-ink-muted" />
              <span>Log Out</span>
            </button>
          </div>

          {avatarSuccess && (
            <div className="p-2.5 rounded-lg bg-sage-surface border border-sage/30 text-xs font-serif text-forest flex items-center gap-1.5">
              <Check className="w-3.5 h-3.5 text-sage" />
              <span>Profile image updated successfully!</span>
            </div>
          )}
          {avatarError && (
            <div className="p-2.5 rounded-lg bg-red-50 border border-red-200 text-xs font-serif text-red-700 flex items-center gap-1.5">
              <AlertTriangle className="w-3.5 h-3.5 text-red-600" />
              <span>{avatarError}</span>
            </div>
          )}
        </div>

        {/* Planning Preferences Form */}
        <div className="bg-paper-alt border border-border-subtle rounded-2xl p-6 shadow-xs space-y-6">
          <div className="flex items-center gap-2 border-b border-border-subtle pb-3">
            <Calendar className="w-4 h-4 text-sage" />
            <h2 className="font-serif text-lg font-medium text-ink">
              Calendar &amp; Appearance
            </h2>
          </div>

          <div className="space-y-5">
            {/* Week Start */}
            <div className="space-y-2">
              <label className="font-serif text-xs font-medium text-ink block">
                Week Starts On
              </label>
              <p className="text-[11px] font-serif text-ink-muted">
                Choose whether your weekly plan and calendar start on Monday or Sunday.
              </p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
                <button
                  type="button"
                  onClick={() => setWeekStart('monday')}
                  className={`p-3 rounded-xl border text-left cursor-pointer transition-all ${
                    weekStart === 'monday'
                      ? 'bg-paper border-sage ring-1 ring-sage'
                      : 'bg-paper/40 border-border-subtle'
                  }`}
                >
                  <span className="font-serif text-sm font-medium text-ink block">
                    Monday
                  </span>
                  <span className="text-[11px] font-serif text-ink-muted block">
                    Standard workweek view (Saturday &amp; Sunday grouped together)
                  </span>
                </button>

                <button
                  type="button"
                  onClick={() => setWeekStart('sunday')}
                  className={`p-3 rounded-xl border text-left cursor-pointer transition-all ${
                    weekStart === 'sunday'
                      ? 'bg-paper border-sage ring-1 ring-sage'
                      : 'bg-paper/40 border-border-subtle'
                  }`}
                >
                  <span className="font-serif text-sm font-medium text-ink block">
                    Sunday
                  </span>
                  <span className="text-[11px] font-serif text-ink-muted block">
                    Traditional calendar format starting on Sunday
                  </span>
                </button>
              </div>
            </div>

            {/* Paper Theme */}
            <div className="space-y-2 pt-2">
              <label className="font-serif text-xs font-medium text-ink block">
                Page Look &amp; Color Theme
              </label>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
                <button
                  type="button"
                  onClick={() => setTheme('paper-warm')}
                  className={`p-3 rounded-xl border text-left cursor-pointer transition-all ${
                    theme === 'paper-warm'
                      ? 'bg-paper border-sage ring-1 ring-sage'
                      : 'bg-paper/40 border-border-subtle'
                  }`}
                >
                  <span className="font-serif text-sm font-medium text-ink block">
                    Warm Linen
                  </span>
                  <span className="text-[11px] font-serif text-ink-muted block">
                    Soft, relaxing cream paper tone with gentle green accents
                  </span>
                </button>

                <button
                  type="button"
                  onClick={() => setTheme('paper-editorial')}
                  className={`p-3 rounded-xl border text-left cursor-pointer transition-all ${
                    theme === 'paper-editorial'
                      ? 'bg-paper border-sage ring-1 ring-sage'
                      : 'bg-paper/40 border-border-subtle'
                  }`}
                >
                  <span className="font-serif text-sm font-medium text-ink block">
                    Classic Editorial
                  </span>
                  <span className="text-[11px] font-serif text-ink-muted block">
                    Clean, crisp white paper style
                  </span>
                </button>
              </div>
            </div>

            {/* Reduced Motion */}
            <div className="pt-2 flex items-center justify-between p-3.5 rounded-xl bg-paper border border-border-subtle">
              <div>
                <span className="font-serif text-xs font-medium text-ink block">
                  Gentle Transitions
                </span>
                <span className="text-[11px] font-serif text-ink-muted block">
                  Turn off fast page animations for a calmer, simpler screen experience
                </span>
              </div>
              <input
                type="checkbox"
                checked={prefersReducedMotion}
                onChange={(e) => setPrefersReducedMotion(e.target.checked)}
                className="w-4 h-4 text-sage rounded border-stone-300 focus:ring-sage cursor-pointer"
              />
            </div>

            {/* Language Selection */}
            <div className="space-y-2 pt-2 border-t border-border-subtle">
              <label className="font-serif text-xs font-medium text-ink block">
                {t.languageLabel}
              </label>
              <p className="text-[11px] font-serif text-ink-muted">
                Choose your preferred interface language between English and Amharic (አማርኛ).
              </p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
                <button
                  type="button"
                  onClick={() => setLanguage('en')}
                  className={`p-3 rounded-xl border text-left cursor-pointer transition-all ${
                    language === 'en'
                      ? 'bg-paper border-sage ring-1 ring-sage'
                      : 'bg-paper/40 border-border-subtle'
                  }`}
                >
                  <span className="font-serif text-sm font-medium text-ink block">
                    🇺🇸 English (Default)
                  </span>
                  <span className="text-[11px] font-serif text-ink-muted block">
                    Full English planner interface
                  </span>
                </button>

                <button
                  type="button"
                  onClick={() => setLanguage('am')}
                  className={`p-3 rounded-xl border text-left cursor-pointer transition-all ${
                    language === 'am'
                      ? 'bg-paper border-sage ring-1 ring-sage'
                      : 'bg-paper/40 border-border-subtle'
                  }`}
                >
                  <span className="font-serif text-sm font-medium text-ink block">
                    🇪🇹 አማርኛ (Amharic)
                  </span>
                  <span className="text-[11px] font-serif text-ink-muted block">
                    የአማርኛ ቋንቋ አማራጭ እና አሰሳ
                  </span>
                </button>
              </div>
            </div>

            <div className="flex items-center gap-3 pt-2">
              <button
                type="button"
                onClick={handleSavePreferences}
                disabled={saving}
                className="inline-flex items-center gap-2 px-5 py-2.5 bg-sage hover:bg-sage-dark text-white rounded-xl font-serif text-xs font-medium transition-all shadow-xs cursor-pointer disabled:opacity-50"
              >
                {savedSuccess ? (
                  <>
                    <Check className="w-3.5 h-3.5" />
                    <span>Saved to Profile</span>
                  </>
                ) : (
                  <span>{saving ? 'Saving...' : 'Save Preferences'}</span>
                )}
              </button>
            </div>
          </div>
        </div>

        {/* Guided Onboarding & Philosophy */}
        <div className="bg-paper-alt border border-border-subtle rounded-2xl p-6 shadow-xs space-y-4">
          <div className="flex items-center justify-between border-b border-border-subtle pb-3">
            <div className="flex items-center gap-2">
              <BookOpen className="w-4 h-4 text-sage" />
              <h2 className="font-serif text-lg font-medium text-ink">
                Quick Start Guide &amp; Tips
              </h2>
            </div>
            <span className="text-xs font-serif text-ink-muted capitalize">
              {user?.preferences?.onboardingStatus === 'completed' ? '✓ Completed' : 'Available'}
            </span>
          </div>

          <p className="text-xs font-serif text-ink-muted leading-relaxed">
            Need a reminder on how to use the Rule of 3, set yearly themes, or navigate your days?
            Take the quick 1-minute guided tour anytime.
          </p>

          <button
            type="button"
            onClick={handleRevisitOnboarding}
            className="inline-flex items-center gap-2 px-4 py-2 bg-paper border border-border-subtle hover:bg-paper-alt text-ink rounded-xl text-xs font-serif transition-colors cursor-pointer"
          >
            <RotateCcw className="w-3.5 h-3.5 text-sage" />
            <span>Open Guided Tour &amp; Tips</span>
          </button>
        </div>

        {/* Complete Backup, Safe Restore & Data Portability */}
        <div className="bg-paper-alt border border-border-subtle rounded-2xl p-6 shadow-xs space-y-6">
          <div className="flex items-center justify-between border-b border-border-subtle pb-3">
            <div className="flex items-center gap-2">
              <Database className="w-4 h-4 text-sage" />
              <h2 className="font-serif text-lg font-medium text-ink">
                Backup &amp; Restore Your Data
              </h2>
            </div>
            <span className="text-[11px] font-serif text-forest bg-sage/10 px-2.5 py-0.5 rounded-full font-medium">
              Safe &amp; Private
            </span>
          </div>

          <p className="text-xs font-serif text-ink-muted leading-relaxed">
            Your notes and goals belong entirely to you. You can download a complete backup copy to your computer 
            at any time, or restore your previous notes whenever you need them.
          </p>

          {/* Export Action Section */}
          <div className="p-4 rounded-xl bg-paper border border-border-subtle space-y-3">
            <div className="flex items-center gap-2">
              <Download className="w-4 h-4 text-sage" />
              <h3 className="font-serif text-sm font-semibold text-ink">
                Save a Backup to Your Computer
              </h3>
            </div>
            <p className="text-xs font-serif text-ink-muted">
              Click below to download a single file containing all your yearly goals, monthly plans, 
              weekly schedules, daily journal entries, and habit records.
            </p>

            {pendingSyncCount > 0 && (
              <div className="p-3.5 bg-gold-light/25 border border-gold/40 rounded-xl space-y-2">
                <div className="flex items-center gap-2 text-amber-900 font-serif text-xs font-semibold">
                  <AlertTriangle className="w-4 h-4 text-amber-800" />
                  <span>Unsaved Offline Notes ({pendingSyncCount} waiting to sync)</span>
                </div>
                <p className="text-[11px] font-serif text-ink-muted leading-relaxed">
                  You made edits while offline that haven&apos;t reached the server yet. 
                  You can download a quick offline backup below to make sure nothing is lost:
                </p>
                <button
                  type="button"
                  onClick={() => {
                    if (user?.id) syncManager.exportUnsyncedData(user.id);
                  }}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-paper border border-gold/60 text-amber-900 hover:bg-gold-light/30 rounded-lg text-xs font-serif font-medium cursor-pointer shadow-2xs"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span>Download Unsynced Offline Notes (.json)</span>
                </button>
              </div>
            )}

            <div className="flex flex-wrap items-center gap-3 pt-1">
              <button
                type="button"
                onClick={handleDownloadServerBackup}
                disabled={exportingServerBackup}
                className="inline-flex items-center gap-2 px-4 py-2 bg-sage hover:bg-sage-dark text-white rounded-xl text-xs font-serif font-medium transition-all shadow-xs cursor-pointer disabled:opacity-50"
              >
                {exportingServerBackup ? (
                  <>
                    <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                    <span>Preparing Download...</span>
                  </>
                ) : serverExportSuccess ? (
                  <>
                    <Check className="w-3.5 h-3.5" />
                    <span>Backup Saved to Computer!</span>
                  </>
                ) : (
                  <>
                    <Download className="w-3.5 h-3.5" />
                    <span>Download Backup File</span>
                  </>
                )}
              </button>

              <button
                type="button"
                onClick={handleExportLocalMirror}
                className="inline-flex items-center gap-2 px-3.5 py-2 bg-paper border border-border-subtle hover:bg-paper-alt text-ink-muted hover:text-ink rounded-xl text-xs font-serif transition-colors cursor-pointer"
                title="Exports cached browser records as a local fallback"
              >
                <Download className="w-3 h-3 text-ink-muted" />
                <span>Save Offline Copy</span>
              </button>
            </div>
          </div>

          {/* Restore / Import Section */}
          <div className="p-4 rounded-xl bg-paper border border-border-subtle space-y-4">
            <div className="flex items-center gap-2">
              <Upload className="w-4 h-4 text-sage" />
              <h3 className="font-serif text-sm font-semibold text-ink">
                Restore Notes from a Backup File
              </h3>
            </div>
            <p className="text-xs font-serif text-ink-muted">
              Choose a backup file you saved earlier to restore your goals, habits, and notes. 
              The app checks the file first and lets you preview what will be restored.
            </p>

            {/* Hidden file input */}
            <input
              type="file"
              ref={fileInputRef}
              accept=".json,application/json"
              onChange={handleFileChange}
              className="hidden"
              data-testid="backup-file-input"
            />

            {!validationPreview && !isValidatingBackup && (
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="inline-flex items-center gap-2 px-4 py-2.5 bg-paper-alt border border-dashed border-sage/50 hover:border-sage text-ink rounded-xl text-xs font-serif transition-all cursor-pointer"
              >
                <Upload className="w-4 h-4 text-sage" />
                <span>Choose Backup File to Restore</span>
              </button>
            )}

            {isValidatingBackup && (
              <div className="flex items-center gap-2 p-3 bg-sage/5 rounded-xl border border-sage/20 text-xs font-serif text-sage">
                <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                <span>Checking backup file...</span>
              </div>
            )}

            {restoreError && (
              <div className="p-3.5 rounded-xl bg-terracotta/10 border border-terracotta/30 text-terracotta text-xs font-serif flex items-start gap-2">
                <AlertTriangle className="w-4 h-4 flex-shrink-0 mt-0.5" />
                <span>{restoreError}</span>
              </div>
            )}

            {restoreResult && (
              <div className="p-4 rounded-xl bg-sage/10 border border-sage/30 text-forest text-xs font-serif space-y-2">
                <div className="flex items-center gap-2 font-medium">
                  <Check className="w-4 h-4 text-sage" />
                  <span>{restoreResult.message}</span>
                </div>
                <div className="text-[11px] text-ink-muted grid grid-cols-2 sm:grid-cols-3 gap-1 pt-1">
                  <span>Yearly Goals: {restoreResult.restoredCounts.annualPlans}</span>
                  <span>Monthly Plans: {restoreResult.restoredCounts.monthlyPlans}</span>
                  <span>Weekly Plans: {restoreResult.restoredCounts.weeklyPlans}</span>
                  <span>Daily Journal Notes: {restoreResult.restoredCounts.dailyPlans}</span>
                  <span>Mood Entries: {restoreResult.restoredCounts.moods}</span>
                  <span>Habit Trackers: {restoreResult.restoredCounts.habits}</span>
                </div>
              </div>
            )}

            {/* Validation Preview Card */}
            {validationPreview && (
              <div className="border border-border-strong rounded-xl p-4 bg-paper-alt/80 space-y-4">
                <div className="flex items-center justify-between border-b border-border-subtle pb-2">
                  <div className="flex items-center gap-2">
                    <FileCheck className="w-4 h-4 text-forest" />
                    <span className="font-serif text-xs font-semibold text-ink">
                      Backup Verified: {uploadedFileName || 'backup.json'}
                    </span>
                  </div>
                  <span className="text-[10px] font-serif bg-forest/10 text-forest px-2 py-0.5 rounded-md font-medium">
                    Valid Backup
                  </span>
                </div>

                {/* Record Counts Table */}
                <div className="space-y-1.5">
                  <span className="text-[11px] font-serif font-medium text-ink block">
                    What is inside this backup:
                  </span>
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 text-xs font-serif">
                    <div className="p-2 rounded-lg bg-paper border border-border-subtle flex justify-between">
                      <span className="text-ink-muted">Yearly Goals</span>
                      <span className="font-semibold text-ink">{validationPreview.counts.annualPlans}</span>
                    </div>
                    <div className="p-2 rounded-lg bg-paper border border-border-subtle flex justify-between">
                      <span className="text-ink-muted">Monthly Plans</span>
                      <span className="font-semibold text-ink">{validationPreview.counts.monthlyPlans}</span>
                    </div>
                    <div className="p-2 rounded-lg bg-paper border border-border-subtle flex justify-between">
                      <span className="text-ink-muted">Weekly Plans</span>
                      <span className="font-semibold text-ink">{validationPreview.counts.weeklyPlans}</span>
                    </div>
                    <div className="p-2 rounded-lg bg-paper border border-border-subtle flex justify-between">
                      <span className="text-ink-muted">Daily Notes</span>
                      <span className="font-semibold text-ink">{validationPreview.counts.dailyPlans}</span>
                    </div>
                    <div className="p-2 rounded-lg bg-paper border border-border-subtle flex justify-between">
                      <span className="text-ink-muted">Mood Entries</span>
                      <span className="font-semibold text-ink">{validationPreview.counts.moods}</span>
                    </div>
                    <div className="p-2 rounded-lg bg-paper border border-border-subtle flex justify-between">
                      <span className="text-ink-muted">Habits</span>
                      <span className="font-semibold text-ink">{validationPreview.counts.habits}</span>
                    </div>
                  </div>
                </div>

                {validationPreview.warnings && validationPreview.warnings.length > 0 && (
                  <div className="p-2.5 bg-amber-500/10 border border-amber-500/30 rounded-lg text-[11px] font-serif text-amber-900">
                    {validationPreview.warnings.map((w, idx) => (
                      <p key={idx}>{w}</p>
                    ))}
                  </div>
                )}

                {/* Restore Mode Radio Selection */}
                <div className="space-y-2 pt-2 border-t border-border-subtle">
                  <span className="font-serif text-xs font-medium text-ink block">
                    Choose How to Restore:
                  </span>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <label
                      className={`p-3 rounded-xl border flex flex-col gap-1 cursor-pointer transition-all ${
                        restoreMode === 'merge'
                          ? 'bg-paper border-sage ring-1 ring-sage'
                          : 'bg-paper/40 border-border-subtle'
                      }`}
                    >
                      <div className="flex items-center gap-2">
                        <input
                          type="radio"
                          name="restoreMode"
                          value="merge"
                          checked={restoreMode === 'merge'}
                          onChange={() => setRestoreMode('merge')}
                          className="text-sage focus:ring-sage"
                        />
                        <span className="font-serif text-xs font-semibold text-ink">
                          Combine with Current Notes (Recommended)
                        </span>
                      </div>
                      <span className="text-[11px] font-serif text-ink-muted pl-5">
                        Keeps all your current notes and adds any missing entries from the backup. Nothing is deleted.
                      </span>
                    </label>

                    <label
                      className={`p-3 rounded-xl border flex flex-col gap-1 cursor-pointer transition-all ${
                        restoreMode === 'replace'
                          ? 'bg-paper border-terracotta ring-1 ring-terracotta'
                          : 'bg-paper/40 border-border-subtle'
                      }`}
                    >
                      <div className="flex items-center gap-2">
                        <input
                          type="radio"
                          name="restoreMode"
                          value="replace"
                          checked={restoreMode === 'replace'}
                          onChange={() => setRestoreMode('replace')}
                          className="text-terracotta focus:ring-terracotta"
                        />
                        <span className="font-serif text-xs font-semibold text-ink">
                          Replace All Current Notes
                        </span>
                      </div>
                      <span className="text-[11px] font-serif text-ink-muted pl-5">
                        Clears your current planner entries and restores this backup file as a fresh start. Your Google login remains safe.
                      </span>
                    </label>
                  </div>
                </div>

                {/* Replacement Confirmation Checkbox */}
                {restoreMode === 'replace' && (
                  <div className="p-3 bg-terracotta/10 border border-terracotta/30 rounded-xl space-y-2">
                    <div className="flex items-start gap-2">
                      <input
                        type="checkbox"
                        id="confirmReplaceCheckbox"
                        checked={confirmReplace}
                        onChange={(e) => setConfirmReplace(e.target.checked)}
                        className="w-4 h-4 mt-0.5 text-terracotta rounded border-stone-300 focus:ring-terracotta cursor-pointer"
                      />
                      <label htmlFor="confirmReplaceCheckbox" className="font-serif text-xs text-ink cursor-pointer">
                        I understand this will replace my current entries with the contents of this backup file.
                      </label>
                    </div>
                  </div>
                )}

                {/* Actions */}
                <div className="flex items-center gap-3 pt-2">
                  <button
                    type="button"
                    onClick={handleExecuteRestore}
                    disabled={isRestoring || (restoreMode === 'replace' && !confirmReplace)}
                    className="inline-flex items-center gap-2 px-4 py-2 bg-sage hover:bg-sage-dark text-white rounded-xl text-xs font-serif font-medium transition-all shadow-xs cursor-pointer disabled:opacity-50"
                  >
                    {isRestoring ? (
                      <>
                        <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                        <span>Restoring Notes...</span>
                      </>
                    ) : (
                      <>
                        <Check className="w-3.5 h-3.5" />
                        <span>Restore My Planner Now</span>
                      </>
                    )}
                  </button>

                  <button
                    type="button"
                    onClick={handleCancelRestore}
                    disabled={isRestoring}
                    className="px-4 py-2 bg-paper border border-border-subtle hover:bg-paper-alt text-ink rounded-xl text-xs font-serif transition-colors cursor-pointer"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </PlannerLayout>
  );
};
