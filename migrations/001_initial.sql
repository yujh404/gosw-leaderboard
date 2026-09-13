CREATE TABLE IF NOT EXISTS photos (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  data bytea NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL CHECK (length(name) BETWEEN 1 AND 60),
  description text NOT NULL DEFAULT '' CHECK (length(description) <= 2000),
  rules text NOT NULL DEFAULT '' CHECK (length(rules) <= 4000),
  status text NOT NULL DEFAULT 'waiting' CHECK (status IN ('waiting','live','completed')),
  photo_id uuid REFERENCES photos(id),
  position integer NOT NULL,
  version integer NOT NULL DEFAULT 1,
  scores jsonb NOT NULL DEFAULT '{"1":0,"2":0,"3":0,"4":0,"5":0}',
  updated_at timestamptz NOT NULL DEFAULT now(),
  CHECK (jsonb_typeof(scores) = 'object' AND scores ?& ARRAY['1','2','3','4','5'])
);

CREATE TABLE IF NOT EXISTS sessions (
  token_hash text PRIMARY KEY,
  expires_at timestamptz NOT NULL
);
CREATE INDEX IF NOT EXISTS sessions_expiry_idx ON sessions(expires_at);

CREATE TABLE IF NOT EXISTS login_attempts (
  key text PRIMARY KEY,
  attempts integer NOT NULL,
  window_start timestamptz NOT NULL
);
