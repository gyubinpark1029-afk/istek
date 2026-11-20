(function () {
  var hello = document.getElementById('myHello');
  var body = document.getElementById('myBody');
  var profileForm = document.getElementById('profileForm');
  var passwordForm = document.getElementById('passwordForm');
  var profileMsg = document.getElementById('profileMsg');
  var passwordMsg = document.getElementById('passwordMsg');
  var currentUser = null;

  if (!supabaseClient) {
    hello.textContent = '서버 연결 준비 중입니다. (js/supabase-config.js 설정 필요)';
    return;
  }

  function setMsg(input, text) {
    input.closest('.field').querySelector('.field__msg').textContent = text;
    input.classList.toggle('is-error', text !== '');
    input.setAttribute('aria-invalid', text !== '');
  }

  // 폼 아래 결과 문구 (ok면 초록색)
  function setResult(el, text, ok) {
    el.textContent = text;
    el.classList.toggle('is-ok', !!ok);
  }

  function busy(btn, on, label) {
    btn.disabled = on;
    btn.textContent = on ? '처리 중...' : label;
  }

  function fill(info) {
    hello.innerHTML = '';
    var strong = document.createElement('strong');
    strong.textContent = info.name;
    hello.appendChild(strong);
    hello.appendChild(document.createTextNode('님, 안녕하세요.'));

    document.getElementById('infoId').textContent = info.id || '-';
    document.getElementById('infoEmail').textContent = info.email;
    document.getElementById('infoDate').textContent = new Date(info.created_at).toLocaleDateString('ko-KR');
    profileForm.userName.value = info.name || '';
    profileForm.phone.value = info.phone || '';
  }

  // 로그인 확인 → users 테이블에서 내 정보 불러오기
  supabaseClient.auth.getSession().then(function (res) {
    var session = res.data.session;
    if (!session) {
      location.replace('login.html?next=mypage.html');
      return;
    }
    currentUser = session.user;

    return supabaseClient.from('users').select('id, name, email, phone, created_at').maybeSingle()
      .then(function (r) {
        var meta = currentUser.user_metadata || {};
        // users 테이블에 아직 줄이 없으면 로그인 정보로 대신 표시
        fill(r.data || {
          id: null,
          name: meta.name || currentUser.email,
          email: currentUser.email,
          phone: meta.phone,
          created_at: currentUser.created_at
        });
        body.hidden = false;
      });
  }).catch(function (err) {
    hello.textContent = '정보를 불러오지 못했습니다. (' + err.message + ')';
  });

  // 다른 탭에서 로그아웃하면 로그인 화면으로
  supabaseClient.auth.onAuthStateChange(function (event) {
    if (event === 'SIGNED_OUT') location.replace('login.html');
  });

  // 전화번호 하이픈 자동 입력
  profileForm.phone.addEventListener('input', function () {
    var d = profileForm.phone.value.replace(/\D/g, '').slice(0, 11);
    profileForm.phone.value = d.length < 4 ? d
      : d.length < 8 ? d.slice(0, 3) + '-' + d.slice(3)
      : d.slice(0, 3) + '-' + d.slice(3, d.length - 4) + '-' + d.slice(-4);
  });

  // 정보 수정: 로그인 정보(user_metadata)를 바꾸면 DB 트리거가 users 테이블도 함께 수정
  profileForm.addEventListener('submit', function (e) {
    e.preventDefault();
    setResult(profileMsg, '');

    var name = profileForm.userName.value.trim();
    var phone = profileForm.phone.value.trim();
    var nameError = name ? '' : '이름을 입력해 주세요.';
    var phoneError = !phone ? '전화번호를 입력해 주세요.'
      : !/^01[0-9]-?\d{3,4}-?\d{4}$/.test(phone) ? '전화번호 형식이 올바르지 않습니다. (예: 010-1234-5678)' : '';
    setMsg(profileForm.userName, nameError);
    setMsg(profileForm.phone, phoneError);
    if (nameError) return profileForm.userName.focus();
    if (phoneError) return profileForm.phone.focus();

    var btn = profileForm.querySelector('.join-form__submit');
    busy(btn, true);
    supabaseClient.auth.updateUser({ data: { name: name, phone: phone } }).then(function (res) {
      if (res.error) throw res.error;
      hello.querySelector('strong').textContent = name;
      setResult(profileMsg, '저장되었습니다.', true);
    }).catch(function (err) {
      setResult(profileMsg, '저장 중 문제가 발생했습니다. (' + err.message + ')');
    }).finally(function () {
      busy(btn, false, '저장');
    });
  });

  // 비밀번호 변경: 현재 비밀번호가 맞는지 먼저 확인
  passwordForm.addEventListener('submit', function (e) {
    e.preventDefault();
    setResult(passwordMsg, '');

    var current = passwordForm.currentPassword.value;
    var pw = passwordForm.password.value;
    var pw2 = passwordForm.passwordConfirm.value;
    var currentError = current ? '' : '현재 비밀번호를 입력해 주세요.';
    var pwError = !pw ? '새 비밀번호를 입력해 주세요.'
      : (pw.length < 8 || !/[A-Za-z]/.test(pw) || !/[0-9]/.test(pw) || !/[^A-Za-z0-9]/.test(pw))
        ? '영문, 숫자, 특수문자를 포함해 8자 이상 입력해 주세요.'
      : pw === current ? '현재와 다른 비밀번호를 입력해 주세요.' : '';
    var pw2Error = !pw2 ? '새 비밀번호를 한 번 더 입력해 주세요.'
      : pw2 !== pw ? '비밀번호가 일치하지 않습니다.' : '';
    setMsg(passwordForm.currentPassword, currentError);
    setMsg(passwordForm.password, pwError);
    setMsg(passwordForm.passwordConfirm, pw2Error);
    if (currentError) return passwordForm.currentPassword.focus();
    if (pwError) return passwordForm.password.focus();
    if (pw2Error) return passwordForm.passwordConfirm.focus();

    var btn = passwordForm.querySelector('.join-form__submit');
    busy(btn, true);
    supabaseClient.auth.signInWithPassword({ email: currentUser.email, password: current })
      .then(function (res) {
        if (res.error) {
          var wrong = new Error('wrong');
          wrong.wrongPassword = /invalid login credentials/i.test(res.error.message);
          wrong.original = res.error;
          throw wrong;
        }
        return supabaseClient.auth.updateUser({ password: pw });
      })
      .then(function (res) {
        if (res.error) throw res.error;
        passwordForm.reset();
        setResult(passwordMsg, '비밀번호가 변경되었습니다.', true);
      })
      .catch(function (err) {
        if (err.wrongPassword) {
          setMsg(passwordForm.currentPassword, '현재 비밀번호가 올바르지 않습니다.');
          passwordForm.currentPassword.focus();
        } else {
          var msg = (err.original || err).message;
          setResult(passwordMsg, /rate limit/i.test(msg)
            ? '잠시 후 다시 시도해 주세요.'
            : '비밀번호 변경 중 문제가 발생했습니다. (' + msg + ')');
        }
      })
      .finally(function () {
        busy(btn, false, '비밀번호 변경');
      });
  });

  document.getElementById('logoutBtn').addEventListener('click', function () {
    supabaseClient.auth.signOut();
  });
})();
