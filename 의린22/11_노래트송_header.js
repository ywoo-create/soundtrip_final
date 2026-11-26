function updateSoundTripHeaderAccount() {
  var accountMenu = document.querySelector(".account-menu");
  if (accountMenu == null) return;

  var profile = null;
  var savedProfile = localStorage.getItem("soundtripProfile");
  if (savedProfile != null && savedProfile != "") {
    profile = JSON.parse(savedProfile);
  }

  var loggedIn = localStorage.getItem("soundtripLoggedIn") == "true";
  if (loggedIn && profile != null && profile.nickname != "") {
    accountMenu.innerHTML = "";
    accountMenu.className = "account-menu is-logged-in";

    var welcome = document.createElement("span");
    welcome.className = "account-welcome";
    welcome.innerText = profile.nickname + "님 환영합니다";
    accountMenu.appendChild(welcome);

    var dividerOne = document.createElement("span");
    dividerOne.className = "account-divider";
    dividerOne.innerText = "|";
    accountMenu.appendChild(dividerOne);

    var logoutButton = document.createElement("button");
    logoutButton.className = "account-logout-button";
    logoutButton.type = "button";
    logoutButton.innerText = "로그아웃";
    logoutButton.addEventListener("click", function() {
      localStorage.removeItem("soundtripLoggedIn");
      sessionStorage.removeItem("soundtripLoggedIn");
      alert("로그아웃되었습니다.");
      window.location.href = "11_노래트송_index.html";
    });
    accountMenu.appendChild(logoutButton);

    var dividerTwo = document.createElement("span");
    dividerTwo.className = "account-divider";
    dividerTwo.innerText = "|";
    accountMenu.appendChild(dividerTwo);

    var myMusic = document.createElement("a");
    myMusic.href = "11_노래트송_mymusic.html";
    myMusic.innerText = "MY MUSIC";
    accountMenu.appendChild(myMusic);

    // 로그인 상태에서는 전체 카테고리의 로그인 링크를 숨김
    var categoryMenu = document.getElementById("categoryMenu");
    if (categoryMenu != null) {
      var categoryLinks = categoryMenu.getElementsByTagName("a");
      for (var i = 0; i < categoryLinks.length; i++) {
        if (categoryLinks[i].getAttribute("href") == "11_노래트송_account.html") {
          categoryLinks[i].remove();
          break;
        }
      }
    }
  }
}

document.addEventListener("DOMContentLoaded", function() {
  updateSoundTripHeaderAccount();

  var categoryButton = document.getElementById("categoryButton");
  var categoryMenu = document.getElementById("categoryMenu");

  if (categoryButton != null && categoryMenu != null) {
    categoryButton.addEventListener("click", function() {
      if (categoryMenu.style.display == "block") {
        categoryMenu.style.display = "none";
        categoryButton.setAttribute("aria-expanded", "false");
      } else {
        categoryMenu.style.display = "block";
        categoryButton.setAttribute("aria-expanded", "true");
      }
    });
  }
});
