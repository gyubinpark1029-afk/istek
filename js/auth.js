// 모든 페이지 공통: Supabase 연결 + 헤더에 로그인 상태 표시
var supabaseClient = null;
if (window.supabase && SUPABASE_URL.indexOf('YOUR-PROJECT') === -1) {
  supabaseClient = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
}

(function () {
  if (!supabaseClient) return;
  var icon = document.querySelector('.header__right a[href="login.html"]');
  if (!icon) return;

  // 사람 아이콘 왼쪽에 "OOO님" 표시
  var nameLink = document.createElement('a');
  nameLink.href = 'login.html';
  nameLink.className = 'header__name';
  nameLink.hidden = true;
  icon.parentNode.insertBefore(nameLink, icon);

  function update(session) {
    if (session) {
      var user = session.user;
      var name = (user.user_metadata && user.user_metadata.name) || user.email;
      nameLink.textContent = name + '님';
      nameLink.hidden = false;
      icon.setAttribute('aria-label', '내 정보');
    } else {
      nameLink.hidden = true;
      icon.setAttribute('aria-label', '로그인');
    }
  }

  // 페이지를 열 때, 로그인/로그아웃할 때마다 자동으로 다시 표시
  supabaseClient.auth.onAuthStateChange(function (event, session) {
    update(session);
  });
})();
