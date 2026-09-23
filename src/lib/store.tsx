import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";

import { SEED_APPLICATIONS, SEED_EVENTS, SEED_JOBS } from "./seed";
import {
  DEFAULT_CATEGORIES,
  EVENT_STATE_MAP,
  type Application,
  type ApplicationEvent,
  type EventType,
  type Job,
  type WorkflowState,
} from "./types";

const STORAGE_KEY = "mtt.state.v1";

interface StoreState {
  jobs: Job[];
  applications: Application[];
  events: ApplicationEvent[];
  categories: string[];
}

const initialState: StoreState = {
  jobs: SEED_JOBS,
  applications: SEED_APPLICATIONS,
  events: SEED_EVENTS,
  categories: DEFAULT_CATEGORIES,
};

export interface NewJobInput {
  title: string;
  company: string;
  location: string;
  application_url: string;
  release_date: string | null;
  deadline: string | null;
  categories: string[];
  priority: Job["priority"];
  notes: string;
  job_description: string;
  initial_state: Extract<WorkflowState, "Saved" | "To Apply">;
}

export interface NewEventInput {
  event_type: EventType;
  received_at: string | null;
  event_date: string | null;
  notes: string;
}

interface StoreContextValue extends StoreState {
  addJob: (input: NewJobInput) => string;
  addEvent: (applicationId: string, input: NewEventInput) => void;
  updateApplication: (applicationId: string, patch: Partial<Application>) => void;
  updateJob: (jobId: string, patch: Partial<Job>) => void;
  addCategory: (name: string) => void;
  deleteJob: (jobId: string) => void;
  deleteJobs: (jobIds: string[]) => void;
  assignCategories: (
    jobIds: string[],
    categories: string[],
    mode: "add" | "replace",
  ) => void;
  deleteEvent: (eventId: string) => void;
  applicationForJob: (jobId: string) => Application | undefined;
  eventsFor: (applicationId: string) => ApplicationEvent[];
  resetToSeed: () => void;
  exportData: () => string;
  importData: (raw: string) => { jobs: number; events: number };
}

const StoreContext = createContext<StoreContextValue | null>(null);

const uid = () => Math.random().toString(36).slice(2, 10);
const today = () => new Date().toISOString().slice(0, 10);

function sortEvents(events: ApplicationEvent[]) {
  return [...events].sort((a, b) => {
    const da = a.received_at ?? a.event_date ?? a.created_at.slice(0, 10);
    const db = b.received_at ?? b.event_date ?? b.created_at.slice(0, 10);
    if (da === db) return a.created_at.localeCompare(b.created_at);
    return da.localeCompare(db);
  });
}

export function StoreProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<StoreState>(initialState);
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    try {
      const raw = window.localStorage.getItem(STORAGE_KEY);
      if (raw) setState(JSON.parse(raw) as StoreState);
    } catch {
      /* ignore corrupt storage */
    }
    setHydrated(true);
  }, []);

  useEffect(() => {
    if (!hydrated) return;
    try {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
    } catch {
      /* storage full or unavailable */
    }
  }, [state, hydrated]);

  const addJob = useCallback((input: NewJobInput) => {
    const now = new Date().toISOString();
    const jobId = `job-${uid()}`;
    const appId = `app-${uid()}`;
    const job: Job = {
      id: jobId,
      title: input.title,
      company: input.company,
      location: input.location,
      application_url: input.application_url,
      release_date: input.release_date,
      deadline: input.deadline,
      categories: input.categories,
      priority: input.priority,
      notes: input.notes,
      job_description: input.job_description,
      created_at: now,
      updated_at: now,
    };
    const application: Application = {
      id: appId,
      job_id: jobId,
      applied_at: null,
      workflow_state: input.initial_state,
      next_action: input.initial_state === "To Apply" ? "Submit application" : "",
      next_action_date: input.initial_state === "To Apply" ? input.deadline : null,
      last_activity_at: now,
    };
    const events: ApplicationEvent[] = [
      {
        id: `ev-${uid()}`,
        application_id: appId,
        event_type: "Job Saved",
        received_at: today(),
        event_date: null,
        notes: "",
        created_at: now,
      },
    ];
    if (input.initial_state === "To Apply") {
      events.push({
        id: `ev-${uid()}`,
        application_id: appId,
        event_type: "Marked To Apply",
        received_at: today(),
        event_date: null,
        notes: "",
        created_at: now,
      });
    }
    setState((s) => ({
      ...s,
      jobs: [job, ...s.jobs],
      applications: [application, ...s.applications],
      events: [...s.events, ...events],
      categories: Array.from(new Set([...s.categories, ...input.categories])),
    }));
    return jobId;
  }, []);

  const addEvent = useCallback((applicationId: string, input: NewEventInput) => {
    const now = new Date().toISOString();
    const event: ApplicationEvent = {
      id: `ev-${uid()}`,
      application_id: applicationId,
      ...input,
      created_at: now,
    };
    setState((s) => {
      const nextState = EVENT_STATE_MAP[input.event_type];
      return {
        ...s,
        events: [...s.events, event],
        applications: s.applications.map((a) => {
          if (a.id !== applicationId) return a;
          const updated: Application = { ...a, last_activity_at: now };
          if (nextState) updated.workflow_state = nextState;
          if (input.event_type === "Application Submitted") {
            updated.applied_at = input.received_at ?? today();
          }
          if (input.event_type === "Interview Invitation" && input.event_date) {
            updated.next_action = "Prepare for interview";
            updated.next_action_date = input.event_date;
          }
          if (
            input.event_type === "Rejection Received" ||
            input.event_type === "Application Withdrawn"
          ) {
            updated.next_action = "";
            updated.next_action_date = null;
          }
          return updated;
        }),
      };
    });
  }, []);

  const updateApplication = useCallback(
    (applicationId: string, patch: Partial<Application>) => {
      setState((s) => ({
        ...s,
        applications: s.applications.map((a) =>
          a.id === applicationId ? { ...a, ...patch } : a,
        ),
      }));
    },
    [],
  );

  const updateJob = useCallback((jobId: string, patch: Partial<Job>) => {
    const now = new Date().toISOString();
    setState((s) => ({
      ...s,
      jobs: s.jobs.map((j) => (j.id === jobId ? { ...j, ...patch, updated_at: now } : j)),
    }));
  }, []);

  const addCategory = useCallback((name: string) => {
    const clean = name.trim();
    if (!clean) return;
    setState((s) =>
      s.categories.includes(clean) ? s : { ...s, categories: [...s.categories, clean] },
    );
  }, []);

  const deleteJob = useCallback((jobId: string) => {
    setState((s) => {
      const appIds = s.applications.filter((a) => a.job_id === jobId).map((a) => a.id);
      return {
        ...s,
        jobs: s.jobs.filter((j) => j.id !== jobId),
        applications: s.applications.filter((a) => a.job_id !== jobId),
        events: s.events.filter((e) => !appIds.includes(e.application_id)),
      };
    });
  }, []);

  const deleteJobs = useCallback((jobIds: string[]) => {
    const ids = new Set(jobIds);
    setState((s) => {
      const appIds = new Set(
        s.applications.filter((a) => ids.has(a.job_id)).map((a) => a.id),
      );
      return {
        ...s,
        jobs: s.jobs.filter((j) => !ids.has(j.id)),
        applications: s.applications.filter((a) => !ids.has(a.job_id)),
        events: s.events.filter((e) => !appIds.has(e.application_id)),
      };
    });
  }, []);

  const assignCategories = useCallback(
    (jobIds: string[], categories: string[], mode: "add" | "replace") => {
      const ids = new Set(jobIds);
      const now = new Date().toISOString();
      setState((s) => ({
        ...s,
        categories: Array.from(new Set([...s.categories, ...categories])),
        jobs: s.jobs.map((j) =>
          ids.has(j.id)
            ? {
                ...j,
                categories:
                  mode === "replace"
                    ? [...categories]
                    : Array.from(new Set([...j.categories, ...categories])),
                updated_at: now,
              }
            : j,
        ),
      }));
    },
    [],
  );

  const deleteEvent = useCallback((eventId: string) => {
    setState((s) => ({ ...s, events: s.events.filter((e) => e.id !== eventId) }));
  }, []);

  const resetToSeed = useCallback(() => setState(initialState), []);

  const exportData = useCallback(
    () =>
      JSON.stringify(
        { version: 1, exported_at: new Date().toISOString(), data: state },
        null,
        2,
      ),
    [state],
  );

  const importData = useCallback((raw: string) => {
    const parsed = JSON.parse(raw) as
      | { data?: Partial<StoreState> }
      | Partial<StoreState>;
    const data = (("data" in parsed && parsed.data ? parsed.data : parsed) ??
      {}) as Partial<StoreState>;
    if (!Array.isArray(data.jobs) || !Array.isArray(data.applications)) {
      throw new Error("Invalid backup file");
    }
    const next: StoreState = {
      jobs: data.jobs,
      applications: data.applications,
      events: Array.isArray(data.events) ? data.events : [],
      categories: Array.isArray(data.categories) && data.categories.length
        ? data.categories
        : DEFAULT_CATEGORIES,
    };
    setState(next);
    return { jobs: next.jobs.length, events: next.events.length };
  }, []);

  const value = useMemo<StoreContextValue>(() => {
    const sorted = sortEvents(state.events);
    return {
      ...state,
      events: sorted,
      addJob,
      addEvent,
      updateApplication,
      updateJob,
      addCategory,
      deleteJob,
      deleteJobs,
      assignCategories,
      deleteEvent,
      resetToSeed,
      exportData,
      importData,
      applicationForJob: (jobId) => state.applications.find((a) => a.job_id === jobId),
      eventsFor: (applicationId) =>
        sorted.filter((e) => e.application_id === applicationId),
    };
  }, [
    state,
    addJob,
    addEvent,
    updateApplication,
    updateJob,
    addCategory,
    deleteJob,
    deleteJobs,
    assignCategories,
    deleteEvent,
    resetToSeed,
  ]);

  return <StoreContext.Provider value={value}>{children}</StoreContext.Provider>;
}

export function useStore() {
  const ctx = useContext(StoreContext);
  if (!ctx) throw new Error("useStore must be used inside StoreProvider");
  return ctx;
}
