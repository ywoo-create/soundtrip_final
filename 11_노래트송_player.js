/* Custom SoundTrip controls for the two track pages */
document.addEventListener("DOMContentLoaded", function() {
    var audio = document.getElementById("stAudio");
    var player = document.getElementById("stCustomPlayer");
    var playButton = document.getElementById("stPlayPauseButton");
    var previousButton = document.getElementById("stPreviousTrackButton");
    var nextButton = document.getElementById("stNextTrackButton");
    var progress = document.getElementById("stProgressRange");
    var currentTimeLabel = document.getElementById("stCurrentTime");
    var durationLabel = document.getElementById("stDuration");
    var muteButton = document.getElementById("stMuteButton");
    var volume = document.getElementById("stVolumeRange");
    var volumeValue = document.getElementById("stVolumeValue");
    var status = document.getElementById("stPlayerStatus");

    if (audio == null || player == null) return;

    function formatTime(seconds) {
        if (!isFinite(seconds) || seconds < 0) return "0:00";
        var minutes = Math.floor(seconds / 60);
        var remain = Math.floor(seconds % 60);
        if (remain < 10) remain = "0" + remain;
        return minutes + ":" + remain;
    }

    function updateProgress() {
        var percent = 0;
        if (isFinite(audio.duration) && audio.duration > 0) {
            percent = (audio.currentTime / audio.duration) * 100;
        }
        progress.value = percent;
        progress.style.background = "linear-gradient(to right, #4d5cff 0%, #4d5cff " + percent + "%, #e8e9f1 " + percent + "%, #e8e9f1 100%)";
        currentTimeLabel.innerText = formatTime(audio.currentTime);
        durationLabel.innerText = formatTime(audio.duration);
    }

    function updatePlayState() {
        if (audio.paused) {
            playButton.innerText = "▶";
            playButton.setAttribute("aria-label", "재생");
            playButton.setAttribute("title", "재생");
            player.className = "st-custom-player";
            if (audio.ended) status.innerText = "PLAYBACK COMPLETE";
            else if (audio.currentTime > 0) status.innerText = "PAUSED";
            else status.innerText = "READY TO PLAY";
        } else {
            playButton.innerText = "Ⅱ";
            playButton.setAttribute("aria-label", "일시정지");
            playButton.setAttribute("title", "일시정지");
            player.className = "st-custom-player is-playing";
            status.innerText = "NOW PLAYING";
        }
    }

    function updateVolume() {
        var value = Math.round(audio.volume * 100);
        volume.value = value;
        volumeValue.innerText = value + "%";
        volume.style.background = "linear-gradient(to right, #4d5cff 0%, #4d5cff " + value + "%, #e8e9f1 " + value + "%, #e8e9f1 100%)";
        if (audio.muted || audio.volume == 0) {
            muteButton.innerText = "×";
            muteButton.setAttribute("aria-label", "음소거 해제");
            muteButton.setAttribute("title", "음소거 해제");
        } else {
            muteButton.innerText = "♪";
            muteButton.setAttribute("aria-label", "음소거");
            muteButton.setAttribute("title", "음소거");
        }
    }

    playButton.addEventListener("click", function() {
        if (audio.paused) {
            if (audio.ended) audio.currentTime = 0;
            var playRequest = audio.play();
            if (playRequest != undefined) {
                playRequest.catch(function() {
                    status.innerText = "재생할 수 없습니다. 음원 파일을 확인해주세요.";
                });
            }
        } else {
            audio.pause();
        }
    });

    if (previousButton != null && previousButton.disabled == false) {
        previousButton.addEventListener("click", function() {
            window.location.href = previousButton.getAttribute("data-page");
        });
    }

    if (nextButton != null && nextButton.disabled == false) {
        nextButton.addEventListener("click", function() {
            window.location.href = nextButton.getAttribute("data-page");
        });
    }

    progress.addEventListener("input", function() {
        if (isFinite(audio.duration) && audio.duration > 0) {
            audio.currentTime = audio.duration * (parseFloat(progress.value) / 100);
            updateProgress();
        }
    });

    muteButton.addEventListener("click", function() {
        audio.muted = !audio.muted;
        updateVolume();
    });

    volume.addEventListener("input", function() {
        audio.volume = parseFloat(volume.value) / 100;
        audio.muted = false;
        updateVolume();
    });

    audio.addEventListener("loadedmetadata", updateProgress);
    audio.addEventListener("durationchange", updateProgress);
    audio.addEventListener("timeupdate", updateProgress);
    audio.addEventListener("play", updatePlayState);
    audio.addEventListener("pause", updatePlayState);
    audio.addEventListener("ended", function() {
        updateProgress();
        updatePlayState();
    });
    audio.addEventListener("volumechange", updateVolume);
    audio.addEventListener("waiting", function() {
        status.innerText = "LOADING AUDIO…";
    });
    audio.addEventListener("canplay", function() {
        if (audio.paused && audio.currentTime == 0) status.innerText = "READY TO PLAY";
    });
    audio.addEventListener("error", function() {
        status.innerText = "음원 파일을 불러오지 못했습니다.";
    });

    audio.volume = parseFloat(volume.value) / 100;
    updateProgress();
    updatePlayState();
    updateVolume();
});
