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
  const activeSession = useAppStore((s) => s.activeSession);
  const initialize = useAppStore((s) => s.initialize);
  const setCurrentTab = useAppStore((s) => s.setCurrentTab);
  const setGoalType = useAppStore((s) => s.setGoalType);
  const setMonocularMode = useAppStore((s) => s.setMonocularMode);
  const abandonSession = useAppStore((s) => s.abandonSession);

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
    check();
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
          onSelect={async (goal: GoalType, monocular: boolean, eye: 'left' | 'right', name: string) => {
            await setMonocularMode(monocular, eye);
            await setGoalType(goal, name);
          }}
        />
      </main>
    );
  }

  const onTabChange = async (tab: typeof currentTab) => {
    if (currentTab === 'train' && tab !== 'train') {
      try {
        await abandonSession();
      } catch (err) {
        // Intentional: navigate even if abandon failed so the user can't be trapped
        // on the Train tab by a transient persistence error. Stale activeSession
        // will be cleaned up on the next abandonSession or completeSession call.
        console.error('Failed to abandon session', err);
      }
    }
    setCurrentTab(tab);
  };

  return (
    <main className="app-shell">
      <section className={`tab-content ${currentTab === 'train' ? 'tab-content--wide' : ''}`}>
        {currentTab === 'home' && (
          <div className="tab-pane tab-pane--active">
            <HomeScreen
              profile={profile}
              dashboard={dashboard}
              gamification={gamification}
              timePhase={timePhase}
              onStartSession={() => setCurrentTab('train')}
            />
          </div>
        )}
        {currentTab === 'train' && (
          <div className="tab-pane tab-pane--active">
            <SessionFlow />
          </div>
        )}
        {currentTab === 'progress' && (
          <div className="tab-pane tab-pane--active">
            <ProgressDashboard dashboard={dashboard} />
          </div>
        )}
        {currentTab === 'science' && (
          <div className="tab-pane tab-pane--active">
            <ScienceTab />
          </div>
        )}
        {currentTab === 'settings' && (
          <div className="tab-pane tab-pane--active">
            <SettingsScreen
              profile={profile}
              calibration={calibration}
              onChangeGoal={setGoalType}
            />
          </div>
        )}
      </section>
      <TabBar
        currentTab={currentTab}
        onTabChange={onTabChange}
        hidden={currentTab === 'train' && activeSession !== null}
      />
    </main>
  );
}
