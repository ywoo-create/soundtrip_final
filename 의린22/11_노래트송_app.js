/* SoundTrip 공통 스크립트 (수업 범위의 문법만 사용)
   흐름: 출발(여행지) → 체크인(장르 = 게이트) → 탑승(플레이리스트) → 비행(재생) → 도착(MY MUSIC 스탬프)

   - fetch + JSON     : 여행지, 장르, 곡, 메뉴, 추천 데이터 (11_노래트송_data.json)
   - XMLHttpRequest   : 홈 공지 (#noticeText)
   - sessionStorage   : 이번 방문(탭)에서만 쓰는 값 → 선택한 도시/게이트/장르, 로그인 상태, 고른 추천 조건
   - localStorage     : 계속 남겨두는 값 → 회원 정보, 좋아요, 담기, 스탬프, 들은 곡, 최근 추천 조건
   - addEventListener : 모든 클릭/입력 이벤트
*/
const DATA_FILE = "11_노래트송_data.json";
const PAGE_GENRE = "11_노래트송_genre.html";
const PAGE_PLAYLIST = "11_노래트송_playlist.html";
const PAGE_MYMUSIC = "11_노래트송_mymusic.html";
const PAGE_ACCOUNT = "11_노래트송_account.html";

let appData = null;      // JSON에서 불러온 데이터
let heroIndex = 0;       // 지금 보이는 홈 슬라이드 번호
let heroTimer = null;
let toastTimer = null;
let selectedGate = null; // 체크인에서 고른 장르(게이트)
let picked = {mood: [], activity: [], time: []}; // 취향추천에서 고른 조건

/* ================= 데이터 불러오기 ================= */

// fetch로 JSON 불러오기
function loadAppData() {
  fetch(DATA_FILE)
    .then(function(response) {
      if (!response.ok) {
        throw new Error("JSON load error");
      }
      return response.json();
    })
    .then(function(data) {
      appData = data;
      renderPage();
    })
    .catch(function(error) {
      console.error("데이터를 불러오지 못했어요.", error);
      showToast("내용을 불러오지 못했어요. Live Server로 열었는지 확인해주세요.");
    });
}

// 공지는 XMLHttpRequest로 같은 JSON에서 읽기
function loadNotice() {
  const target = document.getElementById("noticeText");
  if (target == null) return;
  const xhr = new XMLHttpRequest();
  xhr.open("GET", DATA_FILE, true);
  xhr.onreadystatechange = function() {
    if (xhr.readyState == 4 && xhr.status == 200) {
      const data = JSON.parse(xhr.responseText);
      target.innerText = data.notice;
    }
  };
  xhr.send();
}

/* ================= 작은 도구들 ================= */

function showToast(message) {
  let box = document.getElementById("toast");
  if (box == null) {
    box = document.createElement("div");
    box.id = "toast";
    box.className = "toast";
    document.body.appendChild(box);
  }
  box.innerText = message;
  box.style.display = "block";
  clearTimeout(toastTimer);
  toastTimer = setTimeout(function() {
    box.style.display = "none";
  }, 2600);
}

// 글자 속 <, >, &, " 를 안전하게 바꾸기
function escapeHtml(text) {
  let value = text;
  if (value == null) value = "";
  let result = "";

  for (let i = 0; i < value.length; i++) {
    const character = value[i];
    if (character == "&") result += "&amp;";
    else if (character == "<") result += "&lt;";
    else if (character == ">") result += "&gt;";
    else if (character == '"') result += "&quot;";
    else result += character;
  }
  return result;
}

// 저장소(localStorage / sessionStorage)에서 목록 읽기
function getList(store, key) {
  const list = JSON.parse(store.getItem(key)) || [];
  return list;
}

// localStorage 목록에 id가 들어 있는지
function hasItem(key, id) {
  const list = getList(localStorage, key);
  for (let i = 0; i < list.length; i++) {
    if (list[i] == id) return true;
  }
  return false;
}

// 있으면 빼고 없으면 넣기. 새로 넣었으면 true
function toggleItem(key, id) {
  const list = getList(localStorage, key);
  const next = [];
  let found = false;
  for (let i = 0; i < list.length; i++) {
    if (list[i] == id) found = true;
    else next.push(list[i]);
  }
  if (found == false) next.push(id);
  localStorage.setItem(key, JSON.stringify(next));
  return found == false;
}

function findById(list, id) {
  for (let i = 0; i < list.length; i++) {
    if (list[i].id == id) return list[i];
  }
  return null;
}

function genresOf(cityId) {
  return appData.genres.filter(function(g) { return g.city == cityId; });
}

function tracksOf(genre) {
  return appData.tracks.filter(function(t) { return t.playlist == genre.city + "-" + genre.id; });
}

// 음원이 있는 곡만 바로 재생할 수 있어요
function isPlayable(track) {
  return track.audio != undefined;
}

// 좌석 번호: 1A, 1B, 2A, 2B ...
function seatOf(index) {
  const row = Math.floor(index / 2) + 1;
  if (index % 2 == 0) return row + "A";
  return row + "B";
}

function formatLikes(n) {
  if (n >= 1000) return (Math.floor(n / 100) / 10) + "천";
  return String(n);
}

function genreLikeCount(genre) {
  if (hasItem("soundtripLikedGenres", genre.id)) return genre.likes + 1;
  return genre.likes;
}

function todayText() {
  const d = new Date();
  let month = d.getMonth() + 1;
  let day = d.getDate();
  if (month < 10) month = "0" + month;
  if (day < 10) day = "0" + day;
  return d.getFullYear() + "." + month + "." + day;
}

// 로그인 중인 회원 정보 (없으면 null)
function getProfile() {
  if (localStorage.getItem("soundtripLoggedIn") != "true") return null;
  const saved = localStorage.getItem("soundtripProfile");
  if (saved == null) return null;
  return JSON.parse(saved);
}

function goTo(url) {
  window.location.href = url;
}

/* ================= 페이지 그리기 ================= */

function renderPage() {
  renderHeaderAndFooter();
  if (document.getElementById("hero") != null) renderHome();
  if (document.getElementById("destinationGrid") != null) renderDestinations("전체");
  if (document.getElementById("genreGrid") != null) renderGenrePage();
  if (document.getElementById("plSummary") != null) renderPlaylistPage();
  if (document.getElementById("chartTop") != null) renderChartPage();
  if (document.getElementById("moodOpts") != null) renderRecommendPage();
  if (document.getElementById("ppStats") != null) renderMyMusic();
  if (document.getElementById("loginForm") != null || document.getElementById("signupForm") != null) renderAccountPage();
  if (document.getElementById("stAudio") != null) renderPlayerPage();
  refreshButtons();
}

/* --- 푸터는 JSON에서 읽고, 공용 헤더는 HTML과 header.js에서 처리 --- */
function renderHeaderAndFooter() {
  const footer = document.getElementById("siteFooter");
  if (footer != null) {
    footer.innerHTML = '<p><strong>SOUNDTRIP</strong> · ' +
      appData.footer[0].replace("SOUNDTRIP · ", "") + "</p><p>" +
      appData.footer[1] + "</p><p>" + appData.footer[2] + "</p>";
  }
}

/* --- 홈 --- */
function renderHome() {
  heroIndex = 0;
  showHero(0);
  document.getElementById("heroPrev").addEventListener("click", function() {
    showHero(heroIndex - 1);
  });
  document.getElementById("heroNext").addEventListener("click", function() {
    showHero(heroIndex + 1);
  });

  document.getElementById("shortcutBox").innerHTML = appData.shortcuts.map(function(s) {
    return '<a href="' + s.href + '"><i><img src="' + s.icon + '" alt=""></i>' + s.label + "</a>";
  }).join("");

  renderPass();
  renderDestinationCards(document.getElementById("popularDestinationCards"), appData.destinations.slice(0, 4));
  renderChartPreview();
  renderStamps("stampBoxHome", 3);
}


function showHero(index) {
  const slides = appData.heroSlides;
  if (index < 0) index = slides.length - 1;
  if (index >= slides.length) index = 0;
  heroIndex = index;
  const s = slides[index];
  document.getElementById("heroImg").src = s.image;
  document.getElementById("heroTitle").innerHTML = escapeHtml(s.title).replace("\n", "<br>");
  document.getElementById("heroText").innerHTML = escapeHtml(s.text).replace("\n", "<br>");
  const link = document.getElementById("heroLink");
  link.href = s.link;
  link.innerText = s.linkText;
  document.getElementById("heroCount").innerText = (index + 1) + " / " + slides.length;
  let dots = "";
  for (let i = 0; i < slides.length; i++) {
    if (i == index) dots += '<i class="on"></i>';
    else dots += "<i></i>";
  }
  document.getElementById("heroDots").innerHTML = dots;
}

// 홈 탑승권: 도시 → 게이트(장르) 고르기
function renderPass() {
  const city = document.getElementById("passCity");
  const gate = document.getElementById("passGate");
  const flight = document.getElementById("passFlight");
  const hint = document.getElementById("passHint");
  const button = document.getElementById("passButton");

  let options = '<option value="">도시를 선택하세요</option>';
  for (let i = 0; i < appData.destinations.length; i++) {
    const d = appData.destinations[i];
    options += '<option value="' + d.id + '">' + d.cityName + " (" + d.code + ")</option>";
  }
  city.innerHTML = options;

  city.addEventListener("change", function() {
    const d = findById(appData.destinations, city.value);
    if (d == null) {
      city.className = "empty";
      gate.innerHTML = '<option value="">도시 선택 후</option>';
      gate.disabled = true;
      gate.className = "empty";
      flight.innerText = "—";
      flight.className = "empty";
      hint.innerText = "도시를 고르면 탑승권이 만들어져요";
      button.disabled = true;
      return;
    }
    city.className = "";
    let gateOptions = '<option value="">체크인에서 고를게요</option>';
    const genres = genresOf(d.id);
    for (let i = 0; i < genres.length; i++) {
      gateOptions += '<option value="' + genres[i].id + '">' + genres[i].name + "</option>";
    }
    gate.innerHTML = gateOptions;
    gate.disabled = false;
    gate.className = "empty";
    flight.innerText = d.flight;
    flight.className = "";
    hint.innerText = d.cityName + "행 " + d.flight + " · 게이트는 지금 골라도, 체크인에서 골라도 돼요";
    button.disabled = false;
  });

  gate.addEventListener("change", function() {
    if (gate.value == "") gate.className = "empty";
    else gate.className = "";
  });

  document.getElementById("passForm").addEventListener("submit", function(event) {
    event.preventDefault();
    if (city.value == "") {
      showToast("가고 싶은 도시를 먼저 선택해주세요.");
      return;
    }
    sessionStorage.setItem("soundtripCity", city.value);
    if (gate.value != "") sessionStorage.setItem("soundtripGate", gate.value);
    else sessionStorage.removeItem("soundtripGate");
    goTo(PAGE_GENRE);
  });
}

/* --- 출발 카드 (홈, 여행지) --- */
function renderDestinationCards(box, list) {
  box.innerHTML = list.map(function(d) {
    return '<a class="fc" href="' + d.link + '" data-city="' + d.id + '">' +
      '<div class="ph"><img class="bgimg" src="' + d.image + '" alt=""><div class="shade"></div><span class="code">' + d.code + "</span>" +
      '<div class="city">' + d.city + "<small>" + d.label + "</small></div></div>" +
      '<div class="bd"><div><small>FLIGHT</small><b>' + d.flight + "</b></div><span>탑승 ›</span></div></a>";
  }).join("");
  bindNav(box);
}

// 카드를 누르면 선택한 도시/장르를 sessionStorage에 저장하고 이동
function bindNav(root) {
  const links = root.querySelectorAll("[data-city]");
  for (let i = 0; i < links.length; i++) {
    bindNavOne(links[i]);
  }
}
function bindNavOne(link) {
  link.addEventListener("click", function() {
    sessionStorage.setItem("soundtripCity", link.getAttribute("data-city"));
    sessionStorage.removeItem("soundtripGate");
    const genre = link.getAttribute("data-genre");
    if (genre != null) sessionStorage.setItem("soundtripGenre", genre);
  });
}

function renderDestinations(area) {
  // 지역 칩은 destinations의 area 값으로 만들기
  const chipBox = document.getElementById("areaChips");
  if (chipBox.innerHTML == "") {
    const areas = ["전체"];
    for (let i = 0; i < appData.destinations.length; i++) {
      const a = appData.destinations[i].area;
      let exists = false;
      for (let j = 0; j < areas.length; j++) {
        if (areas[j] == a) exists = true;
      }
      if (exists == false) areas.push(a);
    }
    chipBox.innerHTML = areas.map(function(a) {
      return '<button class="chip" type="button" data-area="' + a + '">' + a + "</button>";
    }).join("");
    const chips = chipBox.querySelectorAll("[data-area]");
    for (let i = 0; i < chips.length; i++) {
      bindAreaChip(chips[i]);
    }
  }
  const chips = chipBox.querySelectorAll("[data-area]");
  for (let i = 0; i < chips.length; i++) {
    if (chips[i].getAttribute("data-area") == area) chips[i].className = "chip on";
    else chips[i].className = "chip";
  }
  const list = appData.destinations.filter(function(d) { return area == "전체" || d.area == area; });
  renderDestinationCards(document.getElementById("destinationGrid"), list);
}
function bindAreaChip(chip) {
  chip.addEventListener("click", function() {
    renderDestinations(chip.getAttribute("data-area"));
  });
}

/* --- 곡 목록 도구 --- */
function likeButtonHtml(id) {
  return '<button class="ib" type="button" data-like-song="' + id + '" aria-label="좋아요"><img src="11_favorite.svg" alt=""></button>';
}
function addButtonHtml(id) {
  return '<button class="pill" type="button" data-add-song="' + id + '"><img src="11_add.svg" alt=""><span>담기</span></button>';
}
function trackLinkHtml(t, inner) {
  if (isPlayable(t)) return '<a href="' + t.playLink + '">' + inner + "</a>";
  return '<a href="#" data-unplayable="true">' + inner + "</a>";
}

function renderChartPreview() {
  const box = document.getElementById("chartPreview");
  box.innerHTML = appData.tracks.slice(0, 5).map(function(t) {
    return '<div class="r"><span class="n">' + t.rank + '</span><img class="cv" src="' + t.image + '" alt="">' +
      "<div>" + trackLinkHtml(t, "<b>" + escapeHtml(t.title) + "</b>") + "<small>" + escapeHtml(t.artist) + " · " + t.genre + "</small></div>" +
      likeButtonHtml(t.id) +
      '<button class="ib" type="button" data-add-song="' + t.id + '" data-icon="true" aria-label="담기"><img src="11_add.svg" alt=""></button></div>';
  }).join("");
  bindActions(box);
}

/* --- 스탬프 --- */
function renderStamps(boxId, slots) {
  const box = document.getElementById(boxId);
  if (box == null) return;
  const stamps = getList(localStorage, "soundtripStamps");
  let html = "";
  let count = slots;
  if (stamps.length > slots) count = stamps.length;
  for (let i = 0; i < count; i++) {
    if (i < stamps.length) {
      const d = findById(appData.destinations, stamps[i].cityId);
      html += '<div class="sp on"><div><b>' + d.code + "</b><span>" + stamps[i].date + "</span></div></div>";
    } else {
      html += '<div class="sp"><div>STAMP</div></div>';
    }
  }
  box.innerHTML = html;
  const message = document.getElementById("stampMessage");
  if (message != null && stamps.length > 0) {
    message.innerHTML = stamps.length + "개 도시에 도착했어요.<br>다음 도시로 떠나볼까요?";
  }
}

// 곡을 끝까지 들으면 player.js가 호출: 들은 곡 기록 + 도시 스탬프
function recordArrival(trackId) {
  if (appData == null) return;
  const track = findById(appData.tracks, trackId);
  if (track == null) return;

  const played = getList(localStorage, "soundtripPlayed");
  let alreadyPlayed = false;
  for (let i = 0; i < played.length; i++) {
    if (played[i] == trackId) alreadyPlayed = true;
  }
  if (alreadyPlayed == false) {
    played.push(trackId);
    localStorage.setItem("soundtripPlayed", JSON.stringify(played));
  }

  const stamps = getList(localStorage, "soundtripStamps");
  let isNewCity = true;
  for (let i = 0; i < stamps.length; i++) {
    if (stamps[i].cityId == track.cityId) isNewCity = false;
  }
  if (isNewCity) {
    stamps.push({cityId: track.cityId, date: todayText()});
    localStorage.setItem("soundtripStamps", JSON.stringify(stamps));
  }

  const city = findById(appData.destinations, track.cityId);
  const box = document.getElementById("arrivalBox");
  if (box != null) {
    box.style.display = "flex";
    box.getElementsByTagName("h3")[0].innerText = city.cityName + "에 도착했어요";
    if (isNewCity) box.getElementsByTagName("p")[0].innerText = "여권에 도착 스탬프가 찍혔어요.";
    else box.getElementsByTagName("p")[0].innerText = "이미 스탬프가 있는 도시예요. 다른 도시도 다녀와 보세요.";
  }
  if (isNewCity) showToast("도착! 여권에 스탬프가 찍혔어요.");
  else showToast("도착했어요.");
}

/* --- 체크인: 장르 = 게이트 --- */
function renderGenrePage() {
  let cityId = sessionStorage.getItem("soundtripCity");
  if (cityId == null) cityId = "tokyo";
  const d = findById(appData.destinations, cityId);
  const profile = getProfile();

  document.getElementById("crumbCity").innerText = d.cityName;
  document.getElementById("genreCityName").innerText = d.cityName;
  document.getElementById("gateTitleCity").innerText = d.cityName;
  document.getElementById("tkCode").innerText = d.code;
  document.getElementById("tkCity").innerText = d.city;
  document.getElementById("tkFlight").innerText = d.flight;
  if (profile != null) document.getElementById("tkName").innerText = profile.nickname;

  const grid = document.getElementById("genreGrid");
  const genres = genresOf(d.id);
  grid.innerHTML = genres.map(function(g, i) {
    const count = tracksOf(g).length;
    let countText = "";
    if (count > 0) countText = count + "곡";
    const keywords = g.keywords.map(function(k) { return "<span>" + k + "</span>"; }).join("");
    return '<div class="gc" data-gate="' + g.id + '">' +
      '<img src="' + g.image + '" alt="' + g.name + '">' +
      '<div class="tx"><div class="top2"><span class="code">GATE A' + (i + 1) + "</span>" +
      '<button class="ib" type="button" data-like-genre="' + g.id + '" aria-label="장르 좋아요"><img src="11_favorite.svg" alt=""></button></div>' +
      "<h3>" + g.name + "</h3><p>" + g.desc + '</p><div class="tags">' + keywords + "</div>" +
      '<div class="bt"><span class="lk"><img src="11_favorite.svg" alt=""><span data-like-count="' + g.id + '">' + formatLikes(genreLikeCount(g)) + "</span></span>" +
      "<span>" + countText + "</span></div></div></div>";
  }).join("");

  const cards = grid.querySelectorAll("[data-gate]");
  for (let i = 0; i < cards.length; i++) {
    bindGateCard(cards[i]);
  }
  bindActions(grid);

  selectedGate = null;
  const wanted = sessionStorage.getItem("soundtripGate");
  if (wanted != null && findById(genres, wanted) != null) selectGate(wanted);

  document.getElementById("tkGo").addEventListener("click", function() {
    if (selectedGate == null) {
      showToast("게이트를 먼저 선택해주세요.");
      return;
    }
    sessionStorage.setItem("soundtripGenre", selectedGate.id);
    goTo(PAGE_PLAYLIST);
  });
}
function bindGateCard(card) {
  card.addEventListener("click", function() {
    selectGate(card.getAttribute("data-gate"));
  });
}
function selectGate(genreId) {
  const genre = findById(appData.genres, genreId);
  selectedGate = genre;
  sessionStorage.setItem("soundtripGate", genreId);
  const cards = document.querySelectorAll("[data-gate]");
  let index = 0;
  for (let i = 0; i < cards.length; i++) {
    if (cards[i].getAttribute("data-gate") == genreId) {
      cards[i].className = "gc on";
      index = i;
    } else {
      cards[i].className = "gc";
    }
  }
  const count = tracksOf(genre).length;
  document.getElementById("tkGate").innerText = "A" + (index + 1);
  if (count > 0) document.getElementById("tkSeat").innerText = count + "석";
  else document.getElementById("tkSeat").innerText = "—";
  const big = document.getElementById("tkGateBig");
  big.innerText = genre.name;
  big.className = "big";
  document.getElementById("tkGo").disabled = false;
}

/* --- 탑승: 플레이리스트 --- */
function trackTableHtml(list, useRank) {
  let first = "SEAT";
  if (useRank) first = "RANK";
  let html = '<table class="tbl"><thead><tr><th>' + first + '</th><th>TITLE</th><th class="alb">ALBUM</th><th class="tm">TIME</th><th></th></tr></thead><tbody>';
  for (let i = 0; i < list.length; i++) {
    const t = list[i];
    let label = seatOf(i);
    if (useRank) label = t.rank;
    html += '<tr><td class="seat">' + label + "</td>" +
      '<td><div class="t"><img src="' + t.image + '" alt=""><div>' + trackLinkHtml(t, "<b>" + escapeHtml(t.title) + "</b>") + "<small>" + escapeHtml(t.artist) + "</small></div></div></td>" +
      '<td class="alb">' + escapeHtml(t.album) + '</td><td class="tm">' + t.duration + "</td>" +
      '<td class="r"><div class="acts">' + likeButtonHtml(t.id) + addButtonHtml(t.id) + "</div></td></tr>";
  }
  return html + "</tbody></table>";
}

function renderPlaylistPage() {
  let genreId = sessionStorage.getItem("soundtripGenre");
  if (genreId == null) genreId = "j-indie";
  const genre = findById(appData.genres, genreId);
  const city = findById(appData.destinations, genre.city);
  const list = tracksOf(genre);

  document.title = "SoundTrip | " + genre.name + " 탑승 명단";
  document.getElementById("plTitle").innerText = genre.name;
  document.getElementById("crumbGenre").innerText = genre.name;
  const crumb = document.getElementById("crumbCityLink");
  crumb.innerText = city.cityName;
  crumb.setAttribute("data-city", city.id);
  bindNavOne(crumb);

  const keywords = genre.keywords.map(function(k) { return "<span>" + k + "</span>"; }).join("");
  const summary = document.getElementById("plSummary");
  summary.innerHTML = '<img class="cv" src="' + genre.image + '" alt="' + genre.name + '">' +
    '<div><h2>' + genre.name + '</h2><p>' + genre.desc + '</p>' +
    '<div class="cs">' + keywords + "<span>" + list.length + "곡</span></div>" +
    '<div class="acts"><button class="btn" type="button" id="playAllButton">전체 재생</button>' +
    '<button class="btn o" type="button" data-add-playlist="' + genre.id + '"><img src="11_add.svg" alt=""><span>전체 담기</span></button>' +
    '<button class="btn o like" type="button" data-like-genre="' + genre.id + '"><img src="11_favorite.svg" alt=""><span>장르 좋아요 <b data-like-count="' + genre.id + '">' + formatLikes(genreLikeCount(genre)) + "</b></span></button></div></div>";
  bindActions(summary);

  const box = document.getElementById("plTableBox");
  if (list.length == 0) {
    box.innerHTML = '<div class="empty-state" style="margin-top:30px"><p>아직 이 게이트의 탑승 명단에 오른 곡이 없어요.</p><a class="btn s" href="' + PAGE_GENRE + '">다른 게이트 고르기</a></div>';
  } else {
    box.innerHTML = trackTableHtml(list, false);
  }
  bindActions(box);

  document.getElementById("playAllButton").addEventListener("click", function() {
    for (let i = 0; i < list.length; i++) {
      if (isPlayable(list[i])) {
        goTo(list[i].playLink);
        return;
      }
    }
    showToast("이 게이트에는 재생할 수 있는 곡이 아직 없어요.");
  });
}

/* --- 비행: 재생 페이지 (두 페이지 모두 JSON의 곡 정보로 그리기) --- */
function renderPlayerPage() {
  const id = document.body.getAttribute("data-track-id");
  const track = findById(appData.tracks, id);
  if (track == null) return;

  let genre = null;
  for (let i = 0; i < appData.genres.length; i++) {
    if (appData.genres[i].name == track.genre && appData.genres[i].city == track.cityId) {
      genre = appData.genres[i];
      break;
    }
  }
  if (genre == null) return;
  const list = tracksOf(genre);

  let displayTitle = track.title;
  if (id == "bansanka") displayTitle += " (Bansanka)";

  document.title = "SoundTrip | " + displayTitle;
  document.getElementById("trackTitle").innerText = displayTitle;
  document.getElementById("trackArtist").innerText = track.artist;
  const description = document.getElementById("trackDescription");
  if (description != null) {
    if (id == "lemon") {
      description.innerText = "도쿄의 밤과 늦은 산책을 떠올리게 하는 SoundTrip 대표 추천곡입니다.";
    } else {
      description.innerText = "차분한 보컬과 섬세한 멜로디가 어우러진 SoundTrip 추천곡입니다.";
    }
  }
  document.getElementById("trackCover").src = track.image;
  document.getElementById("dockCover").src = track.image;
  document.getElementById("dockTitle").innerText = displayTitle;
  document.getElementById("dockArtist").innerText = track.artist + " · " + genre.name;
  document.getElementById("stAudio").src = track.audio;

  // 곡별 소개글은 1123의 곡 정보 카드에 맞춰 표시
  if (id == "lemon") {
    document.getElementById("trackStoryTitle").innerText = "도쿄의 밤을 담은 J-Indie";
    document.getElementById("trackStoryText").innerText =
      "도쿄의 네온과 늦은 밤의 산책을 떠올리게 하는 감성적인 분위기의 곡입니다. 일본 인디 음악 특유의 섬세한 감성을 느껴보세요.";
  } else {
    document.getElementById("trackStoryTitle").innerText = "잔잔한 밤의 감성을 담은 J-Indie";
    document.getElementById("trackStoryText").innerText =
      "차분한 보컬과 섬세한 멜로디가 어우러져 늦은 밤 조용히 음악을 감상하는 순간에 잘 어울리는 곡입니다.";
  }

  // 같은 플레이리스트에서 이전 곡과 다음 곡을 찾음
  let index = 0;
  for (let i = 0; i < list.length; i++) {
    if (list[i].id == id) index = i;
  }

  let prev = null;
  let next = null;
  for (let i = index - 1; i >= 0; i--) {
    if (isPlayable(list[i])) {
      prev = list[i];
      break;
    }
  }
  for (let i = index + 1; i < list.length; i++) {
    if (isPlayable(list[i])) {
      next = list[i];
      break;
    }
  }

  const prevButton = document.getElementById("stPreviousTrackButton");
  const nextButton = document.getElementById("stNextTrackButton");
  if (prev != null) {
    prevButton.setAttribute("data-page", prev.playLink);
    prevButton.disabled = false;
  } else {
    prevButton.removeAttribute("data-page");
    prevButton.disabled = true;
  }
  if (next != null) {
    nextButton.setAttribute("data-page", next.playLink);
    nextButton.disabled = false;
  } else {
    nextButton.removeAttribute("data-page");
    nextButton.disabled = true;
  }

  // 1123 화면처럼 다음 곡 커버와 제목을 표시
  let cardTrack = next;
  if (cardTrack == null && list.length > 1) cardTrack = list[0];
  const card = document.getElementById("nextCard");
  if (cardTrack != null) {
    card.innerHTML =
      '<span>다음곡</span>' +
      '<div class="st-next-track"><img src="' + cardTrack.image + '" alt="' + escapeHtml(cardTrack.title) + ' 앨범 이미지">' +
      '<div><h3>' + escapeHtml(cardTrack.id == "bansanka" ? cardTrack.title + " (Bansanka)" : cardTrack.title) + '</h3><p>' + escapeHtml(cardTrack.artist) + '</p></div></div>' +
      '<a href="' + cardTrack.playLink + '" class="st-next-track-button"><strong>다음 곡 듣기</strong><span aria-hidden="true">→</span></a>';
  } else {
    card.innerHTML =
      '<span>다음곡</span><div class="st-next-track"><div><h3>마지막 곡입니다.</h3><p>플레이리스트에서 다른 곡을 선택해보세요.</p></div></div>' +
      '<a href="' + PAGE_PLAYLIST + '" class="st-next-track-button"><strong>플레이리스트 보기</strong><span aria-hidden="true">→</span></a>';
  }

  // MY MUSIC 담기 버튼을 현재 곡과 연결
  const addButton = document.getElementById("addCurrentTrackButton");
  addButton.setAttribute("data-add-song", id);
  bindActions(document.getElementById("stPlayerActions"));

  const footerLikeButton = document.getElementById("likeTrackButton");
  const footerAddButton = document.getElementById("addTrackButton");
  if (footerLikeButton != null) footerLikeButton.setAttribute("data-like-song", id);
  if (footerAddButton != null) footerAddButton.setAttribute("data-add-song", id);
  bindActions(document.getElementById("stCustomPlayer"));
}

/* --- 차트 --- */
function renderChartPage() {
  const tabs = document.getElementById("chartTabs");
  const genres = ["전체"];
  for (let i = 0; i < appData.tracks.length; i++) {
    const g = appData.tracks[i].genre;
    let exists = false;
    for (let j = 0; j < genres.length; j++) {
      if (genres[j] == g) exists = true;
    }
    if (exists == false) genres.push(g);
  }
  tabs.innerHTML = genres.map(function(g) {
    return '<button class="chip" type="button" data-chart-genre="' + g + '">' + g + "</button>";
  }).join("");
  const chips = tabs.querySelectorAll("[data-chart-genre]");
  for (let i = 0; i < chips.length; i++) {
    bindChartChip(chips[i]);
  }
  renderChart("전체");
}
function bindChartChip(chip) {
  chip.addEventListener("click", function() {
    renderChart(chip.getAttribute("data-chart-genre"));
  });
}
function renderChart(genre) {
  const chips = document.querySelectorAll("[data-chart-genre]");
  for (let i = 0; i < chips.length; i++) {
    if (chips[i].getAttribute("data-chart-genre") == genre) chips[i].className = "chip on";
    else chips[i].className = "chip";
  }
  const list = appData.tracks.filter(function(t) { return genre == "전체" || t.genre == genre; });
  const top = document.getElementById("chartTop");
  const table = document.getElementById("chartTableBox");
  const top3 = list.slice(0, 3);
  top.innerHTML = top3.map(function(t) {
    let href = "#";
    let extra = ' data-unplayable="true"';
    if (isPlayable(t)) {
      href = t.playLink;
      extra = "";
    }
    return '<div class="tc"><img class="bgimg" src="' + t.image + '" alt=""><div class="shade"></div>' +
      '<a class="stretch" href="' + href + '"' + extra + ' aria-label="' + escapeHtml(t.title) + ' 듣기"></a>' +
      '<span class="no">' + t.rank + "</span>" + likeButtonHtml(t.id) +
      '<div class="tx"><b>' + escapeHtml(t.title) + "</b><small>" + escapeHtml(t.artist) + " · " + t.genre + "</small></div></div>";
  }).join("");
  if (list.length > 3) table.innerHTML = trackTableHtml(list.slice(3), true);
  else table.innerHTML = "";
  bindActions(top);
  bindActions(table);
  refreshButtons();
}

/* --- 취향추천: 고른 조건과 태그가 맞는 만큼 점수를 줘서 고르기 --- */
function renderRecommendPage() {
  const groups = [["moodOpts", "mood", "moodOptions"], ["activityOpts", "activity", "activityOptions"], ["timeOpts", "time", "timeOptions"]];
  for (let g = 0; g < groups.length; g++) {
    const box = document.getElementById(groups[g][0]);
    box.innerHTML = appData[groups[g][2]].map(function(o) {
      return '<button class="opt" type="button" data-group="' + groups[g][1] + '" data-value="' + o + '">' + o + "</button>";
    }).join("");
    const opts = box.querySelectorAll(".opt");
    for (let i = 0; i < opts.length; i++) {
      bindOption(opts[i]);
    }
  }
  document.getElementById("recommendButton").addEventListener("click", runRecommend);

  // 이번 방문(sessionStorage)에 고른 조건이 있으면 다시 채워두기
  const saved = JSON.parse(sessionStorage.getItem("soundtripPicked"));
  if (saved != null) applyPicked(saved);
  renderRecentConds();
  showRecommendIntro();
}
function bindOption(opt) {
  opt.addEventListener("click", function() {
    const group = opt.getAttribute("data-group");
    const value = opt.getAttribute("data-value");
    const next = [];
    let found = false;
    for (let i = 0; i < picked[group].length; i++) {
      if (picked[group][i] == value) found = true;
      else next.push(picked[group][i]);
    }
    if (found == false) next.push(value);
    picked[group] = next;
    if (found) opt.className = "opt";
    else opt.className = "opt on";
    sessionStorage.setItem("soundtripPicked", JSON.stringify(picked));
  });
}
function applyPicked(cond) {
  picked = {mood: cond.mood.slice(), activity: cond.activity.slice(), time: cond.time.slice()};
  const opts = document.querySelectorAll(".opt");
  for (let i = 0; i < opts.length; i++) {
    const group = opts[i].getAttribute("data-group");
    const value = opts[i].getAttribute("data-value");
    let on = false;
    for (let j = 0; j < picked[group].length; j++) {
      if (picked[group][j] == value) on = true;
    }
    if (on) opts[i].className = "opt on";
    else opts[i].className = "opt";
  }
  sessionStorage.setItem("soundtripPicked", JSON.stringify(picked));
}
function showRecommendIntro() {
  const presets = appData.presets.map(function(p, i) {
    return '<button class="chip" type="button" data-preset="' + i + '">' + p.label + "</button>";
  }).join("");
  const box = document.getElementById("recommendResult");
  box.innerHTML = '<div class="empty-state"><p>기분과 여행 상황을 고르고 <b>추천 받기</b>를 눌러보세요.</p><p style="margin-bottom:0">고르기 어렵다면 이런 조합은 어때요?</p><div class="suggest">' + presets + "</div></div>";
  const buttons = box.querySelectorAll("[data-preset]");
  for (let i = 0; i < buttons.length; i++) {
    bindPreset(buttons[i]);
  }
}
function bindPreset(button) {
  button.addEventListener("click", function() {
    applyPicked(appData.presets[button.getAttribute("data-preset")]);
    runRecommend();
  });
}
function matchList(a, b) {
  const result = [];
  for (let i = 0; i < a.length; i++) {
    for (let j = 0; j < b.length; j++) {
      if (a[i] == b[j]) result.push(a[i]);
    }
  }
  return result;
}
// 맞는 조건 개수로 점수 계산 (기분, 상황은 2점, 시간대는 1점)
function scoreItem(item) {
  const m = matchList(picked.mood, item.mood);
  const a = matchList(picked.activity, item.activity);
  const t = matchList(picked.time, item.time);
  return {score: m.length * 2 + a.length * 2 + t.length, matched: m.concat(a, t)};
}
// 점수가 높은 순으로 정렬 (같으면 원래 순서 유지)
function sortByScore(list) {
  for (let i = 0; i < list.length; i++) {
    for (let j = i + 1; j < list.length; j++) {
      if (list[j].score > list[i].score) {
        const temp = list[i];
        list[i] = list[j];
        list[j] = temp;
      }
    }
  }
  return list;
}
function runRecommend() {
  const total = picked.mood.length + picked.activity.length + picked.time.length;
  if (total == 0) {
    showToast("기분이나 여행 상황을 하나 이상 골라주세요.");
    return;
  }
  saveRecentCond();
  const label = picked.mood.concat(picked.activity, picked.time).join(" · ");

  let ranked = [];
  for (let i = 0; i < appData.themes.length; i++) {
    const r = scoreItem(appData.themes[i]);
    if (r.score > 0) ranked.push({theme: appData.themes[i], score: r.score, matched: r.matched});
  }
  ranked = sortByScore(ranked);

  const box = document.getElementById("recommendResult");
  if (ranked.length == 0) {
    box.innerHTML = '<div class="empty-state"><p>고른 조건과 딱 맞는 여행을 찾지 못했어요.</p><p style="margin-bottom:0">조건을 한두 개만 바꿔 다시 골라보세요.</p></div>';
    return;
  }

  const best = ranked[0];
  const city = findById(appData.destinations, best.theme.cityId);
  let songs = [];
  for (let i = 0; i < appData.tracks.length; i++) {
    const t = appData.tracks[i];
    if (t.cityId == best.theme.cityId) {
      const r = scoreItem(t);
      if (r.score > 0) songs.push({track: t, score: r.score, matched: r.matched});
    }
  }
  songs = sortByScore(songs).slice(0, 3);

  const chips = best.matched.map(function(m) { return "<span>" + m + "</span>"; }).join("");
  const why = "<b>" + best.matched.join(" · ") + "</b> 조건이 이 여행과 맞아요. " + best.theme.reason;
  let songHtml = "";
  if (songs.length > 0) {
    songHtml = '<div class="mini">' + songs.map(function(s) {
      let href = PAGE_PLAYLIST;
      if (isPlayable(s.track)) href = s.track.playLink;
      return '<a href="' + href + '"><img class="cv" src="' + s.track.image + '" alt=""><div><b>' + escapeHtml(s.track.title) + "</b><small>" + escapeHtml(s.track.artist) + '</small></div><span class="mt2">' + s.matched.join(" · ") + "</span></a>";
    }).join("") + "</div>";
  }

  let html = '<div class="sumline"><h2><em>' + escapeHtml(label) + '</em> 조건으로 골랐어요</h2><button type="button" id="resetRecommend">조건 초기화</button></div>' +
    '<div class="feat"><div class="im"><img class="bgimg" src="' + best.theme.image + '" alt=""><span>BEST MATCH</span></div>' +
    '<div class="tx"><h3>' + best.theme.title + '</h3><p>' + best.theme.desc + '</p>' +
    '<div class="why">' + why + '</div><div class="tags">' + chips + "</div>" + songHtml +
    '<div class="acts"><a class="btn s" href="' + city.link + '" data-city="' + city.id + '">' + city.cityName + "행 탑승하기</a></div></div></div>";
  const others = ranked.slice(1, 5);
  if (others.length > 0) {
    html += '<div class="res2">' + others.map(function(x) {
      const c = findById(appData.destinations, x.theme.cityId);
      return '<a class="rc" href="' + c.link + '" data-city="' + c.id + '"><div class="im"><img class="bgimg" src="' + x.theme.image + '" alt=""><span>' + c.code + '</span></div><div class="tx"><b>' + x.theme.title + "</b><p>" + x.theme.desc + "</p><em>" + x.matched.join(" · ") + " 일치 ›</em></div></a>";
    }).join("") + "</div>";
  }
  box.innerHTML = html;
  bindNav(box);
  document.getElementById("resetRecommend").addEventListener("click", function() {
    applyPicked({mood: [], activity: [], time: []});
    showRecommendIntro();
  });
}
// 최근에 고른 조건 3개는 localStorage에 저장
function saveRecentCond() {
  const now = {mood: picked.mood, activity: picked.activity, time: picked.time};
  const text = JSON.stringify(now);
  const list = getList(localStorage, "soundtripRecentConds").filter(function(c) { return JSON.stringify(c) != text; });
  list.unshift(now);
  localStorage.setItem("soundtripRecentConds", JSON.stringify(list.slice(0, 3)));
  renderRecentConds();
}
function renderRecentConds() {
  const list = getList(localStorage, "soundtripRecentConds");
  const box = document.getElementById("recentConds");
  if (list.length == 0) box.style.display = "none";
  else box.style.display = "block";
  const listBox = document.getElementById("recentList");
  listBox.innerHTML = list.map(function(c, i) {
    return '<button type="button" data-recent="' + i + '">' + c.mood.concat(c.activity, c.time).join(" · ") + "</button>";
  }).join("");
  const buttons = listBox.querySelectorAll("[data-recent]");
  for (let i = 0; i < buttons.length; i++) {
    bindRecent(buttons[i]);
  }
}
function bindRecent(button) {
  button.addEventListener("click", function() {
    applyPicked(getList(localStorage, "soundtripRecentConds")[button.getAttribute("data-recent")]);
    runRecommend();
  });
}

/* --- MY MUSIC --- */
function songRowHtml(t, button) {
  return '<div class="lrow"><img src="' + t.image + '" alt=""><div>' + trackLinkHtml(t, "<b>" + escapeHtml(t.title) + "</b>") + "<small>" + escapeHtml(t.artist) + '</small></div><div class="acts">' + button + "</div></div>";
}
function emptyHtml(text, href, label) {
  return '<div class="empty-state"><p>' + text + '</p><a class="btn s o" href="' + href + '">' + label + "</a></div>";
}
function renderMyMusic() {
  const profile = getProfile();
  const stamps = getList(localStorage, "soundtripStamps");
  const played = getList(localStorage, "soundtripPlayed");
  const likedGenres = getList(localStorage, "soundtripLikedGenres");
  const likedSongs = getList(localStorage, "soundtripLikedSongs");
  const addedPlaylists = getList(localStorage, "soundtripAddedPlaylists");
  const addedSongs = getList(localStorage, "soundtripAddedSongs");

  if (profile != null) document.getElementById("ppName").innerText = profile.nickname;
  else document.getElementById("ppName").innerText = "게스트";
  if (stamps.length > 0) document.getElementById("ppMessage").innerText = stamps.length + "개 도시에 다녀왔어요.";
  const stats = [["도착한 도시", stamps.length], ["비행한 곡", played.length], ["좋아요", likedGenres.length + likedSongs.length], ["담은 곡", addedPlaylists.length + addedSongs.length]];
  document.getElementById("ppStats").innerHTML = stats.map(function(s) { return "<div><small>" + s[0] + "</small><b>" + s[1] + "</b></div>"; }).join("");
  renderStamps("stampBox", 4);

  document.getElementById("likeTotal").innerText = likedGenres.length + likedSongs.length;
  document.getElementById("addTotal").innerText = addedPlaylists.length + addedSongs.length;
  document.getElementById("likeGenreCount").innerText = likedGenres.length + "개";
  document.getElementById("likeSongCount").innerText = likedSongs.length + "곡";
  document.getElementById("addPlaylistCount").innerText = addedPlaylists.length + "개";
  document.getElementById("addSongCount").innerText = addedSongs.length + "곡";

  const genreBox = document.getElementById("likedGenres");
  if (likedGenres.length == 0) {
    genreBox.innerHTML = emptyHtml("좋아요한 장르가 아직 없어요.", PAGE_GENRE, "여행지 둘러보기");
  } else {
    genreBox.innerHTML = likedGenres.map(function(id) {
      const g = findById(appData.genres, id);
      const city = findById(appData.destinations, g.city);
      return '<div class="gm"><img class="g" src="' + g.image + '" alt=""><div><b>' + g.name + "</b><small>" + city.cityName + '</small></div><button class="ib liked" type="button" data-like-genre="' + g.id + '" aria-label="좋아요 취소"><img src="11_favorite-fill.svg" alt=""></button></div>';
    }).join("");
  }

  const likedBox = document.getElementById("likedSongs");
  if (likedSongs.length == 0) {
    likedBox.innerHTML = emptyHtml("좋아요한 곡이 아직 없어요.", PAGE_PLAYLIST, "플레이리스트 보기");
  } else {
    likedBox.innerHTML = likedSongs.map(function(id) {
      const t = findById(appData.tracks, id);
      return songRowHtml(t, '<button class="ib liked" type="button" data-like-song="' + t.id + '" aria-label="좋아요 취소"><img src="11_favorite-fill.svg" alt=""></button>');
    }).join("");
  }

  const plBox = document.getElementById("addedPlaylists");
  if (addedPlaylists.length == 0) {
    plBox.innerHTML = emptyHtml("담은 플레이리스트가 아직 없어요.", PAGE_PLAYLIST, "플레이리스트 보기");
  } else {
    plBox.innerHTML = addedPlaylists.map(function(id) {
      const g = findById(appData.genres, id);
      return '<div class="plc"><img src="' + g.image + '" alt=""><div><b>' + g.name + "</b><small>" + tracksOf(g).length + '곡 · 플레이리스트</small></div><div class="acts"><a class="btn s o" href="' + PAGE_PLAYLIST + '" data-city="' + g.city + '" data-genre="' + g.id + '">보기</a><button class="pill on" type="button" data-add-playlist="' + g.id + '" data-fixed="true"><span>빼기</span></button></div></div>';
    }).join("");
  }

  const songBox = document.getElementById("mySongList");
  if (addedSongs.length == 0) {
    songBox.innerHTML = emptyHtml("담은 곡이 아직 없어요.", PAGE_PLAYLIST, "곡 담으러 가기");
  } else {
    songBox.innerHTML = addedSongs.map(function(id) {
      const t = findById(appData.tracks, id);
      return songRowHtml(t, '<button class="pill on" type="button" data-add-song="' + t.id + '" data-fixed="true"><span>빼기</span></button>');
    }).join("");
  }
  bindActions(document.querySelector(".two3"));
  bindNav(plBox);
}

/* ================= 좋아요 · 담기 버튼 ================= */

// root 안의 버튼들에 클릭 이벤트를 하나씩 연결 (화면을 새로 그릴 때마다 호출)
function bindActions(root) {
  let list = root.querySelectorAll("[data-like-song]");
  for (let i = 0; i < list.length; i++) bindLikeSong(list[i]);
  list = root.querySelectorAll("[data-like-genre]");
  for (let i = 0; i < list.length; i++) bindLikeGenre(list[i]);
  list = root.querySelectorAll("[data-add-song]");
  for (let i = 0; i < list.length; i++) bindAddSong(list[i]);
  list = root.querySelectorAll("[data-add-playlist]");
  for (let i = 0; i < list.length; i++) bindAddPlaylist(list[i]);
  list = root.querySelectorAll("[data-unplayable]");
  for (let i = 0; i < list.length; i++) bindUnplayable(list[i]);
}

function bindLikeSong(button) {
  button.addEventListener("click", function(event) {
    event.preventDefault();
    const on = toggleItem("soundtripLikedSongs", button.getAttribute("data-like-song"));
    afterToggle();
    if (on) showToast("좋아요한 곡에 저장했어요.");
    else showToast("좋아요를 취소했어요.");
  });
}
function bindLikeGenre(button) {
  button.addEventListener("click", function(event) {
    event.preventDefault();
    event.stopPropagation(); // 장르 카드 선택 이벤트로 번지지 않게
    const on = toggleItem("soundtripLikedGenres", button.getAttribute("data-like-genre"));
    afterToggle();
    if (on) showToast("좋아요한 장르에 저장했어요.");
    else showToast("좋아요를 취소했어요.");
  });
}
function bindAddSong(button) {
  button.addEventListener("click", function(event) {
    event.preventDefault();
    const on = toggleItem("soundtripAddedSongs", button.getAttribute("data-add-song"));
    afterToggle();
    if (on) showToast("담은 곡에 추가했어요.");
    else showToast("담은 곡에서 뺐어요.");
  });
}
function bindAddPlaylist(button) {
  button.addEventListener("click", function(event) {
    event.preventDefault();
    const on = toggleItem("soundtripAddedPlaylists", button.getAttribute("data-add-playlist"));
    afterToggle();
    if (on) showToast("플레이리스트를 담았어요.");
    else showToast("담은 플레이리스트에서 뺐어요.");
  });
}
function bindUnplayable(link) {
  link.addEventListener("click", function(event) {
    event.preventDefault();
    showToast("이 곡은 지금 바로 재생할 수 없어요. 다른 곡을 골라보세요.");
  });
}

function afterToggle() {
  if (document.getElementById("ppStats") != null) renderMyMusic();
  refreshButtons();
}

// 저장된 좋아요/담기 상태에 맞게 모든 버튼 모양 바꾸기
function refreshButtons() {
  let nodes = document.querySelectorAll("[data-like-song]");
  for (let i = 0; i < nodes.length; i++) {
    setLikeLook(nodes[i], hasItem("soundtripLikedSongs", nodes[i].getAttribute("data-like-song")));
  }
  nodes = document.querySelectorAll("[data-like-genre]");
  for (let i = 0; i < nodes.length; i++) {
    setLikeLook(nodes[i], hasItem("soundtripLikedGenres", nodes[i].getAttribute("data-like-genre")));
  }
  nodes = document.querySelectorAll("[data-like-count]");
  for (let i = 0; i < nodes.length; i++) {
    const g = findById(appData.genres, nodes[i].getAttribute("data-like-count"));
    nodes[i].innerText = formatLikes(genreLikeCount(g));
  }
  nodes = document.querySelectorAll("[data-add-song]");
  for (let i = 0; i < nodes.length; i++) {
    setAddLook(nodes[i], hasItem("soundtripAddedSongs", nodes[i].getAttribute("data-add-song")), "담기", "담음");
  }
  nodes = document.querySelectorAll("[data-add-playlist]");
  for (let i = 0; i < nodes.length; i++) {
    setAddLook(nodes[i], hasItem("soundtripAddedPlaylists", nodes[i].getAttribute("data-add-playlist")), "전체 담기", "담음");
  }
}
function setLikeLook(button, on) {
  const img = button.getElementsByTagName("img")[0];
  let cls = button.className.replace(" liked", "");
  if (on) {
    button.className = cls + " liked";
    img.src = "11_favorite-fill.svg";
  } else {
    button.className = cls;
    img.src = "11_favorite.svg";
  }
}
function setAddLook(button, on, offText, onText) {
  let cls = button.className.replace(" on", "");
  if (on) button.className = cls + " on";
  else button.className = cls;
  const label = button.getElementsByTagName("span")[0];
  if (label != undefined && button.getAttribute("data-fixed") == null) {
    if (on) label.innerText = onText;
    else label.innerText = offText;
  }
}

/* ================= 검색 ================= */
function performSearch() {
  const input = document.getElementById("globalSearchInput");
  if (appData == null) return;
  const word = input.value.toLowerCase();
  if (word == "") {
    showToast("검색어를 입력해주세요.");
    return;
  }
  for (let i = 0; i < appData.destinations.length; i++) {
    const d = appData.destinations[i];
    if ((d.country + " " + d.city + " " + d.cityName + " " + d.code).toLowerCase().indexOf(word) >= 0) {
      sessionStorage.setItem("soundtripCity", d.id);
      sessionStorage.removeItem("soundtripGate");
      goTo(PAGE_GENRE);
      return;
    }
  }
  for (let i = 0; i < appData.genres.length; i++) {
    const g = appData.genres[i];
    if (g.name.toLowerCase().indexOf(word) >= 0) {
      sessionStorage.setItem("soundtripCity", g.city);
      sessionStorage.setItem("soundtripGenre", g.id);
      goTo(PAGE_PLAYLIST);
      return;
    }
  }
  for (let i = 0; i < appData.tracks.length; i++) {
    const t = appData.tracks[i];
    if ((t.title + " " + t.artist).toLowerCase().indexOf(word) >= 0) {
      if (isPlayable(t)) goTo(t.playLink);
      else goTo(PAGE_PLAYLIST);
      return;
    }
  }
  showToast("검색 결과가 없어요. 도시, 장르, 곡 이름으로 검색해보세요.");
}

/* ================= 회원가입 / 로그인 ================= */

function renderAccountPage() {
  const loginForm = document.getElementById("loginForm");
  const signupForm = document.getElementById("signupForm");

  if (loginForm != null) loginForm.addEventListener("submit", logIn);
  if (signupForm != null) signupForm.addEventListener("submit", signUp);
}

function signUp(event) {
  event.preventDefault();

  const nickname = document.getElementById("signupName").value;
  const password = document.getElementById("signupPassword").value;
  const email = document.getElementById("signupEmail").value;

  if (nickname == "" || password == "" || email == "") {
    showToast("닉네임, 비밀번호, 이메일을 모두 입력해주세요.");
    return;
  }

  const profile = {nickname: nickname, password: password, email: email, genres: []};
  localStorage.setItem("soundtripProfile", JSON.stringify(profile));
  localStorage.setItem("soundtripLoggedIn", "true");
  sessionStorage.setItem("soundtripLoggedIn", "true");

  alert(nickname + "님, 회원가입이 완료되었습니다.");
  window.location.href = "11_노래트송_index.html";
}

function logIn(event) {
  event.preventDefault();

  const saved = localStorage.getItem("soundtripProfile");
  if (saved == null) {
    alert("가입 정보가 없습니다. 먼저 회원가입을 해주세요.");
    window.location.href = "11_노래트송_signup.html";
    return;
  }

  const profile = JSON.parse(saved);
  const nickname = document.getElementById("loginName").value;
  const password = document.getElementById("loginPassword").value;

  if (profile.password == undefined) {
    showToast("기존 회원 정보에 비밀번호가 없습니다. 다시 회원가입해주세요.");
    return;
  }

  if (nickname != profile.nickname || password != profile.password) {
    showToast("닉네임 또는 비밀번호가 일치하지 않습니다.");
    return;
  }

  localStorage.setItem("soundtripLoggedIn", "true");
  sessionStorage.setItem("soundtripLoggedIn", "true");
  alert(profile.nickname + "님, 환영합니다.");
  window.location.href = "11_노래트송_index.html";
}

function logout() {
  localStorage.removeItem("soundtripLoggedIn");
  sessionStorage.removeItem("soundtripLoggedIn");
  alert("로그아웃되었습니다.");
  window.location.href = "11_노래트송_index.html";
}
window.logoutProfile = logout;

/* ================= 시작 ================= */
function startApp() {
  const searchButton = document.getElementById("globalSearchButton");
  const searchInput = document.getElementById("globalSearchInput");

  if (searchButton != null) {
    searchButton.addEventListener("click", performSearch);
  }
  if (searchInput != null) {
    searchInput.addEventListener("keydown", function(event) {
      if (event.key == "Enter") performSearch();
    });
  }

  loadNotice();
  loadAppData();
}
window.addEventListener("load", startApp);
