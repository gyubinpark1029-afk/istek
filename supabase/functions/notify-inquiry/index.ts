// 새 문의가 inquiries 표에 들어오면 Supabase 데이터베이스 웹훅이 이 함수를 호출하고,
// 이 함수가 Resend(메일 발송 서비스)로 알림 메일을 보냄.
// 설정 방법은 supabase/README.md 참고.
//
// 필요한 비밀 값 (supabase secrets set 으로 등록 — 코드나 깃허브에는 절대 넣지 말 것)
//   RESEND_API_KEY  Resend 에서 발급한 API 키
//   NOTIFY_TO       알림을 받을 메일 주소 (쉼표로 여러 개 가능)
//   WEBHOOK_SECRET  웹훅과 함수가 서로 확인하는 비밀 문자열 (아무도 모르게 길게)
//   MAIL_FROM       (선택) 보내는 사람. 기본값은 Resend 테스트 주소

const esc = (v: unknown) =>
  String(v ?? '').replace(/[&<>"']/g, (c) => (
    { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c] as string
  ));

Deno.serve(async (req) => {
  if (req.method !== 'POST') return new Response('Method Not Allowed', { status: 405 });

  // 웹훅 이외의 요청은 거절
  const secret = Deno.env.get('WEBHOOK_SECRET');
  if (!secret || req.headers.get('x-webhook-secret') !== secret) {
    return new Response('Unauthorized', { status: 401 });
  }

  const apiKey = Deno.env.get('RESEND_API_KEY');
  const to = (Deno.env.get('NOTIFY_TO') ?? '').split(',').map((s) => s.trim()).filter(Boolean);
  if (!apiKey || to.length === 0) {
    return new Response('메일 설정(RESEND_API_KEY, NOTIFY_TO)이 없습니다.', { status: 500 });
  }

  let payload: { type?: string; record?: Record<string, unknown> };
  try {
    payload = await req.json();
  } catch {
    return new Response('Bad Request', { status: 400 });
  }
  if (payload.type !== 'INSERT' || !payload.record) return new Response('ignored', { status: 200 });

  const q = payload.record;
  const row = (label: string, value: unknown) =>
    `<tr><th style="padding:8px 12px;border:1px solid #ddd;background:#f6f6f6;text-align:left;white-space:nowrap">${label}</th>` +
    `<td style="padding:8px 12px;border:1px solid #ddd">${esc(value) || '-'}</td></tr>`;

  const html =
    `<div style="font-family:sans-serif;font-size:14px;line-height:1.6;color:#222">` +
    `<p>istek 사이트에 새 문의가 접수되었습니다.</p>` +
    `<table style="border-collapse:collapse;width:100%;max-width:640px">` +
    row('문의 유형', q.type) + row('이름', q.name) + row('회사·기관명', q.company) +
    row('연락처', q.phone) + row('이메일', q.email) + row('제목', q.title) +
    `</table>` +
    `<p style="margin-top:16px;padding:12px;border:1px solid #ddd;white-space:pre-wrap;max-width:640px">${esc(q.content)}</p>` +
    `<p style="color:#888;font-size:12px">이 메일에 답장하면 문의하신 분의 이메일로 전달됩니다.</p>` +
    `</div>`;

  const res = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: { 'Authorization': `Bearer ${apiKey}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({
      from: Deno.env.get('MAIL_FROM') ?? 'istek 문의 <onboarding@resend.dev>',
      to,
      reply_to: q.email,
      subject: `[istek 문의] ${String(q.type ?? '')} - ${String(q.title ?? '').slice(0, 60)}`,
      html,
    }),
  });

  if (!res.ok) {
    console.error('메일 발송 실패', res.status, await res.text());
    return new Response('메일 발송 실패', { status: 502 });
  }
  return new Response('ok', { status: 200 });
});
