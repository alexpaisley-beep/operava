"use server";

import { redirect } from "next/navigation";

import { runAction, type ActionState } from "./action-state";
import { PortalError } from "./errors";
import { supabaseConfigured } from "./env";
import { createUserClient } from "./supabase/server";
import { getViewer } from "./viewer";

function cleanEmail(formData: FormData): string {
  const email = String(formData.get("email") ?? "")
    .trim()
    .toLowerCase()
    .slice(0, 320);
  if (!email.includes("@")) {
    throw new PortalError(
      "validation_failed",
      "Enter the email address your portal was set up with.",
    );
  }
  return email;
}

export async function signInWithPassword(
  _state: ActionState,
  formData: FormData,
): Promise<ActionState> {
  if (!supabaseConfigured()) {
    return { status: "error", message: "The portal is not configured on this deployment." };
  }
  const state = await runAction(async () => {
    const email = cleanEmail(formData);
    const password = String(formData.get("password") ?? "");
    if (!password) throw new PortalError("validation_failed", "Enter your password.");

    const supabase = await createUserClient();
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) {
      throw new PortalError("unauthorized", "That email and password combination didn't work.");
    }
  });
  if (state.status !== "ok") return state;

  const viewer = await getViewer();
  if (!viewer) {
    // Authenticated at Supabase but not provisioned in the portal.
    const supabase = await createUserClient();
    await supabase.auth.signOut();
    return {
      status: "error",
      message: "This account has no portal access yet. Ask Operava to invite you.",
    };
  }
  redirect(viewer.role === "admin" ? "/admin" : "/portal");
}

export async function requestMagicLink(
  _state: ActionState,
  formData: FormData,
): Promise<ActionState> {
  if (!supabaseConfigured()) {
    return { status: "error", message: "The portal is not configured on this deployment." };
  }
  return runAction(async () => {
    const email = cleanEmail(formData);
    const supabase = await createUserClient();
    // shouldCreateUser:false — sign-in links are for provisioned accounts only.
    const { error } = await supabase.auth.signInWithOtp({
      email,
      options: { shouldCreateUser: false },
    });
    if (error) {
      // Do not reveal whether the address exists.
      console.error("portal.magic_link_failed", error.message);
    }
    return "If that address has portal access, a sign-in link is on its way.";
  });
}

export async function setPassword(
  _state: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const state = await runAction(async () => {
    const password = String(formData.get("password") ?? "");
    const confirm = String(formData.get("confirm") ?? "");
    if (password.length < 10) {
      throw new PortalError("validation_failed", "Use at least 10 characters.");
    }
    if (password !== confirm) {
      throw new PortalError("validation_failed", "The two passwords don't match.");
    }
    const supabase = await createUserClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user)
      throw new PortalError("unauthorized", "Your sign-in link expired. Ask for a new one.");
    const { error } = await supabase.auth.updateUser({ password });
    if (error) throw new PortalError("internal", "Could not set the password. Try again.");
  });
  if (state.status !== "ok") return state;

  const viewer = await getViewer();
  redirect(viewer?.role === "admin" ? "/admin" : "/portal");
}

export async function signOut(): Promise<void> {
  const supabase = await createUserClient();
  await supabase.auth.signOut();
  redirect("/portal/login");
}
