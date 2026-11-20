(function () {
  var hello = document.getElementById('myHello');
  var body = document.getElementById('myBody');

  if (!supabaseClient) {
    hello.textContent = '서버 연결 준비 중입니다. (js/supabase-config.js 설정 필요)';
    return;
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
  }

  // 총주문(취소·반품 제외)과 최근 3개월 주문처리 현황
  function loadOrders() {
    return supabaseClient.from('orders').select('status, total_price, created_at')
      .then(function (res) {
        if (res.error) return; // 주문 테이블이 아직 없으면 0 그대로 표시
        var since = new Date();
        since.setMonth(since.getMonth() - 3);

        var sum = 0, times = 0, counts = {};
        res.data.forEach(function (o) {
          if (o.status !== '취소' && o.status !== '반품') {
            sum += o.total_price;
            times += 1;
          }
          if (new Date(o.created_at) >= since) counts[o.status] = (counts[o.status] || 0) + 1;
        });

        document.getElementById('infoTotal').textContent = sum.toLocaleString('ko-KR') + '원(' + times + '회)';
        document.querySelectorAll('[data-status]').forEach(function (e) {
          e.textContent = counts[e.dataset.status] || 0;
        });
      });
  }

  // 로그인 확인 → users 테이블에서 내 정보 불러오기
  supabaseClient.auth.getSession().then(function (res) {
    var session = res.data.session;
    if (!session) {
      location.replace('login.html?next=mypage.html');
      return;
    }
    var user = session.user;

    return supabaseClient.from('users').select('id, name, email, created_at').maybeSingle()
      .then(function (r) {
        var meta = user.user_metadata || {};
        // users 테이블에 아직 줄이 없으면 로그인 정보로 대신 표시
        fill(r.data || {
          id: null,
          name: meta.name || user.email,
          email: user.email,
          created_at: user.created_at
        });
        body.hidden = false;
        return loadOrders();
      });
  }).catch(function (err) {
    hello.textContent = '정보를 불러오지 못했습니다. (' + err.message + ')';
  });

  // 다른 탭에서 로그아웃하면 로그인 화면으로
  supabaseClient.auth.onAuthStateChange(function (event) {
    if (event === 'SIGNED_OUT') location.replace('login.html');
  });

  // 아직 없는 메뉴 (Order, Wishlist)
  document.querySelectorAll('[data-soon]').forEach(function (a) {
    a.addEventListener('click', function (e) {
      e.preventDefault();
      alert('준비 중인 기능입니다.');
    });
  });

  document.getElementById('logoutBtn').addEventListener('click', function () {
    supabaseClient.auth.signOut();
  });
})();
