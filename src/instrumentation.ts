export async function register() {
  if (process.env.NEXT_RUNTIME === "nodejs") {
    const { initializeBackend } = await import("./lib/startup");
    await initializeBackend();
  }
}
