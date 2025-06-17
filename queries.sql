-- USERS
CREATE TABLE users (
    id SERIAL PRIMARY KEY,
    name VARCHAR(100),
    email VARCHAR(150) UNIQUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ORDERS
CREATE TABLE orders (
    id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES users(id),
    product_name VARCHAR(255),
    amount NUMERIC(10, 2),
    status VARCHAR(50),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- USERS
INSERT INTO users (name, email) VALUES
  ('Alice Smith', 'alice@example.com'),
  ('Bob Johnson', 'bob@example.com'),
  ('Charlie Davis', 'charlie@example.com');

-- ORDERS
INSERT INTO orders (user_id, product_name, amount, status) VALUES
  (1, 'Noise Cancelling Headphones', 199.99, 'processing'),
  (1, 'Wireless Mouse', 29.99, 'shipped'),
  (2, 'Mechanical Keyboard', 89.95, 'processing'),
  (3, '27" 4K Monitor', 349.00, 'delivered'),
  (2, 'USB-C Hub', 45.00, 'cancelled');


-- New user
INSERT INTO users (name, email) VALUES ('Tom Prince', 'tom@example.com');

-- New order
INSERT INTO orders (user_id, product_name, amount, status) VALUES
  (4, 'Mousepad', 20.00, 'shipped');

-- Update order status
UPDATE orders SET status = 'cancelled' WHERE id = 1;

-- Delete an order
DELETE FROM orders WHERE id = 5;

SELECT * FROM pg_create_logical_replication_slot('cdc_slot', 'test_decoding');
