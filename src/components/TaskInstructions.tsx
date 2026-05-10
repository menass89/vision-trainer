import { Info } from 'lucide-react';
import type { ParadigmId } from '../types';
import type { PlannedBlock } from '../session/sessionPlanner';
import { paradigmLabel } from '../utils/labels';

type TaskInstructionsProps = {
  block: PlannedBlock;
  onDismiss: () => void;
};

const roleCopy: Record<PlannedBlock['role'], string> = {
  'warm-up': 'Easy warm-up round with a coarse pattern. Get your eyes adjusted.',
  training: 'Main training block. The pattern strength adapts to your current detection level.',
  assessment: 'Final check. We measure your current sharpness score to track improvement over sessions.'
};

const paradigmCopy: Record<ParadigmId, string> = {
  'contrast-detection': 'One interval contains a faint striped pattern, and the other is blank.',
  'lateral-masking': 'The target appears with aligned side patterns that train pattern grouping.',
  'spatial-masking': 'The target appears inside nearby mixed patterns, training clutter resistance.',
  'backward-masking': 'The target is followed by a brief noisy mask. The gap gets shorter as temporal processing improves.',
  'pedestal-discrimination': 'Both intervals contain a visible pattern. Choose the interval with the slightly stronger contrast.'
};

export function TaskInstructions({ block, onDismiss }: TaskInstructionsProps) {
  return (
    <div className="instruction-card" role="status" aria-live="polite">
      <div className="section-heading compact">
        <Info size={18} />
        <div>
          <h2>{block.label}</h2>
          <span>{paradigmLabel(block.paradigm)}</span>
        </div>
      </div>
      <p>{roleCopy[block.role]}</p>
      <p>{paradigmCopy[block.paradigm]}</p>
      <ul>
        <li>You will see two intervals.</li>
        <li>Press 1 if the pattern appeared in Interval 1, or press 2 if it appeared in Interval 2.</li>
        <li>The pattern will get harder to see as you improve. This is normal.</li>
      </ul>
      <button type="button" className="primary-button wide" onClick={onDismiss}>
        Got it
      </button>
    </div>
  );
}
