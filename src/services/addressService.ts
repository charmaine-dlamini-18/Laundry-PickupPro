import { supabase } from '../lib/supabase';

export type SavedAddress = {
  id: string;
  label: string;
  address: string;
  isDefault: boolean;
};

type AddressRow = {
  id: string;
  label: string;
  address: string;
  is_default: boolean;
};

function rowToAddress(row: AddressRow): SavedAddress {
  return {
    id: row.id,
    label: row.label,
    address: row.address,
    isDefault: row.is_default,
  };
}

export async function fetchSavedAddresses(): Promise<SavedAddress[]> {
  const { data, error } = await supabase.rpc('customer_list_addresses');

  if (error) {
    throw new Error(error.message);
  }

  return ((data ?? []) as AddressRow[]).map(rowToAddress);
}

export async function saveAddress(input: {
  id?: string;
  label: string;
  address: string;
  isDefault: boolean;
}): Promise<SavedAddress[]> {
  const { data, error } = await supabase.rpc('customer_save_address', {
    p_id: input.id ?? null,
    p_label: input.label,
    p_address: input.address,
    p_is_default: input.isDefault,
  });

  if (error) {
    throw new Error(error.message);
  }

  return ((data ?? []) as AddressRow[]).map(rowToAddress);
}

export async function deleteAddress(id: string): Promise<SavedAddress[]> {
  const { data, error } = await supabase.rpc('customer_delete_address', {
    p_id: id,
  });

  if (error) {
    throw new Error(error.message);
  }

  return ((data ?? []) as AddressRow[]).map(rowToAddress);
}