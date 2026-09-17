const API_URL = import.meta.env.VITE_API_URL;

function getAdminKey() {
  return localStorage.getItem("admin_key") || "";
}

async function request(path, options = {}) {
  const res = await fetch(`${API_URL}${path}`, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      "x-admin-key": getAdminKey(),
      ...options.headers,
    },
  });

  if (res.status === 401) {
    throw new Error("UNAUTHORIZED");
  }
  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new Error(body.error || `So'rov xatosi: ${res.status}`);
  }
  if (res.status === 204) return null;
  return res.json();
}

export const api = {
  overview: () => request("/admin/overview"),
  monthlyTrend: () => request("/admin/monthly-trend"),
  transactions: (page = 1) => request(`/admin/transactions?page=${page}&pageSize=20`),
  categories: () => request("/categories"),
  createCategory: (data) => request("/categories", { method: "POST", body: JSON.stringify(data) }),
  updateCategory: (id, data) => request(`/categories/${id}`, { method: "PUT", body: JSON.stringify(data) }),
  deleteCategory: (id) => request(`/categories/${id}`, { method: "DELETE" }),
};
