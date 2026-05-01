import { useEffect } from 'react';
import { Brain, WifiOff } from 'lucide-react';
import { CalibrationPanel } from './components/CalibrationPanel';
import { GamificationBar } from './components/GamificationBar';
import { ModuleStatus } from './components/ModuleStatus';
import { ProgressDashboard } from './components/ProgressDashboard';
import { SessionFlow } from './components/SessionFlow';
import { useAppStore } from './store/useAppStore';
import './styles.css';

export default function App() {
  const ready = useAppStore((state) => state.ready);
  const calibration = useAppStore((state) => state.calibration);
  const dashboard = useAppStore((state) => state.dashboard);
  const gamification = useAppStore((state) => state.gamification);
  const initialize = useAppStore((state) => state.initialize);
  const updateCalibration = useAppStore((state) => state.updateCalibration);
  const setAudioMuted = useAppStore((state) => state.setAudioMuted);

  useEffect(() => {
    void initialize();
  }, [initialize]);

  if (!ready) {
    return (
      <main className="loading-screen">
        <Brain size={32} />
        <span>Loading local training profile</span>
      </main>
    );
  }

  return (
    <main className="app-shell">
      <header className="app-header">
        <div className="brand-lockup">
          <Brain size={28} />
          <div>
            <h1>Vision Trainer</h1>
            <span>Open perceptual learning platform</span>
          </div>
        </div>
        <div className="offline-pill">
          <WifiOff size={16} />
          <span>Offline ready</span>
        </div>
      </header>
      <GamificationBar gamification={gamification} dashboard={dashboard} onMuteChange={setAudioMuted} />

      <section className="workspace">
        <div className="primary-column">
          <SessionFlow />
        </div>
        <div className="side-column">
          <CalibrationPanel calibration={calibration} onSave={updateCalibration} />
          <ProgressDashboard dashboard={dashboard} />
          <ModuleStatus />
        </div>
      </section>
    </main>
  );
}
