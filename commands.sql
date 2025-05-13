/* NOTIFY/LISTEN */
-- 1. Create a table
CREATE TYPE order_status AS ENUM('open', 'paid');

CREATE TABLE orders (
    id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL,
    product TEXT,
    amount NUMERIC,
    status order_status NOT NULL DEFAULT 'open'
);

-- 2. Create a trigger function that notifies when a new order is inserted
CREATE OR REPLACE FUNCTION notify_new_order () RETURNS trigger AS $$
BEGIN
  PERFORM pg_notify('new_order_channel', row_to_json(NEW)::text);
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 3. Attach it to the 'orders' table
CREATE TRIGGER trigger_new_order
AFTER INSERT ON orders FOR EACH ROW
EXECUTE FUNCTION notify_new_order ();

---
/* Row-Level Security */
-- 1. Enable RLS
ALTER TABLE orders ENABLE ROW LEVEL SECURITY;

-- 3. Create a policy
CREATE POLICY user_only_access ON orders USING (
    user_id = current_setting('app.current_user_id')::int
);

---
/* Custom Data Types & Composite Types and JSONB */
-- 1. Create a custom data type
CREATE TYPE address AS (street TEXT, city TEXT, zip TEXT);

-- 2. Create a users table and assign the custom type
CREATE TABLE users (
    id SERIAL PRIMARY KEY,
    name TEXT NOT NULL,
    home_address address,
    settings JSONB
);

-- 3. Create test data
INSERT INTO
    users (name, home_address, settings)
VALUES
    (
        'Alice',
        ROW ('123 Main St', 'Berlin', '10115'),
        '{"theme": "dark", "notifications": {"email": true, "sms": false}, "language": "en"}'::jsonb
    ),
    (
        'Juan',
        ROW ('123 Main Calle', 'Madrid', '10116'),
        '{"theme": "light", "notifications": {"email": true, "sms": false}, "language": "es"}'::jsonb
    );