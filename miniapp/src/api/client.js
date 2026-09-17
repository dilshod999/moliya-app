const API_URL = import.meta.env.VITE_API_URL;

function getInitData() {
  const tg = window.Telegram?.WebApp;
  if (tg?.initData) return tg.initData;
  // Falls back to DEV_MODE so the app is testable in a normal browser tab.
  // The backend only accepts this outside production.
  return "DEV_MODE";
}

async function request(path, options = {}) {
  const res = await fetch(`${API_URL}${path}`, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      "x-telegram-init-data": getInitData(),
      ...options.headers,
    },
  });

  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new Error(body.error || `So'rov xatosi: ${res.status}`);
  }
  if (res.status === 204) return null;
  return res.json();
}

export const api = {
  me: () => request("/auth/me"),
  categories: (type) => request(`/categories${type ? `?type=${type}` : ""}`),
  transactions: (limit) => request(`/transactions${limit ? `?limit=${limit}` : ""}`),
  addTransaction: (data) => request("/transactions", { method: "POST", body: JSON.stringify(data) }),
  deleteTransaction: (id) => request(`/transactions/${id}`, { method: "DELETE" }),
  summary: () => request("/stats/summary"),
  byCategory: () => request("/stats/by-category"),
  setCurrency: (currency) => request("/users/currency", { method: "PUT", body: JSON.stringify({ currency }) }),
  exportCsvUrl: () => `${API_URL}/export/csv`,
};
