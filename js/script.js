(function () {
  var openBtn = document.getElementById('menuOpen');
  var closeBtn = document.getElementById('menuClose');
  var drawer = document.getElementById('drawer');
  var overlay = document.getElementById('overlay');
  if (!drawer) return; // 헤더/메뉴가 없는 페이지 (로그인 등)

  function openMenu() {
    drawer.classList.add('is-open');
    overlay.classList.add('is-open');
    drawer.setAttribute('aria-hidden', 'false');
    openBtn.setAttribute('aria-expanded', 'true');
    document.body.classList.add('menu-open');
    closeBtn.focus();
  }

  function closeMenu() {
    drawer.classList.remove('is-open');
    overlay.classList.remove('is-open');
    drawer.setAttribute('aria-hidden', 'true');
    openBtn.setAttribute('aria-expanded', 'false');
    document.body.classList.remove('menu-open');
    openBtn.focus();
  }

  openBtn.addEventListener('click', openMenu);
  closeBtn.addEventListener('click', closeMenu);
  overlay.addEventListener('click', closeMenu);
  document.addEventListener('keydown', function (e) {
    if (e.key === 'Escape' && drawer.classList.contains('is-open')) closeMenu();
  });

  // 하위 메뉴 열기/닫기 (아코디언)
  document.querySelectorAll('.menu__toggle').forEach(function (btn) {
    btn.addEventListener('click', function () {
      var item = btn.parentElement;
      var open = item.classList.toggle('is-open');
      btn.setAttribute('aria-expanded', open);
    });
  });

  // 메뉴 안의 링크를 누르면 메뉴 닫기
  drawer.querySelectorAll('a').forEach(function (a) {
    a.addEventListener('click', function () {
      drawer.classList.remove('is-open');
      overlay.classList.remove('is-open');
      drawer.setAttribute('aria-hidden', 'true');
      openBtn.setAttribute('aria-expanded', 'false');
      document.body.classList.remove('menu-open');
    });
  });
})();

(function () {
  // TOP 버튼: 조금 스크롤하면 나타나고, 누르면 맨 위로
  var topBtn = document.getElementById('topBtn');
  function toggleTop() {
    topBtn.classList.toggle('is-show', window.scrollY > 300);
  }
  window.addEventListener('scroll', toggleTop, { passive: true });
  toggleTop();
  topBtn.addEventListener('click', function () {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  });

  // Recommend: #브랜드를 누르면 그 브랜드의 제품을 최대 4개 보여주고, 아래 더보기로 전체 목록 연결
  var productList = document.getElementById('productList');
  if (!productList) return; // 메인 페이지가 아니면 건너뛰기
  var tags = document.querySelectorAll('.tag');
  var more = document.getElementById('recommendMore');
  var RECOMMEND_COUNT = 4;

  function renderProducts(brand) {
    productList.textContent = '';
    var items = PRODUCTS.filter(function (p) { return p.brand === brand; });

    more.href = 'products.html?brand=' + encodeURIComponent(brand);

    if (items.length === 0) {
      var empty = document.createElement('li');
      empty.className = 'product-empty';
      empty.textContent = '등록된 제품이 없습니다.';
      productList.appendChild(empty);
      return;
    }

    items.slice(0, RECOMMEND_COUNT).forEach(function (p) {
      productList.appendChild(productCard(p));
    });
  }

  tags.forEach(function (tag) {
    tag.addEventListener('click', function () {
      tags.forEach(function (t) {
        t.classList.remove('is-active');
        t.setAttribute('aria-pressed', 'false');
      });
      tag.classList.add('is-active');
      tag.setAttribute('aria-pressed', 'true');
      renderProducts(tag.dataset.brand);
    });
  });

  renderProducts(document.querySelector('.tag.is-active').dataset.brand);
})();
