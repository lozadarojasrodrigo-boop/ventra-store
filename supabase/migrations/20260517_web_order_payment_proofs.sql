alter table public.pedidos_web
add column if not exists payment_proof_path text,
add column if not exists payment_proof_uploaded_at timestamptz;

insert into storage.buckets (id, name, public)
values ('web-order-proofs', 'web-order-proofs', true)
on conflict (id) do update
set public = true;
