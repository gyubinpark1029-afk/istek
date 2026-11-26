// 헤더의 돋보기를 누르면 아래로 검색창이 열리고, 검색하면 products.html?q=검색어 로 이동
// (상품을 걸러서 보여주는 일은 products-page.js 가 함)
(function () {
  var icon = document.querySelector('.header__right a[aria-label="검색"]');
  if (!icon) return; // 헤더가 없는 페이지 (로그인 등)

  var form = document.createElement('form');
  form.className = 'searchbar';
  form.id = 'searchbar';
  form.setAttribute('role', 'search');
  form.hidden = true;

  var inner = document.createElement('div');
  inner.className = 'searchbar__inner';

  var input = document.createElement('input');
  input.type = 'search';
  input.name = 'q';
  input.maxLength = 100;
  input.placeholder = '상품명, 브랜드를 검색해 보세요';
  input.autocomplete = 'off';
  input.setAttribute('aria-label', '상품 검색어');

  var submit = document.createElement('button');
  submit.type = 'submit';
  submit.className = 'searchbar__submit';
  submit.textContent = '검색';

  var close = document.createElement('button');
  close.type = 'button';
  close.className = 'searchbar__close';
  close.setAttribute('aria-label', '검색창 닫기');
  close.textContent = '×';

  inner.appendChild(input);
  inner.appendChild(submit);
  inner.appendChild(close);
  form.appendChild(inner);
  var header = document.querySelector('.header');
  header.parentNode.insertBefore(form, header.nextSibling);

  icon.setAttribute('aria-expanded', 'false');
  icon.setAttribute('aria-controls', 'searchbar');

  // 검색 결과 화면이면 검색어를 미리 채워 두기
  if (/products\.html$/.test(location.pathname)) {
    input.value = (new URLSearchParams(location.search).get('q') || '').slice(0, 100);
  }

  function open() {
    form.hidden = false;
    icon.setAttribute('aria-expanded', 'true');
    input.focus();
    input.select();
  }

  function shut() {
    form.hidden = true;
    icon.setAttribute('aria-expanded', 'false');
  }

  icon.addEventListener('click', function (e) {
    e.preventDefault();
    if (form.hidden) open(); else shut();
  });
  close.addEventListener('click', function () {
    shut();
    icon.focus();
  });
  document.addEventListener('keydown', function (e) {
    if (e.key === 'Escape' && !form.hidden) {
      shut();
      icon.focus();
    }
  });
  // 검색창 밖을 누르면 닫기
  document.addEventListener('click', function (e) {
    if (!form.hidden && !form.contains(e.target) && !icon.contains(e.target)) shut();
  });

  form.addEventListener('submit', function (e) {
    e.preventDefault();
    var q = input.value.trim();
    if (!q) {
      input.focus();
      return;
    }
    location.href = 'products.html?q=' + encodeURIComponent(q);
  });
})();
