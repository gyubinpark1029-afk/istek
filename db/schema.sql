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
-- 주문은 사이트의 주문서(checkout.html)에서 place_order 함수로 만들어짐 (맨 아래 참고)
-- 회원은 자기 주문만 볼 수 있고, 주문을 직접 고칠 수는 없음
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

-- ---------- 주문하기 (checkout.html) ----------
-- 배송 정보와 결제 방법
alter table public.orders add column if not exists receiver_name  text;                         -- 받는 분
alter table public.orders add column if not exists receiver_phone text;                         -- 받는 분 연락처
alter table public.orders add column if not exists zipcode        text;                         -- 우편번호
alter table public.orders add column if not exists address        text;                         -- 기본 주소
alter table public.orders add column if not exists address_detail text;                         -- 상세 주소
alter table public.orders add column if not exists memo           text;                         -- 배송 메모
alter table public.orders add column if not exists payment_method text not null default '무통장입금';  -- 결제 방법
alter table public.orders add column if not exists depositor      text;                         -- 입금자명

-- ---------- 상품 (products 테이블) ----------
-- 상품 추가·수정·삭제는 Supabase 대시보드 > Table Editor > products 에서
--   판매 중지: is_active 를 false 로 (사이트에서 안 보이고 주문도 안 됨, 지난 주문내역은 그대로)
--   순서: sort_order 가 작은 상품이 먼저 보임
create table if not exists public.products (
  id            text primary key,                       -- 상품 고유 번호 (예: istek-1), 상세 주소와 장바구니가 이 번호를 사용하므로 정한 뒤에는 바꾸지 말 것
  brand         text not null,                          -- 브랜드 (메인 #태그와 똑같이: istek, HUMAS, miraest, evergreenTop, analytik-jena)
  name          text not null,                          -- 상품명
  price         integer not null check (price >= 0),    -- 가격 (원)
  image         text not null default '',               -- 대표 사진 경로 또는 주소 (비우면 회색 박스)
  images        jsonb not null default '[]',            -- 추가 사진: ["images/products/istek-1-2.jpg"]
  summary       text,                                   -- 상품명 아래 한 줄 소개
  description   text,                                   -- 상세 설명 (빈 줄로 문단 나누기)
  specs         jsonb not null default '[]',            -- 상품 정보 표: [["모델명", "IS-100"], ["원산지", "대한민국"]]
  detail_images jsonb not null default '[]',            -- 상세 설명 아래 긴 이미지: ["images/products/istek-1-detail.jpg"]
  sort_order    integer not null default 0,             -- 보이는 순서 (작을수록 먼저)
  is_active     boolean not null default true,          -- 판매 중
  created_at    timestamptz not null default now()
);

alter table public.products enable row level security;

-- 로그인하지 않은 손님도 상품은 볼 수 있게 (바꾸는 건 대시보드에서만)
grant select on public.products to anon, authenticated;

drop policy if exists "판매 중인 상품만 조회" on public.products;
create policy "판매 중인 상품만 조회"
  on public.products for select
  to anon, authenticated
  using (is_active);

-- 처음 한 번: 기존 js/products.js 에 있던 임시 상품 20개 넣기 (이미 있는 번호는 건너뜀 → 대시보드에서 고친 내용이 덮어써지지 않음)
insert into public.products (id, brand, name, price, sort_order) values
  ('istek-1', 'istek', '[임시] istek 제품 1', 448000, 10),
  ('istek-2', 'istek', '[임시] istek 제품 2', 448000, 20),
  ('istek-3', 'istek', '[임시] istek 제품 3', 448000, 30),
  ('istek-4', 'istek', '[임시] istek 제품 4', 448000, 40),
  ('HUMAS-1', 'HUMAS', '[임시] HUMAS 제품 1', 448000, 50),
  ('HUMAS-2', 'HUMAS', '[임시] HUMAS 제품 2', 448000, 60),
  ('HUMAS-3', 'HUMAS', '[임시] HUMAS 제품 3', 448000, 70),
  ('HUMAS-4', 'HUMAS', '[임시] HUMAS 제품 4', 448000, 80),
  ('evergreenTop-1', 'evergreenTop', '[임시] evergreenTop 제품 1', 448000, 90),
  ('evergreenTop-2', 'evergreenTop', '[임시] evergreenTop 제품 2', 448000, 100),
  ('evergreenTop-3', 'evergreenTop', '[임시] evergreenTop 제품 3', 448000, 110),
  ('evergreenTop-4', 'evergreenTop', '[임시] evergreenTop 제품 4', 448000, 120),
  ('analytik-jena-1', 'analytik-jena', '[임시] analytik-jena 제품 1', 448000, 130),
  ('analytik-jena-2', 'analytik-jena', '[임시] analytik-jena 제품 2', 448000, 140),
  ('analytik-jena-3', 'analytik-jena', '[임시] analytik-jena 제품 3', 448000, 150),
  ('analytik-jena-4', 'analytik-jena', '[임시] analytik-jena 제품 4', 448000, 160),
  ('miraest-1', 'miraest', '[임시] miraest 제품 1', 448000, 170),
  ('miraest-2', 'miraest', '[임시] miraest 제품 2', 448000, 180),
  ('miraest-3', 'miraest', '[임시] miraest 제품 3', 448000, 190),
  ('miraest-4', 'miraest', '[임시] miraest 제품 4', 448000, 200)
on conflict (id) do nothing;

-- 주문 만들기: 사이트는 이 함수로만 주문을 넣을 수 있음 (orders 테이블에 직접 쓰기 권한은 없음)
-- 사이트는 상품 번호와 수량만 보내고, 상품명·가격·사진은 여기서 products 테이블을 직접 조회함
-- 주문번호 생성, 총 결제금액 계산, 상태('입금전')도 서버에서 정하므로 사이트에서 바꿀 수 없음
create or replace function public.place_order(
  p_items          jsonb,   -- [{"id": "istek-1", "qty": 1}]
  p_receiver_name  text,
  p_receiver_phone text,
  p_zipcode        text,
  p_address        text,
  p_address_detail text,
  p_memo           text,
  p_depositor      text
)
returns text  -- 주문번호
language plpgsql
security definer set search_path = ''
as $$
declare
  v_uid   uuid := auth.uid();
  v_item  jsonb;
  v_items jsonb := '[]'::jsonb;
  v_total bigint := 0;
  v_name  text;
  v_price integer;
  v_image text;
  v_qty   integer;
  v_id    bigint;
  v_no    text;
begin
  if v_uid is null then
    raise exception '로그인이 필요합니다.';
  end if;

  if jsonb_typeof(p_items) is distinct from 'array'
     or jsonb_array_length(p_items) = 0 or jsonb_array_length(p_items) > 50 then
    raise exception '주문할 상품이 올바르지 않습니다.';
  end if;

  for v_item in select value from jsonb_array_elements(p_items) loop
    v_qty := (v_item ->> 'qty')::integer;
    if v_qty is null or v_qty < 1 or v_qty > 99 then
      raise exception '주문할 상품이 올바르지 않습니다.';
    end if;

    -- 판매 중인 상품의 현재 가격으로 계산 (주문내역에는 주문한 때의 이름·가격이 그대로 남음)
    select p.name, p.price, p.image into v_name, v_price, v_image
    from public.products p
    where p.id = v_item ->> 'id' and p.is_active;
    if not found then
      raise exception '판매하지 않는 상품이 포함되어 있습니다. 장바구니를 확인해 주세요.';
    end if;

    v_items := v_items || jsonb_build_array(jsonb_build_object(
      'id', v_item ->> 'id', 'name', v_name, 'price', v_price, 'qty', v_qty, 'image', v_image));
    v_total := v_total + v_price::bigint * v_qty;
  end loop;

  if coalesce(trim(p_receiver_name), '') = '' or coalesce(trim(p_receiver_phone), '') = ''
     or coalesce(trim(p_address), '') = '' or coalesce(trim(p_depositor), '') = '' then
    raise exception '배송 정보를 모두 입력해 주세요.';
  end if;

  insert into public.orders (order_no, auth_id, items, total_price,
                             receiver_name, receiver_phone, zipcode, address, address_detail, memo, depositor)
  values (gen_random_uuid()::text, v_uid, v_items, v_total,
          trim(p_receiver_name), trim(p_receiver_phone), p_zipcode, trim(p_address),
          nullif(trim(p_address_detail), ''), nullif(left(trim(p_memo), 200), ''), trim(p_depositor))
  returning id into v_id;

  -- 주문번호: 한국 날짜 + 주문 번호 7자리 (예: 20261125-0000012)
  v_no := to_char(now() at time zone 'Asia/Seoul', 'YYYYMMDD') || '-' || lpad(v_id::text, 7, '0');
  update public.orders set order_no = v_no where id = v_id;
  return v_no;
end;
$$;

revoke execute on function public.place_order(jsonb, text, text, text, text, text, text, text) from public, anon;
grant execute on function public.place_order(jsonb, text, text, text, text, text, text, text) to authenticated;
