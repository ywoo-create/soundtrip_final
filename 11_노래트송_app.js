
const DATA_FILE = "11_노래트송_data.json";
let soundTripData = null;
let heroIndex = 0;
let heroTimer = null;

// Fetch + JSON: repeated travel/music data is loaded asynchronously from one JSON file.
function loadAppData() {
  return fetch(DATA_FILE)
    .then(function(response) {
      if (!response.ok) throw new Error("JSON load error");
      return response.json();
    })
    .then(function(data) {
      soundTripData = data;
      renderCurrentPage();
      return data;
    })
    .catch(function() {
      showDataError();
    });
}

// Classic AJAX: the notice bar is read from the same JSON file with XMLHttpRequest.
function loadNoticeAjax() {
  const target = document.getElementById("noticeText");
  if (!target) return;
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

function showDataError() {
  const targets = document.querySelectorAll("[data-json-area]");
  for (let i=0; i<targets.length; i++) {
    targets[i].innerHTML = '<div class="empty-state">JSON 데이터를 불러오지 못했습니다. VSCode의 Live Server로 실행해주세요.</div>';
  }
}

function renderCurrentPage() {
  renderHero();
  renderPopularDestinations();
  renderChartPreview();
  renderDestinations();
  renderGenres();
  renderThemes();
  renderChart("전체");
  renderPlaylist();
  renderMyMusic();
  renderRecent();
  renderAccountProfile();
  restoreRecommendation();
}

function bindCommonEvents() {
  const searchButton = document.getElementById("globalSearchButton");
  const searchInput = document.getElementById("globalSearchInput");
  if (searchButton) searchButton.addEventListener("click", performSearch);
  if (searchInput) {
    searchInput.addEventListener("keyup", function(event) {
      if (event.key == "Enter") performSearch();
    });
  }

  const prev = document.getElementById("heroPrev");
  const next = document.getElementById("heroNext");
  const prevSide = document.getElementById("prevSide");
  const nextSide = document.getElementById("nextSide");
  if (prev) prev.addEventListener("click", previousHero);
  if (next) next.addEventListener("click", nextHero);
  if (prevSide) prevSide.addEventListener("click", previousHero);
  if (nextSide) nextSide.addEventListener("click", nextHero);

  const areaFilter = document.getElementById("areaFilter");
  if (areaFilter) areaFilter.addEventListener("change", renderDestinations);

  const chartTabs = document.querySelectorAll("[data-chart-genre]");
  for (let i=0; i<chartTabs.length; i++) {
    chartTabs[i].addEventListener("click", function(event) {
      const genre = event.currentTarget.getAttribute("data-chart-genre");
      setSelectedChartTab(event.currentTarget);
      renderChart(genre);
    });
  }

  const recommendButton = document.getElementById("recommendButton");
  if (recommendButton) recommendButton.addEventListener("click", recommendTrip);

  const addSong = document.getElementById("addSongButton");
  if (addSong) addSong.addEventListener("click", addSelectedSong);

  const myList = document.getElementById("mySongList");
  if (myList) {
    myList.addEventListener("click", function(event) {
      const id = event.target.getAttribute("data-remove-song");
      if (id) removeMySong(id);
    });
  }
//playlist//
  
  const playlistLikeButton = document.getElementById("playlistLikeButton");

  if (playlistLikeButton) {
    playlistLikeButton.addEventListener("click", function() {
      const liked = localStorage.getItem("soundtripPlaylistLiked") == "true";
      const next = !liked;

      localStorage.setItem("soundtripPlaylistLiked", next);
      updatePlaylistLikeButton();
    });

    updatePlaylistLikeButton();
  }
  // 플레이리스트 전체 MY MUSIC에 담기
  const playlistAddButton = document.getElementById("playlistAddButton");

  if (playlistAddButton) {
    playlistAddButton.addEventListener("click", function() {
      if (!soundTripData || !soundTripData.tracks) return;

      soundTripData.tracks.forEach(function(track) {
        addSongById(track.id);
      });

      alert("플레이리스트 전체를 MY MUSIC에 담았습니다.");

      // MY MUSIC 페이지로 이동
      window.location.href = "11_노래트송_mymusic.html";
    });
  }

  // 플레이리스트 이벤트
  const playlistBody = document.getElementById("playlistBody");

  if (playlistBody) {

    // MY MUSIC 추가
      playlistBody.addEventListener("click", function(event) {

          const addButton = event.target.closest("[data-add-song]");

          if (addButton) {
              const id = addButton.getAttribute("data-add-song");
              addSongById(id);
          }

      });

    // 좋아요 상태 변경 및 저장
      playlistBody.addEventListener("change", function(event) {

          const likeInput = event.target;

          if (likeInput.getAttribute("data-like-song")) {

              const id = likeInput.getAttribute("data-like-song");

              toggleLikeSong(id, likeInput.checked);
          }

      });

  }

  const genreArea = document.getElementById("genreGrid");
  if (genreArea) {
    genreArea.addEventListener("click", function(event) {
      const name = event.target.getAttribute("data-preparing");
      if (name) alert(name + " 플레이리스트는 다음 업데이트에서 공개됩니다. 현재는 J-Indie를 이용해주세요.");
    });
  }
  // 플레이리스트 공유
  const playlistShareButton =
  document.getElementById("playlistShareButton");

  if (playlistShareButton) {
    playlistShareButton.addEventListener("click", function() {

      if (navigator.clipboard && window.isSecureContext) {
        navigator.clipboard.writeText(window.location.href)
          .then(function() {
            alert("플레이리스트 주소를 복사했습니다.");
          })
          .catch(function() {
            alert("주소 복사에 실패했습니다.");
          });
      } else {
        alert("현재 브라우저에서는 주소 복사를 지원하지 않습니다.");
      }

    });
  }
  bindAccountEvents();
}

function performSearch() {
  const input = document.getElementById("globalSearchInput");
  if (!input || !soundTripData) return;
  const word = input.value.trim().toLowerCase();
  if (word == "") { alert("검색어를 입력해주세요."); return; }

  for (let i=0; i<soundTripData.destinations.length; i++) {
    const d = soundTripData.destinations[i];
    const text = (d.country + " " + d.city + " " + d.label).toLowerCase();
    if (text.indexOf(word) >= 0) {
      saveRecentDestination(d.id);
      window.location.href = d.link;
      return;
    }
  }
  for (let i=0; i<soundTripData.tracks.length; i++) {
    const t = soundTripData.tracks[i];
    const text = (t.title + " " + t.artist + " " + t.genre).toLowerCase();
    if (text.indexOf(word) >= 0) { window.location.href = t.playLink; return; }
  }
  for (let i=0; i<soundTripData.genres.length; i++) {
    if (soundTripData.genres[i].name.toLowerCase().indexOf(word) >= 0) {
      window.location.href = "11_노래트송_genre.html";
      return;
    }
  }
  alert("검색 결과가 없습니다. 도쿄, J-Indie, Lemon, 차트 등을 검색해보세요.");
}

function renderHero() {
  if (!soundTripData || !document.getElementById("nolHeroImage")) return;
  showHero(heroIndex);
  if (!heroTimer) autoHero();
}
function showHero(index) {
  const list = soundTripData.heroSlides;
  if (index < 0) index = list.length - 1;
  if (index >= list.length) index = 0;
  heroIndex = index;
  const current = list[index];
  const prev = list[(index - 1 + list.length) % list.length];
  const next = list[(index + 1) % list.length];
  document.getElementById("nolHeroBadge").innerText = current.badge;
  document.getElementById("nolHeroTitle").innerText = current.title;
  document.getElementById("nolHeroText").innerHTML = current.line1 + "<br>" + current.line2;
  document.getElementById("nolHeroPeriod").innerText = current.period;
  document.getElementById("nolHeroImage").src = current.image;
  document.getElementById("nolHeroLink").href = current.link;
  document.getElementById("heroCount").innerText = (index+1) + " / " + list.length;
  document.getElementById("prevHeroImage").src = prev.image;
  document.getElementById("prevHeroTag").innerText = prev.tag;
  document.getElementById("prevHeroTitle").innerText = prev.short;
  document.getElementById("nextHeroImage").src = next.image;
  document.getElementById("nextHeroTag").innerText = next.tag;
  document.getElementById("nextHeroTitle").innerText = next.short;
}
function nextHero() { if (soundTripData) showHero(heroIndex + 1); }
function previousHero() { if (soundTripData) showHero(heroIndex - 1); }
function autoHero() {
  heroTimer = setTimeout(function() { nextHero(); heroTimer = null; autoHero(); }, 5000);
}

function renderPopularDestinations() {
  const box = document.getElementById("popularDestinationCards");
  if (!box || !soundTripData) return;
  let code = "";
  const ids = ["tokyo","busan","london","rio"];
  for (let i=0; i<ids.length; i++) {
    const d = findDestination(ids[i]);
    if (!d) continue;
    code += '<a class="nol-content-card" href="' + d.link + '" data-recent-destination="' + d.id + '">';
    code += '<img src="' + d.image + '" alt="' + d.label + '">';
    code += '<div class="nol-card-text"><span>' + d.country + ' · ' + d.city + '</span><h3>' + d.label + '</h3><p>' + d.desc + '</p></div></a>';
  }
  box.innerHTML = code;
  bindRecentLinks(box);
}

function renderChartPreview() {
  const box = document.getElementById("chartPreview");
  if (!box || !soundTripData) return;
  let code = "";
  for (let i=0; i<3 && i<soundTripData.tracks.length; i++) {
    const t = soundTripData.tracks[i];
    code += '<div class="rank-strip-card"><strong>' + t.rank + '</strong><img src="' + t.image + '" alt="' + t.title + '"><div><h3>' + t.title + '</h3><p>' + t.artist + ' · ' + t.city + '</p></div><a href="' + t.playLink + '">▶</a></div>';
  }
  box.innerHTML = code;
}

function renderDestinations() {
  const box = document.getElementById("destinationGrid");
  if (!box || !soundTripData) return;
  const filter = document.getElementById("areaFilter");
  const area = filter ? filter.value : "전체";
  let code = "";
  for (let i=0; i<soundTripData.destinations.length; i++) {
    const d = soundTripData.destinations[i];
    if (area != "전체" && d.area != area) continue;
    code += '<a class="destination-card" href="' + d.link + '" data-recent-destination="' + d.id + '"><img src="' + d.image + '" alt="' + d.label + '"><div class="card-body"><p class="card-kicker">' + d.country + ' / ' + d.city + '</p><h3 class="card-title">' + d.label + '</h3><p class="card-desc">' + d.desc + '</p></div></a>';
  }
  box.innerHTML = code;
  bindRecentLinks(box);
}

function bindRecentLinks(container) {
  const links = container.querySelectorAll("[data-recent-destination]");
  for (let i=0; i<links.length; i++) {
    links[i].addEventListener("click", function(event) {
      saveRecentDestination(event.currentTarget.getAttribute("data-recent-destination"));
    });
  }
}
function findDestination(id) {
  for (let i=0; i<soundTripData.destinations.length; i++) if (soundTripData.destinations[i].id == id) return soundTripData.destinations[i];
  return null;
}

function renderGenres() {
  const box = document.getElementById("genreGrid");
  if (!box || !soundTripData) return;
  let code = "";
  for (let i=0; i<soundTripData.genres.length; i++) {
    const g = soundTripData.genres[i];
    code += '<article class="genre-card"><img src="' + g.image + '" alt="' + g.name + '"><div class="card-body"><h3>' + g.name + '</h3><p class="card-desc">' + g.desc + '</p>';
    if (g.ready) code += '<a class="small-button" href="' + g.link + '">플레이리스트 보기</a>';
    else code += '<button type="button" data-preparing="' + g.name + '">추천 준비중</button>';
    code += '</div></article>';
  }
  box.innerHTML = code;
}

function renderThemes() {
  const box = document.getElementById("themeGrid");
  if (!box || !soundTripData) return;
  let code = "";
  for (let i=0; i<soundTripData.themes.length; i++) {
    const t = soundTripData.themes[i];
    code += '<a class="content-card" href="' + t.link + '"><img src="' + t.image + '" alt="' + t.title + '"><div class="card-body"><p class="card-kicker">' + t.city + ' / ' + t.tag + '</p><h3 class="card-title">' + t.title + '</h3><p class="card-desc">' + t.desc + '</p></div></a>';
  }
  box.innerHTML = code;
}

function setSelectedChartTab(button) {
  const tabs = document.querySelectorAll("[data-chart-genre]");
  for (let i=0; i<tabs.length; i++) tabs[i].className = "";
  button.className = "selected";
}
function renderChart(genre) {
  const body = document.getElementById("chartBody");
  if (!body || !soundTripData) return;
  let code = "";
  for (let i=0; i<soundTripData.tracks.length; i++) {
    const t = soundTripData.tracks[i];
    if (genre != "전체" && t.genre != genre) continue;
    code += '<tr><td class="rank-number">' + t.rank + '</td><td><strong>' + t.title + '</strong><br><span style="color:#777;font-size:12px;">' + t.artist + '</span></td><td>' + t.genre + '</td><td>' + t.city + '</td><td class="rank-action"><a href="' + t.playLink + '">듣기</a></td></tr>';
  }
  body.innerHTML = code;
}
//playlist//
// 좋아요한 곡 목록 불러오기
function getLikedSongs() {
    const saved = localStorage.getItem("soundtripLikedSongs");

    if (saved) {
        return JSON.parse(saved);
    }

    return [];
}

// 좋아요한 곡 목록 저장하기
function saveLikedSongs(list) {
    localStorage.setItem(
        "soundtripLikedSongs",
        JSON.stringify(list)
    );
}

// 좋아요 상태 변경하기
function toggleLikeSong(id, isLiked) {
    const list = getLikedSongs();

    if (isLiked) {
        if (list.indexOf(id) == -1) {
            list.push(id);
        }
    } else {
        const next = [];

        for (let i = 0; i < list.length; i++) {
            if (list[i] != id) {
                next.push(list[i]);
            }
        }

        saveLikedSongs(next);
        return;
    }

    saveLikedSongs(list);
}

function renderPlaylist() {
    const body = document.getElementById("playlistBody");

    if (!body || !soundTripData) return;

    const likedSongs = getLikedSongs();

    let code = "";

    for (let i = 0; i < soundTripData.tracks.length; i++) {
        const t = soundTripData.tracks[i];

        const isLiked = likedSongs.indexOf(t.id) != -1;

        code += '<tr>';

        code += '<td class="playlist-track-number">';
        code += (i + 1);
        code += '</td>';

        code += '<td>';
        code += '<div class="playlist-track-info">';

        code += '<img class="playlist-track-cover" ';
        code += 'src="' + t.image + '" ';
        code += 'alt="' + t.title + ' 앨범 커버" ';
        code += 'onerror="this.src=\'11_album-placeholder.svg\'">';

        code += '<div class="playlist-track-text">';
        code += '<a class="playlist-track-title" href="' + t.playLink + '">';
        code += t.title;
        code += '</a>';
        code += '<span class="playlist-track-artist">';
        code += t.artist;
        code += '</span>';
        code += '</div>';

        code += '</div>';
        code += '</td>';
              
        code += '<td class="playlist-track-album">';
        code += t.album || "-";
        code += '</td>';
        code += '<td class="playlist-track-duration">';
        code += t.duration || "-";
        code += '</td>';

        code += '<td class="playlist-track-actions">';

        code += '<a href="' + t.playLink + '" aria-label="재생">';
        code += '<img src="11_play.svg" alt="">';
        code += '</a>';

        code += '<label class="like-button">';
        code += '<input type="checkbox" data-like-song="' + t.id + '" ';
        if (isLiked) code += 'checked';
        code += '>';
        code += '<img src="11_favorite.svg" class="heart-outline" alt="좋아요">';
        code += '<img src="11_favorite-fill.svg" class="heart-fill" alt="좋아요 취소">';
        code += '</label>';

        code += '<button type="button" data-add-song="' + t.id + '" aria-label="MY MUSIC 추가">';
        code += '<img src="11_add.svg" alt="">';
        code += '</button>';

        code += '</td>';

        code += '</tr>';
    }

    body.innerHTML = code;
}

function updatePlaylistLikeButton() {
  const button = document.getElementById("playlistLikeButton");
  if (!button) return;

  const liked = localStorage.getItem("soundtripPlaylistLiked") == "true";
  const img = button.querySelector("img");

  img.src = liked ? "11_favorite-fill.svg" : "11_favorite.svg";
  button.setAttribute("aria-pressed", liked);
  button.setAttribute("aria-label", liked ? "플레이리스트 좋아요 취소" : "플레이리스트 좋아요");
}

// Web Storage: MY MUSIC survives refresh/browser restart.
function getMyMusic() {
  const saved = localStorage.getItem("soundtripMyMusic");
  return saved ? JSON.parse(saved) : [];
}
function saveMyMusic(list) { localStorage.setItem("soundtripMyMusic", JSON.stringify(list)); }
function addSongById(id) {
  if (!soundTripData) return;
  const list = getMyMusic();
  for (let i=0; i<list.length; i++) if (list[i] == id) { alert("이미 MY MUSIC에 있는 곡입니다."); return; }
  list.push(id); saveMyMusic(list); alert("MY MUSIC에 추가했습니다."); renderMyMusic();
}
function addSelectedSong() {
  const select = document.getElementById("songSelect");
  if (select) addSongById(select.value);
}
function removeMySong(id) {
  const list = getMyMusic();
  const next = [];
  for (let i=0; i<list.length; i++) if (list[i] != id) next.push(list[i]);
  saveMyMusic(next); renderMyMusic();
}
function findTrack(id) {
  if (!soundTripData) return null;
  for (let i=0; i<soundTripData.tracks.length; i++) if (soundTripData.tracks[i].id == id) return soundTripData.tracks[i];
  return null;
}
function renderMyMusic() {
  const listBox = document.getElementById("mySongList");
  const select = document.getElementById("songSelect");
  if (!soundTripData) return;
  if (select && select.options.length == 0) {
    for (let i=0; i<soundTripData.tracks.length; i++) {
      const option = document.createElement("option"); option.value = soundTripData.tracks[i].id; option.innerText = soundTripData.tracks[i].title + " - " + soundTripData.tracks[i].artist; select.appendChild(option);
    }
  }
  if (!listBox) return;
  const saved = getMyMusic();
  if (saved.length == 0) { listBox.innerHTML = '<li class="empty-state">아직 저장한 곡이 없습니다. 플레이리스트에서 곡을 추가해보세요.</li>'; return; }
  let code = "";
  for (let i=0; i<saved.length; i++) {
    const t = findTrack(saved[i]); if (!t) continue;
    code += '<li><div><strong>' + t.title + '</strong><small>' + t.artist + ' · ' + t.genre + '</small></div><button type="button" data-remove-song="' + t.id + '">삭제</button></li>';
  }
  listBox.innerHTML = code;
}

// Web Storage: recently viewed destinations.
function saveRecentDestination(id) {
  let list = localStorage.getItem("soundtripRecent");
  list = list ? JSON.parse(list) : [];
  const next = [id];
  for (let i=0; i<list.length; i++) if (list[i] != id && next.length < 4) next.push(list[i]);
  localStorage.setItem("soundtripRecent", JSON.stringify(next));
}
function renderRecent() {
  const box = document.getElementById("recentBox");
  if (!box || !soundTripData) return;
  let list = localStorage.getItem("soundtripRecent");
  list = list ? JSON.parse(list) : [];
  if (list.length == 0) { box.innerHTML = '<p>아직 본 여행지가 없습니다. 여행지 카드를 눌러보세요.</p>'; return; }
  let code = '<p>최근 본 여행지를 다시 이어서 탐색할 수 있어요.</p><div class="recent-links">';
  for (let i=0; i<list.length; i++) { const d = findDestination(list[i]); if (d) code += '<a href="' + d.link + '">' + d.label + '</a>'; }
  code += '</div>'; box.innerHTML = code;
}

function recommendTrip() {
  const mood = document.getElementById("mood");
  const activity = document.getElementById("activity");
  const result = document.getElementById("recommendResult");
  if (!mood || !activity || !result) return;
  let title="", text="", link="11_노래트송_themes.html";
  if (mood.value == "설렘") { title="SEOUL / 새벽 드라이브"; text="빠르게 바뀌는 도시 풍경과 잘 어울리는 밝고 리듬감 있는 음악 테마를 추천합니다."; }
  else if (mood.value == "차분") { title="LONDON / 비 오는 오후"; text="천천히 걷는 여행에 어울리는 잔잔한 분위기의 음악 테마를 추천합니다."; }
  else { title="TOKYO / NIGHT WALK"; text="도시의 불빛과 늦은 밤 산책에 어울리는 J-Indie 플레이리스트를 추천합니다."; link="11_노래트송_playlist.html"; }
  if (activity.value == "드라이브") text += " 드라이브를 선택했기 때문에 템포감 있는 곡을 중심으로 구성했습니다.";
  else if (activity.value == "산책") text += " 산책을 선택했기 때문에 풍경을 천천히 느낄 수 있는 곡을 추천합니다.";
  else text += " 휴식을 선택했기 때문에 편안하게 들을 수 있는 곡을 추천합니다.";
  const saved = {mood:mood.value, activity:activity.value, title:title, text:text, link:link};
  localStorage.setItem("soundtripRecommendation", JSON.stringify(saved));
  showRecommendation(saved);
}
function showRecommendation(saved) {
  const result = document.getElementById("recommendResult"); if (!result) return;
  result.innerHTML = '<h3>' + saved.title + '</h3><p>' + saved.text + '</p><p><a class="primary-button" href="' + saved.link + '">추천 보러가기</a></p>';
}
function restoreRecommendation() {
  const saved = localStorage.getItem("soundtripRecommendation");
  if (saved) showRecommendation(JSON.parse(saved));
}

function bindAccountEvents() {
  const loginForm = document.getElementById("loginForm");
  const signupForm = document.getElementById("signupForm");
  if (loginForm) loginForm.addEventListener("submit", loginLocalProfile);
  if (signupForm) signupForm.addEventListener("submit", saveLocalProfile);
}
function saveLocalProfile(event) {
  event.preventDefault();
  const profile = {nickname:document.getElementById("signupName").value.trim(), email:document.getElementById("signupEmail").value.trim(), city:document.getElementById("signupCity").value, genre:document.getElementById("signupGenre").value};
  if (profile.nickname == "" || profile.email == "") { alert("닉네임과 이메일을 입력해주세요."); return; }
  localStorage.setItem("soundtripProfile", JSON.stringify(profile));
  alert("로컬 프로필을 저장했습니다. 위의 로그인 영역에서 닉네임으로 로그인해보세요.");
  renderAccountProfile();
}
function loginLocalProfile(event) {
  event.preventDefault();
  const saved = localStorage.getItem("soundtripProfile");
  if (!saved) { alert("저장된 프로필이 없습니다. 먼저 회원가입을 진행해주세요."); return; }
  const profile = JSON.parse(saved); const name = document.getElementById("loginName").value.trim();
  if (name == profile.nickname) { localStorage.setItem("soundtripLoggedIn", "true"); alert(profile.nickname + "님, 로그인되었습니다."); renderAccountProfile(); }
  else alert("저장된 닉네임과 일치하지 않습니다.");
}
function renderAccountProfile() {
  const box = document.getElementById("profileSummary"); if (!box) return;
  const saved = localStorage.getItem("soundtripProfile");
  if (!saved) { box.innerHTML = '<p>아직 저장된 로컬 프로필이 없습니다.</p>'; return; }
  const p = JSON.parse(saved); box.innerHTML = '<h3>' + p.nickname + '님의 SoundTrip 취향</h3><p>선호 도시: ' + p.city + ' · 선호 장르: ' + p.genre + '</p>';
}

function setTodayText() {
  const target = document.getElementById("todayText"); if (!target) return;
  const today = new Date(); target.innerText = today.getFullYear() + "." + (today.getMonth()+1) + "." + today.getDate() + " 기준 SoundTrip 편집 추천";
}

document.addEventListener("DOMContentLoaded", function() {
  bindCommonEvents();
  setTodayText();
  loadNoticeAjax();
  loadAppData();
});
