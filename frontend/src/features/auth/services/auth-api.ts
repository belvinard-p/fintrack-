import { api } from "@/services/http-client";
import {
  LoginCredentials,
  RegisterPayload,
  AuthResponse,
  PasswordChangePayload,
  EmailChangePayload,
  CurrentUser,
} from "../types";

export async function login(credentials: LoginCredentials): Promise<AuthResponse> {
  const response = await api.post<AuthResponse>("/auth/login", credentials);
  return response.data;
}

export async function fetchCurrentUser(): Promise<CurrentUser> {
  const response = await api.get<CurrentUser>("/auth/me");
  return response.data;
}

export async function register(payload: RegisterPayload): Promise<void> {
  await api.post("/auth/register", payload);
}

export async function changePassword(payload: PasswordChangePayload): Promise<void> {
  await api.patch("/auth/me/password", payload);
}

export async function changeEmail(payload: EmailChangePayload): Promise<AuthResponse> {
  const response = await api.patch<AuthResponse>("/auth/me/email", payload);
  return response.data;
}

export async function deleteAccount(): Promise<void> {
  await api.delete("/auth/me");
}
