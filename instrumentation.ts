export async function register() {
  if (process.env.NEXT_RUNTIME === "nodejs") {
    // On hosts with no IPv6 route, Node's Happy Eyeballs races an
    // unreachable AAAA address against the working A address and the
    // whole connection times out instead of falling back — breaks
    // fetch() to dual-stack hosts like the Neon serverless driver's.
    const { setDefaultAutoSelectFamily } = await import("node:net");
    setDefaultAutoSelectFamily(false);
  }
}
