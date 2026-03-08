import { useNavigate } from 'react-router-dom';
import { Card, CardContent } from './Card';
import { Button } from './Button';
import { 
  Dumbbell, 
  CheckCircle, 
  Target, 
  Users, 
  TrendingUp,
  Zap,
  Play
} from 'lucide-react';

interface EmptyStateGuideProps {
  type?: 'dashboard' | 'workouts' | 'habits' | 'goals';
}

export function EmptyStateGuide({ type = 'dashboard' }: EmptyStateGuideProps) {
  const navigate = useNavigate();

  const guides = {
    dashboard: {
      title: "Welcome to PeakPath! 🎉",
      subtitle: "Let's get you started on your fitness journey",
      steps: [
        {
          icon: Dumbbell,
          title: "Log Your First Workout",
          description: "Track your exercises, sets, reps, and weight",
          action: "Log Workout",
          path: "/train",
          color: "green"
        },
        {
          icon: CheckCircle,
          title: "Create a Habit",
          description: "Build consistency with daily habits and streaks",
          action: "Create Habit",
          path: "/habits",
          color: "blue"
        },
        {
          icon: Target,
          title: "Set Your Goals",
          description: "Define what you want to achieve and track progress",
          action: "Set Goals",
          path: "/habits",
          color: "purple"
        },
        {
          icon: Users,
          title: "Connect with Friends",
          description: "Join the community, find workout partners, and compete",
          action: "Explore Social",
          path: "/community",
          color: "orange"
        }
      ]
    },
    workouts: {
      title: "Start Tracking Your Workouts",
      subtitle: "Build strength and see your progress over time",
      steps: [
        {
          icon: Zap,
          title: "Quick Start",
          description: "Log a simple workout to get started",
          action: "Log First Workout",
          path: "/train",
          color: "green"
        },
        {
          icon: TrendingUp,
          title: "Track Your Progress",
          description: "See your strength gains and workout trends over time",
          action: "View Progress",
          path: "/progress",
          color: "purple"
        }
      ]
    },
    habits: {
      title: "Build Consistent Habits",
      subtitle: "Small daily actions lead to big transformations",
      steps: [
        {
          icon: CheckCircle,
          title: "Create Your First Habit",
          description: "Start with something simple like drinking water daily",
          action: "Create Habit",
          path: "/habits",
          color: "blue"
        }
      ]
    },
    goals: {
      title: "Set Your Fitness Goals",
      subtitle: "What do you want to achieve?",
      steps: [
        {
          icon: Target,
          title: "Define Your Goal",
          description: "Be specific: weight loss, strength gain, or endurance",
          action: "Create Goal",
          path: "/progress",
          color: "purple"
        }
      ]
    }
  };

  const guide = guides[type];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="text-center mb-8">
        <h2 className="text-2xl md:text-3xl font-bold text-[var(--text-primary)] mb-2">
          {guide.title}
        </h2>
        <p className="text-[var(--text-secondary)]">{guide.subtitle}</p>
      </div>

      {/* Quick Stats Explanation */}
      {type === 'dashboard' && (
        <Card className="mb-6 bg-gradient-to-br from-[var(--brand-primary)]/10 to-[var(--brand-secondary)]/10 border-[var(--brand-primary)]/20">
          <CardContent className="p-6">
            <div className="flex items-start gap-4">
              <div className="p-3 rounded-lg bg-[var(--brand-primary)]/20">
                <Play className="w-6 h-6 text-[var(--brand-primary)]" />
              </div>
              <div>
                <h3 className="font-semibold text-[var(--text-primary)] mb-1">
                  Your dashboard will come alive as you track
                </h3>
                <p className="text-sm text-[var(--text-secondary)]">
                  We'll show you workout heatmaps, achievement progress, daily quests, 
                  leaderboard rankings, and detailed analytics. Complete the steps below to unlock everything!
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Step Cards */}
      <div className="grid md:grid-cols-2 gap-4">
        {guide.steps.map((step, index) => {
          const Icon = step.icon;
          return (
            <Card key={index} className="hover:shadow-lg transition-shadow">
              <CardContent className="p-6">
                <div className="flex items-start gap-4">
                  <div className={`p-3 rounded-lg ${
                    step.color === 'green' ? 'bg-[var(--brand-primary)]/15 text-[var(--brand-primary)]' :
                    step.color === 'blue' ? 'bg-[var(--brand-secondary)]/15 text-[var(--brand-secondary)]' :
                    step.color === 'purple' ? 'bg-purple-500/15 text-purple-400' :
                    'bg-orange-500/15 text-orange-400'
                  }`}>
                    <Icon className="w-6 h-6" />
                  </div>
                  <div className="flex-1">
                    <h3 className="font-semibold text-[var(--text-primary)] mb-1">
                      {index + 1}. {step.title}
                    </h3>
                    <p className="text-sm text-[var(--text-secondary)] mb-4">
                      {step.description}
                    </p>
                    <Button
                      onClick={() => navigate(step.path)}
                      className={
                        step.color === 'green' ? 'pp-btn-primary' :
                        step.color === 'blue' ? 'pp-btn-secondary' :
                        'pp-btn-secondary'
                      }
                    >
                      {step.action}
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Sample Data Option */}
      {type === 'dashboard' && (
        <Card className="mt-6 border-dashed border-2 border-[var(--border-default)]">
          <CardContent className="p-6 text-center">
            <p className="text-[var(--text-secondary)] mb-4">
              Want to explore the platform first?
            </p>
            <div className="flex gap-3 justify-center flex-wrap">
              <Button
                onClick={() => navigate('/train')}
                className="pp-btn-primary"
              >
                Start Tracking Now
              </Button>
              <Button
                onClick={() => navigate('/community')}
                className="pp-btn-secondary"
              >
                Join Community
              </Button>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}