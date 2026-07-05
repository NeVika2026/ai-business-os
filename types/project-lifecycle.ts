export type ProjectLifecycleSnapshot = {
  projectId: string;
  projectName: string;
  detectedType: string;
  detectedTypeLabel: string;
  specialists: Array<{ role: string; status: string }>;
  workPlan: Array<{
    title: string;
    estimate: string;
    priorityLabel: string;
  }>;
  executiveBrief: string;
  firstStepPrompt: string;
  organizedAt: string;
};
