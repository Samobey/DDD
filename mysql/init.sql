CREATE TABLE IF NOT EXISTS accounts (
  id INT PRIMARY KEY,
  balance INT
);

TRUNCATE TABLE accounts;
INSERT INTO accounts (id, balance) VALUES (1, 100), (2, 100);