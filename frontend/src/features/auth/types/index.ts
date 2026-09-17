export interface LoginCredentials {
  email: string;
  password: string;
}

export interface RegisterPayload {
  email: string;
  password: string;
}

export interface AuthResponse {
  access_token: string;
  token_type: string;
}

export interface PasswordChangePayload {
  current_password: string;
  new_password: string;
}

export interface EmailChangePayload {
  current_password: string;
  new_email: string;
}

export interface CurrentUser {
  id: number;
  email: string;
  created_at: string;
}
