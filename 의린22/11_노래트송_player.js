/* 하단 고정 음악 재생기
   오디오 하나를 상단 큰 재생 버튼과 하단 재생 버튼이 함께 조작합니다. */
window.addEventListener("load", function() {
  var audio = document.getElementById("stAudio");
  var playButton = document.getElementById("stPlayPauseButton");
  var heroPlayButton = document.getElementById("stHeroPlayPauseButton");
  var previousButton = document.getElementById("stPreviousTrackButton");
  var nextButton = document.getElementById("stNextTrackButton");
  var progress = document.getElementById("stProgressRange");
  var progressFill = document.getElementById("stProgressFill");
  var currentTimeLabel = document.getElementById("stCurrentTime");
  var durationLabel = document.getElementById("stDuration");
  var muteButton = document.getElementById("stMuteButton");
  var muteIcon = document.getElementById("stMuteIcon");
  var volume = document.getElementById("stVolumeRange");
  var playIcon = document.getElementById("stPlayPauseIcon");
  var heroPlayIcon = document.getElementById("stHeroPlayPauseIcon");

  if (audio == null || playButton == null || progress == null) return;

  function formatTime(seconds) {
    if (!(seconds >= 0)) return "0:00";
    var minutes = Math.floor(seconds / 60);
    var remain = Math.floor(seconds % 60);
    if (remain < 10) remain = "0" + remain;
    return minutes + ":" + remain;
  }

  function updateProgress() {
    var percent = 0;
    if (audio.duration > 0) {
      percent = (audio.currentTime / audio.duration) * 100;
    }

    if (percent < 0) percent = 0;
    if (percent > 100) percent = 100;
    progress.value = percent;
    if (progressFill != null) progressFill.style.width = percent + "%";

    currentTimeLabel.innerText = formatTime(audio.currentTime);
    durationLabel.innerText = formatTime(audio.duration);
  }

  function updatePlayState() {
    if (audio.paused) {
      playIcon.src = "11_play-fill-w.svg";
      heroPlayIcon.src = "11_play-fill-w.svg";
      playButton.setAttribute("aria-label", "재생");
      heroPlayButton.setAttribute("aria-label", "재생");
    } else {
      playIcon.src = "11_pause-w.svg";
      heroPlayIcon.src = "11_pause-w.svg";
      playButton.setAttribute("aria-label", "일시정지");
      heroPlayButton.setAttribute("aria-label", "일시정지");
    }
  }

  function togglePlayback() {
    if (audio.paused) audio.play();
    else audio.pause();
  }

  function updateVolume() {
    volume.value = Math.round(audio.volume * 100);
    if (audio.muted || audio.volume == 0) {
      muteIcon.src = "11_volume-off.svg";
      muteButton.setAttribute("aria-label", "음소거 해제");
    } else {
      muteIcon.src = "11_volume.svg";
      muteButton.setAttribute("aria-label", "음소거");
    }
  }

  playButton.addEventListener("click", togglePlayback);
  heroPlayButton.addEventListener("click", togglePlayback);

  previousButton.addEventListener("click", function() {
    var page = previousButton.getAttribute("data-page");
    if (page != null && page != "") window.location.href = page;
  });
  nextButton.addEventListener("click", function() {
    var page = nextButton.getAttribute("data-page");
    if (page != null && page != "") window.location.href = page;
  });

  progress.addEventListener("input", function() {
    if (audio.duration > 0) {
      audio.currentTime = audio.duration * (progress.value / 100);
      updateProgress();
    }
  });

  muteButton.addEventListener("click", function() {
    audio.muted = !audio.muted;
    updateVolume();
  });
  volume.addEventListener("input", function() {
    audio.volume = volume.value / 100;
    audio.muted = false;
    updateVolume();
  });

  audio.addEventListener("loadedmetadata", updateProgress);
  audio.addEventListener("durationchange", updateProgress);
  audio.addEventListener("timeupdate", updateProgress);
  audio.addEventListener("play", updatePlayState);
  audio.addEventListener("pause", updatePlayState);
  audio.addEventListener("volumechange", updateVolume);
  audio.addEventListener("ended", function() {
    updateProgress();
    updatePlayState();
    recordArrival(document.body.getAttribute("data-track-id"));
  });

  audio.volume = volume.value / 100;
  updateProgress();
  updatePlayState();
  updateVolume();
});
