import React, { useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Settings,
  Shield,
  Calendar,
  Sparkles,
  Download,
  Upload,
  LogOut,
  RotateCcw,
  Check,
  AlertTriangle,
  FileCheck,
  RefreshCw,
  Database,
} from 'lucide-react';
import { PlannerLayout } from '../components/layout/PlannerLayout';
import { useAuth } from '../context/AuthContext';
import {
  WeekStartPreference,
  RestoreMode,
  RestorePreview,
  RestoreResult,
} from '@planner/shared';
import { exportJournalAsJsonFile } from '../utils/localStorageBackup';
import { syncManager } from '../services/syncManager';

export const SettingsPage: React.FC = () => {
  const { user, logout, refreshUser, pendingSyncCount } = useAuth();
  const navigate = useNavigate();
  const fileInputRef = useRef<HTMLInputElement>(null);

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
              Account &amp; Preferences
            </h1>
          </div>
          <p className="text-xs text-ink-muted font-serif mt-1">
            Manage your personal planning rhythms, privacy, and journal settings.
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
                Verified Identity
              </h2>
            </div>
            <span className="text-[10px] uppercase tracking-wider px-2 py-0.5 rounded-full bg-sage/10 text-sage font-serif font-medium">
              Google Authenticated
            </span>
          </div>

          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="flex items-center gap-3.5">
              {user?.avatarUrl ? (
                <img
                  src={user.avatarUrl}
                  alt={user.name}
                  className="w-12 h-12 rounded-full border border-border-strong flex-shrink-0"
                />
              ) : (
                <img
                  src="/images/gp-monogram.png"
                  alt="Avatar"
                  className="w-12 h-12 rounded-full object-contain bg-sage-surface/60 border border-sage/40 p-1 flex-shrink-0"
                />
              )}
              <div>
                <span className="font-serif font-semibold text-ink text-base block">
                  {user?.name}
                </span>
                <span className="text-xs font-sans text-ink-muted block">
                  {user?.email}
                </span>
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
        </div>

        {/* Planning Preferences Form */}
        <div className="bg-paper-alt border border-border-subtle rounded-2xl p-6 shadow-xs space-y-6">
          <div className="flex items-center gap-2 border-b border-border-subtle pb-3">
            <Calendar className="w-4 h-4 text-sage" />
            <h2 className="font-serif text-lg font-medium text-ink">
              Rhythm &amp; Display Preferences
            </h2>
          </div>

          <div className="space-y-5">
            {/* Week Start */}
            <div className="space-y-2">
              <label className="font-serif text-xs font-medium text-ink block">
                First Day of the Week
              </label>
              <p className="text-[11px] font-serif text-ink-muted">
                Choose how weekly spreads and month mini-calendars are structured.
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
                    Monday (ISO 8601)
                  </span>
                  <span className="text-[11px] font-serif text-ink-muted block">
                    Default journal rhythm with weekends grouped together
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
                    Traditional calendar format starting with Sunday
                  </span>
                </button>
              </div>
            </div>

            {/* Paper Theme */}
            <div className="space-y-2 pt-2">
              <label className="font-serif text-xs font-medium text-ink block">
                Paper Tone &amp; Palette
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
                    Subtle warmth with soft sage accents (#FDFBF7)
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
                    Clean paper-white (#F7F5F0)
                  </span>
                </button>
              </div>
            </div>

            {/* Reduced Motion */}
            <div className="pt-2 flex items-center justify-between p-3.5 rounded-xl bg-paper border border-border-subtle">
              <div>
                <span className="font-serif text-xs font-medium text-ink block">
                  Reduced Motion
                </span>
                <span className="text-[11px] font-serif text-ink-muted block">
                  Honor motion-sensitivity preferences for transitions and modals
                </span>
              </div>
              <input
                type="checkbox"
                checked={prefersReducedMotion}
                onChange={(e) => setPrefersReducedMotion(e.target.checked)}
                className="w-4 h-4 text-sage rounded border-stone-300 focus:ring-sage cursor-pointer"
              />
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
              <Sparkles className="w-4 h-4 text-sage" />
              <h2 className="font-serif text-lg font-medium text-ink">
                Guided Onboarding &amp; Philosophy
              </h2>
            </div>
            <span className="text-xs font-serif text-ink-muted capitalize">
              Status: {user?.preferences?.onboardingStatus || 'not_started'}
            </span>
          </div>

          <p className="text-xs font-serif text-ink-muted leading-relaxed">
            Want to re-read the guided walkthrough, review the Rule of 3 philosophy, or re-anchor your annual intention?
          </p>

          <button
            type="button"
            onClick={handleRevisitOnboarding}
            className="inline-flex items-center gap-2 px-4 py-2 bg-paper border border-border-subtle hover:bg-paper-alt text-ink rounded-xl text-xs font-serif transition-colors cursor-pointer"
          >
            <RotateCcw className="w-3.5 h-3.5 text-sage" />
            <span>Revisit Guided Onboarding Flow</span>
          </button>
        </div>

        {/* Phase 6: Complete Backup, Safe Restore & Data Portability */}
        <div className="bg-paper-alt border border-border-subtle rounded-2xl p-6 shadow-xs space-y-6">
          <div className="flex items-center justify-between border-b border-border-subtle pb-3">
            <div className="flex items-center gap-2">
              <Database className="w-4 h-4 text-sage" />
              <h2 className="font-serif text-lg font-medium text-ink">
                Data Portability &amp; Complete Backup
              </h2>
            </div>
            <span className="text-[11px] font-serif text-forest bg-sage/10 px-2.5 py-0.5 rounded-full font-medium">
              Version 1.0 JSON
            </span>
          </div>

          <p className="text-xs font-serif text-ink-muted leading-relaxed">
            You maintain full ownership and portability over your entire planner. Export server snapshots
            covering all seven planner categories (preferences, annual intentions, monthly dashboards,
            weekly spreads, daily reflections, mood tracking, and habit grids), or safely restore past data.
          </p>

          {/* Export Action Section */}
          <div className="p-4 rounded-xl bg-paper border border-border-subtle space-y-3">
            <div className="flex items-center gap-2">
              <Download className="w-4 h-4 text-sage" />
              <h3 className="font-serif text-sm font-semibold text-ink">
                Export Planner Data
              </h3>
            </div>
            <p className="text-xs font-serif text-ink-muted">
              Download a complete, verified server snapshot in structured JSON format. This file contains
              no passwords or session credentials and is safely portable across devices.
            </p>

            {pendingSyncCount > 0 && (
              <div className="p-3.5 bg-gold-light/25 border border-gold/40 rounded-xl space-y-2">
                <div className="flex items-center gap-2 text-amber-900 font-serif text-xs font-semibold">
                  <AlertTriangle className="w-4 h-4 text-amber-800" />
                  <span>Unsynchronized Offline Edits Detected ({pendingSyncCount} queued)</span>
                </div>
                <p className="text-[11px] font-serif text-ink-muted leading-relaxed">
                  You have pending edits queued in this browser that haven&apos;t been synchronized to the cloud yet.
                  Exporting the cloud server snapshot below will not reflect these unsynced changes.
                  You can download an offline rescue backup immediately below to preserve them:
                </p>
                <button
                  type="button"
                  onClick={() => {
                    if (user?.id) syncManager.exportUnsyncedData(user.id);
                  }}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-paper border border-gold/60 text-amber-900 hover:bg-gold-light/30 rounded-lg text-xs font-serif font-medium cursor-pointer shadow-2xs"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span>Download Unsynced Edits Rescue Backup (.json)</span>
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
                    <span>Generating Snapshot...</span>
                  </>
                ) : serverExportSuccess ? (
                  <>
                    <Check className="w-3.5 h-3.5" />
                    <span>Snapshot Downloaded</span>
                  </>
                ) : (
                  <>
                    <Download className="w-3.5 h-3.5" />
                    <span>Download Complete Server Backup (JSON)</span>
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
                <span>Export Local Mirror Only</span>
              </button>
            </div>
          </div>

          {/* Restore / Import Section */}
          <div className="p-4 rounded-xl bg-paper border border-border-subtle space-y-4">
            <div className="flex items-center gap-2">
              <Upload className="w-4 h-4 text-sage" />
              <h3 className="font-serif text-sm font-semibold text-ink">
                Restore &amp; Import Planner Data
              </h3>
            </div>
            <p className="text-xs font-serif text-ink-muted">
              Upload a previously exported Guided Annual Planner backup JSON file (up to 5MB).
              The system inspects and validates the file structure before applying changes.
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
                <span>Select Backup JSON File to Inspect</span>
              </button>
            )}

            {isValidatingBackup && (
              <div className="flex items-center gap-2 p-3 bg-sage/5 rounded-xl border border-sage/20 text-xs font-serif text-sage">
                <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                <span>Verifying and parsing backup data...</span>
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
                  <span>Annual Plans: {restoreResult.restoredCounts.annualPlans}</span>
                  <span>Monthly Plans: {restoreResult.restoredCounts.monthlyPlans}</span>
                  <span>Weekly Plans: {restoreResult.restoredCounts.weeklyPlans}</span>
                  <span>Daily Plans: {restoreResult.restoredCounts.dailyPlans}</span>
                  <span>Mood Entries: {restoreResult.restoredCounts.moods}</span>
                  <span>Habits: {restoreResult.restoredCounts.habits}</span>
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
                    {validationPreview.metadata?.format ?? (validationPreview as any).format ?? 'guided-annual-planner-backup'} ({validationPreview.metadata?.version ?? (validationPreview as any).version ?? '1.0.0'})
                  </span>
                </div>

                {/* Record Counts Table */}
                <div className="space-y-1.5">
                  <span className="text-[11px] font-serif font-medium text-ink block">
                    Snapshot Record Breakdown:
                  </span>
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 text-xs font-serif">
                    <div className="p-2 rounded-lg bg-paper border border-border-subtle flex justify-between">
                      <span className="text-ink-muted">Annual Plans</span>
                      <span className="font-semibold text-ink">{validationPreview.counts.annualPlans}</span>
                    </div>
                    <div className="p-2 rounded-lg bg-paper border border-border-subtle flex justify-between">
                      <span className="text-ink-muted">Monthly Plans</span>
                      <span className="font-semibold text-ink">{validationPreview.counts.monthlyPlans}</span>
                    </div>
                    <div className="p-2 rounded-lg bg-paper border border-border-subtle flex justify-between">
                      <span className="text-ink-muted">Weekly Spreads</span>
                      <span className="font-semibold text-ink">{validationPreview.counts.weeklyPlans}</span>
                    </div>
                    <div className="p-2 rounded-lg bg-paper border border-border-subtle flex justify-between">
                      <span className="text-ink-muted">Daily Plans</span>
                      <span className="font-semibold text-ink">{validationPreview.counts.dailyPlans}</span>
                    </div>
                    <div className="p-2 rounded-lg bg-paper border border-border-subtle flex justify-between">
                      <span className="text-ink-muted">Mood Entries</span>
                      <span className="font-semibold text-ink">{validationPreview.counts.moods}</span>
                    </div>
                    <div className="p-2 rounded-lg bg-paper border border-border-subtle flex justify-between">
                      <span className="text-ink-muted">Habit Trackers</span>
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
                    Choose Restore Strategy:
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
                          Non-Destructive Merge (Recommended)
                        </span>
                      </div>
                      <span className="text-[11px] font-serif text-ink-muted pl-5">
                        Imports records by natural date keys. Preserves any existing filled days and adds missing ones.
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
                          Full Planner Replacement
                        </span>
                      </div>
                      <span className="text-[11px] font-serif text-ink-muted pl-5">
                        Wipes existing planner data for this account and replaces them with this backup. Account login remains safe.
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
                        I understand this is a destructive replacement. My current annual, monthly, weekly, and daily entries will be replaced with this backup file.
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
                        <span>Restoring Data...</span>
                      </>
                    ) : (
                      <>
                        <Check className="w-3.5 h-3.5" />
                        <span>Confirm and Restore</span>
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
