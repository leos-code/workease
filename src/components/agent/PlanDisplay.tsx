/**
 * Plan Display Component
 * Shows the agent's execution plan with steps
 */

import { CheckCircle, Circle, AlertCircle } from "lucide-react";
import type { TaskPlan } from "../../types";

interface PlanDisplayProps {
  plan: TaskPlan;
  isComplete?: boolean;
}

export function PlanDisplay({ plan, isComplete = false }: PlanDisplayProps) {
  return (
    <div className="bg-[var(--bg-elevated)] border border-[var(--border-subtle)] rounded-lg p-5 mb-4">
      {/* Header */}
      <div className="flex items-center gap-3 mb-4">
        <div className="w-8 h-8 rounded-full bg-[var(--accent-primary)] bg-opacity-10 flex items-center justify-center">
          {isComplete ? (
            <CheckCircle size={18} className="text-[var(--accent-primary)]" />
          ) : (
            <AlertCircle size={18} className="text-[var(--warning)]" />
          )}
        </div>
        <div className="flex flex-col gap-0.5">
          <h3 className="text-sm font-semibold text-[var(--text-primary)]">
            Execution Plan
          </h3>
          <p className="text-xs text-[var(--text-tertiary)]">
            {plan.steps?.length || 0} steps • {isComplete ? "Complete" : "In Progress"}
          </p>
        </div>
      </div>

      {/* Goal */}
      {plan.goal && (
        <div className="mb-3 p-3 bg-[var(--bg-tertiary)] rounded-md">
          <p className="text-xs text-[var(--text-secondary)] mb-1">Goal</p>
          <p className="text-sm text-[var(--text-primary)]">{plan.goal}</p>
        </div>
      )}

      {/* Steps */}
      {plan.steps && plan.steps.length > 0 && (
        <div className="space-y-2">
          <p className="text-xs text-[var(--text-tertiary)] uppercase tracking-wide font-medium">
            Steps
          </p>
          {plan.steps.map((step, index) => (
            <div
              key={index}
              className="flex items-start gap-3 p-2.5 hover:bg-[var(--bg-tertiary)] rounded-md transition-colors"
            >
              <div className="flex-shrink-0 w-5 h-5 rounded-full border-2 border-[var(--border-subtle)] flex items-center justify-center mt-0.5">
                <span className="text-xs text-[var(--text-tertiary)] font-medium">
                  {index + 1}
                </span>
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm text-[var(--text-primary)] break-words">
                  {step.description || step.action || "Untitled step"}
                </p>
                {step.tool && (
                  <p className="text-xs text-[var(--text-tertiary)] mt-0.5">
                    Tool: {step.tool}
                  </p>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
