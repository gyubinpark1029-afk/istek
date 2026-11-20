/*
 * 상품 데이터 (지금은 임시 상품)
 * 실제 상품이 정해지면 이 목록만 고치면 됩니다.
 *   id    : 상품 고유 번호 (겹치면 안 됨, 장바구니가 이 번호로 상품을 찾아요)
 *   brand : 위의 #브랜드 이름과 똑같이 적어야 연결돼요
 *   name  : 상품명
 *   price : 가격 (숫자)
 *   image : 이미지 경로 (예: "images/products/istek-1.jpg"), 비워두면 회색 박스
 */
var PRODUCTS = [
  { id: 'istek-1', brand: 'istek',         name: '[임시] istek 제품 1',         price: 448000, image: '' },
  { id: 'istek-2', brand: 'istek',         name: '[임시] istek 제품 2',         price: 448000, image: '' },
  { id: 'istek-3', brand: 'istek',         name: '[임시] istek 제품 3',         price: 448000, image: '' },
  { id: 'istek-4', brand: 'istek',         name: '[임시] istek 제품 4',         price: 448000, image: '' },

  { id: 'HUMAS-1', brand: 'HUMAS',         name: '[임시] HUMAS 제품 1',         price: 448000, image: '' },
  { id: 'HUMAS-2', brand: 'HUMAS',         name: '[임시] HUMAS 제품 2',         price: 448000, image: '' },
  { id: 'HUMAS-3', brand: 'HUMAS',         name: '[임시] HUMAS 제품 3',         price: 448000, image: '' },
  { id: 'HUMAS-4', brand: 'HUMAS',         name: '[임시] HUMAS 제품 4',         price: 448000, image: '' },

  { id: 'evergreenTop-1', brand: 'evergreenTop',  name: '[임시] evergreenTop 제품 1',  price: 448000, image: '' },
  { id: 'evergreenTop-2', brand: 'evergreenTop',  name: '[임시] evergreenTop 제품 2',  price: 448000, image: '' },
  { id: 'evergreenTop-3', brand: 'evergreenTop',  name: '[임시] evergreenTop 제품 3',  price: 448000, image: '' },
  { id: 'evergreenTop-4', brand: 'evergreenTop',  name: '[임시] evergreenTop 제품 4',  price: 448000, image: '' },

  { id: 'analytik-jena-1', brand: 'analytik-jena', name: '[임시] analytik-jena 제품 1', price: 448000, image: '' },
  { id: 'analytik-jena-2', brand: 'analytik-jena', name: '[임시] analytik-jena 제품 2', price: 448000, image: '' },
  { id: 'analytik-jena-3', brand: 'analytik-jena', name: '[임시] analytik-jena 제품 3', price: 448000, image: '' },
  { id: 'analytik-jena-4', brand: 'analytik-jena', name: '[임시] analytik-jena 제품 4', price: 448000, image: '' },

  { id: 'miraest-1', brand: 'miraest',       name: '[임시] miraest 제품 1',       price: 448000, image: '' },
  { id: 'miraest-2', brand: 'miraest',       name: '[임시] miraest 제품 2',       price: 448000, image: '' },
  { id: 'miraest-3', brand: 'miraest',       name: '[임시] miraest 제품 3',       price: 448000, image: '' },
  { id: 'miraest-4', brand: 'miraest',       name: '[임시] miraest 제품 4',       price: 448000, image: '' }
];
