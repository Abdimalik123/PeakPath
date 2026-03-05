import { useState } from 'react';
import { Button } from './Button';
import { Copy, CheckCircle, Loader } from 'lucide-react';
import { useToast } from '../contexts/ToastContext';
import client from '../api/client';

interface RepeatWorkoutButtonProps {
  onSuccess?: () => void;
  variant?: 'primary' | 'secondary';
  showLabel?: boolean;
}

export function RepeatWorkoutButton({ 
  onSuccess, 
  variant = 'primary',
  showLabel = true 
}: RepeatWorkoutButtonProps) {
  const { showToast } = useToast();
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);

  const handleRepeatLastWorkout = async () => {
    setLoading(true);
    
    try {
      // First, get the last workout
      const lastWorkoutResponse = await client.get('/workouts/last');
      
      if (!lastWorkoutResponse.data.success) {
        showToast('No previous workouts found', 'info');
        setLoading(false);
        return;
      }

      const lastWorkout = lastWorkoutResponse.data.workout;

      // Duplicate it
      const duplicateResponse = await client.post(`/workouts/${lastWorkout.id}/duplicate`);

      if (duplicateResponse.data.success) {
        setSuccess(true);
        showToast('Workout repeated successfully! 🎉', 'success');
        
        if (duplicateResponse.data.prs_achieved && duplicateResponse.data.prs_achieved.length > 0) {
          const prCount = duplicateResponse.data.prs_achieved.length;
          setTimeout(() => {
            showToast(`🏆 ${prCount} new PR${prCount > 1 ? 's' : ''} achieved!`, 'success');
          }, 1000);
        }

        setTimeout(() => {
          setSuccess(false);
          if (onSuccess) onSuccess();
        }, 2000);
      }
    } catch (error: any) {
      console.error('Failed to repeat workout:', error);
      showToast(error.response?.data?.message || 'Failed to repeat workout', 'error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Button
      onClick={handleRepeatLastWorkout}
      disabled={loading || success}
      className={variant === 'primary' ? 'pp-btn-primary' : 'pp-btn-secondary'}
    >
      {loading && <Loader className="w-4 h-4 mr-2 animate-spin" />}
      {success && <CheckCircle className="w-4 h-4 mr-2 text-[var(--brand-primary)]" />}
      {!loading && !success && <Copy className="w-4 h-4 mr-2" />}
      {showLabel && (
        <span>
          {loading ? 'Copying...' : success ? 'Repeated!' : 'Repeat Last Workout'}
        </span>
      )}
    </Button>
  );
}