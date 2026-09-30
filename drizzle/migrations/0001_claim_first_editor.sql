-- Prvi prijavljeni korisnik može sam da preuzme urednička prava.
-- Funkcija radi samo dok tabela uloga nije prazna, pa se poslije toga trajno zaključava.

create or replace function public.claim_first_editor()
returns boolean
language plpgsql
security definer
set search_path = public
as $$
declare
  uid uuid := auth.uid();
begin
  if uid is null then
    return false;
  end if;

  if exists (select 1 from public.user_roles) then
    return false;
  end if;

  insert into public.user_roles (user_id, role)
  values (uid, 'editor')
  on conflict (user_id, role) do nothing;

  return true;
end;
$$;

comment on function public.claim_first_editor() is
  'Dodijeli ulogu urednika prvom korisniku; zaključava se čim postoji bilo koja uloga.';

grant execute on function public.claim_first_editor() to authenticated;