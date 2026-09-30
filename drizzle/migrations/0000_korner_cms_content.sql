-- ============================================================
-- Korner BiH: sadrzaj portala u bazi + uloge urednika
-- ============================================================

-- 1) Uloga koja smije da ureduje sadrzaj ---------------------------------
create type public.app_role as enum ('editor');

create table public.user_roles (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  role public.app_role not null,
  created_at timestamptz not null default now(),
  unique (user_id, role)
);

grant select on public.user_roles to authenticated;
grant all on public.user_roles to service_role;

alter table public.user_roles enable row level security;

create policy "user_roles_read_own" on public.user_roles
  for select to authenticated
  using (auth.uid() = user_id);

create or replace function public.has_role(_user_id uuid, _role public.app_role)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1 from public.user_roles
    where user_id = _user_id and role = _role
  );
$$;

-- 2) Clanci --------------------------------------------------------------
create table public.articles (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique,
  title text not null,
  kicker text not null default '',
  lead text not null default '',
  body text[] not null default '{}'::text[],
  category text not null default 'fudbal'
    check (category in ('fudbal', 'kosarka', 'ostali-sportovi')),
  image_path text,
  author text not null default 'Korner redakcija',
  is_published boolean not null default true,
  is_headline boolean not null default false,
  is_featured boolean not null default false,
  comments integer not null default 0,
  published_at timestamptz not null default now(),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index articles_published_at_idx on public.articles (published_at desc);
create index articles_category_idx on public.articles (category);

grant select on public.articles to anon;
grant select, insert, update, delete on public.articles to authenticated;
grant all on public.articles to service_role;

alter table public.articles enable row level security;

create policy "articles_public_read" on public.articles
  for select to anon, authenticated
  using (is_published);

create policy "articles_editor_write" on public.articles
  for all to authenticated
  using (public.has_role(auth.uid(), 'editor'))
  with check (public.has_role(auth.uid(), 'editor'));

-- 3) Raspored ------------------------------------------------------------
create table public.fixtures (
  id uuid primary key default gen_random_uuid(),
  comp text not null default '',
  home text not null,
  away text not null,
  when_text text not null default '',
  score_home integer,
  score_away integer,
  finished boolean not null default false,
  sort_order integer not null default 0
);

grant select on public.fixtures to anon;
grant select, insert, update, delete on public.fixtures to authenticated;
grant all on public.fixtures to service_role;

alter table public.fixtures enable row level security;

create policy "fixtures_public_read" on public.fixtures
  for select to anon, authenticated
  using (true);

create policy "fixtures_editor_write" on public.fixtures
  for all to authenticated
  using (public.has_role(auth.uid(), 'editor'))
  with check (public.has_role(auth.uid(), 'editor'));

-- 4) Tabela --------------------------------------------------------------
create table public.standings (
  id uuid primary key default gen_random_uuid(),
  team text not null,
  played integer not null default 0,
  wins integer not null default 0,
  draws integer not null default 0,
  losses integer not null default 0,
  points integer not null default 0,
  sort_order integer not null default 0
);

grant select on public.standings to anon;
grant select, insert, update, delete on public.standings to authenticated;
grant all on public.standings to service_role;

alter table public.standings enable row level security;

create policy "standings_public_read" on public.standings
  for select to anon, authenticated
  using (true);

create policy "standings_editor_write" on public.standings
  for all to authenticated
  using (public.has_role(auth.uid(), 'editor'))
  with check (public.has_role(auth.uid(), 'editor'));

-- 5) Tekstovi stranice O nama i kontakt ----------------------------------
create table public.site_settings (
  id integer primary key default 1 check (id = 1),
  about text not null default '',
  contact_email text not null default '',
  instagram text not null default 'https://www.instagram.com/korner_bih/',
  facebook text not null default '',
  updated_at timestamptz not null default now()
);

grant select on public.site_settings to anon;
grant select, insert, update on public.site_settings to authenticated;
grant all on public.site_settings to service_role;

alter table public.site_settings enable row level security;

create policy "site_settings_public_read" on public.site_settings
  for select to anon, authenticated
  using (true);

create policy "site_settings_editor_write" on public.site_settings
  for all to authenticated
  using (public.has_role(auth.uid(), 'editor'))
  with check (public.has_role(auth.uid(), 'editor'));

-- 6) Odrzavanje updated_at -----------------------------------------------
create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create trigger articles_set_updated_at
  before update on public.articles
  for each row execute function public.set_updated_at();

create trigger site_settings_set_updated_at
  before update on public.site_settings
  for each row execute function public.set_updated_at();

-- 7) Postojeci sadrzaj portala -------------------------------------------
insert into public.articles (slug, title, kicker, lead, category, image_path, author, comments, is_headline, is_featured, published_at, body) values
  ('zmajevi-pred-kvalifikacijsku-utakmicu',
   'Zmajevi pred kljucnu utakmicu: Selektor otkrio ko pocinje na Grbavici',
   'Reprezentacija',
   'Reprezentacija BiH u petak igra utakmicu koja odlucuje o nastavku kvalifikacija, a sastav je gotovo poznat.',
   'fudbal', 'hero-stadion.jpg', 'Korner redakcija', 42, true, false,
   '2026-09-30T12:00:00+02:00',
   array[
     'Nogometna reprezentacija Bosne i Hercegovine odradila je posljednji trening pred utakmicu koja bi mogla odluciti o plasmanu u baraz. Atmosfera u taboru Zmajeva je, kazu iz stru cnog staba, bolja nego ikad ove godine.',
     'Selektor je na konferenciji za medije potvrdio da su svi igraci zdravi i spremni, te da odluka o startnoj postavi necie biti donesena do jutra pred mec.',
     'Ulaznice za susret rasprodane su za manje od 48 sati, a navijacka grupa najavila je veliku koreografiju na sjevernoj tribini.'
   ]),
  ('premijer-liga-derbi-kola',
   'Derbi kola u Premijer ligi BiH: Sarajevo i Zeljeznicar u borbi za vrh',
   'Premijer liga',
   'Gradski derbi ponovo odlucuje o liderskoj poziciji, a oba tima ulaze bez poraza u posljednjih pet kola.',
   'fudbal', 'news-trener.jpg', 'Amar H.', 118, false, true,
   '2026-09-29T18:30:00+02:00',
   array[
     'Vjeciti derbi ponovo se igra u trenutku kada obje ekipe jure vrh tabele. Posljednjih pet kola donijelo je devet bodova jednima i deset drugima.',
     'Treneri su se u najavi susreta uzdrzali od provokacija, ali je jasno da pobjednik preuzima psiholosku prednost pred nastavak sezone.',
     'Sudijsku kontrolu preuzeo je iskusan sudijski tim, a mec se igra pred punim tribinama.'
   ]),
  ('kosarkasi-bih-pobjeda-kvalifikacije',
   'Kosarkasi BiH slavili u gostima i ostali u igri za Eurobasket',
   'Kosarka',
   'Snazna odbrana u posljednjoj cetvrtini donijela je nasoj selekciji mozda i najvazniju pobjedu u ciklusu.',
   'kosarka', 'news-kosarka.jpg', 'Dino S.', 27, false, true,
   '2026-09-28T21:00:00+02:00',
   array[
     'Kosarkaska reprezentacija BiH odigrala je sjajnu posljednju dionicu i dosla do pobjede koja je vraca u trku za plasman na Eurobasket.',
     'Najefikasniji u redovima nasoj selekcije bio je krilni igrac s 24 poena i osam skokova.',
     'Naredni susret igra se za tri dana pred domacom publikom.'
   ]),
  ('mladi-talent-transfer-bundesliga',
   'Mladi bh. talent pred transferom u Bundesligu: Ponuda stigla na sto',
   'Transferi',
   'Njemacki prvoligas spreman je platiti oStetnu koja bi bila medju najvecima u historiji kluba.',
   'fudbal', 'news-reprezentacija.jpg', 'Korner redakcija', 63, false, false,
   '2026-09-28T13:00:00+02:00',
   array[
     'Prema informacijama iz kluba, pregovori su u zavrsnoj fazi, a igrac bi ljekarski pregled mogao obaviti vec naredne sedmice.',
     'Rijec je o jednom od najperspektivnijih igraca domesticne lige, koji je ove sezone upisao sedam golova i cetiri asistencije.',
     'Klub bi od transfera mogao zaraditi rekordnu sumu za bh. uslove.'
   ]),
  ('rukomet-evropski-kup',
   'Rukometasi iznenadili favorita i izborili drugo kolo evropskog kupa',
   'Rukomet',
   'Nakon poraza u prvoj utakmici, uslijedio je preokret kakav se pamti.',
   'ostali-sportovi', 'hero-stadion.jpg', 'Lejla M.', 11, false, false,
   '2026-09-27T19:00:00+02:00',
   array[
     'Preokret od sedam golova zaostatka rijetko se vidja, a upravo to je uspjelo nasem predstavniku pred svojom publikom.',
     'Golman domesticih odbranio je 17 udaraca i bio prvo ime susreta.'
   ]),
  ('atletika-rekord-bih',
   'Novi drzavni rekord: Bh. atletičarka ušla medju najbolje u Evropi',
   'Atletika',
   'Rezultat sa mitinga u Beogradu doneo joj je normu za naredno veliko takmicenje.',
   'ostali-sportovi', 'news-kosarka.jpg', 'Korner redakcija', 8, false, false,
   '2026-09-26T16:00:00+02:00',
   array[
     'Drzavni rekord star vise od decenije pao je na mitingu u Beogradu.',
     'Nasa predstavnica sada se nalazi medju deset najboljih u Evropi ove sezone.'
   ]),
  ('analiza-taktika-kolo',
   'Analiza kola: Zasto je presing visoko na terenu promijenio sliku lige',
   'Analiza',
   'Tri kluba su ove sezone potpuno promijenila pristup i rezultati su odmah uslijedili.',
   'fudbal', 'news-trener.jpg', 'Amar H.', 19, false, false,
   '2026-09-26T11:00:00+02:00',
   array[
     'Statistika pokazuje da su tri kluba ove sezone gotovo udvostrucila broj oduzetih lopti u posljednjoj trecini terena.',
     'Rezultat je vidljiv: vise golova iz tranzicije i manje primljenih pogodaka iz kontri.'
   ]),
  ('kosarkaski-derbi-lige',
   'Kosarkaski derbi odlucen u posljednjoj sekundi',
   'Liga BiH',
   'Trojka sa zvukom sirene donijela je gostima pobjedu i prvo mjesto na tabeli.',
   'kosarka', 'news-kosarka.jpg', 'Dino S.', 35, false, false,
   '2026-09-25T20:00:00+02:00',
   array[
     'Dvorana je eksplodirala nakon sto je lopta prosla kroz obruc u posljednjoj sekundi susreta.',
     'Gosti su tako preuzeli prvo mjesto uoci nastavka sezone.'
   ]);

insert into public.fixtures (comp, home, away, when_text, sort_order) values
  ('Kvalifikacije', 'BiH', 'Svedska', 'petak 20:45', 1),
  ('Premijer liga', 'Sarajevo', 'Zeljeznicar', 'subota 17:00', 2),
  ('Premijer liga', 'Borac', 'Zrinjski', 'nedjelja 15:00', 3),
  ('Kosarka', 'Igokea', 'Spars', 'nedjelja 19:00', 4);

insert into public.standings (team, played, wins, draws, losses, points, sort_order) values
  ('Zrinjski', 9, 7, 1, 1, 22, 1),
  ('Sarajevo', 9, 6, 2, 1, 20, 2),
  ('Zeljeznicar', 9, 6, 1, 2, 19, 3),
  ('Borac', 9, 5, 2, 2, 17, 4),
  ('Velez', 9, 4, 2, 3, 14, 5),
  ('Siroki Brijeg', 9, 3, 3, 3, 12, 6);

insert into public.site_settings (id, about, contact_email, instagram, facebook) values
  (1,
   E'Korner je sportski portal iz Bosne i Hercegovine. Krenuli smo kao Instagram zajednica @korner_bih, a danas pratimo fudbal, kosarku i sve ostale sportove u kojima nasi sportisti ostavljaju trag.\n\nPisemo brzo, kratko i bez fraza - vijesti sa terena, transferi, analize kola i price o ljudima koji stoje iza rezultata.',
   '', 'https://www.instagram.com/korner_bih/', '');