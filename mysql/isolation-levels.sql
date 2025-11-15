-- READ UNCOMMITTED --

-- TX1 --
SET TRANSACTION ISOLATION LEVEL READ UNCOMMITTED;
BEGIN;
SELECT balance FROM accounts WHERE id = 1;  -- returns 100

-- TX2 --
BEGIN;
UPDATE accounts SET balance = 200 WHERE id = 1;   -- NOT committed yet

-- TX1 --
SELECT balance FROM accounts WHERE id = 1;  -- returns 200 (dirty read)



-- REPEATABLE READ --

-- TX1 --
SET TRANSACTION ISOLATION LEVEL REPEATABLE READ;
BEGIN;
SELECT balance FROM accounts WHERE id = 1;  -- returns 100

-- TX2 --
BEGIN;
UPDATE accounts SET balance = 200 WHERE id = 1;  
-- BLOCKS until TX1 commits

-- TX1 --
UPDATE accounts SET balance = 150 WHERE id = 1; -- results in a deadlock, TX1 is rolled back
