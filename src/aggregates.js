import { redisClient } from "./db.js";
import { readStream } from "./eventstore.js";

const SNAPSHOT_PREFIX = "snapshot:";

async function getSnapshot(aggregateId) {
  const data = await redisClient.get(`${SNAPSHOT_PREFIX}${aggregateId}`);
  return data ? JSON.parse(data) : null;
}

async function saveSnapshot(aggregateId, state, lastEventIndex) {
  await redisClient.set(
    `${SNAPSHOT_PREFIX}${aggregateId}`,
    JSON.stringify({ state, lastEventIndex }),
    { EX: 300 }
  );
}

export async function getAggregateState(aggregateId) {
  // 1️⃣ Check Redis cache
  const cached = await redisClient.get(aggregateId);
  if (cached) return JSON.parse(cached);

  // 2️⃣ Load snapshot
  let state = { balance: 0 };
  let startIndex = 0;
  const snapshot = await getSnapshot(aggregateId);
  if (snapshot) {
    state = snapshot.state;
    startIndex = snapshot.lastEventIndex + 1;
  }

  // 3️⃣ Replay events after snapshot
  const events = await readStream(aggregateId);
  for (let i = startIndex; i < events.length; i++) {
    const e = events[i];
    if (e.type === "DEPOSIT") state.balance += e.data.amount;
    if (e.type === "WITHDRAW") state.balance -= e.data.amount;
  }

  // 4️⃣ Cache in Redis
  await redisClient.set(aggregateId, JSON.stringify(state), { EX: 60 });

  // 5️⃣ Periodic snapshot
  if (events.length % 5 === 0) {
    await saveSnapshot(aggregateId, state, events.length - 1);
  }

  return state;
}
