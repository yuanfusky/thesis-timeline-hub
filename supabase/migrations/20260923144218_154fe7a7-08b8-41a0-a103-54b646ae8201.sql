CREATE TABLE public.jobs (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL DEFAULT auth.uid(),
  title TEXT NOT NULL DEFAULT '',
  company TEXT NOT NULL DEFAULT '',
  location TEXT NOT NULL DEFAULT '',
  application_url TEXT NOT NULL DEFAULT '',
  release_date DATE,
  deadline DATE,
  categories TEXT[] NOT NULL DEFAULT '{}',
  priority TEXT NOT NULL DEFAULT 'Medium',
  notes TEXT NOT NULL DEFAULT '',
  job_description TEXT NOT NULL DEFAULT '',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE public.applications (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL DEFAULT auth.uid(),
  job_id UUID NOT NULL REFERENCES public.jobs(id) ON DELETE CASCADE,
  applied_at DATE,
  workflow_state TEXT NOT NULL DEFAULT 'Saved',
  next_action TEXT NOT NULL DEFAULT '',
  next_action_date DATE,
  last_activity_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE public.application_events (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL DEFAULT auth.uid(),
  application_id UUID NOT NULL REFERENCES public.applications(id) ON DELETE CASCADE,
  event_type TEXT NOT NULL,
  received_at DATE,
  event_date DATE,
  notes TEXT NOT NULL DEFAULT '',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE public.user_categories (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL DEFAULT auth.uid(),
  name TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (user_id, name)
);

CREATE INDEX idx_jobs_user ON public.jobs(user_id);
CREATE INDEX idx_applications_user ON public.applications(user_id);
CREATE INDEX idx_applications_job ON public.applications(job_id);
CREATE INDEX idx_events_user ON public.application_events(user_id);
CREATE INDEX idx_events_application ON public.application_events(application_id);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.jobs TO authenticated;
GRANT ALL ON public.jobs TO service_role;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.applications TO authenticated;
GRANT ALL ON public.applications TO service_role;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.application_events TO authenticated;
GRANT ALL ON public.application_events TO service_role;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.user_categories TO authenticated;
GRANT ALL ON public.user_categories TO service_role;

ALTER TABLE public.jobs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.applications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.application_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_categories ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users manage own jobs" ON public.jobs FOR ALL TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users manage own applications" ON public.applications FOR ALL TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users manage own events" ON public.application_events FOR ALL TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users manage own categories" ON public.user_categories FOR ALL TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

CREATE TRIGGER update_jobs_updated_at BEFORE UPDATE ON public.jobs
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();