/*
 * 상품 불러오기: Supabase products 테이블에서 판매 중인 상품을 가져옴
 * 상품 추가·수정은 Supabase 대시보드 > Table Editor > products 에서 (항목 설명은 db/schema.sql 참고)
 *
 * 사용법: Products.load().then(function (PRODUCTS) { ... })
 * 한 페이지에서 여러 번 불러도 서버에는 한 번만 요청함
 * 받는 상품 모양: { id, brand, name, price, image, images, summary, description, specs, detailImages }
 */
var Products = (function () {
  var promise = null;

  function normalize(row) {
    return {
      id: row.id,
      brand: row.brand,
      name: row.name,
      price: row.price,
      image: row.image || '',
      images: Array.isArray(row.images) ? row.images : [],
      summary: row.summary || '',
      description: row.description || '',
      specs: Array.isArray(row.specs) ? row.specs : [],
      detailImages: Array.isArray(row.detail_images) ? row.detail_images : []
    };
  }

  function load() {
    if (promise) return promise;
    if (!supabaseClient) {
      promise = Promise.reject(new Error('서버 연결 준비 중입니다. (js/supabase-config.js 설정 필요)'));
    } else {
      promise = supabaseClient.from('products')
        .select('id, brand, name, price, image, images, summary, description, specs, detail_images')
        .eq('is_active', true)
        .order('sort_order')
        .order('id')
        .then(function (res) {
          if (res.error) throw res.error;
          return res.data.map(normalize);
        });
    }
    // 실패하면 다음에 다시 시도할 수 있게
    promise.catch(function () { promise = null; });
    return promise;
  }

  return { load: load };
})();

// 목록 자리에 "불러오는 중" / 오류 문구 표시 (메인, 전체 상품 목록에서 사용)
function productsMessage(list, text) {
  list.textContent = '';
  var li = document.createElement('li');
  li.className = 'product-empty';
  li.textContent = text;
  list.appendChild(li);
}
