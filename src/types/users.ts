export interface User {
  user_id: string;
  email: string;
  first_name: string;
  last_name: string;
  job_position: string;
  company: string;
  role: UserRole;
  created_at: string;
  active: boolean;
}

export type UserRole = 'admin' | 'standard' | 'Master';

export interface CreateUserRequest {
  user: string; // email
  password: string;
  nombre: string;
  apellidos: string;
  puesto: string;
  empresa: string;
  role_type: UserRole;
  admin_key?: string; // Optional admin key for admin users
}

export interface CreateUserResponse {
  success: boolean;
  message: string;
  user?: User;
}
