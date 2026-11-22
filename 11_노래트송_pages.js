
var soundTripData = null;
var selectedArea = "전체";
var selectedChartGenre = "전체";
var selectedThemeActivity = "전체";

function loadSoundTripData() {
    fetch("11_노래트송_data.json")
        .then(function(response) {
            if (!response.ok) {
                throw new Error("JSON 데이터를 불러오지 못했습니다.");
            }
            return response.json();
        })
        .then(function(data) {
            soundTripData = data;
            renderSubpageContent();
        })
        .catch(function(error) {
            showLoadError(error.message);
        });
}

function loadSubpageNotice() {
    var notice = document.getElementById("subpageNotice");
    if (notice == null) {
        return;
    }
    var request = new XMLHttpRequest();
    request.open("GET", "11_노래트송_data.json", true);
    request.onreadystatechange = function() {
        if (request.readyState == 4 && request.status == 200) {
            var data = JSON.parse(request.responseText);
            notice.innerText = data.notice;
        }
    };
    request.send();
}

function showLoadError(message) {
    var areas = document.getElementsByClassName("st-loading");
    for (var i = 0; i < areas.length; i++) {
        areas[i].innerText = "데이터를 불러오지 못했습니다. VS Code에서 Live Server로 실행해주세요. (" + message + ")";
    }
}

function renderSubpageContent() {
    renderDestinations();
    renderGenres();
    renderThemes();
    renderChart();
    renderPlaylist();
    renderMyMusic();
    renderRecentDestinations();
    restoreRecommendation();
    renderProfile();
    renderChartTopThree();
    setTodayText();
    renderCurrentTrack();
}

function addSubpageEvents() {
    var searchButton = document.getElementById("globalSearchButton");
    var searchInput = document.getElementById("globalSearchInput");
    if (searchButton != null) {
        searchButton.addEventListener("click", searchSoundTrip);
    }
    if (searchInput != null) {
        searchInput.addEventListener("keyup", function(event) {
            if (event.key == "Enter") {
                searchSoundTrip();
            }
        });
    }

    var areaTabs = document.getElementById("destinationAreaTabs");
    if (areaTabs != null) {
        areaTabs.addEventListener("click", function(event) {
            var area = event.target.getAttribute("data-area");
            if (area != null) {
                selectedArea = area;
                setSelectedButton(areaTabs, "data-area", area);
                renderDestinations();
            }
        });
    }
    var destinationSearch = document.getElementById("destinationSearch");
    if (destinationSearch != null) {
        destinationSearch.addEventListener("keyup", renderDestinations);
    }
    var genreSearch = document.getElementById("genreSearch");
    if (genreSearch != null) {
        genreSearch.addEventListener("keyup", renderGenres);
    }

    var chartTabs = document.getElementById("chartTabs");
    if (chartTabs != null) {
        chartTabs.addEventListener("click", function(event) {
            var genre = event.target.getAttribute("data-chart-genre");
            if (genre != null) {
                selectedChartGenre = genre;
                setSelectedButton(chartTabs, "data-chart-genre", genre);
                renderChart();
            }
        });
    }

    var themeTabs = document.getElementById("themeTabs");
    if (themeTabs != null) {
        themeTabs.addEventListener("click", function(event) {
            var activity = event.target.getAttribute("data-theme-activity");
            if (activity != null) {
                selectedThemeActivity = activity;
                setSelectedButton(themeTabs, "data-theme-activity", activity);
                renderThemes();
            }
        });
    }

    var playlistBody = document.getElementById("playlistBody");
    if (playlistBody != null) {
        playlistBody.addEventListener("click", function(event) {
            var addId = event.target.getAttribute("data-add-track");
            var favId = event.target.getAttribute("data-favorite-track");
            if (addId != null) {
                addToMyMusic(addId);
            }
            if (favId != null) {
                toggleFavorite(favId);
                renderPlaylist();
            }
        });
    }

    var addAll = document.getElementById("addAllSongsButton");
    if (addAll != null) {
        addAll.addEventListener("click", addAllToMyMusic);
    }
    var addCurrent = document.getElementById("addCurrentTrackButton");
    if (addCurrent != null) {
        addCurrent.addEventListener("click", function(event) {
            addToMyMusic(event.currentTarget.getAttribute("data-add-track"));
        });
    }

    var chartBody = document.getElementById("chartBody");
    if (chartBody != null) {
        chartBody.addEventListener("click", function(event) {
            var addId = event.target.getAttribute("data-add-track");
            if (addId != null) {
                addToMyMusic(addId);
            }
        });
    }

    var myList = document.getElementById("mySongList");
    if (myList != null) {
        myList.addEventListener("click", function(event) {
            var removeId = event.target.getAttribute("data-remove-track");
            if (removeId != null) {
                removeFromMyMusic(removeId);
            }
        });
    }

    var clearAll = document.getElementById("clearMyMusicButton");
    if (clearAll != null) {
        clearAll.addEventListener("click", clearMyMusic);
    }

    var recommendForm = document.getElementById("recommendForm");
    if (recommendForm != null) {
        recommendForm.addEventListener("submit", function(event) {
            event.preventDefault();
            recommendTrip();
        });
    }

    var signupForm = document.getElementById("signupForm");
    if (signupForm != null) {
        signupForm.addEventListener("submit", saveProfile);
    }
    var loginForm = document.getElementById("loginForm");
    if (loginForm != null) {
        loginForm.addEventListener("submit", loginProfile);
    }
    var logoutButton = document.getElementById("logoutButton");
    if (logoutButton != null) {
        logoutButton.addEventListener("click", logoutProfile);
    }

}

function setSelectedButton(container, attributeName, selectedValue) {
    var buttons = container.getElementsByTagName("button");
    for (var i = 0; i < buttons.length; i++) {
        if (buttons[i].getAttribute(attributeName) == selectedValue) {
            buttons[i].className = "selected";
        } else {
            buttons[i].className = "";
        }
    }
}

function searchSoundTrip() {
    var input = document.getElementById("globalSearchInput");
    if (input == null || soundTripData == null) return;
    var word = input.value.toLowerCase().trim();
    if (word == "") {
        alert("검색어를 입력해주세요.");
        return;
    }
    for (var i = 0; i < soundTripData.destinations.length; i++) {
        var d = soundTripData.destinations[i];
        var destText = (d.country + " " + d.city + " " + d.label).toLowerCase();
        if (destText.indexOf(word) >= 0) {
            saveRecentDestination(d.id);
            window.location.href = d.link;
            return;
        }
    }
    for (var j = 0; j < soundTripData.tracks.length; j++) {
        var t = soundTripData.tracks[j];
        var trackText = (t.title + " " + t.artist + " " + t.genre).toLowerCase();
        if (trackText.indexOf(word) >= 0) {
            if (t.audioSrc != "") window.location.href = t.playLink;
            else window.location.href = "11_노래트송_playlist.html";
            return;
        }
    }
    for (var k = 0; k < soundTripData.genres.length; k++) {
        if (soundTripData.genres[k].name.toLowerCase().indexOf(word) >= 0) {
            window.location.href = "11_노래트송_genre.html";
            return;
        }
    }
    alert("검색 결과가 없습니다. 도쿄, J-Indie, Lemon, 차트 등을 검색해보세요.");
}

function findTrack(id) {
    if (soundTripData == null) return null;
    for (var i = 0; i < soundTripData.tracks.length; i++) {
        if (soundTripData.tracks[i].id == id) return soundTripData.tracks[i];
    }
    return null;
}
function findDestination(id) {
    if (soundTripData == null) return null;
    for (var i = 0; i < soundTripData.destinations.length; i++) {
        if (soundTripData.destinations[i].id == id) return soundTripData.destinations[i];
    }
    return null;
}

function renderDestinations() {
    var box = document.getElementById("destinationGrid");
    if (box == null || soundTripData == null) return;
    var search = document.getElementById("destinationSearch");
    var word = search == null ? "" : search.value.toLowerCase().trim();
    var count = 0;
    var code = "";
    for (var i = 0; i < soundTripData.destinations.length; i++) {
        var d = soundTripData.destinations[i];
        var text = (d.country + " " + d.city + " " + d.label + " " + d.desc).toLowerCase();
        if (selectedArea != "전체" && d.area != selectedArea) continue;
        if (word != "" && text.indexOf(word) < 0) continue;
        count++;
        code += '<a class="st-destination-card" href="' + d.link + '" data-recent-destination="' + d.id + '">';
        code += '<div class="st-card-image"><img src="' + d.image + '" alt="' + d.label + '"><span class="st-card-number">0' + (i + 1) + '</span></div>';
        code += '<div class="st-card-body"><p class="st-card-kicker">' + d.country + ' · ' + d.city + '</p><h3>' + d.label + '</h3><p>' + d.desc + '</p><span class="st-card-action">음악 여행 보기 ›</span></div></a>';
    }
    if (count == 0) code = '<div class="st-empty-state">검색 결과가 없습니다.<br>다른 도시 이름이나 지역을 선택해보세요.</div>';
    box.innerHTML = code;
    var countBox = document.getElementById("destinationCount");
    if (countBox != null) countBox.innerText = count + " CITIES";
    bindRecentDestinationLinks();
}

function bindRecentDestinationLinks() {
    var links = document.querySelectorAll("[data-recent-destination]");
    for (var i = 0; i < links.length; i++) {
        links[i].addEventListener("click", function(event) {
            saveRecentDestination(event.currentTarget.getAttribute("data-recent-destination"));
        });
    }
}
function saveRecentDestination(id) {
    var list = getStorageArray("soundtripRecent");
    var next = [id];
    for (var i = 0; i < list.length; i++) {
        if (list[i] != id && next.length < 4) next.push(list[i]);
    }
    localStorage.setItem("soundtripRecent", JSON.stringify(next));
}
function renderRecentDestinations() {
    // Recent destinations are rendered on the homepage; subpages only update the stored history.
}

function renderGenres() {
    var box = document.getElementById("genreGrid");
    if (box == null || soundTripData == null) return;
    var search = document.getElementById("genreSearch");
    var word = search == null ? "" : search.value.toLowerCase().trim();
    var code = "";
    var count = 0;
    for (var i = 0; i < soundTripData.genres.length; i++) {
        var g = soundTripData.genres[i];
        if (word != "" && g.name.toLowerCase().indexOf(word) < 0) continue;
        count++;
        code += '<article class="st-genre-card"><div class="st-card-image"><img src="' + g.image + '" alt="' + g.name + '"><span class="st-card-number">GENRE 0' + (i + 1) + '</span></div>';
        code += '<div class="st-card-body"><p class="st-card-kicker">TOKYO MUSIC</p><h3>' + g.name + '</h3><p>' + g.desc + '</p>';
        if (g.ready) code += '<a class="st-card-action" href="' + g.link + '">플레이리스트 보기 ›</a>';
        else if (g.name == "J-Rock" || g.name == "City Pop") code += '<a class="st-card-action" href="' + g.link + '">관련 차트 보기 ›</a>';
        else code += '<span class="st-card-label">장르 소개</span>';
        code += '</div></article>';
    }
    if (count == 0) code = '<div class="st-empty-state">해당하는 장르가 없습니다. 다른 단어로 검색해보세요.</div>';
    box.innerHTML = code;
}

function renderThemes() {
    var box = document.getElementById("themeGrid");
    if (box == null || soundTripData == null) return;
    var code = "";
    var count = 0;
    for (var i = 0; i < soundTripData.themes.length; i++) {
        var t = soundTripData.themes[i];
        if (selectedThemeActivity != "전체" && t.activity != selectedThemeActivity) continue;
        count++;
        code += '<a class="st-theme-card" href="' + t.link + '"><div class="st-card-image"><img src="' + t.image + '" alt="' + t.title + '"><span class="st-card-number">' + t.tag + '</span></div>';
        code += '<div class="st-card-body"><p class="st-card-kicker">' + t.city + ' · ' + t.activity + '</p><h3>' + t.title + '</h3><p>' + t.desc + '</p><span class="st-card-action">테마 둘러보기 ›</span></div></a>';
    }
    if (count == 0) code = '<div class="st-empty-state">선택한 상황에 맞는 테마가 없습니다.</div>';
    box.innerHTML = code;
}

function renderPlaylist() {
    var body = document.getElementById("playlistBody");
    if (body == null || soundTripData == null) return;
    var code = "";
    var favorites = getStorageArray("soundtripFavorites");
    for (var i = 0; i < soundTripData.tracks.length; i++) {
        var t = soundTripData.tracks[i];
        var playingLink = t.audioSrc != "" ? '<a class="st-table-action" href="' + t.playLink + '">▶ 재생</a>' : '<span class="st-card-label">미리듣기 준비 중</span>';
        var favoriteClass = containsValue(favorites, t.id) ? ' class="st-favorite-button selected"' : ' class="st-favorite-button"';
        code += '<tr><td class="st-track-number">' + (i + 1) + '</td><td colspan="2"><div class="st-track-info"><img src="' + t.image + '" alt="' + t.title + '"><div><strong>' + t.title + '</strong><small>' + t.artist + '</small></div></div></td>';
        code += '<td>' + t.genre + '</td><td>' + playingLink + '</td><td><button type="button"' + favoriteClass + ' data-favorite-track="' + t.id + '" aria-label="좋아요">♥</button></td><td><button type="button" class="st-table-action" data-add-track="' + t.id + '">＋ 담기</button></td></tr>';
    }
    body.innerHTML = code;
}

function renderChart() {
    var body = document.getElementById("chartBody");
    if (body == null || soundTripData == null) return;
    var code = "";
    var count = 0;
    for (var i = 0; i < soundTripData.tracks.length; i++) {
        var t = soundTripData.tracks[i];
        if (selectedChartGenre != "전체" && t.genre != selectedChartGenre) continue;
        count++;
        var playText = t.audioSrc != "" ? '<a href="' + t.playLink + '">▶ 재생</a>' : '<span class="st-card-label">미리듣기 준비 중</span>';
        code += '<tr><td class="st-rank-number">' + t.rank + '</td><td colspan="2"><div class="st-track-info"><img src="' + t.image + '" alt="' + t.title + '"><div class="st-chart-song"><strong>' + t.title + '</strong><small>' + t.artist + '</small></div></div></td><td>' + t.genre + '</td><td>' + t.city + '</td><td>' + playText + '</td><td><button type="button" class="st-table-action" data-add-track="' + t.id + '">＋ 담기</button></td></tr>';
    }
    if (count == 0) code = '<tr><td colspan="7"><div class="st-empty-state">현재 등록된 곡이 없습니다. 다른 장르를 선택해보세요.</div></td></tr>';
    body.innerHTML = code;
}

function renderChartTopThree() {
    var box = document.getElementById("chartTopThree");
    if (box == null || soundTripData == null) return;
    var code = "";
    for (var i = 0; i < 3 && i < soundTripData.tracks.length; i++) {
        var t = soundTripData.tracks[i];
        code += '<a class="st-chart-podium-card" href="' + (t.audioSrc != "" ? t.playLink : "11_노래트송_playlist.html") + '"><img src="' + t.image + '" alt="' + t.title + '"><span>RANK 0' + (i + 1) + '</span><strong>' + t.title + '</strong><small>' + t.artist + '</small></a>';
    }
    box.innerHTML = code;
}

function renderCurrentTrack() {
    var body = document.getElementsByTagName("body")[0];
    if (body == null || soundTripData == null) return;
    var trackId = body.getAttribute("data-track-id");
    if (trackId == null || trackId == "") return;
    var track = findTrack(trackId);
    if (track == null) return;
    var addButton = document.querySelector("[data-add-track='" + trackId + "']");
    if (addButton != null) addButton.innerText = "♡ MY MUSIC 담기";
}

function getStorageArray(key) {
    var value = localStorage.getItem(key);
    if (value == null) return [];
    try { return JSON.parse(value); } catch (error) { return []; }
}
function containsValue(list, value) {
    for (var i = 0; i < list.length; i++) if (list[i] == value) return true;
    return false;
}
function addToMyMusic(id) {
    var track = findTrack(id);
    if (track == null) return;
    var list = getStorageArray("soundtripMyMusic");
    if (containsValue(list, id)) {
        alert("이미 MY MUSIC에 저장된 곡입니다.");
        return;
    }
    list.push(id);
    localStorage.setItem("soundtripMyMusic", JSON.stringify(list));
    alert(track.title + " 곡을 MY MUSIC에 저장했습니다.");
    renderMyMusic();
}
function addAllToMyMusic() {
    if (soundTripData == null) return;
    var list = getStorageArray("soundtripMyMusic");
    var added = 0;
    for (var i = 0; i < soundTripData.tracks.length; i++) {
        if (!containsValue(list, soundTripData.tracks[i].id)) {
            list.push(soundTripData.tracks[i].id);
            added++;
        }
    }
    localStorage.setItem("soundtripMyMusic", JSON.stringify(list));
    alert(added + "곡을 MY MUSIC에 추가했습니다.");
    renderMyMusic();
}
function removeFromMyMusic(id) {
    var list = getStorageArray("soundtripMyMusic");
    var next = [];
    for (var i = 0; i < list.length; i++) if (list[i] != id) next.push(list[i]);
    localStorage.setItem("soundtripMyMusic", JSON.stringify(next));
    renderMyMusic();
}
function clearMyMusic() {
    var list = getStorageArray("soundtripMyMusic");
    if (list.length == 0) {
        alert("MY MUSIC이 비어 있습니다.");
        return;
    }
    if (confirm("저장한 곡을 모두 삭제할까요?")) {
        localStorage.setItem("soundtripMyMusic", JSON.stringify([]));
        renderMyMusic();
    }
}
function toggleFavorite(id) {
    var list = getStorageArray("soundtripFavorites");
    var next = [];
    var found = false;
    for (var i = 0; i < list.length; i++) {
        if (list[i] == id) found = true;
        else next.push(list[i]);
    }
    if (!found) next.push(id);
    localStorage.setItem("soundtripFavorites", JSON.stringify(next));
}
function renderMyMusic() {
    var listBox = document.getElementById("mySongList");
    var countBox = document.getElementById("myMusicCount");
    if (soundTripData == null) return;
    var list = getStorageArray("soundtripMyMusic");
    if (countBox != null) countBox.innerText = list.length < 10 ? "0" + list.length : list.length;
    if (listBox == null) return;
    if (list.length == 0) {
        listBox.innerHTML = '<li class="st-empty-state">아직 저장한 곡이 없습니다.<br>J-Indie 플레이리스트에서 마음에 드는 곡을 담아보세요.<br><a href="11_노래트송_playlist.html">플레이리스트 둘러보기 ›</a></li>';
        return;
    }
    var code = "";
    for (var i = 0; i < list.length; i++) {
        var t = findTrack(list[i]);
        if (t == null) continue;
        var playLink = t.audioSrc != "" ? '<a href="' + t.playLink + '">듣기</a>' : '';
        code += '<li><div class="st-my-song-left"><img src="' + t.image + '" alt="' + t.title + '"><div><strong>' + t.title + '</strong><small>' + t.artist + ' · ' + t.genre + '</small></div></div><div class="st-my-song-actions">' + playLink + '<button type="button" data-remove-track="' + t.id + '">삭제</button></div></li>';
    }
    listBox.innerHTML = code;
}

function recommendTrip() {
    var mood = document.getElementById("mood");
    var activity = document.getElementById("activity");
    var box = document.getElementById("recommendResult");
    if (mood == null || activity == null || box == null || soundTripData == null) return;
    var selected = null;
    for (var i = 0; i < soundTripData.recommendations.length; i++) {
        var item = soundTripData.recommendations[i];
        if (item.mood == mood.value && item.activity == activity.value) {
            selected = item;
            break;
        }
    }
    if (selected == null) {
        if (activity.value == "드라이브") selected = soundTripData.recommendations[0];
        else if (activity.value == "산책") selected = soundTripData.recommendations[1];
        else selected = soundTripData.recommendations[2];
    }
    localStorage.setItem("soundtripRecommendation", JSON.stringify(selected));
    showRecommendation(selected);
}
function showRecommendation(item) {
    var box = document.getElementById("recommendResult");
    if (box == null) return;
    box.innerHTML = '<div class="st-result-card"><img src="' + item.image + '" alt="' + item.title + '"><p class="st-eyebrow">' + item.city + ' · ' + item.activity + '</p><h3>' + item.title + '</h3><p>' + item.description + '</p><div class="st-result-actions"><a href="' + item.link + '">추천 콘텐츠 보기 ›</a><button type="button" data-add-track="' + item.trackId + '">대표곡 MY MUSIC 저장</button></div></div>';
    var saveButton = box.querySelector("[data-add-track]");
    if (saveButton != null) {
        saveButton.addEventListener("click", function(event) {
            addToMyMusic(event.currentTarget.getAttribute("data-add-track"));
        });
    }
}
function restoreRecommendation() {
    var saved = localStorage.getItem("soundtripRecommendation");
    if (saved != null) {
        try { showRecommendation(JSON.parse(saved)); } catch (error) { localStorage.removeItem("soundtripRecommendation"); }
    }
}

function saveProfile(event) {
    event.preventDefault();
    var profile = {
        nickname: document.getElementById("signupName").value.trim(),
        email: document.getElementById("signupEmail").value.trim(),
        city: document.getElementById("signupCity").value,
        genre: document.getElementById("signupGenre").value
    };
    if (profile.nickname == "" || profile.email == "") {
        alert("닉네임과 이메일을 입력해주세요.");
        return;
    }
    localStorage.setItem("soundtripProfile", JSON.stringify(profile));
    renderProfile();
    alert("프로필이 이 브라우저에 저장되었습니다.");
}
function loginProfile(event) {
    event.preventDefault();
    var saved = localStorage.getItem("soundtripProfile");
    if (saved == null) {
        alert("먼저 회원가입에서 프로필을 저장해주세요.");
        return;
    }
    var profile = JSON.parse(saved);
    var nickname = document.getElementById("loginName").value.trim();
    if (nickname == profile.nickname) {
        localStorage.setItem("soundtripLoggedIn", "true");
        alert(profile.nickname + "님, 환영합니다.");
        renderProfile();
    } else {
        alert("저장한 닉네임과 일치하지 않습니다.");
    }
}
function logoutProfile() {
    localStorage.removeItem("soundtripLoggedIn");
    alert("로그아웃되었습니다.");
    renderProfile();
}
function renderProfile() {
    var box = document.getElementById("profileSummary");
    if (box == null) return;
    var saved = localStorage.getItem("soundtripProfile");
    if (saved == null) {
        box.innerHTML = '<p>저장된 프로필이 없습니다. 회원가입에서 정보를 입력해보세요.</p>';
        return;
    }
    var p = JSON.parse(saved);
    var logged = localStorage.getItem("soundtripLoggedIn") == "true";
    box.innerHTML = '<p><strong>' + p.nickname + '님</strong> · ' + (logged ? '로그인 상태' : '프로필 저장됨') + '</p><p>선호 도시: ' + p.city + ' · 선호 장르: ' + p.genre + '</p>';
}
function setTodayText() {
    var box = document.getElementById("todayText");
    if (box == null) return;
    var today = new Date();
    box.innerText = today.getFullYear() + "." + (today.getMonth() + 1) + "." + today.getDate();
}

document.addEventListener("DOMContentLoaded", function() {
    addSubpageEvents();
    loadSubpageNotice();
    loadSoundTripData();
});
