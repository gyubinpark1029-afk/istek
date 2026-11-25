// 전체 상품 목록: products.html?brand=istek 처럼 브랜드를 고르면 그 브랜드만, 없으면 전체 상품
(function () {
  var params = new URLSearchParams(location.search);
  var brandBox = document.getElementById('plistBrands');
  var grid = document.getElementById('plistGrid');
  var sortSelect = document.getElementById('plistSort');

  // 브랜드 목록은 products.js 에 나오는 순서대로
  var brands = [];
  PRODUCTS.forEach(function (p) {
    if (brands.indexOf(p.brand) === -1) brands.push(p.brand);
  });

  var brand = params.get('brand');
  if (brands.indexOf(brand) === -1) brand = ''; // 없는 브랜드면 전체
  var sort = params.get('sort') || '';
  if (!sortSelect.querySelector('option[value="' + sort + '"]')) sort = '';
  sortSelect.value = sort;

  // 주소를 바꿔 두면 새로고침·뒤로가기·링크 공유해도 같은 목록이 보임
  function updateUrl() {
    var q = new URLSearchParams();
    if (brand) q.set('brand', brand);
    if (sort) q.set('sort', sort);
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
    var title = brand ? brand + ' 상품' : '전체 상품';
    document.getElementById('plistTitle').textContent = title;
    document.title = title + ' | istek';

    var items = PRODUCTS.filter(function (p) { return !brand || p.brand === brand; });
    if (sort === 'low') items.sort(function (a, b) { return a.price - b.price; });
    if (sort === 'high') items.sort(function (a, b) { return b.price - a.price; });
    if (sort === 'name') items.sort(function (a, b) { return a.name.localeCompare(b.name, 'ko'); });

    document.getElementById('plistCount').innerHTML = '';
    var count = document.createElement('b');
    count.textContent = items.length;
    document.getElementById('plistCount').append('총 ', count, '개의 상품');

    grid.textContent = '';
    if (!items.length) {
      var empty = document.createElement('li');
      empty.className = 'product-empty';
      empty.textContent = '등록된 제품이 없습니다.';
      grid.appendChild(empty);
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
})();
