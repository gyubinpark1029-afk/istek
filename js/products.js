/*
 * 상품 데이터 (지금은 임시 상품)
 * 실제 상품이 정해지면 이 목록만 고치면 됩니다.
 *   id    : 상품 고유 번호 (겹치면 안 됨, 장바구니가 이 번호로 상품을 찾아요)
 *   brand : 위의 #브랜드 이름과 똑같이 적어야 연결돼요
 *   name  : 상품명
 *   price : 가격 (숫자)
 *   image : 이미지 경로 (예: "images/products/istek-1.jpg"), 비워두면 회색 박스
 *
 * 상품 상세 페이지(product.html?id=...)에 쓰이는 항목 (모두 선택, 없으면 빼도 됨)
 *   images       : 추가 사진 목록 (예: ["images/products/istek-1-2.jpg"]), 대표 사진 아래 작은 사진으로 표시
 *   summary      : 상품명 아래 한 줄 소개
 *   specs        : 상품 정보 표 (예: [["모델명", "IS-100"], ["원산지", "대한민국"]]), 브랜드는 자동으로 들어감
 *   description  : 상세 설명 글 (빈 줄로 문단 나누기, 예: "첫 문단\n\n둘째 문단")
 *   detailImages : 상세 설명 아래에 차례로 넣을 긴 상세 이미지 목록
 *
 * 예) { id: 'istek-1', brand: 'istek', name: '제품명', price: 448000, image: 'images/products/istek-1.jpg',
 *       summary: '한 줄 소개', specs: [['모델명', 'IS-100']], description: '설명...' }
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
