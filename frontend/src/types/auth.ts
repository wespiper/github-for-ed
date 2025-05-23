export interface User {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  role: 'student' | 'educator' | 'admin';
  profilePicture?: string;
  bio?: string;
  isVerified: boolean;
  createdAt: string;
}

export interface AuthResponse {
  message: string;
  user: User;
  token: string;
}

export interface RegisterData {
  email: string;
  password: string;
  firstName: string;
  lastName: string;
  role: 'student' | 'educator' | 'admin';
}

export interface LoginData {
  email: string;
  password: string;
}