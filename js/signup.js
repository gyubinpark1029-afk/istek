(function () {
  var form = document.getElementById('joinForm');
  var agreeAll = document.getElementById('agreeAll');
  var agreeItems = form.querySelectorAll('.agree__item');
  var agreeMsg = document.getElementById('agreeMsg');

  // 항목별 검사: 문제가 있으면 안내 문구, 없으면 ''
  // (화면 위에서부터 순서대로 — 첫 번째 오류 칸으로 이동할 때 이 순서를 씀)
  var rules = {
    userName: function (v) {
      return v ? '' : '이름을 입력해 주세요.';
    },
    email: function (v) {
      if (!v) return '이메일을 입력해 주세요.';
      if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v)) return '이메일 형식이 올바르지 않습니다.';
      return '';
    },
    password: function (v) {
      if (!v) return '비밀번호를 입력해 주세요.';
      if (v.length < 8 || !/[A-Za-z]/.test(v) || !/[0-9]/.test(v) || !/[^A-Za-z0-9]/.test(v)) {
        return '영문, 숫자, 특수문자를 포함해 8자 이상 입력해 주세요.';
      }
      return '';
    },
    passwordConfirm: function (v) {
      if (!v) return '비밀번호를 한 번 더 입력해 주세요.';
      if (v !== form.password.value) return '비밀번호가 일치하지 않습니다.';
      return '';
    },
    phone: function (v) {
      if (!v) return '전화번호를 입력해 주세요.';
      if (!/^01[0-9]-?\d{3,4}-?\d{4}$/.test(v)) return '전화번호 형식이 올바르지 않습니다. (예: 010-1234-5678)';
      return '';
    }
  };

  function check(name) {
    var input = form[name];
    var msg = rules[name](input.value.trim());
    input.closest('.field').querySelector('.field__msg').textContent = msg;
    input.classList.toggle('is-error', msg !== '');
    input.setAttribute('aria-invalid', msg !== '');
    return msg === '';
  }

  // 입력칸을 벗어날 때 바로 검사
  Object.keys(rules).forEach(function (name) {
    form[name].addEventListener('blur', function () { check(name); });
  });
  form.password.addEventListener('input', function () {
    if (form.passwordConfirm.value) check('passwordConfirm');
  });

  // 휴대폰 번호 하이픈 자동 입력
  form.phone.addEventListener('input', function () {
    var d = form.phone.value.replace(/\D/g, '').slice(0, 11);
    form.phone.value = d.length < 4 ? d
      : d.length < 8 ? d.slice(0, 3) + '-' + d.slice(3)
      : d.slice(0, 3) + '-' + d.slice(3, d.length - 4) + '-' + d.slice(-4);
  });

  // 약관 전체 동의
  agreeAll.addEventListener('change', function () {
    agreeItems.forEach(function (c) { c.checked = agreeAll.checked; });
  });
  agreeItems.forEach(function (c) {
    c.addEventListener('change', function () {
      agreeAll.checked = Array.prototype.every.call(agreeItems, function (x) { return x.checked; });
    });
  });

  form.addEventListener('submit', function (e) {
    e.preventDefault();

    var ok = true;
    var firstError = null;
    Object.keys(rules).forEach(function (name) {
      if (!check(name)) {
        ok = false;
        if (!firstError) firstError = form[name];
      }
    });

    var agreed = Array.prototype.every.call(form.querySelectorAll('.agree__item[required]'), function (c) { return c.checked; });
    agreeMsg.textContent = agreed ? '' : '필수 약관에 동의해 주세요.';
    if (!agreed) ok = false;

    if (!ok) {
      if (firstError) firstError.focus();
      return;
    }

    signUp();
  });

  // Supabase로 회원가입
  // 이메일/비밀번호 → Supabase Auth, 이름/전화번호 → users 테이블 (db/schema.sql 의 트리거가 자동 저장)
  var submitBtn = form.querySelector('.join-form__submit');
  function signUp() {
    if (!supabaseClient) {
      alert('회원가입 서버 연결 준비 중입니다. (js/supabase-config.js 설정 필요)');
      return;
    }

    submitBtn.disabled = true;
    submitBtn.textContent = '가입 중...';

    supabaseClient.auth.signUp({
      email: form.email.value.trim().toLowerCase(),
      password: form.password.value,
      options: {
        data: {
          name: form.userName.value.trim(),
          phone: form.phone.value.trim()
        },
        // 인증 메일의 링크를 누르면 돌아올 주소
        emailRedirectTo: new URL('login.html', location.href).href
      }
    }).then(function (res) {
      if (res.error) throw res.error;

      // 이미 가입된 이메일이면 Supabase가 오류 대신 빈 identities를 돌려줌
      if (res.data.user && res.data.user.identities && res.data.user.identities.length === 0) {
        showEmailTaken();
        return;
      }

      if (res.data.session) {
        alert('회원가입이 완료되었습니다!');
      } else {
        alert('가입하신 이메일로 인증 메일을 보냈습니다.\n메일의 링크를 눌러 가입을 완료해 주세요.');
      }
      location.href = 'index.html';
    }).catch(function (err) {
      if (/already registered/i.test(err.message)) {
        showEmailTaken();
      } else if (/rate limit/i.test(err.message)) {
        alert('잠시 후 다시 시도해 주세요.');
      } else {
        alert('회원가입 중 문제가 발생했습니다.\n' + err.message);
      }
    }).finally(function () {
      submitBtn.disabled = false;
      submitBtn.textContent = '가입하기';
    });
  }

  function showEmailTaken() {
    var msg = form.email.closest('.field').querySelector('.field__msg');
    msg.textContent = '이미 가입된 이메일입니다.';
    form.email.classList.add('is-error');
    form.email.focus();
  }
})();
