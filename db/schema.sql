-- Supabase 대시보드 > SQL Editor 에 붙여 넣고 Run (여러 번 실행해도 괜찮음)

-- 사용자 정보 (users 테이블)
-- 이메일/비밀번호는 Supabase Auth(auth.users)가 암호화해서 관리하므로
-- 여기에는 비밀번호를 저장하지 않음
create table if not exists public.users (
  id          bigint generated always as identity primary key,  -- 사용자 번호 (1, 2, 3... 자동 증가)
  auth_id     uuid not null unique references auth.users (id) on delete cascade,  -- Supabase 로그인 계정과 연결
  name        text not null,                                    -- 이름
  email       text not null unique,                             -- 이메일 (로그인할 때 사용)
  phone       text not null,                                    -- 전화번호
  created_at  timestamptz not null default now()                -- 가입일
);

-- 보안: 로그인한 본인 정보만 볼 수 있게
alter table public.users enable row level security;

drop policy if exists "본인 정보만 조회" on public.users;
create policy "본인 정보만 조회"
  on public.users for select
  to authenticated
  using (auth.uid() = auth_id);

-- 회원가입(auth.users 생성) 시 users 테이블에 자동으로 한 줄 추가
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer set search_path = ''
as $$
begin
  insert into public.users (auth_id, name, email, phone)
  values (
    new.id,
    new.raw_user_meta_data ->> 'name',
    new.email,
    new.raw_user_meta_data ->> 'phone'
  );
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();
