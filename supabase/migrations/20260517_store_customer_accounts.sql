alter table public.pedidos_web
add column if not exists auth_user_id uuid references auth.users (id) on delete set null,
add column if not exists cliente_direccion text not null default '';

update public.pedidos_web
set
  cliente_direccion = case
    when position(' | ' in coalesce(cliente_ciudad, '')) > 0
      then split_part(cliente_ciudad, ' | ', 2)
    else coalesce(cliente_direccion, '')
  end,
  cliente_ciudad = case
    when position(' | ' in coalesce(cliente_ciudad, '')) > 0
      then split_part(cliente_ciudad, ' | ', 1)
    else cliente_ciudad
  end
where coalesce(cliente_direccion, '') = '';

alter table public.pedidos_web
drop constraint if exists pedidos_web_estado_check;

alter table public.pedidos_web
add constraint pedidos_web_estado_check
check (
  estado in (
    'pendiente',
    'pago_en_revision',
    'procesando',
    'confirmado',
    'preparando',
    'enviado',
    'entregado',
    'cancelado',
    'completado'
  )
);

create index if not exists idx_pedidos_web_auth_user_created_at
  on public.pedidos_web (auth_user_id, created_at desc);
