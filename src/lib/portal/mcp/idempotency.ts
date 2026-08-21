import * as data from "../data";
import { PortalError } from "../errors";
import type { Db } from "../supabase/server";

type LedgerRecord = { status: "pending" } | { status: "done"; payload: unknown };

const PENDING_STALE_MS = 60_000;

/**
 * Claim → execute → store. A duplicate call with the same key replays the
 * stored result instead of executing twice; two *concurrent* identical calls
 * resolve to one execution via the ledger's unique index.
 */
export async function runIdempotent<T>(
  db: Db,
  tool: string,
  key: string | undefined,
  execute: () => Promise<T>,
): Promise<{ result: T; replayed: boolean }> {
  if (!key) {
    return { result: await execute(), replayed: false };
  }

  for (let attempt = 0; attempt < 2; attempt += 1) {
    const existing = await data.getMcpOp(db, tool, key);
    if (existing) {
      const record = existing.result as LedgerRecord;
      if (record && record.status === "done") {
        return { result: record.payload as T, replayed: true };
      }
      const age = Date.now() - Date.parse(existing.created_at);
      if (Number.isFinite(age) && age < PENDING_STALE_MS) {
        throw new PortalError(
          "conflict",
          "An identical operation is already in progress. Retry shortly to fetch its result.",
          { idempotencyKey: key },
        );
      }
      // A pending claim this old means the earlier execution died mid-flight.
      // Release it and let this call take over.
      await data.deleteMcpOp(db, tool, key);
    }

    const claimed = await data.claimMcpOp(db, tool, key, {
      status: "pending",
    } satisfies LedgerRecord);
    if (!claimed) continue; // lost the race — loop to read the winner's record

    try {
      const result = await execute();
      await data.updateMcpOp(db, tool, key, {
        status: "done",
        payload: result,
      } satisfies LedgerRecord);
      return { result, replayed: false };
    } catch (error) {
      // Release the claim so a retry can actually retry.
      try {
        await data.deleteMcpOp(db, tool, key);
      } catch {
        // The original error matters more.
      }
      throw error;
    }
  }

  throw new PortalError(
    "conflict",
    "An identical operation is already in progress. Retry shortly to fetch its result.",
    { idempotencyKey: key },
  );
}
