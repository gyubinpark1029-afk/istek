// 상품 상세: product.html?id=istek-1 처럼 주소의 id로 Supabase products 테이블의 상품을 찾아서 표시
(function () {
  var id = new URLSearchParams(location.search).get('id');

  Products.load().then(show).catch(function (err) {
    var box = document.getElementById('pdEmpty');
    box.querySelector('p').textContent = '상품을 불러오지 못했습니다. 잠시 후 다시 시도해 주세요. (' + err.message + ')';
    box.hidden = false;
  });

  function show(PRODUCTS) {
    var p = PRODUCTS.find(function (x) { return x.id === id; });

    if (!p) {
      document.getElementById('pdEmpty').hidden = false;
      return;
    }

    function won(n) {
      return Number(n || 0).toLocaleString('ko-KR') + '원';
    }

    function el(tag, className, text) {
      var e = document.createElement(tag);
      if (className) e.className = className;
      if (text != null) e.textContent = text;
      return e;
    }

    function picture(src, className) {
      if (!src) return el('div', className + ' ph');
      var img = el('img', className);
      img.src = src;
      img.alt = p.name;
      return img;
    }

    document.title = p.name + ' | istek';

    // 이미지: image(대표) + images(추가 사진). 2장 이상이면 작은 사진을 눌러 바꿔 보기
    var main = document.getElementById('pdMain');
    var photos = [p.image].concat(p.images || []).filter(Boolean);
    main.appendChild(picture(photos[0], 'pd__img'));
    if (photos.length > 1) {
      var thumbs = document.getElementById('pdThumbs');
      photos.forEach(function (src, i) {
        var li = el('li');
        var btn = el('button', i === 0 ? 'is-active' : '');
        btn.type = 'button';
        btn.setAttribute('aria-label', (i + 1) + '번째 사진 보기');
        btn.appendChild(picture(src, 'pd__thumb'));
        btn.addEventListener('click', function () {
          main.querySelector('img').src = src;
          thumbs.querySelectorAll('button').forEach(function (b) { b.classList.toggle('is-active', b === btn); });
        });
        li.appendChild(btn);
        thumbs.appendChild(li);
      });
      thumbs.hidden = false;
    }

    document.getElementById('pdBrand').textContent = p.brand;
    document.getElementById('pdName').textContent = p.name;
    document.getElementById('pdPrice').textContent = won(p.price);
    if (p.summary) {
      var summary = document.getElementById('pdSummary');
      summary.textContent = p.summary;
      summary.hidden = false;
    }

    // 상품 정보 표: 브랜드 + specs
    var meta = document.getElementById('pdMeta');
    [['브랜드', p.brand]].concat(p.specs || []).forEach(function (row) {
      var div = el('div');
      div.appendChild(el('dt', null, row[0]));
      div.appendChild(el('dd', null, row[1]));
      meta.appendChild(div);
    });

    // 상세 설명: 줄바꿈 두 번 = 문단 나누기, detailImages 는 설명 아래에 차례로 표시
    var desc = document.getElementById('pdDescription');
    var paragraphs = (p.description || '').split(/\n\s*\n/).map(function (s) { return s.trim(); }).filter(Boolean);
    paragraphs.forEach(function (text) { desc.appendChild(el('p', 'pd-section__text', text)); });
    (p.detailImages || []).forEach(function (src) { desc.appendChild(picture(src, 'pd-section__img')); });
    if (!desc.children.length) desc.appendChild(el('p', 'pd-section__none', '상세 설명을 준비 중입니다. 궁금한 점은 고객센터 (051) 581-4303 으로 문의해 주세요.'));

    // 수량과 총 상품금액
    var qtyInput = document.getElementById('pdQty');
    function qty() {
      return Math.max(1, Math.min(parseInt(qtyInput.value, 10) || 1, 99));
    }
    function setQty(n) {
      qtyInput.value = Math.max(1, Math.min(n, 99));
      document.getElementById('pdTotal').textContent = won(p.price * qty());
    }
    document.getElementById('pdMinus').addEventListener('click', function () { setQty(qty() - 1); });
    document.getElementById('pdPlus').addEventListener('click', function () { setQty(qty() + 1); });
    qtyInput.addEventListener('change', function () { setQty(qty()); });
    setQty(1);

    document.getElementById('pdCart').addEventListener('click', function () {
      Cart.add(p.id, qty());
      if (confirm('장바구니에 담았습니다.\n장바구니로 이동할까요?')) location.href = 'cart.html';
    });

    // 바로 구매: 고른 수량으로 장바구니에 넣고(이미 있으면 수량을 맞춤) 이 상품만 주문서로
    document.getElementById('pdBuy').addEventListener('click', function () {
      var inCart = Cart.get().some(function (x) { return x.id === p.id; });
      if (inCart) Cart.setQty(p.id, qty());
      else Cart.add(p.id, qty());
      try {
        sessionStorage.setItem('istek-checkout', JSON.stringify([p.id]));
      } catch (e) {
        // 저장이 막히면 주문서에서 장바구니 전체가 주문 상품이 됨
      }
      location.href = 'checkout.html';
    });

    document.getElementById('pdBody').hidden = false;
  }
})();
