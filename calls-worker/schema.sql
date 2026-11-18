-- D1: журнал звонков «Мои Звонки». Связь со сделками: client_phone (+996…) и user_login (email агента).
CREATE TABLE IF NOT EXISTS calls (
  id            TEXT PRIMARY KEY,           -- account_id:db_call_id, защита от дублей
  user_login    TEXT NOT NULL,              -- email сотрудника в «Мои Звонки» = агент
  direction     TEXT NOT NULL CHECK (direction IN ('in','out')),
  client_phone  TEXT NOT NULL,              -- нормализован до +996…
  client_name   TEXT NOT NULL DEFAULT '',
  start_time    INTEGER NOT NULL DEFAULT 0, -- UTC timestamp
  answer_time   INTEGER NOT NULL DEFAULT 0,
  end_time      INTEGER NOT NULL DEFAULT 0,
  duration      INTEGER NOT NULL DEFAULT 0, -- секунды
  answered      INTEGER NOT NULL DEFAULT 0,
  recording_url TEXT NOT NULL DEFAULT '',   -- наружу не отдаётся
  db_call_id    INTEGER                     -- для догрузки calls.list
);
CREATE INDEX IF NOT EXISTS calls_agent_client ON calls (user_login, client_phone, start_time DESC);
CREATE INDEX IF NOT EXISTS calls_agent_time ON calls (user_login, start_time DESC);
CREATE INDEX IF NOT EXISTS calls_db_id ON calls (db_call_id);
