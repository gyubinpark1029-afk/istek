// 주문서 작성: 장바구니에서 고른 상품 → 배송 정보 입력 → Supabase place_order 함수로 주문 저장
(function () {
  // TODO: 실제 입금 계좌로 바꾸기 (예: '부산은행 000-0000-0000-00 (예금주: 이스텍)')
  var BANK_INFO = '[입금 계좌 준비 중] 주문 후 담당자가 연락드려 안내해 드립니다.';
  var CHECKOUT_KEY = 'istek-checkout'; // 장바구니에서 넘겨준 주문할 상품 id 목록

  var form = document.getElementById('checkoutForm');
  var emptyBox = document.getElementById('checkoutEmpty');
  var doneBox = document.getElementById('checkoutDone');
  var msg = document.getElementById('checkoutMsg');
  var submitBtn = document.getElementById('checkoutSubmit');
  var same = document.getElementById('sameAsBuyer');
  var buyer = {};
  var orderItems = [];
  var PRODUCTS = []; // Supabase에서 불러온 판매 중인 상품 (화면 표시용, 실제 결제금액은 서버가 계산)

  if (!supabaseClient) {
    alert('서버 연결 준비 중입니다. (js/supabase-config.js 설정 필요)');
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

  function setMsg(input, text) {
    input.closest('.field').querySelector('.field__msg').textContent = text;
    input.classList.toggle('is-error', text !== '');
    input.setAttribute('aria-invalid', text !== '');
  }

  function formatPhone(v) {
    var d = v.replace(/\D/g, '').slice(0, 11);
    return d.length < 4 ? d
      : d.length < 8 ? d.slice(0, 3) + '-' + d.slice(3)
      : d.slice(0, 3) + '-' + d.slice(3, d.length - 4) + '-' + d.slice(-4);
  }

  // 장바구니에서 고른 상품 id (없으면 장바구니 전체)
  function selectedIds() {
    try {
      var ids = JSON.parse(sessionStorage.getItem(CHECKOUT_KEY));
      if (Array.isArray(ids)) return ids;
    } catch (e) {}
    return null;
  }

  // 주문할 상품 = 장바구니에 있으면서 고른 상품 (수량은 장바구니 기준)
  function loadItems() {
    var ids = selectedIds();
    var list = [];
    Cart.get().forEach(function (x) {
      if (ids && ids.indexOf(x.id) === -1) return;
      var p = PRODUCTS.find(function (q) { return q.id === x.id; });
      if (p) list.push({ product: p, qty: x.qty });
    });
    return list;
  }

  function renderItems() {
    var ul = document.getElementById('checkoutItems');
    ul.textContent = '';
    orderItems.forEach(function (it) {
      var p = it.product;
      var li = el('li');
      var img;
      if (p.image) {
        img = el('img', 'order-card__img');
        img.src = p.image;
        img.alt = p.name;
      } else {
        img = el('div', 'order-card__img ph');
      }
      li.appendChild(img);
      li.appendChild(el('p', 'order-card__name', p.name));
      li.appendChild(el('p', 'order-card__qty', it.qty + '개'));
      li.appendChild(el('p', 'order-card__price', won(p.price * it.qty)));
      ul.appendChild(li);
    });
    var sum = orderItems.reduce(function (s, it) { return s + it.product.price * it.qty; }, 0);
    document.getElementById('checkoutCount').textContent = '(' + orderItems.length + '개)';
    document.getElementById('checkoutSubtotal').textContent = won(sum);
    document.getElementById('checkoutTotal').textContent = won(sum);
    return sum;
  }

  // "주문자 정보와 동일" → 회원 정보로 배송지 채우기
  function fillFromBuyer() {
    form.receiverName.value = buyer.name || '';
    form.receiverPhone.value = buyer.phone || '';
    form.zipcode.value = buyer.zipcode || '';
    form.address.value = buyer.address || '';
    form.addressDetail.value = buyer.address_detail || '';
  }

  same.addEventListener('change', function () {
    if (same.checked) {
      fillFromBuyer();
    } else {
      ['receiverName', 'receiverPhone', 'zipcode', 'address', 'addressDetail'].forEach(function (n) {
        form[n].value = '';
      });
      form.receiverName.focus();
    }
  });

  // 직접 고치면 "동일" 체크 해제
  ['receiverName', 'receiverPhone', 'addressDetail'].forEach(function (n) {
    form[n].addEventListener('input', function () { same.checked = false; });
  });

  form.receiverPhone.addEventListener('input', function () {
    form.receiverPhone.value = formatPhone(form.receiverPhone.value);
  });

  // 주소 검색 (다음 우편번호 서비스)
  function openPostcode() {
    if (!window.daum || !daum.Postcode) {
      alert('주소 검색을 불러오지 못했습니다. 잠시 후 다시 시도해 주세요.');
      return;
    }
    new daum.Postcode({
      oncomplete: function (data) {
        var addr = data.roadAddress || data.jibunAddress;
        if (data.buildingName) addr += ' (' + data.buildingName + ')';
        form.zipcode.value = data.zonecode;
        form.address.value = addr;
        form.addressDetail.value = '';
        same.checked = false;
        setMsg(form.addressDetail, '');
        form.addressDetail.focus();
      }
    }).open();
  }
  document.getElementById('addrSearch').addEventListener('click', openPostcode);
  form.zipcode.addEventListener('click', openPostcode);
  form.address.addEventListener('click', openPostcode);

  document.getElementById('bankInfo').textContent = BANK_INFO;

  form.addEventListener('submit', function (e) {
    e.preventDefault();
    msg.textContent = '';

    var name = form.receiverName.value.trim();
    var phone = form.receiverPhone.value.trim();
    var address = form.address.value;
    var depositor = form.depositor.value.trim();
    var nameError = name ? '' : '받는 분 이름을 입력해 주세요.';
    var phoneError = !phone ? '연락처를 입력해 주세요.'
      : !/^01[0-9]-?\d{3,4}-?\d{4}$/.test(phone) ? '연락처 형식이 올바르지 않습니다. (예: 010-1234-5678)' : '';
    var addressError = address ? '' : '주소 검색으로 배송 주소를 입력해 주세요.';
    var depositorError = depositor ? '' : '입금자명을 입력해 주세요.';
    setMsg(form.receiverName, nameError);
    setMsg(form.receiverPhone, phoneError);
    setMsg(form.addressDetail, addressError);
    setMsg(form.depositor, depositorError);
    if (nameError) return form.receiverName.focus();
    if (phoneError) return form.receiverPhone.focus();
    if (addressError) return openPostcode();
    if (depositorError) return form.depositor.focus();
    if (!document.getElementById('agree').checked) {
      msg.textContent = '주문 내용 확인 및 결제 동의에 체크해 주세요.';
      return;
    }

    // 다른 탭에서 장바구니가 바뀌었을 수 있으니 한 번 더 확인
    orderItems = loadItems();
    var total = renderItems();
    if (!orderItems.length) {
      msg.textContent = '주문할 상품이 장바구니에 없습니다.';
      return;
    }

    submitBtn.disabled = true;
    submitBtn.textContent = '주문 처리 중...';
    var orderNo;
    // 상품 번호와 수량만 보내고, 이름·가격은 서버가 products 테이블에서 직접 확인
    supabaseClient.rpc('place_order', {
      p_items: orderItems.map(function (it) {
        return { id: it.product.id, qty: it.qty };
      }),
      p_receiver_name: name,
      p_receiver_phone: phone,
      p_zipcode: form.zipcode.value,
      p_address: address,
      p_address_detail: form.addressDetail.value.trim(),
      p_memo: form.memo.value.trim(),
      p_depositor: depositor
    }).then(function (res) {
      if (res.error) throw res.error;
      orderNo = res.data;

      // 주문한 상품은 장바구니에서 빼기
      Cart.remove(orderItems.map(function (it) { return it.product.id; }));
      try { sessionStorage.removeItem(CHECKOUT_KEY); } catch (err) {}

      // 완료 화면에는 서버가 계산해 저장한 결제금액을 표시 (못 불러오면 화면의 금액)
      return supabaseClient.from('orders').select('total_price').eq('order_no', orderNo).maybeSingle()
        .then(function (r) { return r.data ? r.data.total_price : total; }, function () { return total; });
    }).then(function (paid) {
      document.getElementById('doneNo').textContent = orderNo;
      document.getElementById('doneTotal').textContent = won(paid);
      document.getElementById('doneBank').textContent = BANK_INFO;
      document.getElementById('doneDepositor').textContent = depositor;
      form.hidden = true;
      doneBox.hidden = false;
      window.scrollTo(0, 0);
    }).catch(function (err) {
      submitBtn.disabled = false;
      submitBtn.textContent = '주문하기';
      msg.textContent = '주문 중 문제가 발생했습니다. (' + err.message + ')';
    });
  });

  // 로그인 확인 → 회원 정보 불러오기 → 주문서 표시
  supabaseClient.auth.getSession().then(function (res) {
    var session = res.data.session;
    if (!session) {
      location.replace('login.html?next=checkout.html');
      return;
    }

    return Products.load().then(function (list) {
      PRODUCTS = list;
      orderItems = loadItems();
      if (!orderItems.length) {
        emptyBox.hidden = false;
        return;
      }
      renderItems();
      return loadBuyer(session);
    });
  }).catch(function (err) {
    alert('주문서를 불러오지 못했습니다. (' + err.message + ')');
  });

  function loadBuyer(session) {
    return supabaseClient.from('users').select('name, email, phone, zipcode, address, address_detail').maybeSingle()
      .then(function (r) {
        var meta = session.user.user_metadata || {};
        buyer = r.data || meta;
        document.getElementById('buyerName').textContent = buyer.name || '-';
        document.getElementById('buyerEmail').textContent = buyer.email || session.user.email;
        document.getElementById('buyerPhone').textContent = buyer.phone || '-';
        fillFromBuyer();
        form.depositor.value = buyer.name || '';
        form.hidden = false;
      });
  }

  // 다른 탭에서 로그아웃하면 로그인 화면으로
  supabaseClient.auth.onAuthStateChange(function (event) {
    if (event === 'SIGNED_OUT' && doneBox.hidden) location.replace('login.html?next=checkout.html');
  });
})();
