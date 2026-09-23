import type { Role, User } from '../types';
import { supabase } from '../lib/supabase';

type LoginInput = {
  role: Role;
  email: string;
  password: string;
};

type RegisterInput = {
  role: Role;
  name: string;
  email: string;
  phone: string;
  password: string;
};

export async function login({
  role,
  email,
  password,
}: LoginInput): Promise<User> {
  if (!email.trim() || !password.trim()) {
    throw new Error('Please enter your email and password.');
  }

  const { data, error } = await supabase.auth.signInWithPassword({
    email: email.trim(),
    password,
  });

  if (error) {
    throw new Error(error.message);
  }

  if (!data.user) {
    throw new Error('Unable to sign in.');
  }

  const { data: profile, error: profileError } = await supabase
    .from('profiles')
    .select('id, name, email, phone, role')
    .eq('id', data.user.id)
    .single();

  if (profileError) {
    throw new Error('Your user profile could not be found.');
  }

  if (profile.role !== role) {
    await supabase.auth.signOut();
    throw new Error(`This account is not registered as a ${role}.`);
  }

  return {
    id: profile.id,
    name: profile.name,
    email: profile.email,
    phone: profile.phone ?? '',
    role: profile.role as Role,
  };
}

export async function register({
  role,
  name,
  email,
  phone,
  password,
}: RegisterInput): Promise<User> {
  if (!name.trim() || !email.trim() || !password.trim()) {
    throw new Error('Please fill in all required fields.');
  }

  if (role !== 'customer') {
    throw new Error('Only customer accounts can be registered here.');
  }

  const { data, error } = await supabase.auth.signUp({
    email: email.trim(),
    password,
    options: {
      data: {
        name: name.trim(),
        phone: phone.trim(),
      },
    },
  });

  if (error) {
    throw new Error(error.message);
  }

  if (!data.user) {
    throw new Error('Registration could not be completed.');
  }

  return {
    id: data.user.id,
    name: name.trim(),
    email: email.trim(),
    phone: phone.trim(),
    role: 'customer',
  };
}

export async function forgotPassword(email: string): Promise<void> {
  if (!email.trim()) {
    throw new Error('Please enter your email address.');
  }

  const { error } = await supabase.auth.resetPasswordForEmail(email.trim());

  if (error) {
    throw new Error(error.message);
  }
}

export async function resetPassword(
  password: string,
  confirmPassword: string
): Promise<void> {
  if (password !== confirmPassword) {
    throw new Error('Passwords do not match.');
  }

  const { error } = await supabase.auth.updateUser({
    password,
  });

  if (error) {
    throw new Error(error.message);
  }
}

export async function logout(): Promise<void> {
  const { error } = await supabase.auth.signOut();

  if (error) {
    throw new Error(error.message);
  }
}