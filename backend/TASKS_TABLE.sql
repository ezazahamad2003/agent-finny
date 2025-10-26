-- Tasks Table for FINNY
-- This table stores user tasks and their associated AI meeting information

CREATE TABLE IF NOT EXISTS tasks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id UUID NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT,
  status TEXT NOT NULL DEFAULT 'todo' CHECK (status IN ('todo', 'in_progress', 'done')),
  
  -- Meeting details
  email TEXT,
  links TEXT[],
  meeting_id UUID,
  meeting_link TEXT,
  
  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW(),
  completed_at TIMESTAMPTZ,
  
  -- Additional metadata
  metadata JSONB DEFAULT '{}'::jsonb
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS tasks_workspace_id_idx ON tasks(workspace_id);
CREATE INDEX IF NOT EXISTS tasks_status_idx ON tasks(status);
CREATE INDEX IF NOT EXISTS tasks_meeting_id_idx ON tasks(meeting_id);
CREATE INDEX IF NOT EXISTS tasks_created_at_idx ON tasks(created_at DESC);

-- Add comments
COMMENT ON TABLE tasks IS 'Stores user tasks with AI meeting integration';
COMMENT ON COLUMN tasks.status IS 'Task status: todo, in_progress, or done';
COMMENT ON COLUMN tasks.meeting_id IS 'Unique identifier for AI meeting session';
COMMENT ON COLUMN tasks.links IS 'Array of relevant links for the task';
