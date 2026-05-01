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
          onSelect={(goal: GoalType, monocular: boolean, eye: 'left' | 'right') => {
            void setGoalType(goal);
            void setMonocularMode(monocular, eye);
          }}
        />
      </main>
    );
  }

  const renderTab = () => {
    switch (currentTab) {
      case 'home':
        return (
          <HomeScreen
            profile={profile}
            dashboard={dashboard}
            gamification={gamification}
            onStartSession={() => setCurrentTab('train')}
          />
        );
      case 'train':
        return <SessionFlow />;
      case 'progress':
        return <ProgressDashboard dashboard={dashboard} />;
      case 'science':
        return <ScienceTab />;
      case 'settings':
        return (
          <SettingsScreen
            profile={profile}
            calibration={calibration}
            onUpdateCalibration={updateCalibration}
            onChangeTheme={(theme) => setTheme(theme)}
            onChangeGoal={(goal) => void setGoalType(goal)}
            onResetProgress={() => {}}
          />
        );
    }
  };

  return (
    <main className="app-shell">
      <TabBar currentTab={currentTab} onTabChange={setCurrentTab} />
      <section className="tab-content">
        {renderTab()}
      </section>
    </main>
  );
}
