-- Project updates can reference the milestone they speak to, so a milestone's
-- story is reconstructable from the timeline.
alter table project_updates
  add column milestone_id uuid references milestones (id) on delete set null;

create index project_updates_milestone_idx on project_updates (milestone_id);
