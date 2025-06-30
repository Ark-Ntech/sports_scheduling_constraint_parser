'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { ConstraintParser } from '@/components/constraint-parser';
import { EnhancedConstraintSetManager } from '@/components/enhanced-constraint-set-manager';
import { ScheduleCalendar } from '@/components/schedule-calendar';
import { ConfidenceMethodology } from '@/components/confidence-methodology';
import type { ConstraintSet, User } from '@/lib/types';

type TabType = 'manager' | 'parser' | 'calendar';

// Integration state interface
interface IntegrationState {
  selectedConstraintSetId?: string;
  selectedConstraintSet?: ConstraintSet;
  pendingConstraints?: any[];
  navigationSource?: TabType;
  showIntegrationPanel?: boolean;
}

export default function Page() {
  const [user, setUser] = useState<User | null>(null);
  const [constraintSets, setConstraintSets] = useState<ConstraintSet[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<TabType>('parser');
  const [integrationState, setIntegrationState] = useState<IntegrationState>(
    {},
  );
  const router = useRouter();
  const supabase = createClient();

  const loadConstraintSets = async () => {
    try {
      const response = await fetch('/api/constraint-sets');
      if (response.ok) {
        const sets = await response.json();
        setConstraintSets(sets);
      }
    } catch (error) {
      console.error('Failed to load constraint sets:', error);
    }
  };

  useEffect(() => {
    const loadUserData = async () => {
      try {
        const {
          data: { user },
          error,
        } = await supabase.auth.getUser();

        if (error || !user) {
          router.push('/login');
          return;
        }

        setUser(user);
        await loadConstraintSets();
      } catch (error) {
        console.error('Failed to load user data:', error);
      } finally {
        setLoading(false);
      }
    };

    loadUserData();
  }, [router]);

  const handleConstraintSetsChange = (newSets: ConstraintSet[]) => {
    setConstraintSets(newSets);
  };

  // Integration helpers
  const navigateToTab = (tab: TabType, state?: Partial<IntegrationState>) => {
    setActiveTab(tab);
    if (state) {
      setIntegrationState((prev) => ({
        ...prev,
        ...state,
        navigationSource: activeTab,
      }));
    }
  };

  const handleConstraintSetSelected = (constraintSet: ConstraintSet) => {
    setIntegrationState((prev) => ({
      ...prev,
      selectedConstraintSetId: constraintSet.id,
      selectedConstraintSet: constraintSet,
    }));
  };

  const handleConstraintsParsed = (constraints: any[]) => {
    setIntegrationState((prev) => ({
      ...prev,
      pendingConstraints: constraints,
      showIntegrationPanel: true,
    }));
  };

  const handleConstraintsSaved = () => {
    // Refresh constraint sets after saving
    loadConstraintSets();
    setIntegrationState((prev) => ({
      ...prev,
      pendingConstraints: undefined,
      showIntegrationPanel: false,
    }));
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4" />
          <p className="text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return null;
  }

  return (
    <div className="flex flex-col min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      <main className="flex-1 max-w-6xl mx-auto w-full p-4 space-y-6">
        {/* App Header */}
        <div className="text-center py-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            Sports Scheduling Constraint Parser
          </h1>
          <p className="text-lg text-gray-600">
            Transform natural language scheduling rules into structured
            constraints
          </p>

          {/* Tab Navigation */}
          <div className="flex justify-center mt-6">
            <div className="flex bg-white rounded-lg shadow-sm border border-gray-200 p-1">
              <button
                type="button"
                onClick={() => navigateToTab('parser')}
                className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                  activeTab === 'parser'
                    ? 'bg-blue-600 text-white shadow-sm'
                    : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
                }`}
              >
                📝 Parser
              </button>
              <button
                type="button"
                onClick={() => navigateToTab('manager')}
                className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                  activeTab === 'manager'
                    ? 'bg-blue-600 text-white shadow-sm'
                    : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
                }`}
              >
                🏗️ Constraint Sets
              </button>
              <button
                type="button"
                onClick={() => navigateToTab('calendar')}
                className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                  activeTab === 'calendar'
                    ? 'bg-blue-600 text-white shadow-sm'
                    : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
                }`}
              >
                📅 Calendar
              </button>
            </div>
          </div>
        </div>

        {/* Integration Panel */}
        {integrationState.showIntegrationPanel &&
          integrationState.pendingConstraints && (
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center space-x-2">
                  <div className="w-2 h-2 bg-blue-500 rounded-full animate-pulse" />
                  <h3 className="text-sm font-semibold text-blue-900">
                    Parsed Constraints Ready
                  </h3>
                </div>
                <button
                  type="button"
                  onClick={() =>
                    setIntegrationState((prev) => ({
                      ...prev,
                      showIntegrationPanel: false,
                    }))
                  }
                  className="text-blue-400 hover:text-blue-600"
                >
                  <svg
                    className="w-4 h-4"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M6 18L18 6M6 6l12 12"
                    />
                  </svg>
                </button>
              </div>
              <p className="text-sm text-blue-700 mb-3">
                You have {integrationState.pendingConstraints.length} parsed
                constraint(s) ready to save.
              </p>
              <div className="flex items-center space-x-3">
                <button
                  type="button"
                  onClick={() =>
                    navigateToTab('manager', { showIntegrationPanel: true })
                  }
                  className="inline-flex items-center px-3 py-1.5 bg-blue-600 text-white text-sm font-medium rounded-md hover:bg-blue-700 transition-colors"
                >
                  <svg
                    className="w-4 h-4 mr-1.5"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M19 11H5m14-4h-7M5 15h14"
                    />
                  </svg>
                  Manage Constraint Sets
                </button>
                <button
                  type="button"
                  onClick={() =>
                    navigateToTab('calendar', { showIntegrationPanel: true })
                  }
                  className="inline-flex items-center px-3 py-1.5 bg-green-600 text-white text-sm font-medium rounded-md hover:bg-green-700 transition-colors"
                >
                  <svg
                    className="w-4 h-4 mr-1.5"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 002 2z"
                    />
                  </svg>
                  Test in Calendar
                </button>
              </div>
            </div>
          )}

        {/* Main Content */}
        <div className="space-y-6">
          {activeTab === 'manager' && (
            <EnhancedConstraintSetManager
              constraintSets={constraintSets}
              onConstraintSetsChange={handleConstraintSetsChange}
              onConstraintSetSelected={handleConstraintSetSelected}
              integrationState={integrationState}
              onNavigateToParser={() => navigateToTab('parser')}
              onNavigateToCalendar={() => navigateToTab('calendar')}
            />
          )}

          {activeTab === 'parser' && (
            <div className="space-y-8">
              <ConstraintParser
                constraintSets={constraintSets}
                userId={user.id}
                selectedConstraintSetId={
                  integrationState.selectedConstraintSetId
                }
                onConstraintsParsed={handleConstraintsParsed}
                onConstraintsSaved={handleConstraintsSaved}
                onNavigateToManager={() => navigateToTab('manager')}
                onNavigateToCalendar={() => navigateToTab('calendar')}
                integrationState={integrationState}
              />
              <ConfidenceMethodology />
            </div>
          )}

          {activeTab === 'calendar' && (
            <ScheduleCalendar
              constraintSets={constraintSets}
              selectedConstraintSet={integrationState.selectedConstraintSet}
              onConstraintSetSelected={handleConstraintSetSelected}
              onNavigateToParser={() => navigateToTab('parser')}
              onNavigateToManager={() => navigateToTab('manager')}
              integrationState={integrationState}
            />
          )}
        </div>
      </main>
    </div>
  );
}
