// 장바구니: 이 브라우저에 저장 (로그인 없이 사용, 다른 기기와는 공유되지 않음)
// 저장 형태: [{ id: 'istek-1', qty: 2 }, ...]  ← 상품 정보는 products.js 의 PRODUCTS 에서 id로 찾음
var Cart = (function () {
  var KEY = 'istek-cart';

  function get() {
    try {
      var list = JSON.parse(localStorage.getItem(KEY));
      return Array.isArray(list) ? list : [];
    } catch (e) {
      return [];
    }
  }

  function save(list) {
    try {
      localStorage.setItem(KEY, JSON.stringify(list));
    } catch (e) {
      // 사생활 보호 모드 등에서 저장이 막히면 이번 화면에서만 유지
    }
    updateBadge(list);
    return list;
  }

  function add(id, qty) {
    var list = get();
    var item = list.find(function (x) { return x.id === id; });
    if (item) item.qty = Math.min(item.qty + qty, 99);
    else list.push({ id: id, qty: qty });
    return save(list);
  }

  function setQty(id, qty) {
    return save(get().map(function (x) {
      return x.id === id ? { id: id, qty: Math.max(1, Math.min(qty, 99)) } : x;
    }));
  }

  function remove(ids) {
    return save(get().filter(function (x) { return ids.indexOf(x.id) === -1; }));
  }

  // 헤더 장바구니 아이콘에 담긴 상품 종류 수 표시
  function updateBadge(list) {
    var icon = document.querySelector('.header__right a[href="cart.html"]');
    if (!icon) return;
    var badge = icon.querySelector('.cart-badge');
    if (!badge) {
      badge = document.createElement('span');
      badge.className = 'cart-badge';
      icon.appendChild(badge);
    }
    var n = (list || get()).length;
    badge.textContent = n;
    badge.hidden = n === 0;
  }

  updateBadge();

  // 다른 탭에서 장바구니를 바꾸면 여기 표시도 갱신
  window.addEventListener('storage', function (e) {
    if (e.key === KEY) updateBadge();
  });

  return { get: get, add: add, setQty: setQty, remove: remove };
})();
