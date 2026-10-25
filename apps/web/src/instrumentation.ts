export async function register() {
  if (process.env.NEXT_RUNTIME !== "nodejs") return;

  const { assertServerEnv } = await import("./lib/env");
  assertServerEnv();
}
