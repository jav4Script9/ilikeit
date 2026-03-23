-- Запусти это в Supabase → SQL Editor

-- Таблица записей (блюда/продукты)
create table items (
  id uuid default gen_random_uuid() primary key,
  created_at timestamp with time zone default now(),
  user_id uuid references auth.users(id) on delete cascade not null,
  name text not null,
  place text,
  description text,
  category text check (category in ('restaurant', 'shop')) default 'restaurant',
  photo_url text
);

-- Таблица оценок
create table ratings (
  id uuid default gen_random_uuid() primary key,
  created_at timestamp with time zone default now(),
  user_id uuid references auth.users(id) on delete cascade not null,
  item_id uuid references items(id) on delete cascade not null,
  type text check (type in ('love', 'ok', 'bad')) not null,
  unique(user_id, item_id)
);

-- Открытый доступ на чтение для всех
alter table items enable row level security;
alter table ratings enable row level security;

create policy "Все могут читать items" on items for select using (true);
create policy "Авторизованные могут добавлять items" on items for insert with check (auth.uid() = user_id);
create policy "Автор может удалять свои items" on items for delete using (auth.uid() = user_id);

create policy "Все могут читать ratings" on ratings for select using (true);
create policy "Авторизованные могут голосовать" on ratings for insert with check (auth.uid() = user_id);
create policy "Автор может удалять свой голос" on ratings for delete using (auth.uid() = user_id);

-- Storage bucket для фото
insert into storage.buckets (id, name, public) values ('photos', 'photos', true);

create policy "Все могут видеть фото" on storage.objects for select using (bucket_id = 'photos');
create policy "Авторизованные могут загружать фото" on storage.objects for insert with check (bucket_id = 'photos' and auth.role() = 'authenticated');
