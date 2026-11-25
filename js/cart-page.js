(function () {
  var rows = document.getElementById('cartRows');
  var empty = document.getElementById('cartEmpty');
  var actions = document.getElementById('cartActions');
  var total = document.getElementById('cartTotal');
  var allCheck = document.getElementById('cartAll');
  var unchecked = {}; // 선택 해제한 상품 id (기본은 모두 선택)

  function won(n) {
    return n.toLocaleString('ko-KR') + '원';
  }

  function el(tag, className, text) {
    var e = document.createElement(tag);
    if (className) e.className = className;
    if (text != null) e.textContent = text;
    return e;
  }

  // 장바구니 목록 + 상품 정보 (상품 목록에서 사라진 상품은 장바구니에서도 정리)
  function items() {
    var list = Cart.get();
    var found = [];
    var missing = [];
    list.forEach(function (x) {
      var p = PRODUCTS.find(function (q) { return q.id === x.id; });
      if (p) found.push({ product: p, qty: x.qty });
      else missing.push(x.id);
    });
    if (missing.length) Cart.remove(missing);
    return found;
  }

  function qtyButton(label, text, onClick) {
    var b = el('button', 'cart-qty__btn', text);
    b.type = 'button';
    b.setAttribute('aria-label', label);
    b.addEventListener('click', onClick);
    return b;
  }

  function render() {
    var list = items();
    rows.textContent = '';
    empty.hidden = list.length > 0;
    actions.hidden = total.hidden = list.length === 0;
    document.getElementById('cartCount').textContent = '(' + list.length + '개)';

    list.forEach(function (it) {
      var p = it.product;
      var li = el('li', 'cart-item');

      var check = el('input');
      check.type = 'checkbox';
      check.checked = !unchecked[p.id];
      check.setAttribute('aria-label', p.name + ' 선택');
      check.addEventListener('change', function () {
        if (check.checked) delete unchecked[p.id];
        else unchecked[p.id] = true;
        summary();
      });
      li.appendChild(check);

      var img;
      if (p.image) {
        img = el('img', 'cart-item__img');
        img.src = p.image;
        img.alt = p.name;
      } else {
        img = el('div', 'cart-item__img ph');
      }
      li.appendChild(img);

      var info = el('div', 'cart-item__info');
      var name = el('a', 'cart-item__name', p.name);
      name.href = 'product.html?id=' + encodeURIComponent(p.id);
      info.appendChild(name);
      info.appendChild(el('p', 'cart-item__unit', won(p.price)));
      li.appendChild(info);

      // 수량 - n +
      var qty = el('div', 'cart-qty');
      qty.appendChild(qtyButton('수량 줄이기', '−', function () {
        if (it.qty > 1) { Cart.setQty(p.id, it.qty - 1); render(); }
      }));
      var input = el('input', 'cart-qty__input');
      input.type = 'number';
      input.min = 1;
      input.max = 99;
      input.value = it.qty;
      input.setAttribute('aria-label', p.name + ' 수량');
      input.addEventListener('change', function () {
        Cart.setQty(p.id, parseInt(input.value, 10) || 1);
        render();
      });
      qty.appendChild(input);
      qty.appendChild(qtyButton('수량 늘리기', '+', function () {
        Cart.setQty(p.id, it.qty + 1);
        render();
      }));
      li.appendChild(qty);

      li.appendChild(el('p', 'cart-item__price', won(p.price * it.qty)));

      var del = el('button', 'cart-item__del', '×');
      del.type = 'button';
      del.setAttribute('aria-label', p.name + ' 삭제');
      del.addEventListener('click', function () {
        Cart.remove([p.id]);
        render();
      });
      li.appendChild(del);

      rows.appendChild(li);
    });

    summary();
  }

  function selected() {
    return items().filter(function (it) { return !unchecked[it.product.id]; });
  }

  // 선택한 상품 수와 금액, 전체 선택 체크 상태
  function summary() {
    var list = items();
    var sel = selected();
    var sum = sel.reduce(function (s, it) { return s + it.product.price * it.qty; }, 0);
    document.getElementById('cartSelectedCount').textContent = sel.length + '개';
    document.getElementById('cartSum').textContent = won(sum);
    allCheck.checked = list.length > 0 && sel.length === list.length;
  }

  allCheck.addEventListener('change', function () {
    unchecked = {};
    if (!allCheck.checked) items().forEach(function (it) { unchecked[it.product.id] = true; });
    render();
  });

  document.getElementById('cartRemoveSelected').addEventListener('click', function () {
    var ids = selected().map(function (it) { return it.product.id; });
    if (!ids.length) return alert('삭제할 상품을 선택해 주세요.');
    if (!confirm('선택한 상품 ' + ids.length + '개를 삭제할까요?')) return;
    Cart.remove(ids);
    render();
  });

  document.getElementById('cartClear').addEventListener('click', function () {
    if (!confirm('장바구니를 비울까요?')) return;
    Cart.remove(items().map(function (it) { return it.product.id; }));
    unchecked = {};
    render();
  });

  // 주문할 상품 id를 주문서(checkout.html)로 넘기기 (로그인 안 했으면 주문서가 로그인 화면으로 보냄)
  function order(list) {
    if (!list.length) return alert('주문할 상품을 선택해 주세요.');
    try {
      sessionStorage.setItem('istek-checkout', JSON.stringify(list.map(function (it) { return it.product.id; })));
    } catch (e) {
      // 저장이 막히면 주문서에서 장바구니 전체를 주문 상품으로 사용
    }
    location.href = 'checkout.html';
  }
  document.getElementById('orderSelected').addEventListener('click', function () { order(selected()); });
  document.getElementById('orderAll').addEventListener('click', function () { order(items()); });

  // 다른 탭에서 장바구니를 바꾸면 다시 그리기
  window.addEventListener('storage', function (e) {
    if (e.key === 'istek-cart') render();
  });

  render();
})();
