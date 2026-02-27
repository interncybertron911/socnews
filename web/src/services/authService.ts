import { jwtDecode } from "jwt-decode";
import { config } from "../config";

const API_BASE_URL = config.apiBaseUrl;

export interface User {
    id: string;
    username: string;
    name: string;
    type: "admin" | "user";
}

export interface AuthResponse {
    ok: boolean;
    token?: string;
    user?: User;
    error?: string;
}

export const authService = {
    login: async (username: string, password: string): Promise<AuthResponse> => {
        const res = await fetch(`${API_BASE_URL}/auth/login`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ username, password }),
        });
        const data = await res.json();
        if (data.ok && data.token) {
            localStorage.setItem("soc_token", data.token);
            localStorage.setItem("soc_user", JSON.stringify(data.user));
        }
        return data;
    },

    signup: async (userData: any): Promise<AuthResponse> => {
        const res = await fetch(`${API_BASE_URL}/auth/signup`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(userData),
        });
        return await res.json();
    },

    logout: () => {
        localStorage.removeItem("soc_token");
        localStorage.removeItem("soc_user");
    },

    getCurrentUser: (): User | null => {
        const userStr = localStorage.getItem("soc_user");
        if (!userStr) return null;
        try {
            return JSON.parse(userStr);
        } catch {
            return null;
        }
    },

    isLoggedIn: (): boolean => {
        const token = localStorage.getItem("soc_token");
        if (!token) return false;
        try {
            const decoded: any = jwtDecode(token);
            return decoded.exp * 1000 > Date.now();
        } catch {
            return false;
        }
    },

    getToken: () => localStorage.getItem("soc_token"),

    updateProfile: async (profileData: any): Promise<AuthResponse> => {
        const token = localStorage.getItem("soc_token");
        const res = await fetch(`${API_BASE_URL}/auth/profile`, {
            method: "PATCH",
            headers: {
                "Content-Type": "application/json",
                "Authorization": `Bearer ${token}`
            },
            body: JSON.stringify(profileData),
        });
        const data = await res.json();
        if (data.ok && data.token) {
            localStorage.setItem("soc_token", data.token);
            localStorage.setItem("soc_user", JSON.stringify(data.user));
        }
        return data;
    },

    listUsers: async (): Promise<{ ok: boolean, users?: any[], error?: string }> => {
        const token = localStorage.getItem("soc_token");
        const res = await fetch(`${API_BASE_URL}/auth/users`, {
            method: "GET",
            headers: {
                "Authorization": `Bearer ${token}`
            }
        });
        return await res.json();
    },

    deleteUser: async (id: string): Promise<AuthResponse> => {
        const token = localStorage.getItem("soc_token");
        const res = await fetch(`${API_BASE_URL}/auth/users/${id}`, {
            method: "DELETE",
            headers: {
                "Authorization": `Bearer ${token}`
            }
        });
        return await res.json();
    },

    updateUser: async (id: string, userData: any): Promise<AuthResponse> => {
        const token = localStorage.getItem("soc_token");
        const res = await fetch(`${API_BASE_URL}/auth/users/${id}`, {
            method: "PATCH",
            headers: {
                "Content-Type": "application/json",
                "Authorization": `Bearer ${token}`
            },
            body: JSON.stringify(userData),
        });
        return await res.json();
    },
};
