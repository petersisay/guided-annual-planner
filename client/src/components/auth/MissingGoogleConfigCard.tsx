import React from 'react';
import { AlertTriangle, KeyRound } from 'lucide-react';

export const MissingGoogleConfigCard: React.FC = () => {
  return (
    <div className="min-h-screen bg-paper flex items-center justify-center p-4">
      <div className="w-full max-w-lg bg-paper-alt border border-border-strong rounded-2xl p-8 shadow-paper-lg">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <span className="w-8 h-8 rounded-full bg-amber-100 border border-amber-300 flex items-center justify-center text-amber-800">
              <AlertTriangle className="w-4 h-4" />
            </span>
            <span className="text-xs uppercase tracking-widest text-ink-muted font-sans font-medium">
              Setup Required
            </span>
          </div>
          <img
            src="/images/gp-monogram.png"
            alt="GP Logo"
            className="w-8 h-8 object-contain"
          />
        </div>

        <h2 className="font-serif text-2xl font-medium text-ink mb-2">
          Google Client ID Required
        </h2>

        <p className="font-sans text-sm text-ink-muted leading-relaxed mb-6">
          To protect your private journal space, the Guided Annual Planner requires a verified Google Cloud OAuth 2.0 Web Client ID.
        </p>

        <div className="bg-paper p-4 rounded-xl border border-border-subtle mb-6 text-xs space-y-2">
          <div className="flex items-center gap-1.5 font-medium text-ink">
            <KeyRound className="w-3.5 h-3.5 text-sage" />
            <span>Configuration Instruction:</span>
          </div>
          <p className="text-ink-muted">
            Create an OAuth 2.0 Client ID in the Google Cloud Console and set it in your client environment file:
          </p>
          <div className="font-mono bg-paper-alt p-2.5 rounded border border-border-subtle text-ink">
            <span className="text-ink-light"># client/.env</span>
            <br />
            <span className="text-sage font-semibold">VITE_GOOGLE_CLIENT_ID</span>=your_google_client_id.apps.googleusercontent.com
          </div>
        </div>

        <p className="text-xs text-ink-light">
          Refer to the root <code className="bg-paper px-1.5 py-0.5 rounded border border-border-subtle">README.md</code> for step-by-step Google Cloud Console configuration.
        </p>
      </div>
    </div>
  );
};
