import React, { useState } from 'react';
import { GoalProgress } from '../components/GoalProgress';
import { Navigation } from '../components/Navigation';
import { PageHeader } from '../components/PageHeader';
import { EmptyState } from '../components/EmptyState';
import { AddGoalModal } from '../components/AddGoalModal';
import { GoalDetails } from '../components/GoalDetails';
import { useGoals } from '../hooks/useGoals';

const Goals: React.FC = () => {
  const {
    goals,
    selectedGoal,
    setSelectedGoal,
    loading,
    error,
    formData,
    setFormData,
    handleSubmit,
    handleUpdateProgress,
    handleDelete,
    getProgressPercentage
  } = useGoals();
  
  const [showAddModal, setShowAddModal] = useState(false);

  const handleGoalSubmit = async (e: React.FormEvent) => {
    const success = await handleSubmit(e);
    if (success) {
      setShowAddModal(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#121420] flex items-center justify-center">
        <div className="text-cyan-400 text-xl">Loading goals...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#121420] text-gray-300">
      <Navigation currentPage="/goals" />

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <PageHeader
          title="Goals & Milestones"
          subtitle="LONG-TERM OBJECTIVES // PROGRESS TRACKING"
          actionButton={{
            label: "New Goal",
            onClick: () => setShowAddModal(true),
            icon: (
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
              </svg>
            )
          }}
        />

        {error && (
          <div className="mb-6 p-4 bg-red-500/10 border border-red-500/50 rounded-xl">
            <p className="text-red-400 text-sm text-center font-medium">{error}</p>
          </div>
        )}

        {/* Goals Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Goals List */}
          <div className="lg:col-span-2 space-y-4">
            {goals.length === 0 ? (
              <EmptyState
                icon={
                  <svg className="w-16 h-16" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4M7.835 4.697a3.42 3.42 0 001.946-.806 3.42 3.42 0 014.438 0 3.42 3.42 0 001.946.806 3.42 3.42 0 013.138 3.138 3.42 3.42 0 00.806 1.946 3.42 3.42 0 010 4.438 3.42 3.42 0 00-.806 1.946 3.42 3.42 0 01-3.138 3.138 3.42 3.42 0 00-1.946.806 3.42 3.42 0 01-4.438 0 3.42 3.42 0 00-1.946-.806 3.42 3.42 0 01-3.138-3.138 3.42 3.42 0 00-.806-1.946 3.42 3.42 0 010-4.438 3.42 3.42 0 00.806-1.946 3.42 3.42 0 013.138-3.138z" />
                  </svg>
                }
                title="No Goals Yet"
                description="Set your first milestone and start tracking progress"
                actionButton={{
                  label: "Create First Goal",
                  onClick: () => setShowAddModal(true)
                }}
              />
            ) : (
              goals.map((goal) => {
                const goalData = {
                  id: goal.id.toString(),
                  name: goal.name,
                  progress: goal.progress,
                  target: goal.target,
                  progress_percentage: getProgressPercentage(goal),
                  category: goal.type,
                  deadline: goal.deadline
                };
                
                return (
                  <div key={goal.id} onClick={() => setSelectedGoal(goal)}>
                    <GoalProgress goal={goalData} />
                  </div>
                );
              })
            )}
          </div>

          <div className="space-y-6">
            {selectedGoal ? (
              <GoalDetails 
                goal={selectedGoal} 
                onDelete={handleDelete}
                onUpdateProgress={handleUpdateProgress}
              />
            ) : (
              <div className="bg-[#1c1f2e] border border-white/5 p-12 rounded-[2rem] text-center sticky top-24">
                <svg className="w-12 h-12 text-gray-600 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <p className="text-gray-500 text-sm">Select a goal to view details</p>
              </div>
            )}
          </div>
        </div>
      </div>

      <AddGoalModal
        isOpen={showAddModal}
        onClose={() => setShowAddModal(false)}
        onSubmit={handleGoalSubmit}
        formData={formData}
        setFormData={setFormData}
      />
    </div>
  );
};

export default Goals;