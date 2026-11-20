(function () {
  var form = document.getElementById('loginForm');
  var done = document.getElementById('loginDone');
  var submitBtn = form.querySelector('.join-form__submit');
  var loginMsg = document.getElementById('loginMsg');

  // 로그인된 상태면 폼 대신 "OOO님, 로그인되어 있습니다" 표시
  function showLoggedIn(user) {
    var name = (user.user_metadata && user.user_metadata.name) || user.email;
    document.getElementById('loginName').textContent = name;
    form.hidden = true;
    done.hidden = false;
  }

  function showForm() {
    form.hidden = false;
    done.hidden = true;
  }

  // 이미 로그인했거나, 인증 메일 링크를 눌러서 들어온 경우
  if (supabaseClient) {
    supabaseClient.auth.getSession().then(function (res) {
      if (res.data.session) showLoggedIn(res.data.session.user);
    });
  }

  function setMsg(input, text) {
    input.closest('.field').querySelector('.field__msg').textContent = text;
    input.classList.toggle('is-error', text !== '');
    input.setAttribute('aria-invalid', text !== '');
  }

  form.addEventListener('submit', function (e) {
    e.preventDefault();
    loginMsg.textContent = '';

    var email = form.email.value.trim().toLowerCase();
    var password = form.password.value;
    setMsg(form.email, email ? '' : '이메일을 입력해 주세요.');
    setMsg(form.password, password ? '' : '비밀번호를 입력해 주세요.');
    if (!email) return form.email.focus();
    if (!password) return form.password.focus();

    if (!supabaseClient) {
      alert('로그인 서버 연결 준비 중입니다. (js/supabase-config.js 설정 필요)');
      return;
    }

    submitBtn.disabled = true;
    submitBtn.textContent = '로그인 중...';

    supabaseClient.auth.signInWithPassword({ email: email, password: password })
      .then(function (res) {
        if (res.error) throw res.error;
        location.href = 'index.html';
      })
      .catch(function (err) {
        if (/invalid login credentials/i.test(err.message)) {
          loginMsg.textContent = '이메일 또는 비밀번호가 올바르지 않습니다.';
        } else if (/email not confirmed/i.test(err.message)) {
          loginMsg.textContent = '이메일 인증이 아직 완료되지 않았습니다. 메일함을 확인해 주세요.';
        } else if (/rate limit/i.test(err.message)) {
          loginMsg.textContent = '잠시 후 다시 시도해 주세요.';
        } else {
          loginMsg.textContent = '로그인 중 문제가 발생했습니다. (' + err.message + ')';
        }
        form.password.value = '';
        form.password.focus();
      })
      .finally(function () {
        submitBtn.disabled = false;
        submitBtn.textContent = '로그인';
      });
  });

  document.getElementById('logoutBtn').addEventListener('click', function () {
    supabaseClient.auth.signOut().then(showForm);
  });
})();
