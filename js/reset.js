(function () {
  var requestForm = document.getElementById('requestForm');
  var updateForm = document.getElementById('updateForm');
  var sentDone = document.getElementById('sentDone');
  var desc = document.getElementById('resetDesc');
  var requestMsg = document.getElementById('requestMsg');
  var updateMsg = document.getElementById('updateMsg');

  // 메일의 링크로 들어오면 주소 뒤에 #...type=recovery 가 붙음
  // (Supabase가 곧 주소에서 지우기 때문에 페이지를 열자마자 확인)
  var urlInfo = location.hash + location.search;
  var isRecovery = /type=recovery/.test(urlInfo);
  if (/otp_expired/.test(urlInfo)) {
    requestMsg.textContent = '링크가 만료되었습니다. 재설정 메일을 다시 받아 주세요.';
  } else if (/error=/.test(urlInfo)) {
    requestMsg.textContent = '링크가 올바르지 않습니다. 재설정 메일을 다시 받아 주세요.';
  }

  function show(el) {
    [requestForm, sentDone, updateForm].forEach(function (x) { x.hidden = x !== el; });
  }

  function setMsg(input, text) {
    input.closest('.field').querySelector('.field__msg').textContent = text;
    input.classList.toggle('is-error', text !== '');
    input.setAttribute('aria-invalid', text !== '');
  }

  function busy(btn, on, label) {
    btn.disabled = on;
    btn.textContent = on ? '처리 중...' : label;
  }

  if (isRecovery && supabaseClient) {
    supabaseClient.auth.getSession().then(function (res) {
      if (res.data.session) {
        desc.textContent = '새로 사용할 비밀번호를 입력해 주세요.';
        show(updateForm);
        updateForm.password.focus();
      } else {
        requestMsg.textContent = '링크가 만료되었거나 올바르지 않습니다. 재설정 메일을 다시 받아 주세요.';
      }
    });
  }

  // 1단계: 재설정 메일 보내기
  requestForm.addEventListener('submit', function (e) {
    e.preventDefault();
    requestMsg.textContent = '';

    var email = requestForm.email.value.trim().toLowerCase();
    if (!email) return setMsg(requestForm.email, '이메일을 입력해 주세요.'), requestForm.email.focus();
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return setMsg(requestForm.email, '이메일 형식이 올바르지 않습니다.'), requestForm.email.focus();
    setMsg(requestForm.email, '');

    if (!supabaseClient) {
      alert('서버 연결 준비 중입니다. (js/supabase-config.js 설정 필요)');
      return;
    }

    var btn = requestForm.querySelector('.join-form__submit');
    busy(btn, true);
    supabaseClient.auth.resetPasswordForEmail(email, {
      redirectTo: new URL('reset.html', location.href).href
    }).then(function (res) {
      if (res.error) throw res.error;
      // 보안상 가입되지 않은 이메일이어도 똑같이 "보냈습니다"로 표시됨
      document.getElementById('sentEmail').textContent = email;
      show(sentDone);
    }).catch(function (err) {
      requestMsg.textContent = /rate limit|seconds/i.test(err.message)
        ? '잠시 후 다시 시도해 주세요.'
        : '메일 발송 중 문제가 발생했습니다. (' + err.message + ')';
    }).finally(function () {
      busy(btn, false, '재설정 메일 받기');
    });
  });

  // 2단계: 새 비밀번호 저장
  updateForm.addEventListener('submit', function (e) {
    e.preventDefault();
    updateMsg.textContent = '';

    var pw = updateForm.password.value;
    var pw2 = updateForm.passwordConfirm.value;
    var pwError = !pw ? '새 비밀번호를 입력해 주세요.'
      : (pw.length < 8 || !/[A-Za-z]/.test(pw) || !/[0-9]/.test(pw) || !/[^A-Za-z0-9]/.test(pw))
        ? '영문, 숫자, 특수문자를 포함해 8자 이상 입력해 주세요.' : '';
    var pw2Error = !pw2 ? '새 비밀번호를 한 번 더 입력해 주세요.'
      : pw2 !== pw ? '비밀번호가 일치하지 않습니다.' : '';
    setMsg(updateForm.password, pwError);
    setMsg(updateForm.passwordConfirm, pw2Error);
    if (pwError) return updateForm.password.focus();
    if (pw2Error) return updateForm.passwordConfirm.focus();

    var btn = updateForm.querySelector('.join-form__submit');
    busy(btn, true);
    supabaseClient.auth.updateUser({ password: pw }).then(function (res) {
      if (res.error) throw res.error;
      alert('비밀번호가 변경되었습니다.');
      location.href = 'index.html';
    }).catch(function (err) {
      if (/different from the old/i.test(err.message)) {
        updateMsg.textContent = '이전과 다른 비밀번호를 입력해 주세요.';
      } else if (/session/i.test(err.message)) {
        updateMsg.textContent = '링크가 만료되었습니다. 재설정 메일을 다시 받아 주세요.';
      } else {
        updateMsg.textContent = '비밀번호 변경 중 문제가 발생했습니다. (' + err.message + ')';
      }
    }).finally(function () {
      busy(btn, false, '비밀번호 변경');
    });
  });
})();
