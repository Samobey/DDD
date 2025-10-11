import { getAggregateState } from "./aggregates.js";
import { appendEvent } from "./eventstore.js";

export async function handleCommand(accountId, command) {
  const state = await getAggregateState(accountId);

  if (command.type === "WITHDRAW" && state.balance < command.amount) {
    throw new Error("Insufficient balance");
  }

  await appendEvent(accountId, command.type, { ...command, accountId });

  return { ...state, pending: command };
}
