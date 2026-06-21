import axios from "axios";

const BASE = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:4000/api";

const api = axios.create({
  baseURL: BASE,
  withCredentials: true, // always send httpOnly cookies
});

/* ── silent token rotation ───────────────────────────────
   On any 401, call /auth/refresh (reads the httpOnly
   refresh_token cookie and rotates both tokens server-side),
   then retry the original request once.
   Concurrent 401s share one refresh call — no thundering herd.
   If refresh fails → redirect to /login.
──────────────────────────────────────────────────────── */
let refreshing: Promise<void> | null = null;

api.interceptors.response.use(
  res => res,
  async err => {
    const original = err.config;

    if (
      err.response?.status !== 401 ||
      original._retry ||
      original.url?.includes("/auth/refresh") ||
      original.url?.includes("/auth/login") ||
      original.url?.includes("/auth/me")
    ) {
      return Promise.reject(err);
    }

    original._retry = true;

    if (!refreshing) {
      refreshing = axios
        .post(`${BASE}/auth/refresh`, {}, { withCredentials: true })
        .then(() => { refreshing = null; })
        .catch(() => {
          refreshing = null;
          if (typeof window !== "undefined") window.location.href = "/login";
          return Promise.reject(new Error("Session expired"));
        });
    }

    await refreshing;
    // Re-attach Content-Type so JSON body survives the retry serialization
    return api.request({
      ...original,
      headers: { ...original.headers, "Content-Type": "application/json" },
    });
  }
);

export default api;
