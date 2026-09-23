import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";

import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "./auth";
import {
  DEFAULT_CATEGORIES,
  EVENT_STATE_MAP,
  type Application,
  type ApplicationEvent,
  type EventType,
  type Job,
  type WorkflowState,
} from "./types";

export const LEGACY_STORAGE_KEY = "mtt.state.v1";

interface StoreState {
  jobs: Job[];
  applications: Application[];
  events: ApplicationEvent[];
  categories: string[];
}

const emptyState: StoreState = {
  jobs: [],
  applications: [],
  events: [],
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
  ready: boolean;
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
  exportData: () => string;
  importData: (raw: string) => Promise<{ jobs: number; events: number }>;
  hasLegacyLocalData: () => boolean;
  legacyLocalCount: () => number;
  migrateLegacyLocalData: () => Promise<{ jobs: number; events: number }>;
}

const StoreContext = createContext<StoreContextValue | null>(null);

const uid = () => crypto.randomUUID();
const today = () => new Date().toISOString().slice(0, 10);

function sortEvents(events: ApplicationEvent[]) {
  return [...events].sort((a, b) => {
    const da = a.received_at ?? a.event_date ?? a.created_at.slice(0, 10);
    const db = b.received_at ?? b.event_date ?? b.created_at.slice(0, 10);
    if (da === db) return a.created_at.localeCompare(b.created_at);
    return da.localeCompare(db);
  });
}

function readLegacy(): StoreState | null {
  try {
    const raw = window.localStorage.getItem(LEGACY_STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as StoreState;
    if (!Array.isArray(parsed?.jobs)) return null;
    return parsed;
  } catch {
    return null;
  }
}

export function StoreProvider({ children }: { children: ReactNode }) {
  const { user, loading } = useAuth();
  const [state, setState] = useState<StoreState>(emptyState);
  const [ready, setReady] = useState(false);

  const load = useCallback(async () => {
    if (!user) {
      setState(emptyState);
      setReady(false);
      return;
    }
    const [jobsRes, appsRes, evRes, catRes] = await Promise.all([
      supabase.from("jobs").select("*"),
      supabase.from("applications").select("*"),
      supabase.from("application_events").select("*"),
      supabase.from("user_categories").select("name"),
    ]);
    setState({
      jobs: (jobsRes.data ?? []) as unknown as Job[],
      applications: (appsRes.data ?? []) as unknown as Application[],
      events: (evRes.data ?? []) as unknown as ApplicationEvent[],
      categories: Array.from(
        new Set([
          ...DEFAULT_CATEGORIES,
          ...((catRes.data ?? []) as { name: string }[]).map((c) => c.name),
        ]),
      ),
    });
    setReady(true);
  }, [user]);

  useEffect(() => {
    if (loading) return;
    void load();
  }, [loading, load]);

  const persistCategories = useCallback(
    async (names: string[]) => {
      if (!user) return;
      const rows = names
        .filter((n) => !DEFAULT_CATEGORIES.includes(n))
        .map((name) => ({ user_id: user.id, name }));
      if (rows.length) {
        await supabase.from("user_categories").upsert(rows, {
          onConflict: "user_id,name",
          ignoreDuplicates: true,
        });
      }
    },
    [user],
  );

  const addJob = useCallback(
    (input: NewJobInput) => {
      const now = new Date().toISOString();
      const jobId = uid();
      const appId = uid();
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
          id: uid(),
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
          id: uid(),
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

      void (async () => {
        if (!user) return;
        await supabase.from("jobs").insert({ ...job, user_id: user.id });
        await supabase.from("applications").insert({ ...application, user_id: user.id });
        await supabase
          .from("application_events")
          .insert(events.map((e) => ({ ...e, user_id: user.id })));
        await persistCategories(input.categories);
      })();

      return jobId;
    },
    [user, persistCategories],
  );

  const addEvent = useCallback(
    (applicationId: string, input: NewEventInput) => {
      const now = new Date().toISOString();
      const event: ApplicationEvent = {
        id: uid(),
        application_id: applicationId,
        ...input,
        created_at: now,
      };
      let appPatch: Partial<Application> = {};
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
            const { id: _id, job_id: _jid, ...rest } = updated;
            appPatch = rest;
            return updated;
          }),
        };
      });

      void (async () => {
        if (!user) return;
        await supabase
          .from("application_events")
          .insert({ ...event, user_id: user.id });
        if (Object.keys(appPatch).length) {
          await supabase.from("applications").update(appPatch).eq("id", applicationId);
        }
      })();
    },
    [user],
  );

  const updateApplication = useCallback(
    (applicationId: string, patch: Partial<Application>) => {
      setState((s) => ({
        ...s,
        applications: s.applications.map((a) =>
          a.id === applicationId ? { ...a, ...patch } : a,
        ),
      }));
      void supabase.from("applications").update(patch).eq("id", applicationId);
    },
    [],
  );

  const updateJob = useCallback((jobId: string, patch: Partial<Job>) => {
    const now = new Date().toISOString();
    setState((s) => ({
      ...s,
      jobs: s.jobs.map((j) => (j.id === jobId ? { ...j, ...patch, updated_at: now } : j)),
    }));
    void supabase.from("jobs").update(patch).eq("id", jobId);
  }, []);

  const addCategory = useCallback(
    (name: string) => {
      const clean = name.trim();
      if (!clean) return;
      setState((s) =>
        s.categories.includes(clean) ? s : { ...s, categories: [...s.categories, clean] },
      );
      void persistCategories([clean]);
    },
    [persistCategories],
  );

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
    void supabase.from("jobs").delete().eq("id", jobId);
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
    void supabase.from("jobs").delete().in("id", jobIds);
  }, []);

  const assignCategories = useCallback(
    (jobIds: string[], categories: string[], mode: "add" | "replace") => {
      const ids = new Set(jobIds);
      const now = new Date().toISOString();
      let updates: { id: string; categories: string[] }[] = [];
      setState((s) => {
        const jobs = s.jobs.map((j) =>
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
        );
        updates = jobs
          .filter((j) => ids.has(j.id))
          .map((j) => ({ id: j.id, categories: j.categories }));
        return {
          ...s,
          categories: Array.from(new Set([...s.categories, ...categories])),
          jobs,
        };
      });

      void (async () => {
        await persistCategories(categories);
        for (const u of updates) {
          await supabase.from("jobs").update({ categories: u.categories }).eq("id", u.id);
        }
      })();
    },
    [persistCategories],
  );

  const deleteEvent = useCallback((eventId: string) => {
    setState((s) => ({ ...s, events: s.events.filter((e) => e.id !== eventId) }));
    void supabase.from("application_events").delete().eq("id", eventId);
  }, []);

  const exportData = useCallback(
    () =>
      JSON.stringify(
        { version: 1, exported_at: new Date().toISOString(), data: state },
        null,
        2,
      ),
    [state],
  );

  const writeBulk = useCallback(
    async (data: StoreState) => {
      if (!user) throw new Error("Not signed in");
      const jobs = data.jobs.map((j) => ({ ...j, user_id: user.id }));
      const apps = data.applications.map((a) => ({ ...a, user_id: user.id }));
      const events = data.events.map((e) => ({ ...e, user_id: user.id }));
      if (jobs.length) {
        const { error } = await supabase.from("jobs").upsert(jobs);
        if (error) throw error;
      }
      if (apps.length) {
        const { error } = await supabase.from("applications").upsert(apps);
        if (error) throw error;
      }
      if (events.length) {
        const { error } = await supabase.from("application_events").upsert(events);
        if (error) throw error;
      }
      await persistCategories(data.categories);
      await load();
      return { jobs: jobs.length, events: events.length };
    },
    [user, persistCategories, load],
  );

  const normalise = useCallback((data: StoreState): StoreState => {
    // legacy ids were short random strings; the cloud needs UUIDs
    const jobMap = new Map<string, string>();
    const appMap = new Map<string, string>();
    const isUuid = (v: string) =>
      /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(v);
    const mapId = (m: Map<string, string>, v: string) => {
      if (isUuid(v)) return v;
      if (!m.has(v)) m.set(v, uid());
      return m.get(v)!;
    };
    const jobs = data.jobs.map((j) => ({ ...j, id: mapId(jobMap, j.id) }));
    const applications = data.applications.map((a) => ({
      ...a,
      id: mapId(appMap, a.id),
      job_id: mapId(jobMap, a.job_id),
    }));
    const events = (data.events ?? []).map((e) => ({
      ...e,
      id: isUuid(e.id) ? e.id : uid(),
      application_id: mapId(appMap, e.application_id),
    }));
    return {
      jobs,
      applications,
      events,
      categories: data.categories?.length ? data.categories : DEFAULT_CATEGORIES,
    };
  }, []);

  const importData = useCallback(
    async (raw: string) => {
      const parsed = JSON.parse(raw) as { data?: StoreState } & Partial<StoreState>;
      const data = (parsed.data ?? parsed) as StoreState;
      if (!Array.isArray(data.jobs) || !Array.isArray(data.applications)) {
        throw new Error("Invalid backup file");
      }
      return writeBulk(normalise(data));
    },
    [writeBulk, normalise],
  );

  const hasLegacyLocalData = useCallback(() => (readLegacy()?.jobs.length ?? 0) > 0, []);
  const legacyLocalCount = useCallback(() => readLegacy()?.jobs.length ?? 0, []);

  const migrateLegacyLocalData = useCallback(async () => {
    const legacy = readLegacy();
    if (!legacy) throw new Error("No local data found");
    const result = await writeBulk(normalise(legacy));
    window.localStorage.setItem(
      `${LEGACY_STORAGE_KEY}.migrated`,
      new Date().toISOString(),
    );
    return result;
  }, [writeBulk, normalise]);

  const value = useMemo<StoreContextValue>(() => {
    const sorted = sortEvents(state.events);
    return {
      ...state,
      events: sorted,
      ready,
      addJob,
      addEvent,
      updateApplication,
      updateJob,
      addCategory,
      deleteJob,
      deleteJobs,
      assignCategories,
      deleteEvent,
      exportData,
      importData,
      hasLegacyLocalData,
      legacyLocalCount,
      migrateLegacyLocalData,
      applicationForJob: (jobId) => state.applications.find((a) => a.job_id === jobId),
      eventsFor: (applicationId) =>
        sorted.filter((e) => e.application_id === applicationId),
    };
  }, [
    state,
    ready,
    addJob,
    addEvent,
    updateApplication,
    updateJob,
    addCategory,
    deleteJob,
    deleteJobs,
    assignCategories,
    deleteEvent,
    exportData,
    importData,
    hasLegacyLocalData,
    legacyLocalCount,
    migrateLegacyLocalData,
  ]);

  return <StoreContext.Provider value={value}>{children}</StoreContext.Provider>;
}

export function useStore() {
  const ctx = useContext(StoreContext);
  if (!ctx) throw new Error("useStore must be used inside StoreProvider");
  return ctx;
}
