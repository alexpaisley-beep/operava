import { isPortalError } from "./errors";

/** Result shape for portal/admin server actions driven by useActionState. */
export type ActionState = {
  status: "idle" | "ok" | "error";
  message: string;
};

export const idleActionState: ActionState = { status: "idle", message: "" };

/**
 * Wrap a mutation for useActionState: PortalErrors surface their message,
 * anything else becomes a generic failure (and is logged inside
 * toPortalError's caller). A successful run reports `ok` with an optional
 * confirmation message.
 */
export async function runAction(work: () => Promise<string | void>): Promise<ActionState> {
  try {
    const message = await work();
    return { status: "ok", message: message || "Saved." };
  } catch (error) {
    if (isPortalError(error)) {
      return { status: "error", message: error.message };
    }
    // Next.js redirect() throws a control-flow error that must propagate.
    if (error && typeof error === "object" && "digest" in error) throw error;
    console.error("portal.action_error", error);
    return { status: "error", message: "Something went wrong on our side." };
  }
}
