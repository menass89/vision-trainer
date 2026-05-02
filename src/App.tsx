import { useEffect } from 'react';
import { Brain } from 'lucide-react';
import { GoalSelection } from './components/GoalSelection';
import { HomeScreen } from './components/HomeScreen';
import { TabBar } from './components/TabBar';
import { SessionFlow } from './components/SessionFlow';
import { ProgressDashboard } from './components/ProgressDashboard';
import { ScienceTab } from './components/ScienceTab';
import { SettingsScreen } from './components/SettingsScreen';
import { useAppStore } from './store/useAppStore';
import { getTimePhase } from './theme';
import type { GoalType } from './types';
import './styles.css';

export default function App() {
  const ready = useAppStore((s) => s.ready);
  const profile = useAppStore((s) => s.profile);
  const calibration = useAppStore((s) => s.calibration);
  const dashboard = useAppStore((s) => s.dashboard);
  const gamification = useAppStore((s) => s.gamification);
  const currentTab = useAppStore((s) => s.currentTab);
  const initialize = useAppStore((s) => s.initialize);
  const setCurrentTab = useAppStore((s) => s.setCurrentTab);
  const setGoalType = useAppStore((s) => s.setGoalType);
  const setTheme = useAppStore((s) => s.setTheme);
  const setMonocularMode = useAppStore((s) => s.setMonocularMode);
  const updateCalibration = useAppStore((s) => s.updateCalibration);

  useEffect(() => {
    void initialize();
  }, [initialize]);

  const timePhase = useAppStore((s) => s.timePhase);
  const setTimePhase = useAppStore((s) => s.setTimePhase);

  useEffect(() => {
    const check = () => {
      const phase = getTimePhase();
      if (phase !== timePhase) {
        setTimePhase(phase);
      }
    };
    const interval = setInterval(check, 60_000);
    return () => clearInterval(interval);
  }, [timePhase, setTimePhase]);

  if (!ready) {
    return (
      <main className="loading-screen">
        <Brain size={32} />
        <span>Loading</span>
      </main>
    );
  }

  if (profile.diagnosisType === 'unspecified') {
    return (
      <main className="app-shell">
        <GoalSelection
          onSelect={(goal: GoalType, monocular: boolean, eye: 'left' | 'right', name: string) => {
            void setGoalType(goal, name);
            void setMonocularMode(monocular, eye);
          }}
        />
      </main>
    );
  }

  return (
    <main className="app-shell">
      <section className={`tab-content ${currentTab === 'train' ? 'tab-content--wide' : ''}`}>
        <div className={currentTab === 'home' ? 'tab-pane tab-pane--active' : 'tab-pane'}>
          <HomeScreen
            profile={profile}
            dashboard={dashboard}
            gamification={gamification}
            timePhase={timePhase}
            onStartSession={() => setCurrentTab('train')}
          />
        </div>
        <div className={currentTab === 'train' ? 'tab-pane tab-pane--active' : 'tab-pane'}>
          <SessionFlow />
        </div>
        <div className={currentTab === 'progress' ? 'tab-pane tab-pane--active' : 'tab-pane'}>
          <ProgressDashboard dashboard={dashboard} />
        </div>
        <div className={currentTab === 'science' ? 'tab-pane tab-pane--active' : 'tab-pane'}>
          <ScienceTab />
        </div>
        <div className={currentTab === 'settings' ? 'tab-pane tab-pane--active' : 'tab-pane'}>
          <SettingsScreen
            profile={profile}
            calibration={calibration}
            onUpdateCalibration={updateCalibration}
            onChangeTheme={(theme) => setTheme(theme)}
            onChangeGoal={(goal) => void setGoalType(goal)}
            onResetProgress={() => {}}
          />
        </div>
      </section>
      <TabBar currentTab={currentTab} onTabChange={setCurrentTab} />
    </main>
  );
}
