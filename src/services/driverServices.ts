import { supabase } from '../lib/supabase';

export type DriverAccountInput = {
  name: string;
  email: string;
  password: string;
  phone: string;
  vehicle: string;
  registration: string;
  area: string;
};

type DriverAccountPatch = Partial<
  Omit<DriverAccountInput, 'area'> & { area: string }
>;

export async function createDriver(
  input: DriverAccountInput
): Promise<{ id: string }> {
  const { data, error } = await supabase.rpc('admin_create_driver', {
    p_name: input.name,
    p_email: input.email,
    p_phone: input.phone,
    p_password: input.password,
    p_vehicle: input.vehicle,
    p_registration: input.registration,
    p_area: input.area,
  });

  if (error) {
    throw new Error(error.message);
  }

  return { id: data as string };
}

export async function updateDriver(
  id: string,
  patch: DriverAccountPatch
): Promise<void> {
  const { error } = await supabase.rpc('admin_update_driver', {
    p_driver_id: id,
    p_email: patch.email ?? '',
    p_name: patch.name ?? '',
    p_phone: patch.phone ?? '',
    p_password: patch.password ?? null,
    p_vehicle: patch.vehicle ?? '',
    p_registration: patch.registration ?? '',
    p_area: patch.area ?? '',
  });

  if (error) {
    throw new Error(error.message);
  }
}

export async function deleteDriver(id: string): Promise<void> {
  const { error } = await supabase.rpc('admin_delete_driver', {
    p_driver_id: id,
  });

  if (error) {
    throw new Error(error.message);
  }
}