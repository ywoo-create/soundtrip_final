# SoundTrip v5 수정 목록 (수업 범위 기준)

- 폰트: Pretendard -> Noto Sans KR
- 회색 글씨 제거 (진한 남색 계열로)
- 반복 데이터(메뉴/단계/푸터/도시/장르/곡)를 data.json + fetch로 렌더링
- 저장소 분리: sessionStorage(이번 방문 값) / localStorage(영구 기록)
- JS: closest, URLSearchParams, classList, try/catch, 삼항, 정규식, setInterval, forEach, splice, DOMContentLoaded 제거
  -> getElementById/querySelector, 요소별 addEventListener, for/if, setTimeout 사용
- CSS: grid, gap, transition, transform, gradient, shadow, var(), calc() 제거 -> flex + 고정 색상
- 페이지 이동 값은 URL 파라미터 대신 sessionStorage로 전달
- 아이콘: 전부 .svg 이미지 파일 (img 태그), 회전/반전 필요한 건 파일 자체를 미리 변환

## 슬라이드에서 확인 못 한 문법 (발표 때 참고)
window.location.href, toLowerCase, indexOf, Math.floor, JSON.parse 일부, XHR 상세, object-fit
