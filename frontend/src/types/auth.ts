export interface User {
  id: number;
  email: string;
  username: string;
  firstName: string;
  lastName: string;
  token: string;
}

export interface RegisterFormData {
  email: string;
  username: string;
  password: string;
  firstName?: string;
  lastName?: string;
}

export interface LoginFormData {
  usernameOrEmail: string;
  password: string;
}
