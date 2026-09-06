import React from 'react';
import {
  Database,
  Settings2,
  BrainCircuit,
  Gauge,
  Lightbulb,
  ArrowRight,
} from 'lucide-react';

const steps = [
  { label: 'Employee Data', icon: Database },
  { label: 'Data Processing', icon: Settings2 },
  { label: 'AI/ML Model', icon: BrainCircuit },
  { label: 'Prediction', icon: Gauge },
  { label: 'HR Insight', icon: Lightbulb },
];

export const MLProcessFlow3D: React.FC = () => {
  return (
    <section className="process-flow-card" aria-label="Employee attrition AI process flow">
      <div className="process-flow-card__heading">
        <div>
          <p className="process-flow-card__eyebrow">AI PROCESS</p>
          <h2>From employee data to HR insight</h2>
        </div>
        <p>Lightweight visual of the existing prediction workflow.</p>
      </div>

      <div className="process-flow-3d">
        {steps.map((step, index) => {
          const Icon = step.icon;
          return (
            <React.Fragment key={step.label}>
              <div className="process-flow-3d__node">
                <div className="process-flow-3d__icon">
                  <Icon className="w-5 h-5" />
                </div>
                <span>{step.label}</span>
              </div>

              {index < steps.length - 1 && (
                <div className="process-flow-3d__connector" aria-hidden="true">
                  <span className="process-flow-3d__pulse" />
                  <ArrowRight className="w-4 h-4" />
                </div>
              )}
            </React.Fragment>
          );
        })}
      </div>
    </section>
  );
};
