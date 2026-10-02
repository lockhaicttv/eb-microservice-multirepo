-- One database per domain: each backend owns its own store and never reads
-- another team's tables. Created once on first container boot.
-- The `POSTGRES_DB` (postgres) database already exists; these are the domain ones.

CREATE DATABASE auth;
CREATE DATABASE catalog;
CREATE DATABASE "order"; -- reserved word, must be quoted
CREATE DATABASE payment;
CREATE DATABASE notification;