// 전체 상품 목록: products.html?brand=istek 처럼 브랜드를 고르면 그 브랜드만, 없으면 전체 상품
(function () {
  var params = new URLSearchParams(location.search);
  var brandBox = document.getElementById('plistBrands');
  var grid = document.getElementById('plistGrid');
  var sortSelect = document.getElementById('plistSort');

  productsMessage(grid, '상품을 불러오는 중...');
  Products.load().then(start).catch(function (err) {
    productsMessage(grid, '상품을 불러오지 못했습니다. 잠시 후 다시 시도해 주세요. (' + err.message + ')');
  });

  function start(PRODUCTS) {
    // 브랜드 목록은 상품 순서(sort_order)대로 처음 나오는 순서
    var brands = [];
    PRODUCTS.forEach(function (p) {
      if (brands.indexOf(p.brand) === -1) brands.push(p.brand);
    });

    var brand = params.get('brand');
    if (brands.indexOf(brand) === -1) brand = ''; // 없는 브랜드면 전체
    var sort = params.get('sort') || '';
    if (!sortSelect.querySelector('option[value="' + sort + '"]')) sort = '';
    sortSelect.value = sort;
    var query = (params.get('q') || '').trim().slice(0, 100); // 검색어 (헤더 검색창에서 넘어옴)
    var terms = query.toLowerCase().split(/\s+/).filter(Boolean);

    // 검색어의 모든 단어가 상품명·브랜드·한 줄 설명 안에 있는 상품만
    function matches(p) {
      var text = (p.name + ' ' + p.brand + ' ' + p.summary).toLowerCase();
      return terms.every(function (t) { return text.indexOf(t) !== -1; });
    }

    // 주소를 바꿔 두면 새로고침·뒤로가기·링크 공유해도 같은 목록이 보임
    function updateUrl() {
      var q = new URLSearchParams();
      if (brand) q.set('brand', brand);
      if (sort) q.set('sort', sort);
      if (query) q.set('q', query);
      var s = q.toString();
      history.replaceState(null, '', 'products.html' + (s ? '?' + s : ''));
    }

    function renderBrands() {
      brandBox.textContent = '';
      [''].concat(brands).forEach(function (b) {
        var li = document.createElement('li');
        var btn = document.createElement('button');
        btn.type = 'button';
        btn.className = 'tag' + (b === brand ? ' is-active' : '');
        btn.setAttribute('aria-pressed', b === brand);
        btn.textContent = b ? '#' + b : '전체';
        btn.addEventListener('click', function () {
          brand = b;
          updateUrl();
          render();
        });
        li.appendChild(btn);
        brandBox.appendChild(li);
      });
    }

    function render() {
      renderBrands();
      var title = query ? '"' + query + '" 검색 결과' : brand ? brand + ' 상품' : '전체 상품';
      document.getElementById('plistTitle').textContent = title;
      document.title = title + ' | istek';

      var items = PRODUCTS.filter(function (p) { return (!brand || p.brand === brand) && matches(p); });
      if (sort === 'low') items.sort(function (a, b) { return a.price - b.price; });
      if (sort === 'high') items.sort(function (a, b) { return b.price - a.price; });
      if (sort === 'name') items.sort(function (a, b) { return a.name.localeCompare(b.name, 'ko'); });

      document.getElementById('plistCount').innerHTML = '';
      var count = document.createElement('b');
      count.textContent = items.length;
      document.getElementById('plistCount').append('총 ', count, '개의 상품');

      grid.textContent = '';
      if (!items.length) {
        productsMessage(grid, query ? '검색 결과가 없습니다. 다른 검색어로 찾아보세요.' : '등록된 제품이 없습니다.');
        return;
      }
      items.forEach(function (p) { grid.appendChild(productCard(p)); });
    }

    sortSelect.addEventListener('change', function () {
      sort = sortSelect.value;
      updateUrl();
      render();
    });

    render();
  }
})();
