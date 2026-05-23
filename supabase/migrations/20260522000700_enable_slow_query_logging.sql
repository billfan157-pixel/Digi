-- Enable statement logging for slow queries (>200ms)
ALTER DATABASE postgres SET log_min_duration_statement = 200;
