/**
 * Persists the active examination workflow context (Session / Examination /
 * Class / Section) so the user never has to re-select it when moving between
 * Marks and Results, or between the Marks page and the Results page.
 */
export interface ExamWorkflowContext {
  sessionId: string;
  examId: string;
  classId: string;
  sectionId: string;
}

const STORAGE_KEY = "exam_workflow_context";

export function saveExamWorkflowContext(ctx: ExamWorkflowContext): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(ctx));
  } catch {
    // Ignore storage failures (private mode, quota, etc.).
  }
}

export function loadExamWorkflowContext(): ExamWorkflowContext | null {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    if (
      parsed &&
      typeof parsed.sessionId === "string" &&
      typeof parsed.examId === "string" &&
      typeof parsed.classId === "string" &&
      typeof parsed.sectionId === "string"
    ) {
      return parsed;
    }
    return null;
  } catch {
    return null;
  }
}