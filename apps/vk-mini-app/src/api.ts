const API_BASE = "https://financial-circle.onrender.com";

let authToken: string | null = null;

export function setToken(token: string) {
  authToken = token;
  localStorage.setItem("fc-auth-token", token);
}

function getToken(): string | null {
  if (!authToken) {
    authToken = localStorage.getItem("fc-auth-token");
  }
  return authToken;
}

async function request(method: string, path: string, body?: any): Promise<any> {
  const headers: Record<string, string> = { "Content-Type": "application/json" };
  const token = getToken();
  if (token) headers["Authorization"] = `Bearer ${token}`;

  const opts: RequestInit = { method, headers };
  if (body) opts.body = JSON.stringify(body);

  const res = await fetch(`${API_BASE}${path}`, opts);
  if (!res.ok) throw new Error(`API error: ${res.status}`);
  return res.json();
}

export const api = {
  async authVK(vk_user_id: number) {
    return request("POST", "/auth/vk", { vk_user_id });
  },
  async getMe() {
    return request("GET", "/me");
  },
  async getOperations() {
    return request("GET", "/me/operations");
  },
};
