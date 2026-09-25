export interface LoginRequest {
  identifier: string;
  password: string;
}

export interface AuthUserRole {
  id: string;
  name: string;
}

export interface AuthUserPermission {
  id: string;
  code: string;
  module: string;
}

export interface AuthUser {
  id: string;
  username: string;
  email: string | null;
  phone: string | null;
  userType: string;
  employeeId?: string | null;
  roles?: AuthUserRole[];
  permissions?: AuthUserPermission[];
}

export interface LoginResponse {
  success: boolean;
  data: {
    accessToken: string;
    user: AuthUser;
  };
}