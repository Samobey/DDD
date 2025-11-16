Event seq=1 arrives:
-------------------------------------
expected = 1
buffer = {1}
=> apply(1)
expected becomes 2
buffer now empty
-------------------------------------

Event seq=3 arrives:
-------------------------------------
expected = 2
buffer = {3}
=> cannot apply yet (seq=2 missing)
-------------------------------------

Event seq=2 arrives:
-------------------------------------
expected = 2
buffer = {3, 2}
=> apply(2)
expected becomes 3
=> apply(3)
expected becomes 4
buffer now empty
-------------------------------------

Event seq=4 arrives:
-------------------------------------
expected = 4
buffer = {4}
=> apply(4)
expected becomes 5
buffer now empty
-------------------------------------
