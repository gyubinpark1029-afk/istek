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

-- 주소 (회원 정보 수정 페이지에서 입력, 선택 항목)
alter table public.users add column if not exists zipcode text;         -- 우편번호
alter table public.users add column if not exists address text;         -- 기본 주소
alter table public.users add column if not exists address_detail text;  -- 상세 주소

-- 보안: 로그인한 본인 정보만 볼 수 있게
alter table public.users enable row level security;

-- 로그인한 회원이 사이트에서 읽을 수 있게 권한 부여 (어떤 줄을 볼지는 아래 정책이 제한)
grant select on public.users to authenticated;

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
  insert into public.users (auth_id, name, email, phone, zipcode, address, address_detail)
  values (
    new.id,
    new.raw_user_meta_data ->> 'name',
    new.email,
    new.raw_user_meta_data ->> 'phone',
    new.raw_user_meta_data ->> 'zipcode',
    new.raw_user_meta_data ->> 'address',
    new.raw_user_meta_data ->> 'address_detail'
  );
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- 회원 정보 수정 페이지에서 이름/전화번호/주소(또는 이메일)를 바꾸면 users 테이블에도 자동 반영
create or replace function public.handle_user_updated()
returns trigger
language plpgsql
security definer set search_path = ''
as $$
begin
  update public.users
  set name  = coalesce(new.raw_user_meta_data ->> 'name', name),
      phone = coalesce(new.raw_user_meta_data ->> 'phone', phone),
      zipcode = coalesce(new.raw_user_meta_data ->> 'zipcode', zipcode),
      address = coalesce(new.raw_user_meta_data ->> 'address', address),
      address_detail = coalesce(new.raw_user_meta_data ->> 'address_detail', address_detail),
      email = new.email
  where auth_id = new.id;
  return new;
end;
$$;

drop trigger if exists on_auth_user_updated on auth.users;
create trigger on_auth_user_updated
  after update of raw_user_meta_data, email on auth.users
  for each row execute function public.handle_user_updated();

-- 주문 (orders 테이블)
-- 아직 주문하기 기능이 없어서, 테스트할 때는 Supabase에서 직접 넣어야 함
-- 회원은 자기 주문만 볼 수 있고, 사이트에서 주문을 만들거나 고칠 수는 없음
create table if not exists public.orders (
  id           bigint generated always as identity primary key,
  order_no     text not null unique,                 -- 주문번호 (예: 20261120-0000001)
  auth_id      uuid not null references auth.users (id) on delete cascade,  -- 주문한 회원
  status       text not null default '입금전'         -- 주문처리상태
               check (status in ('입금전', '배송준비중', '배송중', '배송완료', '취소', '교환', '반품')),
  items        jsonb not null default '[]',          -- 상품 목록: [{"name": "상품명", "price": 448000, "qty": 1, "image": ""}]
  total_price  integer not null default 0,           -- 총 결제금액 (원)
  created_at   timestamptz not null default now()    -- 주문일
);

create index if not exists orders_auth_id_created_at on public.orders (auth_id, created_at desc);

alter table public.orders enable row level security;

grant select on public.orders to authenticated;

drop policy if exists "본인 주문만 조회" on public.orders;
create policy "본인 주문만 조회"
  on public.orders for select
  to authenticated
  using (auth.uid() = auth_id);
