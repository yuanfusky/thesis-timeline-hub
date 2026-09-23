export type Priority = "High" | "Medium" | "Low";

export const PRIORITIES: Priority[] = ["High", "Medium", "Low"];

export type WorkflowState =
  | "Saved"
  | "To Apply"
  | "Applied"
  | "Interview"
  | "Offer"
  | "Rejected"
  | "Withdrawn";

export const WORKFLOW_STATES: WorkflowState[] = [
  "Saved",
  "To Apply",
  "Applied",
  "Interview",
  "Offer",
  "Rejected",
  "Withdrawn",
];

export type EventType =
  | "Job Saved"
  | "Marked To Apply"
  | "Application Submitted"
  | "Interview Invitation"
  | "Interview Round 1"
  | "Interview Round 2"
  | "Technical Interview"
  | "HR Interview"
  | "Case / Assignment"
  | "Follow-up Sent"
  | "Offer Received"
  | "Rejection Received"
  | "Application Withdrawn"
  | "Other";

export const EVENT_TYPES: EventType[] = [
  "Job Saved",
  "Marked To Apply",
  "Application Submitted",
  "Interview Invitation",
  "Interview Round 1",
  "Interview Round 2",
  "Technical Interview",
  "HR Interview",
  "Case / Assignment",
  "Follow-up Sent",
  "Offer Received",
  "Rejection Received",
  "Application Withdrawn",
  "Other",
];

export const DEFAULT_CATEGORIES = [
  "Applied ML",
  "Machine Learning",
  "Sensor Fusion",
  "Robotics",
  "SLAM",
  "Computer Vision",
  "LLM",
  "NLP",
  "RAG",
  "Signal Processing",
  "Communication",
  "Data Engineering",
  "ML Engineering",
  "Bayesian / Probabilistic ML",
  "Embedded / Edge AI",
  "Industrial AI",
  "Other",
];

export interface Job {
  id: string;
  title: string;
  company: string;
  location: string;
  application_url: string;
  release_date: string | null;
  deadline: string | null;
  categories: string[];
  priority: Priority;
  notes: string;
  job_description: string;
  created_at: string;
  updated_at: string;
}

export interface Application {
  id: string;
  job_id: string;
  applied_at: string | null;
  workflow_state: WorkflowState;
  next_action: string;
  next_action_date: string | null;
  last_activity_at: string;
}

export interface ApplicationEvent {
  id: string;
  application_id: string;
  event_type: EventType;
  received_at: string | null;
  event_date: string | null;
  notes: string;
  created_at: string;
}

/** Which event types move the workflow state forward. */
export const EVENT_STATE_MAP: Partial<Record<EventType, WorkflowState>> = {
  "Job Saved": "Saved",
  "Marked To Apply": "To Apply",
  "Application Submitted": "Applied",
  "Interview Invitation": "Interview",
  "Interview Round 1": "Interview",
  "Interview Round 2": "Interview",
  "Technical Interview": "Interview",
  "HR Interview": "Interview",
  "Case / Assignment": "Interview",
  "Offer Received": "Offer",
  "Rejection Received": "Rejected",
  "Application Withdrawn": "Withdrawn",
};

/** Event types that count as a first meaningful response from the company. */
export const RESPONSE_EVENTS: EventType[] = [
  "Interview Invitation",
  "Technical Interview",
  "HR Interview",
  "Case / Assignment",
  "Offer Received",
  "Rejection Received",
];

/** Date field configuration per event type (context-aware forms). */
export function eventDateFields(type: EventType): {
  received?: string;
  event?: string;
} {
  switch (type) {
    case "Job Saved":
    case "Marked To Apply":
      return { received: "Date" };
    case "Application Submitted":
      return { received: "Application Date" };
    case "Interview Invitation":
      return { received: "Received Date", event: "Interview Date" };
    case "Interview Round 1":
    case "Interview Round 2":
    case "Technical Interview":
    case "HR Interview":
      return { event: "Interview Date" };
    case "Case / Assignment":
      return { received: "Received Date", event: "Due Date" };
    case "Follow-up Sent":
      return { received: "Sent Date" };
    case "Offer Received":
      return { received: "Received Date", event: "Decision Deadline" };
    case "Rejection Received":
      return { received: "Received Date" };
    case "Application Withdrawn":
      return { received: "Date" };
    default:
      return { received: "Received Date", event: "Event Date" };
  }
}
