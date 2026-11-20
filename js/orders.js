(function () {
  var body = document.getElementById('myBody');
  var filter = document.getElementById('orderFilter');
  var periodBtns = filter.querySelectorAll('.order-filter__period button');
  var rows = document.getElementById('orderRows');
  var empty = document.getElementById('orderEmpty');
  var count = document.getElementById('orderCount');

  if (!supabaseClient) {
    alert('서버 연결 준비 중입니다. (js/supabase-config.js 설정 필요)');
    return;
  }

  // 날짜 → 'YYYY-MM-DD' (내 컴퓨터 시간 기준)
  function ymd(d) {
    var m = String(d.getMonth() + 1).padStart(2, '0');
    var day = String(d.getDate()).padStart(2, '0');
    return d.getFullYear() + '-' + m + '-' + day;
  }

  // 기간 버튼: 오늘부터 거꾸로 N일 / N개월
  function setPeriod(btn) {
    periodBtns.forEach(function (b) { b.classList.toggle('is-active', b === btn); });
    var from = new Date();
    if (btn.dataset.days) from.setDate(from.getDate() - Number(btn.dataset.days));
    if (btn.dataset.months) from.setMonth(from.getMonth() - Number(btn.dataset.months));
    filter.from.value = ymd(from);
    filter.to.value = ymd(new Date());
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

  function render(orders) {
    rows.textContent = '';
    empty.hidden = orders.length > 0;
    count.textContent = '(' + orders.length + '건)';

    orders.forEach(function (o) {
      var card = el('div', 'order-card');

      var head = el('div', 'order-card__head');
      head.appendChild(el('span', 'order-card__date', ymd(new Date(o.created_at))));
      head.appendChild(el('span', 'order-card__no', '[' + o.order_no + ']'));
      head.appendChild(el('span', 'order-card__status is-' + o.status, o.status));
      card.appendChild(head);

      var list = el('ul', 'order-card__items');
      (o.items || []).forEach(function (item) {
        var li = el('li');
        var img;
        if (item.image) {
          img = el('img', 'order-card__img');
          img.src = item.image;
          img.alt = item.name;
        } else {
          img = el('div', 'order-card__img ph');
        }
        li.appendChild(img);
        li.appendChild(el('p', 'order-card__name', item.name));
        li.appendChild(el('p', 'order-card__qty', (item.qty || 1) + '개'));
        li.appendChild(el('p', 'order-card__price', won((item.price || 0) * (item.qty || 1))));
        list.appendChild(li);
      });
      card.appendChild(list);

      var foot = el('div', 'order-card__foot');
      foot.appendChild(document.createTextNode('총 결제금액 '));
      foot.appendChild(el('b', null, won(o.total_price)));
      card.appendChild(foot);

      rows.appendChild(card);
    });
  }

  function load() {
    var from = filter.from.value;
    var to = filter.to.value;
    if (from && to && from > to) {
      alert('시작일이 종료일보다 늦습니다.');
      return;
    }

    var q = supabaseClient.from('orders')
      .select('order_no, status, items, total_price, created_at')
      .order('created_at', { ascending: false });
    if (from) q = q.gte('created_at', new Date(from + 'T00:00:00').toISOString());
    if (to) {
      var end = new Date(to + 'T00:00:00');
      end.setDate(end.getDate() + 1); // 종료일 하루 전체 포함
      q = q.lt('created_at', end.toISOString());
    }
    if (filter.status.value) q = q.eq('status', filter.status.value);

    count.textContent = '불러오는 중...';
    q.then(function (res) {
      if (res.error) throw res.error;
      render(res.data);
    }).catch(function (err) {
      count.textContent = '';
      alert('주문내역을 불러오지 못했습니다. (' + err.message + ')');
    });
  }

  periodBtns.forEach(function (btn) {
    btn.addEventListener('click', function () {
      setPeriod(btn);
      load();
    });
  });

  // 날짜를 직접 바꾸면 기간 버튼 선택 해제
  [filter.from, filter.to].forEach(function (input) {
    input.addEventListener('change', function () {
      periodBtns.forEach(function (b) { b.classList.remove('is-active'); });
    });
  });

  filter.addEventListener('submit', function (e) {
    e.preventDefault();
    load();
  });

  // 로그인 확인 → 기본으로 최근 3개월 조회
  supabaseClient.auth.getSession().then(function (res) {
    if (!res.data.session) {
      location.replace('login.html?next=orders.html');
      return;
    }
    body.hidden = false;
    setPeriod(filter.querySelector('.order-filter__period .is-active'));
    load();
  });

  // 다른 탭에서 로그아웃하면 로그인 화면으로
  supabaseClient.auth.onAuthStateChange(function (event) {
    if (event === 'SIGNED_OUT') location.replace('login.html');
  });
})();
