-- PostgreSQL initialization script for ERP System
-- Enables required extensions

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";
CREATE EXTENSION IF NOT EXISTS "pg_trgm";   -- Fuzzy text search
CREATE EXTENSION IF NOT EXISTS "unaccent";   -- Turkish character support

-- Set timezone
SET timezone = 'Europe/Istanbul';
