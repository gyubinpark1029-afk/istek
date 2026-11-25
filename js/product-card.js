// 상품 카드 (사진, 상품명, 가격, 장바구니 담기) — 메인 Recommend 와 전체 상품 목록에서 같이 사용
function productCard(p) {
  var li = document.createElement('li');

  var img;
  if (p.image) {
    img = document.createElement('img');
    img.src = p.image;
    img.alt = p.name;
    img.className = 'product__img';
  } else {
    img = document.createElement('div');
    img.className = 'product__img ph';
  }

  var name = document.createElement('p');
  name.className = 'product__name';
  name.textContent = p.name;

  // 사진과 상품명을 누르면 상품 상세 페이지로
  var link = document.createElement('a');
  link.className = 'product__link';
  link.href = 'product.html?id=' + encodeURIComponent(p.id);
  link.appendChild(img);
  link.appendChild(name);

  var price = document.createElement('p');
  price.className = 'product__price';
  price.textContent = p.price.toLocaleString('ko-KR') + '원';

  var addBtn = document.createElement('button');
  addBtn.type = 'button';
  addBtn.className = 'product__cart';
  addBtn.textContent = '장바구니 담기';
  addBtn.addEventListener('click', function () {
    Cart.add(p.id, 1);
    if (confirm('장바구니에 담았습니다.\n장바구니로 이동할까요?')) location.href = 'cart.html';
  });

  li.appendChild(link);
  li.appendChild(price);
  li.appendChild(addBtn);
  return li;
}
