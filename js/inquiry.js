(function () {
  var form = document.getElementById('inquiryForm');
  var doneBox = document.getElementById('inqDone');
  var msg = document.getElementById('inqMsg');
  var submitBtn = document.getElementById('inqSubmit');

  if (!supabaseClient) {
    alert('서버 연결 준비 중입니다. (js/supabase-config.js 설정 필요)');
    return;
  }

  function setMsg(input, text) {
    input.closest('.field').querySelector('.field__msg').textContent = text;
    input.classList.toggle('is-error', text !== '');
    input.setAttribute('aria-invalid', text !== '');
  }

  // 로그인한 회원이면 이름·연락처·이메일을 미리 채워 두기 (못 불러와도 그냥 직접 입력)
  supabaseClient.auth.getSession().then(function (res) {
    if (!res.data.session) return;
    return supabaseClient.from('users').select('name, email, phone').maybeSingle().then(function (r) {
      var u = r.data;
      if (!u) return;
      if (!form.elements.name.value) form.elements.name.value = u.name || '';
      if (!form.elements.phone.value) form.elements.phone.value = u.phone || '';
      if (!form.elements.email.value) form.elements.email.value = u.email || '';
    });
  }).catch(function () {});

  // 입력하면 해당 칸의 오류 문구 지우기
  Array.prototype.forEach.call(form.querySelectorAll('input, select, textarea'), function (el) {
    el.addEventListener('input', function () {
      if (el.closest('.field') && el.classList.contains('is-error')) setMsg(el, '');
    });
  });

  form.addEventListener('submit', function (e) {
    e.preventDefault();
    msg.textContent = '';

    var type = form.elements.type.value;
    var name = form.elements.name.value.trim();
    var phone = form.elements.phone.value.trim();
    var email = form.elements.email.value.trim();
    var title = form.elements.title.value.trim();
    var content = form.elements.content.value.trim();

    var typeError = type ? '' : '문의 유형을 선택해 주세요.';
    var nameError = name ? '' : '이름을 입력해 주세요.';
    var phoneError = !phone ? '연락처를 입력해 주세요.'
      : !/^[0-9+\-\s()]{8,20}$/.test(phone) ? '연락처 형식이 올바르지 않습니다. (예: 010-1234-5678)' : '';
    var emailError = !email ? '이메일을 입력해 주세요.'
      : !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) ? '이메일 형식이 올바르지 않습니다.' : '';
    var titleError = title ? '' : '제목을 입력해 주세요.';
    var contentError = content.length < 5 ? '문의 내용을 5자 이상 입력해 주세요.' : '';

    setMsg(form.elements.type, typeError);
    setMsg(form.elements.name, nameError);
    setMsg(form.elements.phone, phoneError);
    setMsg(form.elements.email, emailError);
    setMsg(form.elements.title, titleError);
    setMsg(form.elements.content, contentError);

    var firstError = [
      [typeError, form.elements.type], [nameError, form.elements.name], [phoneError, form.elements.phone],
      [emailError, form.elements.email], [titleError, form.elements.title], [contentError, form.elements.content]
    ].filter(function (p) { return p[0]; })[0];
    if (firstError) return firstError[1].focus();

    if (!document.getElementById('inqAgree').checked) {
      msg.textContent = '개인정보 수집 및 이용에 동의해 주세요.';
      return;
    }

    // 스팸 방지용 숨은 칸에 값이 있으면 접수된 것처럼 보여 주기만 하고 보내지 않음
    if (form.elements.website.value) {
      form.hidden = true;
      doneBox.hidden = false;
      return;
    }

    submitBtn.disabled = true;
    submitBtn.textContent = '접수 중...';
    supabaseClient.rpc('submit_inquiry', {
      p_type: type,
      p_name: name,
      p_company: form.elements.company.value.trim(),
      p_phone: phone,
      p_email: email,
      p_title: title,
      p_content: content
    }).then(function (res) {
      if (res.error) throw res.error;
      form.hidden = true;
      doneBox.hidden = false;
      window.scrollTo(0, 0);
    }).catch(function () {
      submitBtn.disabled = false;
      submitBtn.textContent = '문의 접수';
      msg.textContent = '문의를 접수하지 못했습니다. 잠시 후 다시 시도하시거나 전화 (051) 581-4303 으로 문의해 주세요.';
    });
  });
})();
