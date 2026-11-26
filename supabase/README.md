# 문의 메일 알림 설정

새 온라인 문의가 접수되면 지정한 메일로 알림이 오도록 하는 설정입니다.
흐름: 문의 접수 → `inquiries` 표에 저장 → 데이터베이스 웹훅 → `notify-inquiry` 함수 → Resend가 메일 발송

> 메일 주소, API 키, 비밀 문자열은 **코드에 넣지 말고** 아래 3번의 `secrets set`으로만 등록하세요.
> (깃허브에 올라가면 누구나 볼 수 있습니다.)

## 1. Resend 가입 (메일 발송 서비스, 무료 요금제 있음)

1. https://resend.com 에서 가입합니다. **알림을 받고 싶은 메일 주소로 가입**하세요.
   (도메인을 인증하기 전에는 가입한 본인 메일로만 보낼 수 있습니다.)
2. 왼쪽 메뉴 `API Keys` > `Create API Key` 로 키를 만들고 복사해 둡니다. (`re_...`로 시작)

## 2. Supabase CLI 로그인

터미널에서 이 폴더(프로젝트 최상위)에 들어가 실행합니다.

```
npx supabase login
npx supabase link --project-ref shsaidqtoyeyshlgcmcu
```

## 3. 비밀 값 등록 및 함수 배포

`<...>` 부분만 바꿔서 실행합니다. `WEBHOOK_SECRET`은 아무도 모르는 긴 임의 문자열로 정하세요.

```
npx supabase secrets set RESEND_API_KEY=<Resend API 키> NOTIFY_TO=<알림 받을 메일> WEBHOOK_SECRET=<임의의 긴 문자열>
npx supabase functions deploy notify-inquiry --no-verify-jwt
```

- 알림을 받을 메일이 여러 개면 `NOTIFY_TO=a@x.com,b@y.com` 처럼 쉼표로 구분합니다.
- `--no-verify-jwt`는 웹훅이 로그인 토큰 없이 호출하기 때문에 필요합니다. 대신 함수가 `WEBHOOK_SECRET`으로 호출자를 확인합니다.

## 4. 데이터베이스 웹훅 만들기 (Supabase 대시보드)

`Database` > `Webhooks` > `Create a new hook`

- Name: `notify-inquiry`
- Table: `inquiries`
- Events: `Insert` 만 체크
- Type: `Supabase Edge Functions` > 함수 `notify-inquiry` 선택
- HTTP Headers: `x-webhook-secret` = 3번에서 정한 `WEBHOOK_SECRET` 값과 **똑같이**
  (기본으로 들어 있는 `Authorization` 헤더는 그대로 두어도 됩니다.)

## 5. 확인

사이트에서 테스트 문의를 하나 접수하면 1분 안에 메일이 와야 합니다.
오지 않으면 Supabase 대시보드 `Edge Functions` > `notify-inquiry` > `Logs` 를 확인하세요.

- `401 Unauthorized`: 웹훅 헤더의 `x-webhook-secret` 값이 `WEBHOOK_SECRET`과 다름
- `500`: `RESEND_API_KEY` 또는 `NOTIFY_TO`가 등록되지 않음
- `502`: Resend가 거절함 (로그의 상세 내용 확인. 도메인 미인증 상태에서 본인 외 주소로 보내는 경우 등)

## 나중에 회사 메일 주소로 보내고 싶다면

Resend에서 도메인을 인증하면 `MAIL_FROM=istek 문의 <inquiry@도메인>` 처럼 보내는 주소를 바꾸고,
어떤 주소로도 보낼 수 있습니다. (`npx supabase secrets set MAIL_FROM=...` 후 재배포 불필요)
