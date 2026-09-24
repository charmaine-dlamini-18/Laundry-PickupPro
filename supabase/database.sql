create extension if not exists "pgcrypto";

create table if not exists public.profiles (
  id         uuid primary key references auth.users(id) on delete cascade,
  name       text not null default '',
  email      text not null unique,
  phone      text,
  role       text not null default 'customer'
             check (role in ('customer', 'driver', 'admin')),
  created_at timestamptz not null default now()
);

create index if not exists profiles_role_idx on public.profiles (role);

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, name, email, phone, role)
  values (
    new.id,
    coalesce(nullif(new.raw_user_meta_data ->> 'name', ''), split_part(new.email, '@', 1)),
    new.email,
    nullif(new.raw_user_meta_data ->> 'phone', ''),
    coalesce(new.raw_user_meta_data ->> 'role', 'customer')
  )
  on conflict do nothing;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

create table if not exists public.drivers (
  id           uuid primary key default gen_random_uuid(),
  profile_id   uuid unique not null references public.profiles(id) on delete cascade,
  name         text not null,
  email        text not null unique,
  phone        text,
  vehicle      text,
  registration text,
  area         text,
  created_at   timestamptz not null default now()
);

create table if not exists public.driver_orders (
  id                 uuid primary key default gen_random_uuid(),
  order_number       text not null unique,
  booking_reference  text,
  type               text not null check (type in ('Pickup', 'Delivery')),
  customer_name      text not null,
  customer_phone     text,
  customer_id        uuid references public.profiles(id) on delete set null,
  address            text not null,
  "time"             text,
  notes              text,
  laundromat         text,
  laundromat_address text,
  bag_count          integer,
  total              numeric,
  payment_method     text,
  status             text not null default 'Pending'
                     check (status in ('Pending', 'Assigned', 'In Progress', 'Completed', 'Cancelled')),
  created_at         timestamptz not null default now()
);

drop policy if exists "orders_select_own" on public.driver_orders;
drop policy if exists "orders_update_assigned_driver" on public.driver_orders;
drop policy if exists "orders_insert_customer" on public.driver_orders;

alter table public.driver_orders drop column if exists driver_id;
alter table public.driver_orders drop column if exists driver_name;

create table if not exists public.driver_assignments (
  id          uuid primary key default gen_random_uuid(),
  order_id    uuid not null,
  driver_id   uuid not null,
  assigned_at timestamptz not null default now(),
  status      text not null default 'Assigned',
  notes       text,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);

create index if not exists driver_orders_customer_id_idx on public.driver_orders (customer_id);
create index if not exists driver_orders_status_idx      on public.driver_orders (status);
create index if not exists driver_orders_booking_ref_idx on public.driver_orders (booking_reference);
create index if not exists driver_assignments_driver_id_idx on public.driver_assignments (driver_id);
create index if not exists driver_assignments_order_id_idx  on public.driver_assignments (order_id);

alter table public.driver_assignments
  drop constraint if exists driver_assignments_order_id_fkey;

alter table public.driver_assignments
  add constraint driver_assignments_order_id_fkey
  foreign key (order_id) references public.driver_orders(id) on delete cascade;

alter table public.driver_assignments
  drop constraint if exists driver_assignments_driver_id_fkey;

alter table public.driver_assignments
  add constraint driver_assignments_driver_id_fkey
  foreign key (driver_id) references public.profiles(id) on delete cascade;

alter table public.profiles enable row level security;
alter table public.drivers enable row level security;
alter table public.driver_orders enable row level security;
alter table public.driver_assignments enable row level security;

drop policy if exists "profiles_select_own" on public.profiles;
create policy "profiles_select_own" on public.profiles
  for select using (auth.uid() = id);

drop policy if exists "profiles_update_own" on public.profiles;
create policy "profiles_update_own" on public.profiles
  for update using (auth.uid() = id) with check (auth.uid() = id);

drop policy if exists "drivers_select_own" on public.drivers;
create policy "drivers_select_own" on public.drivers
  for select using (auth.uid() = profile_id);

drop policy if exists "orders_select_own" on public.driver_orders;
create policy "orders_select_own" on public.driver_orders
  for select using (
    auth.uid() = customer_id
    or exists (
      select 1 from public.driver_assignments da
      where da.order_id = id and da.driver_id = auth.uid()
    )
  );

drop policy if exists "orders_update_assigned_driver" on public.driver_orders;
create policy "orders_update_assigned_driver" on public.driver_orders
  for update using (
    exists (
      select 1 from public.driver_assignments da
      where da.order_id = id and da.driver_id = auth.uid()
    )
  ) with check (
    exists (
      select 1 from public.driver_assignments da
      where da.order_id = id and da.driver_id = auth.uid()
    )
  );

drop policy if exists "orders_insert_customer" on public.driver_orders;
create policy "orders_insert_customer" on public.driver_orders
  for insert with check (auth.uid() = customer_id);

drop policy if exists "driver_assignments_select_own" on public.driver_assignments;
create policy "driver_assignments_select_own" on public.driver_assignments
  for select using (auth.uid() = driver_id);

do $$
begin
  alter publication supabase_realtime add table public.driver_orders;
exception
  when duplicate_object then null;
end $$;

do $$
begin
  alter publication supabase_realtime add table public.driver_assignments;
exception
  when duplicate_object then null;
end $$;

insert into auth.users (instance_id, id, aud, role, email, encrypted_password, email_confirmed_at, raw_app_meta_data, raw_user_meta_data, confirmation_token, recovery_token, email_change, email_change_token_new, email_change_token_current, phone_change, phone_change_token, reauthentication_token, created_at, updated_at)
values
  ('00000000-0000-0000-0000-000000000000', '10000000-0000-0000-0000-000000000001', 'authenticated', 'authenticated', 'sipho@laundrypickup.co.za', crypt('Sipho#Nkosi', gen_salt('bf')), now(), '{"provider":"email","providers":["email"]}', '{"role":"driver","name":"Sipho Nkosi","phone":"083 214 5567"}', '', '', '', '', '', '', '', '', now(), now()),
  ('00000000-0000-0000-0000-000000000000', '10000000-0000-0000-0000-000000000002', 'authenticated', 'authenticated', 'thabo@laundrypickup.co.za', crypt('Thabo$Dube', gen_salt('bf')), now(), '{"provider":"email","providers":["email"]}', '{"role":"driver","name":"Thabo Dube","phone":"081 556 9012"}', '', '', '', '', '', '', '', '', now(), now()),
  ('00000000-0000-0000-0000-000000000000', '10000000-0000-0000-0000-000000000003', 'authenticated', 'authenticated', 'jeff@laundrypickup.co.za', crypt('Jeff!Erasmus', gen_salt('bf')), now(), '{"provider":"email","providers":["email"]}', '{"role":"driver","name":"Jeff Erasmus","phone":"072 887 3419"}', '', '', '', '', '', '', '', '', now(), now()),
  ('00000000-0000-0000-0000-000000000000', '10000000-0000-0000-0000-000000000004', 'authenticated', 'authenticated', 'david@laundrypickup.co.za', crypt('David#Mthe', gen_salt('bf')), now(), '{"provider":"email","providers":["email"]}', '{"role":"driver","name":"David Mthembu","phone":"079 412 6678"}', '', '', '', '', '', '', '', '', now(), now()),
  ('00000000-0000-0000-0000-000000000000', '10000000-0000-0000-0000-000000000005', 'authenticated', 'authenticated', 'lerato@laundrypickup.co.za', crypt('Lerato/Mahlangu', gen_salt('bf')), now(), '{"provider":"email","providers":["email"]}', '{"role":"driver","name":"Lerato Mahlangu","phone":"082 445 8899"}', '', '', '', '', '', '', '', '', now(), now()),
  ('00000000-0000-0000-0000-000000000000', '10000000-0000-0000-0000-000000000006', 'authenticated', 'authenticated', 'zanele@laundrypickup.co.za', crypt('Zanele!Ndlovu1', gen_salt('bf')), now(), '{"provider":"email","providers":["email"]}', '{"role":"driver","name":"Zanele Ndlovu","phone":"078 331 5520"}', '', '', '', '', '', '', '', '', now(), now())
on conflict do nothing;

insert into public.profiles (id, name, email, phone, role)
select
  id,
  raw_user_meta_data ->> 'name',
  email,
  raw_user_meta_data ->> 'phone',
  'driver'
from auth.users
where email in (
  'sipho@laundrypickup.co.za', 'thabo@laundrypickup.co.za', 'jeff@laundrypickup.co.za',
  'david@laundrypickup.co.za', 'lerato@laundrypickup.co.za', 'zanele@laundrypickup.co.za'
)
on conflict do nothing;

insert into auth.users (instance_id, id, aud, role, email, encrypted_password, email_confirmed_at, raw_app_meta_data, raw_user_meta_data, confirmation_token, recovery_token, email_change, email_change_token_new, email_change_token_current, phone_change, phone_change_token, reauthentication_token, created_at, updated_at)
values
  ('00000000-0000-0000-0000-000000000000', '20000000-0000-0000-0000-000000000001', 'authenticated', 'authenticated', 'admin@laundrypickup.co.za', crypt('Admin!Laundry#2025', gen_salt('bf')), now(), '{"provider":"email","providers":["email"]}', '{"role":"admin","name":"Admin"}', '', '', '', '', '', '', '', '', now(), now())
on conflict do nothing;

insert into public.profiles (id, name, email, phone, role)
select
  id,
  raw_user_meta_data ->> 'name',
  email,
  raw_user_meta_data ->> 'phone',
  'admin'
from auth.users
where email = 'admin@laundrypickup.co.za'
on conflict do nothing;

insert into public.drivers (profile_id, name, email, phone, vehicle, registration, area)
select
  p.id, p.name, p.email, p.phone, d.vehicle, d.registration, d.area
from public.profiles p
join (values
  ('sipho@laundrypickup.co.za',               'White VW Caddy',     'CA 482-113', 'Woodstock'),
  ('thabo@laundrypickup.co.za',               'Silver Toyota Corolla', 'CA 391-887', 'Maitland'),
  ('jeff@laundrypickup.co.za',                'Blue Ford Fiesta',   'CA 218-554', 'Woodstock'),
  ('david@laundrypickup.co.za',               'Grey Nissan Bakkie', 'CA 467-220', 'Observatory'),
  ('lerato@laundrypickup.co.za',              'White Toyota Bakkie','CA 533-091', 'Maitland'),
  ('zanele@laundrypickup.co.za',       'Red Hyundai i20',    'CA 176-338', 'Observatory')
) as d(email, vehicle, registration, area)
on p.email = d.email
on conflict do nothing;

update auth.users
set
  confirmation_token = coalesce(confirmation_token, ''),
  recovery_token = coalesce(recovery_token, ''),
  email_change = coalesce(email_change, ''),
  email_change_token_new = coalesce(email_change_token_new, ''),
  email_change_token_current = coalesce(email_change_token_current, ''),
  phone_change = coalesce(phone_change, ''),
  phone_change_token = coalesce(phone_change_token, ''),
  reauthentication_token = coalesce(reauthentication_token, '')
where
  confirmation_token is null
  or recovery_token is null
  or email_change is null
  or email_change_token_new is null
  or email_change_token_current is null
  or phone_change is null
  or phone_change_token is null
  or reauthentication_token is null;

insert into auth.identities (id, user_id, provider_id, provider, identity_data, last_sign_in_at, created_at, updated_at)
select
  u.id,
  u.id,
  u.email,
  'email',
  jsonb_build_object('sub', u.id::text, 'email', u.email, 'email_verified', true, 'phone_verified', false),
  now(),
  now(),
  now()
from auth.users u
where u.email in (
  'sipho@laundrypickup.co.za', 'thabo@laundrypickup.co.za', 'jeff@laundrypickup.co.za',
  'david@laundrypickup.co.za', 'lerato@laundrypickup.co.za', 'zanele@laundrypickup.co.za',
  'admin@laundrypickup.co.za'
)
on conflict do nothing;

insert into public.profiles (id, name, email, phone, role)
select
  u.id,
  coalesce(nullif(u.raw_user_meta_data ->> 'name', ''), split_part(u.email, '@', 1)),
  u.email,
  nullif(u.raw_user_meta_data ->> 'phone', ''),
  coalesce(nullif(u.raw_user_meta_data ->> 'role', ''), 'customer')
from auth.users u
where not exists (select 1 from public.profiles p where p.id = u.id)
on conflict do nothing;

do $$
begin
  update auth.config set mailer_autoconfirm = false;
exception
  when others then
    raise warning 'Could not set email confirmation via SQL. Enable it in Dashboard > Authentication > Sign In / Up > Email > Confirm email.';
end $$;

update auth.users
set email = replace(email, '@pickup.co.za', '@laundrypickup.co.za')
where email like '%@pickup.co.za';

update public.profiles
set email = replace(email, '@pickup.co.za', '@laundrypickup.co.za')
where email like '%@pickup.co.za';

update public.drivers
set email = replace(email, '@pickup.co.za', '@laundrypickup.co.za')
where email like '%@pickup.co.za';

update auth.identities
set
  provider_id = replace(provider_id, '@pickup.co.za', '@laundrypickup.co.za'),
  identity_data = jsonb_set(
    identity_data,
    '{email}',
    to_jsonb(replace(identity_data ->> 'email', '@pickup.co.za', '@laundrypickup.co.za'))
  )
where provider_id like '%@pickup.co.za';

create or replace function public.admin_list_orders()
returns table (
  id uuid,
  order_number text,
  booking_reference text,
  type text,
  customer_name text,
  customer_phone text,
  customer_id uuid,
  address text,
  "time" text,
  notes text,
  laundromat text,
  laundromat_address text,
  bag_count integer,
  total numeric,
  payment_method text,
  status text,
  created_at timestamptz,
  assigned_driver_id uuid,
  assigned_driver_name text
)
language sql
security definer
set search_path = public
as $$
  select
    o.id,
    o.order_number,
    o.booking_reference,
    o.type,
    o.customer_name,
    o.customer_phone,
    o.customer_id,
    o.address,
    o."time",
    o.notes,
    o.laundromat,
    o.laundromat_address,
    o.bag_count,
    o.total,
    o.payment_method,
    o.status,
    o.created_at,
    da.driver_id as assigned_driver_id,
    p.name as assigned_driver_name
  from driver_orders o
  left join driver_assignments da on da.order_id = o.id
  left join profiles p on p.id = da.driver_id
  where exists (
    select 1 from profiles a where a.id = auth.uid() and a.role = 'admin'
  )
  order by o.created_at desc;
$$;

create or replace function public.admin_assign_driver(p_booking_reference text, p_driver_id uuid)
returns boolean
language plpgsql
security definer
set search_path = public
as $$
declare
  v_leg_ids uuid[];
begin
  if not exists (
    select 1 from profiles where id = auth.uid() and role = 'admin'
  ) then
    return false;
  end if;

  select array_agg(id) into v_leg_ids
  from driver_orders
  where booking_reference = p_booking_reference;

  if v_leg_ids is null then
    return false;
  end if;

  delete from driver_assignments
  where order_id = any (v_leg_ids);

  insert into driver_assignments (order_id, driver_id, status, assigned_at)
  select id, p_driver_id, 'Assigned', now()
  from unnest(v_leg_ids) as t(id);

  update driver_orders
  set status = 'Assigned'
  where id = any (v_leg_ids)
    and status <> 'Completed';

  return true;
end;
$$;

grant execute on function public.admin_list_orders() to authenticated;
grant execute on function public.admin_assign_driver(text, uuid) to authenticated;

create or replace function public.customer_list_orders()
returns table (
  id uuid,
  order_number text,
  booking_reference text,
  type text,
  address text,
  "time" text,
  notes text,
  laundromat text,
  laundromat_address text,
  bag_count integer,
  total numeric,
  payment_method text,
  status text,
  created_at timestamptz,
  assigned_driver_name text,
  assigned_driver_phone text
)
language sql
security definer
set search_path = public
as $$
  select
    o.id,
    o.order_number,
    o.booking_reference,
    o.type,
    o.address,
    o."time",
    o.notes,
    o.laundromat,
    o.laundromat_address,
    o.bag_count,
    o.total,
    o.payment_method,
    o.status,
    o.created_at,
    p.name as assigned_driver_name,
    p.phone as assigned_driver_phone
  from driver_orders o
  left join driver_assignments da on da.order_id = o.id
  left join profiles p on p.id = da.driver_id
  where o.customer_id = auth.uid()
  order by o.created_at desc;
$$;

grant execute on function public.customer_list_orders() to authenticated;

create or replace function public.customer_cancel_booking(p_booking_reference text)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_customer uuid;
begin
  select customer_id into v_customer
  from orders
  where booking_reference = p_booking_reference;

  if v_customer is null then
    raise exception 'Booking not found.';
  end if;

  if v_customer <> auth.uid() then
    raise exception 'You can only cancel your own bookings.';
  end if;

  if exists (
    select 1 from driver_orders
    where booking_reference = p_booking_reference
      and status <> 'Pending'
  ) then
    raise exception 'Bookings can only be cancelled while they are still pending.';
  end if;

  update driver_orders
    set status = 'Cancelled'
    where booking_reference = p_booking_reference;

  update orders
    set status = 'Cancelled',
        updated_at = now()
    where booking_reference = p_booking_reference;

  update payments
    set status = 'Refunded'
    where booking_reference = p_booking_reference
      and status = 'Captured';

  delete from driver_assignments
    where order_id in (
      select id from driver_orders where booking_reference = p_booking_reference
    );
end;
$$;

grant execute on function public.customer_cancel_booking(text) to authenticated;

create or replace function public.driver_list_orders()
returns table (
  id uuid,
  order_number text,
  booking_reference text,
  type text,
  customer_name text,
  customer_phone text,
  address text,
  "time" text,
  notes text,
  laundromat text,
  laundromat_address text,
  status text,
  created_at timestamptz
)
language sql
security definer
set search_path = public
as $$
  select o.id, o.order_number, o.booking_reference, o.type, o.customer_name,
         o.customer_phone, o.address, o."time", o.notes, o.laundromat,
         o.laundromat_address, o.status, o.created_at
  from driver_orders o
  join driver_assignments da on da.order_id = o.id
  where da.driver_id = auth.uid();
$$;

create or replace function public.driver_get_order(p_order_id uuid)
returns table (
  id uuid,
  order_number text,
  booking_reference text,
  type text,
  customer_name text,
  customer_phone text,
  address text,
  "time" text,
  notes text,
  laundromat text,
  laundromat_address text,
  status text,
  created_at timestamptz
)
language sql
security definer
set search_path = public
as $$
  select o.id, o.order_number, o.booking_reference, o.type, o.customer_name,
         o.customer_phone, o.address, o."time", o.notes, o.laundromat,
         o.laundromat_address, o.status, o.created_at
  from driver_orders o
  join driver_assignments da on da.order_id = o.id
  where o.id = p_order_id and da.driver_id = auth.uid();
$$;

create or replace function public.driver_update_order_status(p_order_id uuid, p_status text)
returns boolean
language plpgsql
security definer
set search_path = public
as $$
declare
  v_assigned boolean;
begin
  if p_status not in ('Pending', 'Assigned', 'In Progress', 'Completed', 'Cancelled') then
    raise exception 'Invalid status: %', p_status;
  end if;

  select exists (
    select 1 from driver_assignments da
    where da.order_id = p_order_id and da.driver_id = auth.uid()
  ) into v_assigned;

  if not v_assigned then
    raise exception 'Order is not assigned to you.';
  end if;

  update driver_orders set status = p_status where id = p_order_id;
  return true;
end;
$$;

grant execute on function public.driver_list_orders() to authenticated;
grant execute on function public.driver_get_order(uuid) to authenticated;
grant execute on function public.driver_update_order_status(uuid, text) to authenticated;

create or replace function public.admin_create_driver(
  p_name text,
  p_email text,
  p_phone text,
  p_password text,
  p_vehicle text,
  p_registration text,
  p_area text
)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  v_user_id uuid;
  v_email text;
begin
  if not exists (select 1 from profiles where id = auth.uid() and role = 'admin') then
    raise exception 'Only administrators can create drivers.';
  end if;

  v_email := lower(btrim(coalesce(p_email, '')));
  if v_email = '' then
    raise exception 'Email is required.';
  end if;
  if p_password is null or length(p_password) < 8 then
    raise exception 'Password must be at least 8 characters.';
  end if;

  insert into auth.users (
    instance_id, id, aud, role, email, encrypted_password, email_confirmed_at,
    raw_app_meta_data, raw_user_meta_data,
    confirmation_token, recovery_token, email_change,
    email_change_token_new, email_change_token_current,
    phone_change, phone_change_token, reauthentication_token,
    created_at, updated_at
  )
  values (
    '00000000-0000-0000-0000-000000000000', gen_random_uuid(), 'authenticated', 'authenticated',
    v_email, crypt(p_password, gen_salt('bf')), now(),
    '{"provider":"email","providers":["email"]}',
    jsonb_build_object('role', 'driver', 'name', coalesce(p_name, ''), 'phone', coalesce(p_phone, '')),
    '', '', '', '', '', '', '', '', now(), now()
  )
  returning id into v_user_id;

  insert into public.profiles (id, name, email, phone, role)
  values (v_user_id, coalesce(p_name, ''), v_email, coalesce(p_phone, ''), 'driver')
  on conflict (id) do nothing;

  insert into public.drivers (profile_id, name, email, phone, vehicle, registration, area)
  values (v_user_id, coalesce(p_name, ''), v_email, coalesce(p_phone, ''), coalesce(p_vehicle, ''), coalesce(p_registration, ''), coalesce(p_area, ''))
  on conflict (profile_id) do nothing;

  return v_user_id;
end;
$$;

create or replace function public.admin_update_driver(
  p_driver_id uuid,
  p_email text,
  p_name text,
  p_phone text,
  p_vehicle text,
  p_registration text,
  p_area text,
  p_password text
)
returns boolean
language plpgsql
security definer
set search_path = public
as $$
declare
  v_email text;
begin
  if not exists (select 1 from profiles where id = auth.uid() and role = 'admin') then
    raise exception 'Only administrators can update drivers.';
  end if;

  v_email := lower(btrim(coalesce(p_email, '')));

  if p_password is not null and length(p_password) < 8 then
    raise exception 'Password must be at least 8 characters.';
  end if;

  if p_password is not null then
    update auth.users
    set encrypted_password = crypt(p_password, gen_salt('bf'))
    where id = p_driver_id;
  end if;

  if v_email <> '' then
    update auth.users set email = v_email where id = p_driver_id;
    update auth.identities
    set
      provider_id = v_email,
      identity_data = jsonb_set(identity_data, '{email}', to_jsonb(v_email))
    where user_id = p_driver_id and provider = 'email';
  end if;

  update public.profiles
  set
    name = coalesce(p_name, name),
    email = case when v_email <> '' then v_email else email end,
    phone = case when p_phone is not null then p_phone else phone end
  where id = p_driver_id;

  update public.drivers
  set
    name = coalesce(p_name, name),
    email = case when v_email <> '' then v_email else email end,
    phone = case when p_phone is not null then p_phone else phone end,
    vehicle = coalesce(p_vehicle, vehicle),
    registration = coalesce(p_registration, registration),
    area = coalesce(p_area, area)
  where profile_id = p_driver_id;

  return true;
end;
$$;

create or replace function public.admin_delete_driver(p_driver_id uuid)
returns boolean
language plpgsql
security definer
set search_path = public
as $$
begin
  if not exists (select 1 from profiles where id = auth.uid() and role = 'admin') then
    raise exception 'Only administrators can delete drivers.';
  end if;

  delete from auth.users where id = p_driver_id;
  return true;
end;
$$;

grant execute on function public.admin_create_driver(text, text, text, text, text, text, text) to authenticated;
grant execute on function public.admin_update_driver(uuid, text, text, text, text, text, text, text) to authenticated;
grant execute on function public.admin_delete_driver(uuid) to authenticated;

drop table if exists public.messages cascade;

create table if not exists public.messages (
  id               uuid primary key default gen_random_uuid(),
  booking_reference text not null,
  sender_id        uuid,
  sender_role      text not null check (sender_role in ('customer', 'driver', 'admin')),
  sender_name      text not null default '',
  body             text not null,
  created_at       timestamptz not null default now()
);

create index if not exists messages_booking_ref_idx on public.messages (booking_reference, created_at);

alter table public.messages enable row level security;

drop policy if exists "messages_select_participant" on public.messages;
create policy "messages_select_participant" on public.messages
  for select using (
    sender_id = auth.uid()
    or exists (
      select 1 from driver_orders o
      where o.booking_reference = messages.booking_reference
        and o.customer_id = auth.uid()
    )
    or exists (
      select 1 from driver_assignments da
      join driver_orders o on o.id = da.order_id
      where o.booking_reference = messages.booking_reference
        and da.driver_id = auth.uid()
    )
    or exists (
      select 1 from profiles p where p.id = auth.uid() and p.role = 'admin'
    )
  );

drop policy if exists "messages_insert_self" on public.messages;
create policy "messages_insert_self" on public.messages
  for insert with check (auth.uid() = sender_id);

create or replace function public.chat_list_messages(p_booking_reference text)
returns table (
  id uuid,
  booking_reference text,
  sender_id uuid,
  sender_role text,
  sender_name text,
  body text,
  created_at timestamptz
)
language sql
security definer
set search_path = public
as $$
  select m.id, m.booking_reference, m.sender_id, m.sender_role, m.sender_name, m.body, m.created_at
  from messages m
  where m.booking_reference = p_booking_reference
    and (
      m.sender_id = auth.uid()
      or exists (select 1 from driver_orders o where o.booking_reference = m.booking_reference and o.customer_id = auth.uid())
      or exists (select 1 from driver_assignments da join driver_orders o on o.id = da.order_id where o.booking_reference = m.booking_reference and da.driver_id = auth.uid())
      or exists (select 1 from profiles p where p.id = auth.uid() and p.role = 'admin')
    )
  order by m.created_at asc;
$$;

create or replace function public.chat_send_message(
  p_booking_reference text,
  p_body text,
  p_sender_role text,
  p_sender_name text
)
returns table (
  id uuid,
  booking_reference text,
  sender_id uuid,
  sender_role text,
  sender_name text,
  body text,
  created_at timestamptz
)
language plpgsql
security definer
set search_path = public
as $$
declare
  v_sender_id uuid := auth.uid();
  v_id uuid;
  v_participant boolean;
begin
  if p_body is null or btrim(p_body) = '' then
    raise exception 'Message cannot be empty.';
  end if;

  if p_sender_role = 'admin' then
    select exists (select 1 from profiles where id = v_sender_id and role = 'admin') into v_participant;
  elsif p_sender_role = 'driver' then
    select exists (
      select 1 from driver_assignments da
      join driver_orders o on o.id = da.order_id
      where o.booking_reference = p_booking_reference and da.driver_id = v_sender_id
    ) into v_participant;
  else
    select exists (
      select 1 from driver_orders o
      where o.booking_reference = p_booking_reference and o.customer_id = v_sender_id
    ) into v_participant;
  end if;

  if not v_participant then
    raise exception 'You cannot send messages for this order.';
  end if;

  select public.chat_insert_message(p_booking_reference, v_sender_id, p_sender_role, coalesce(p_sender_name, ''), p_body) into v_id;

  return query
    select m.id, m.booking_reference, m.sender_id, m.sender_role, m.sender_name, m.body, m.created_at
    from public.messages m
    where m.id = v_id;
end;
$$;

grant execute on function public.chat_list_messages(text) to authenticated;
grant execute on function public.chat_send_message(text, text, text, text) to authenticated;

create or replace function public.admin_update_order_status(p_booking_reference text, p_status text)
returns boolean
language plpgsql
security definer
set search_path = public
as $$
begin
  if not exists (select 1 from profiles where id = auth.uid() and role = 'admin') then
    raise exception 'Only administrators can update orders.';
  end if;

  if p_status not in ('Pending', 'Assigned', 'In Progress', 'Completed', 'Cancelled') then
    raise exception 'Invalid status: %', p_status;
  end if;

  update driver_orders
  set status = p_status
  where booking_reference = p_booking_reference;

  return true;
end;
$$;

grant execute on function public.admin_update_order_status(text, text) to authenticated;

drop table if exists public.support_messages cascade;
drop table if exists public.reviews cascade;
drop table if exists public.payments cascade;
drop table if exists public.order_items cascade;
drop table if exists public.orders cascade;
drop table if exists public.notifications cascade;
drop table if exists public.addresses cascade;
drop table if exists public.conversations cascade;

create table if not exists public.orders (
  id                 uuid primary key default gen_random_uuid(),
  booking_reference  text not null unique,
  customer_id        uuid,
  customer_name      text not null,
  customer_phone     text,
  pickup_address     text not null,
  delivery_address   text not null,
  pickup_window      text,
  delivery_window    text,
  instructions       text,
  laundromat         text,
  laundromat_address text,
  bag_count          integer,
  total              numeric not null default 0,
  payment_method     text not null default 'Card' check (payment_method in ('Card', 'EFT', 'Cash')),
  status             text not null default 'Pending',
  created_at         timestamptz not null default now(),
  updated_at         timestamptz not null default now()
);

create index if not exists orders_booking_idx   on public.orders (booking_reference);
create index if not exists orders_customer_idx  on public.orders (customer_id);

create table if not exists public.order_items (
  id                uuid primary key default gen_random_uuid(),
  booking_reference text not null,
  item_name         text not null,
  quantity          integer not null default 1,
  price             numeric not null default 0,
  created_at        timestamptz not null default now()
);

create index if not exists order_items_booking_idx on public.order_items (booking_reference);

create table if not exists public.payments (
  id                uuid primary key default gen_random_uuid(),
  booking_reference text not null,
  customer_id       uuid,
  customer_name     text not null default '',
  amount            numeric not null default 0,
  method            text not null default 'Card' check (method in ('Card', 'EFT', 'Cash')),
  status            text not null default 'Captured' check (status in ('Pending', 'Captured', 'Failed', 'Refunded')),
  reference         text,
  paid_at           timestamptz not null default now(),
  created_at        timestamptz not null default now()
);

create index if not exists payments_booking_idx on public.payments (booking_reference);
create index if not exists payments_customer_idx on public.payments (customer_id);

create table if not exists public.reviews (
  id                uuid primary key default gen_random_uuid(),
  booking_reference text,
  customer_id       uuid,
  customer_name     text not null default '',
  rating            integer not null default 5 check (rating >= 1 and rating <= 5),
  comment           text not null default '',
  created_at        timestamptz not null default now()
);

create index if not exists reviews_customer_idx on public.reviews (customer_id);

create table if not exists public.support_messages (
  id           uuid primary key default gen_random_uuid(),
  user_id      uuid,
  sender_name  text not null default '',
  sender_email text not null default '',
  subject      text not null default '',
  message      text not null,
  status       text not null default 'Open' check (status in ('Open', 'Resolved')),
  created_at   timestamptz not null default now()
);

create index if not exists support_messages_status_idx on public.support_messages (status);

create table if not exists public.addresses (
  id         uuid primary key default gen_random_uuid(),
  user_id    uuid not null,
  label      text not null default '',
  address    text not null,
  is_default boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists addresses_user_idx on public.addresses (user_id);

create table if not exists public.notifications (
  id             uuid primary key default gen_random_uuid(),
  user_id        uuid,
  recipient_role text not null default 'customer' check (recipient_role in ('customer', 'driver', 'admin')),
  kind           text not null default 'info',
  title          text not null,
  body           text not null,
  order_id       text,
  read           boolean not null default false,
  created_at     timestamptz not null default now()
);

create index if not exists notifications_user_idx on public.notifications (user_id);
create index if not exists notifications_unread_idx on public.notifications (user_id) where read = false;

create table if not exists public.conversations (
  id                uuid primary key default gen_random_uuid(),
  booking_reference text not null unique,
  customer_id       uuid,
  driver_id         uuid,
  created_at        timestamptz not null default now(),
  updated_at        timestamptz not null default now()
);

create index if not exists conversations_booking_idx on public.conversations (booking_reference);

alter table public.orders enable row level security;
alter table public.order_items enable row level security;
alter table public.payments enable row level security;
alter table public.reviews enable row level security;
alter table public.support_messages enable row level security;
alter table public.addresses enable row level security;
alter table public.notifications enable row level security;
alter table public.conversations enable row level security;

-- SQL helper functions: SQL-language functions have no PL/pgSQL variables,
-- so the RETURN-name/INSERT-column ambiguity (PG 42702) cannot occur here.
-- API RPC response shapes stay unchanged.

create or replace function public.booking_insert_leg(
  p_ref text, p_suffix text, p_type text, p_name text, p_phone text,
  p_customer_id uuid, p_address text, p_window text, p_notes text,
  p_laundromat text, p_laundromat_address text, p_bags integer,
  p_total numeric, p_payment text
) returns uuid
language sql security definer set search_path = public as $$
  insert into driver_orders (
    order_number, booking_reference, type, customer_name, customer_phone,
    customer_id, address, "time", notes, laundromat, laundromat_address,
    bag_count, total, payment_method, status
  )
  values (
    p_ref || '-' || p_suffix, p_ref, p_type, p_name, p_phone, p_customer_id,
    p_address, p_window, p_notes, p_laundromat, p_laundromat_address,
    p_bags, p_total, p_payment, 'Pending'
  )
  returning id;
$$;

create or replace function public.booking_insert_order(
  p_ref text, p_customer_id uuid, p_name text, p_phone text,
  p_pickup_address text, p_delivery_address text, p_pickup_window text,
  p_delivery_window text, p_instructions text, p_laundromat text,
  p_laundromat_address text, p_bags integer, p_total numeric, p_payment text
) returns void
language sql security definer set search_path = public as $$
  insert into orders (
    booking_reference, customer_id, customer_name, customer_phone,
    pickup_address, delivery_address, pickup_window, delivery_window,
    instructions, laundromat, laundromat_address, bag_count, total,
    payment_method, status
  )
  values (
    p_ref, p_customer_id, p_name, p_phone, p_pickup_address,
    p_delivery_address, p_pickup_window, p_delivery_window, p_instructions,
    p_laundromat, p_laundromat_address, p_bags, p_total, p_payment, 'Pending'
  );
$$;

create or replace function public.booking_insert_order_item(p_ref text, p_name text, p_qty integer, p_price numeric) returns void
language sql security definer set search_path = public as $$
  insert into order_items (booking_reference, item_name, quantity, price)
  values (p_ref, p_name, p_qty, p_price);
$$;

create or replace function public.booking_insert_payment(p_ref text, p_customer_id uuid, p_name text, p_total numeric, p_payment text) returns void
language sql security definer set search_path = public as $$
  insert into payments (booking_reference, customer_id, customer_name, amount, method, status)
  values (p_ref, p_customer_id, p_name, p_total, coalesce(p_payment, 'Card'), 'Captured');
$$;

create or replace function public.booking_ensure_conversation(p_ref text, p_customer_id uuid) returns void
language sql security definer set search_path = public as $$
  insert into conversations (booking_reference, customer_id)
  select p_ref, p_customer_id
  where not exists (select 1 from conversations c where c.booking_reference = p_ref);
$$;

create or replace function public.booking_add_notification(p_user_id uuid, p_role text, p_kind text, p_title text, p_body text, p_order_id text) returns void
language sql security definer set search_path = public as $$
  insert into notifications (user_id, recipient_role, kind, title, body, order_id)
  values (p_user_id, p_role, p_kind, p_title, p_body, p_order_id);
$$;

create or replace function public.chat_insert_message(p_ref text, p_sender_id uuid, p_role text, p_name text, p_body text) returns uuid
language sql security definer set search_path = public as $$
  insert into public.messages (booking_reference, sender_id, sender_role, sender_name, body)
  values (p_ref, p_sender_id, p_role, coalesce(p_name, ''), btrim(p_body))
  returning id;
$$;

create or replace function public.address_insert(p_id uuid, p_user_id uuid, p_label text, p_address text, p_default boolean) returns void
language sql security definer set search_path = public as $$
  insert into addresses (id, user_id, label, address, is_default)
  values (p_id, p_user_id, coalesce(p_label, ''), coalesce(p_address, ''), coalesce(p_default, false));
$$;

create or replace function public.support_insert_message(p_user_id uuid, p_name text, p_email text, p_subject text, p_message text) returns void
language sql security definer set search_path = public as $$
  insert into support_messages (user_id, sender_name, sender_email, subject, message, status)
  values (p_user_id, coalesce(p_name, ''), coalesce(p_email, ''), coalesce(p_subject, ''), coalesce(p_message, ''), 'Open');
$$;

create or replace function public.reviews_insert(p_ref text, p_customer_id uuid, p_name text, p_rating integer, p_comment text) returns void
language sql security definer set search_path = public as $$
  insert into reviews (booking_reference, customer_id, customer_name, rating, comment)
  values (nullif(p_ref, ''), p_customer_id, coalesce(p_name, ''), p_rating, coalesce(p_comment, ''));
$$;

-- Helpers are internal building blocks; only the API RPCs above may call them.
revoke execute on function public.booking_insert_leg(text, text, text, text, text, uuid, text, text, text, text, text, integer, numeric, text) from public;
revoke execute on function public.booking_insert_order(text, uuid, text, text, text, text, text, text, text, text, text, integer, numeric, text) from public;
revoke execute on function public.booking_insert_order_item(text, text, integer, numeric) from public;
revoke execute on function public.booking_insert_payment(text, uuid, text, numeric, text) from public;
revoke execute on function public.booking_ensure_conversation(text, uuid) from public;
revoke execute on function public.booking_add_notification(uuid, text, text, text, text, text) from public;
revoke execute on function public.chat_insert_message(text, uuid, text, text, text) from public;
revoke execute on function public.address_insert(uuid, uuid, text, text, boolean) from public;
revoke execute on function public.support_insert_message(uuid, text, text, text, text) from public;
revoke execute on function public.reviews_insert(text, uuid, text, integer, text) from public;

create or replace function public.create_booking(
  p_reference text,
  p_customer_name text,
  p_customer_phone text,
  p_pickup_address text,
  p_pickup_window text,
  p_delivery_address text,
  p_delivery_window text,
  p_instructions text,
  p_laundromat text,
  p_laundromat_address text,
  p_bag_count integer,
  p_total numeric,
  p_payment_method text,
  p_items jsonb
)
returns table (pickup_leg_id uuid, delivery_leg_id uuid, booking_reference text)
language plpgsql
security definer
set search_path = public
as $$
declare
  v_customer_id uuid := auth.uid();
  v_pickup uuid;
  v_delivery uuid;
  v_admin_id uuid;
  v_item jsonb;
begin
  if v_customer_id is null then
    raise exception 'You must be signed in to place an order.';
  end if;

  v_pickup := public.booking_insert_leg(p_reference, 'P', 'Pickup', p_customer_name, p_customer_phone, v_customer_id, p_pickup_address, p_pickup_window, p_instructions, p_laundromat, p_laundromat_address, p_bag_count, p_total, p_payment_method);
  v_delivery := public.booking_insert_leg(p_reference, 'D', 'Delivery', p_customer_name, p_customer_phone, v_customer_id, p_delivery_address, p_delivery_window, p_instructions, p_laundromat, p_laundromat_address, p_bag_count, p_total, p_payment_method);

  perform public.booking_insert_order(p_reference, v_customer_id, p_customer_name, p_customer_phone, p_pickup_address, p_delivery_address, p_pickup_window, p_delivery_window, p_instructions, p_laundromat, p_laundromat_address, p_bag_count, p_total, p_payment_method);

  if jsonb_typeof(p_items) = 'array' then
    for v_item in select * from jsonb_array_elements(p_items)
    loop
      perform public.booking_insert_order_item(
        p_reference,
        coalesce(v_item ->> 'name', ''),
        coalesce((v_item ->> 'quantity')::integer, 1),
        coalesce((v_item ->> 'price')::numeric, 0)
      );
    end loop;
  end if;

  perform public.booking_insert_payment(p_reference, v_customer_id, p_customer_name, p_total, p_payment_method);

  perform public.booking_ensure_conversation(p_reference, v_customer_id);

  select id into v_admin_id from profiles where role = 'admin' order by created_at asc limit 1;

  if v_admin_id is not null then
    perform public.booking_add_notification(v_admin_id, 'admin', 'order_placed', 'New Order Placed', p_customer_name || ' placed booking ' || p_reference || '.', p_reference);
  end if;

  return query select v_pickup, v_delivery, p_reference;
end;
$$;

grant execute on function public.create_booking(text, text, text, text, text, text, text, text, text, text, integer, numeric, text, jsonb) to authenticated;

create or replace function public.customer_list_addresses()
returns table (id uuid, label text, address text, is_default boolean)
language sql
security definer
set search_path = public
as $$
  select a.id, a.label, a.address, a.is_default
  from addresses a
  where a.user_id = auth.uid()
  order by a.is_default desc, a.created_at asc;
$$;

create or replace function public.customer_save_address(p_id uuid, p_label text, p_address text, p_is_default boolean)
returns table (id uuid, label text, address text, is_default boolean)
language plpgsql
security definer
set search_path = public
as $$
declare
  v_user_id uuid := auth.uid();
  v_id uuid := coalesce(p_id, gen_random_uuid());
begin
  if v_user_id is null then
    raise exception 'You must be signed in to save an address.';
  end if;

  if p_is_default then
    update addresses a set a.is_default = false where a.user_id = v_user_id;
  end if;

  if p_id is not null and exists (select 1 from addresses a where a.id = p_id and a.user_id = v_user_id) then
    update addresses a
    set a.label = coalesce(p_label, ''), a.address = coalesce(p_address, ''), a.is_default = coalesce(p_is_default, false), a.updated_at = now()
    where a.id = p_id;
  else
    perform public.address_insert(v_id, v_user_id, p_label, p_address, p_is_default);
  end if;

  if not exists (select 1 from addresses a where a.user_id = v_user_id and a.is_default = true)
     and exists (select 1 from addresses a where a.user_id = v_user_id) then
    update addresses a set a.is_default = true
    where a.user_id = v_user_id
      and a.id = (select aa.id from addresses aa where aa.user_id = v_user_id order by aa.created_at asc limit 1);
  end if;

  return query
    select a.id, a.label, a.address, a.is_default
    from addresses a
    where a.user_id = v_user_id
    order by a.is_default desc, a.created_at asc;
end;
$$;

create or replace function public.customer_delete_address(p_id uuid)
returns table (id uuid, label text, address text, is_default boolean)
language plpgsql
security definer
set search_path = public
as $$
declare
  v_user_id uuid := auth.uid();
begin
  delete from addresses a where a.id = p_id and a.user_id = v_user_id;

  if not exists (select 1 from addresses a where a.user_id = v_user_id and a.is_default = true)
     and exists (select 1 from addresses a where a.user_id = v_user_id) then
    update addresses a set a.is_default = true
    where a.user_id = v_user_id
      and a.id = (select aa.id from addresses aa where aa.user_id = v_user_id order by aa.created_at asc limit 1);
  end if;

  return query
    select a.id, a.label, a.address, a.is_default
    from addresses a
    where a.user_id = v_user_id
    order by a.is_default desc, a.created_at asc;
end;
$$;

grant execute on function public.customer_list_addresses() to authenticated;
grant execute on function public.customer_save_address(uuid, text, text, boolean) to authenticated;
grant execute on function public.customer_delete_address(uuid) to authenticated;

create or replace function public.notifications_list()
returns table (
  id uuid,
  kind text,
  title text,
  body text,
  order_id text,
  read boolean,
  created_at timestamptz,
  recipient_role text
)
language sql
security definer
set search_path = public
as $$
  select n.id, n.kind, n.title, n.body, n.order_id, n.read, n.created_at, n.recipient_role
  from notifications n
  where n.user_id = auth.uid()
  order by n.created_at desc;
$$;

create or replace function public.notifications_mark_read(p_id uuid)
returns boolean
language plpgsql
security definer
set search_path = public
as $$
begin
  update notifications set read = true where id = p_id and user_id = auth.uid();
  return found;
end;
$$;

create or replace function public.notifications_mark_all_read()
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  update notifications set read = true where user_id = auth.uid();
end;
$$;

create or replace function public.notifications_add(
  p_recipient_role text,
  p_recipient_name text,
  p_kind text,
  p_title text,
  p_body text,
  p_order_id text
)
returns table (id uuid, kind text, title text, body text, order_id text, read boolean, created_at timestamptz, recipient_role text)
language plpgsql
security definer
set search_path = public
as $$
declare
  v_user_id uuid;
begin
  select p.id into v_user_id
  from profiles p
  where p.role = coalesce(p_recipient_role, 'customer')
    and lower(p.name) = lower(coalesce(p_recipient_name, ''))
  limit 1;

  if v_user_id is null then
    v_user_id := auth.uid();
  end if;

  perform public.booking_add_notification(v_user_id, coalesce(p_recipient_role, 'customer'), coalesce(p_kind, 'info'), coalesce(p_title, ''), coalesce(p_body, ''), p_order_id);

  return query
    select n.id, n.kind, n.title, n.body, n.order_id, n.read, n.created_at, n.recipient_role
    from notifications n
    where n.user_id = v_user_id
    order by n.created_at desc
    limit 1;
end;
$$;

grant execute on function public.notifications_list() to authenticated;
grant execute on function public.notifications_mark_read(uuid) to authenticated;
grant execute on function public.notifications_mark_all_read() to authenticated;
grant execute on function public.notifications_add(text, text, text, text, text, text) to authenticated;

create or replace function public.customer_list_support_messages()
returns table (id uuid, user_id uuid, sender_name text, sender_email text, subject text, message text, status text, created_at timestamptz)
language sql
security definer
set search_path = public
as $$
  select s.id, s.user_id, s.sender_name, s.sender_email, s.subject, s.message, s.status, s.created_at
  from support_messages s
  where s.user_id = auth.uid()
  order by s.created_at desc;
$$;

create or replace function public.add_support_message(p_subject text, p_message text)
returns table (id uuid, user_id uuid, sender_name text, sender_email text, subject text, message text, status text, created_at timestamptz)
language plpgsql
security definer
set search_path = public
as $$
declare
  v_user_id uuid := auth.uid();
  v_name text;
  v_email text;
begin
  if v_user_id is null then
    raise exception 'You must be signed in to send a support message.';
  end if;

  select p.name, p.email into v_name, v_email from profiles p where p.id = v_user_id;

  perform public.support_insert_message(v_user_id, v_name, v_email, p_subject, p_message);

  return query
    select s.id, s.user_id, s.sender_name, s.sender_email, s.subject, s.message, s.status, s.created_at
    from support_messages s
    where s.user_id = v_user_id
    order by s.created_at desc
    limit 1;
end;
$$;

create or replace function public.admin_list_support_messages()
returns table (id uuid, user_id uuid, sender_name text, sender_email text, subject text, message text, status text, created_at timestamptz)
language sql
security definer
set search_path = public
as $$
  select s.id, s.user_id, s.sender_name, s.sender_email, s.subject, s.message, s.status, s.created_at
  from support_messages s
  order by s.created_at desc;
$$;

create or replace function public.admin_update_support_status(p_id uuid, p_status text)
returns boolean
language plpgsql
security definer
set search_path = public
as $$
begin
  if not exists (select 1 from profiles where id = auth.uid() and role = 'admin') then
    raise exception 'Only administrators can update support messages.';
  end if;
  if p_status not in ('Open', 'Resolved') then
    raise exception 'Invalid support message status.';
  end if;
  update support_messages set status = p_status where id = p_id;
  return found;
end;
$$;

create or replace function public.admin_delete_support_message(p_id uuid)
returns boolean
language plpgsql
security definer
set search_path = public
as $$
begin
  if not exists (select 1 from profiles where id = auth.uid() and role = 'admin') then
    raise exception 'Only administrators can delete support messages.';
  end if;
  delete from support_messages where id = p_id;
  return found;
end;
$$;

grant execute on function public.customer_list_support_messages() to authenticated;
grant execute on function public.add_support_message(text, text) to authenticated;
grant execute on function public.admin_list_support_messages() to authenticated;
grant execute on function public.admin_update_support_status(uuid, text) to authenticated;
grant execute on function public.admin_delete_support_message(uuid) to authenticated;

create or replace function public.customer_add_review(p_booking_reference text, p_rating integer, p_comment text)
returns table (id uuid, booking_reference text, customer_id uuid, customer_name text, rating integer, comment text, created_at timestamptz)
language plpgsql
security definer
set search_path = public
as $$
declare
  v_user_id uuid := auth.uid();
  v_name text;
begin
  if v_user_id is null then
    raise exception 'You must be signed in to leave a review.';
  end if;
  if p_rating < 1 or p_rating > 5 then
    raise exception 'Rating must be between 1 and 5.';
  end if;

  select p.name into v_name from profiles p where p.id = v_user_id;

  perform public.reviews_insert(p_booking_reference, v_user_id, v_name, p_rating, p_comment);

  return query
    select r.id, r.booking_reference, r.customer_id, r.customer_name, r.rating, r.comment, r.created_at
    from reviews r
    where r.customer_id = v_user_id
    order by r.created_at desc
    limit 1;
end;
$$;

create or replace function public.admin_list_reviews()
returns table (id uuid, booking_reference text, customer_id uuid, customer_name text, rating integer, comment text, created_at timestamptz)
language sql
security definer
set search_path = public
as $$
  select r.id, r.booking_reference, r.customer_id, r.customer_name, r.rating, r.comment, r.created_at
  from reviews r
  order by r.created_at desc;
$$;

grant execute on function public.customer_add_review(text, integer, text) to authenticated;
grant execute on function public.admin_list_reviews() to authenticated;

create or replace function public.admin_list_payments()
returns table (id uuid, booking_reference text, customer_id uuid, customer_name text, amount numeric, method text, status text, reference text, paid_at timestamptz)
language sql
security definer
set search_path = public
as $$
  select p.id, p.booking_reference, p.customer_id, p.customer_name, p.amount, p.method, p.status, p.reference, p.paid_at
  from payments p
  order by p.paid_at desc;
$$;

create or replace function public.customer_list_payments()
returns table (id uuid, booking_reference text, customer_id uuid, customer_name text, amount numeric, method text, status text, reference text, paid_at timestamptz)
language sql
security definer
set search_path = public
as $$
  select p.id, p.booking_reference, p.customer_id, p.customer_name, p.amount, p.method, p.status, p.reference, p.paid_at
  from payments p
  where p.customer_id = auth.uid()
  order by p.paid_at desc;
$$;

grant execute on function public.admin_list_payments() to authenticated;
grant execute on function public.customer_list_payments() to authenticated;

create or replace function public.admin_list_customers()
returns table (id uuid, name text, email text, phone text, total_orders bigint, created_at timestamptz)
language sql
security definer
set search_path = public
as $$
  select p.id, p.name, p.email, p.phone, count(o.id) as total_orders, p.created_at
  from profiles p
  left join orders o on o.customer_id = p.id
  where p.role = 'customer'
  group by p.id
  order by p.created_at asc;
$$;

create or replace function public.admin_list_drivers()
returns table (id uuid, name text, email text, phone text, vehicle text, registration text, area text, created_at timestamptz)
language sql
security definer
set search_path = public
as $$
  select d.profile_id, d.name, d.email, d.phone, d.vehicle, d.registration, d.area, d.created_at
  from drivers d
  order by d.name asc;
$$;

grant execute on function public.admin_list_customers() to authenticated;
grant execute on function public.admin_list_drivers() to authenticated;

create or replace function public.admin_assign_driver(p_booking_reference text, p_driver_id uuid)
returns boolean
language plpgsql
security definer
set search_path = public
as $$
declare
  v_leg_ids uuid[];
  v_driver_name text;
  v_customer_id uuid;
  v_admin_id uuid;
begin
  if not exists (select 1 from profiles where id = auth.uid() and role = 'admin') then
    return false;
  end if;

  select array_agg(id) into v_leg_ids
  from driver_orders
  where booking_reference = p_booking_reference;

  if v_leg_ids is null then
    return false;
  end if;

  delete from driver_assignments
  where order_id = any (v_leg_ids);

  insert into driver_assignments (order_id, driver_id, status, assigned_at)
  select id, p_driver_id, 'Assigned', now()
  from unnest(v_leg_ids) as t(id);

  update driver_orders
  set status = 'Assigned'
  where id = any (v_leg_ids)
    and status <> 'Completed';

  select name into v_driver_name from profiles where id = p_driver_id;

  select o.customer_id into v_customer_id
  from driver_orders o
  where o.booking_reference = p_booking_reference
  limit 1;

  update conversations
  set driver_id = p_driver_id, updated_at = now()
  where booking_reference = p_booking_reference;

  update orders
  set status = 'Assigned', updated_at = now()
  where booking_reference = p_booking_reference;

  insert into notifications (user_id, recipient_role, kind, title, body, order_id)
  values (p_driver_id, 'driver', 'order_assigned', 'New Order Assigned',
    'Order ' || p_booking_reference || ' has been assigned to you. Please check your Orders tab.', p_booking_reference);

  if v_customer_id is not null then
    insert into notifications (user_id, recipient_role, kind, title, body, order_id)
    values (v_customer_id, 'customer', 'driver_assigned', 'Driver Assigned',
      'Driver ' || coalesce(v_driver_name, '') || ' has been assigned to your order ' || p_booking_reference || '.', p_booking_reference);
  end if;

  select id into v_admin_id from profiles where role = 'admin' order by created_at asc limit 1;

  return true;
end;
$$;

create or replace function public.driver_update_order_status(p_order_id uuid, p_status text)
returns boolean
language plpgsql
security definer
set search_path = public
as $$
declare
  v_assigned boolean;
  v_customer_id uuid;
  v_booking_reference text;
begin
  if p_status not in ('Pending', 'Assigned', 'In Progress', 'Completed', 'Cancelled') then
    raise exception 'Invalid status: %', p_status;
  end if;

  select exists (
    select 1 from driver_assignments da
    where da.order_id = p_order_id and da.driver_id = auth.uid()
  ) into v_assigned;

  if not v_assigned then
    raise exception 'Order is not assigned to you.';
  end if;

  update driver_orders set status = p_status where id = p_order_id;

  select o.customer_id, o.booking_reference
  into v_customer_id, v_booking_reference
  from driver_orders o
  where o.id = p_order_id;

  update orders
  set status = p_status, updated_at = now()
  where booking_reference = v_booking_reference;

  if v_customer_id is not null then
    insert into notifications (user_id, recipient_role, kind, title, body, order_id)
    values (
      v_customer_id,
      'customer',
      case when p_status = 'Completed' then 'order_delivered' else 'order_updated' end,
      case when p_status = 'Completed' then 'Order Delivered' else 'Order ' || p_status end,
      case when p_status = 'Completed'
        then 'Your order ' || v_booking_reference || ' has been delivered. Thanks for using Laundry Pickup Pro!'
        else 'Your order ' || v_booking_reference || ' is now ' || lower(p_status) || '.' end,
      v_booking_reference
    );
  end if;

  return true;
end;
$$;

create or replace function public.admin_update_order_status(p_booking_reference text, p_status text)
returns boolean
language plpgsql
security definer
set search_path = public
as $$
declare
  v_customer_id uuid;
  v_driver_id uuid;
  v_driver_name text;
begin
  if not exists (select 1 from profiles where id = auth.uid() and role = 'admin') then
    raise exception 'Only administrators can update orders.';
  end if;

  if p_status not in ('Pending', 'Assigned', 'In Progress', 'Completed', 'Cancelled') then
    raise exception 'Invalid status: %', p_status;
  end if;

  update driver_orders
  set status = p_status
  where booking_reference = p_booking_reference;

  update orders
  set status = p_status, updated_at = now()
  where booking_reference = p_booking_reference;

  select o.customer_id into v_customer_id
  from driver_orders o
  where o.booking_reference = p_booking_reference
  limit 1;

  select da.driver_id into v_driver_id
  from driver_assignments da
  join driver_orders o on o.id = da.order_id
  where o.booking_reference = p_booking_reference
  limit 1;

  select name into v_driver_name from profiles where id = v_driver_id;

  if v_customer_id is not null then
    insert into notifications (user_id, recipient_role, kind, title, body, order_id)
    values (v_customer_id, 'customer', 'order_updated', 'Order ' || p_status,
      'Your order ' || p_booking_reference || ' is now ' || lower(p_status) || '.', p_booking_reference);
  end if;

  if v_driver_id is not null then
    insert into notifications (user_id, recipient_role, kind, title, body, order_id)
    values (v_driver_id, 'driver', 'order_updated', 'Order ' || p_status,
      'Order ' || p_booking_reference || ' is now ' || lower(p_status) || '.', p_booking_reference);
  end if;

  return true;
end;
$$;

create or replace function public.chat_send_message(
  p_booking_reference text,
  p_body text,
  p_sender_role text,
  p_sender_name text
)
returns table (
  id uuid,
  booking_reference text,
  sender_id uuid,
  sender_role text,
  sender_name text,
  body text,
  created_at timestamptz
)
language plpgsql
security definer
set search_path = public
as $$
declare
  v_sender_id uuid := auth.uid();
  v_id uuid;
  v_participant boolean;
  v_other_user_id uuid;
  v_other_role text;
begin
  if p_body is null or btrim(p_body) = '' then
    raise exception 'Message cannot be empty.';
  end if;

  if p_sender_role = 'admin' then
    select exists (select 1 from profiles where id = v_sender_id and role = 'admin') into v_participant;
  elsif p_sender_role = 'driver' then
    select exists (
      select 1 from driver_assignments da
      join driver_orders o on o.id = da.order_id
      where o.booking_reference = p_booking_reference and da.driver_id = v_sender_id
    ) into v_participant;
  else
    select exists (
      select 1 from driver_orders o
      where o.booking_reference = p_booking_reference and o.customer_id = v_sender_id
    ) into v_participant;
  end if;

  if not v_participant then
    raise exception 'You cannot send messages for this order.';
  end if;

  select public.chat_insert_message(p_booking_reference, v_sender_id, p_sender_role, coalesce(p_sender_name, ''), p_body) into v_id;

  update conversations c
  set c.updated_at = now()
  where c.booking_reference = p_booking_reference;

  if p_sender_role = 'driver' then
    select c.customer_id into v_other_user_id
    from conversations c
    where c.booking_reference = p_booking_reference;
    v_other_role := 'customer';
  else
    select c.driver_id into v_other_user_id
    from conversations c
    where c.booking_reference = p_booking_reference;
    v_other_role := 'driver';
  end if;

  if v_other_user_id is not null then
    perform public.booking_add_notification(v_other_user_id, v_other_role, 'new_message', 'New Message',
      coalesce(p_sender_name, '') || ' sent you a message about ' || p_booking_reference || '.', p_booking_reference);
  end if;

  return query
    select m.id, m.booking_reference, m.sender_id, m.sender_role, m.sender_name, m.body, m.created_at
    from public.messages m
    where m.id = v_id;
end;
$$;

notify pgrst, 'reload schema';