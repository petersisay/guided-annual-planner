import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { JournalLoginCard } from '../components/auth/JournalLoginCard';
import { useAuth } from '../context/AuthContext';

export const LoginPage: React.FC = () => {
  const { user } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (user) {
      navigate('/');
    }
  }, [user, navigate]);

  return (
    <div className="min-h-screen bg-paper flex flex-col justify-center items-center p-4 md:p-8">
      {/* Background ambient texture / subtle decoration */}
      <div className="fixed inset-0 pointer-events-none opacity-40">
        <div className="absolute top-0 left-0 w-96 h-96 bg-sage-surface rounded-full filter blur-3xl opacity-50 -translate-x-1/2 -translate-y-1/2" />
        <div className="absolute bottom-0 right-0 w-96 h-96 bg-sage-surface rounded-full filter blur-3xl opacity-50 translate-x-1/2 translate-y-1/2" />
      </div>

      <div className="w-full relative z-10">
        <JournalLoginCard />
      </div>

      <footer className="mt-8 text-center text-xs text-ink-light relative z-10">
        <p>Guided Annual Planner &bull; Rooted in intentional daily action</p>
      </footer>
    </div>
  );
};
