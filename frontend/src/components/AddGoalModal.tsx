import React from 'react';
import { Modal } from './Modal';
import { FormInput } from './FormInput';

interface AddGoalModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (e: React.FormEvent) => void;
  formData: {
    name: string;
    goal_type: string;
    target: string;
    progress: string;
    deadline: string;
  };
  setFormData: (data: any) => void;
}

export function AddGoalModal({
  isOpen,
  onClose,
  onSubmit,
  formData,
  setFormData
}: AddGoalModalProps) {
  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Create Goal"
    >
      <form onSubmit={onSubmit} className="space-y-4">
        <FormInput
          label="Goal Name"
          value={formData.name}
          onChange={(value) => setFormData({ ...formData, name: value })}
          placeholder="e.g., Run 100km this month"
          required
        />

        <div className="grid grid-cols-2 gap-4">
          <FormInput
            label="Type"
            type="select"
            value={formData.goal_type}
            onChange={(value) => setFormData({ ...formData, goal_type: value })}
            options={[
              { value: 'fitness', label: 'Fitness' },
              { value: 'weight', label: 'Weight' },
              { value: 'habit', label: 'Habit' },
              { value: 'skill', label: 'Skill' },
              { value: 'other', label: 'Other' }
            ]}
          />

          <FormInput
            label="Target"
            type="number"
            value={formData.target}
            onChange={(value) => setFormData({ ...formData, target: value })}
            placeholder="100"
            required
          />
        </div>

        <FormInput
          label="Current Progress"
          type="number"
          value={formData.progress}
          onChange={(value) => setFormData({ ...formData, progress: value })}
          placeholder="0"
        />

        <FormInput
          label="Deadline"
          type="date"
          value={formData.deadline}
          onChange={(value) => setFormData({ ...formData, deadline: value })}
          required
        />

        <button
          type="submit"
          className="w-full bg-cyan-500 hover:bg-cyan-400 text-[#121420] py-4 rounded-xl font-bold uppercase tracking-wider text-sm transition shadow-[0_0_20px_rgba(34,211,238,0.3)]"
        >
          Create Goal
        </button>
      </form>
    </Modal>
  );
}
