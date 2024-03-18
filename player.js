var youtubePlayers = [];
var videoIDs = [];
var like_count_list = [];
var comment_count_list = [];
var gesture_swipe = 'swipe';
var gesture_loop = 'loop';
var isLoop = false;
var initial_time = '';
var currentIndex = 0;
var resultCount = 50;
var playerAppend = 20;

function getQueryParam(name, url) {
    if (!url) url = window.location.href;
    name = name.replace(/[\[\]]/g, '\\$&');
    var regex = new RegExp('[?&]' + name + '(=([^&#]*)|&|#|$)');
    var results = regex.exec(url);
    if (!results) return null;
    if (!results[2]) return '';
    return decodeURIComponent(results[2].replace(/\+/g, ' '));
}

// Get the username from the URL parameter
var username = getQueryParam('username');

var test_uid = username || 'participant_test';

console.log("username in loop: " + test_uid);

// var videoIDs = [
//     'bg4I_NtOshE', 'Ksg6khWeCL8', 'WMv-yaE4YVg', 'cJVHSBr88o4', '_bFK2d5UDoc',
//     'Pb5UdTEh0l0', 'cugxnHLKo_Y', 'yhZTgFp4uDs', 'tex8V4he3AI', 'l3Y1sWE_Yr8',
// ];
// var youtube_api_key = 'AIzaSyAjSa4cR1Li5cWtE3jChY8piErqi0USjqM'

function getWeekNumber(startDate) {
    let start = new Date(startDate);
    let today = new Date();
    let diff = today - start;

    let weeksSinceStart = Math.floor(diff / (1000 * 60 * 60 * 24 * 7));

    return weeksSinceStart % 2 === 0 ? "week_1" : "week_2";
}

//get week number if low/high

function currentDate() {
    var d = new Date;
    var dformat = [
            d.getFullYear(),
            d.getMonth() + 1,
            d.getDate(),
        ].join('-') + ' ' +
        [
            d.getHours(),
            d.getMinutes(),
            d.getSeconds()
        ].join(':');
    return dformat;
}

function postWatchTime(vid, time, isStart, isSwipe) {
    var fd = new FormData();
    fd.append('uid', test_uid);
    fd.append('vid', vid);
    if (isStart) {
        fd.append('start_time', currentDate());
        if (isSwipe) {
            fd.append('start_how', gesture_swipe);
        }
        else {
            fd.append('start_how', gesture_loop);
        }
    }
    else {
        fd.append('end_time', currentDate());
        if (isSwipe) {
            fd.append('end_how', gesture_swipe);
        }
        else {
            fd.append('end_how', gesture_loop);
        }
    }
    $.ajax({
        url: 'https://youtok-api.momochi.me/SaveVideoInteraction',
        data: fd,
        processData: false,
        contentType: false,
        type: 'POST',
        success: function (data) {
            console.log('Store time in the database: ' + vid + ' ---- ' + currentDate())
        }
    });
}

function postPauseTime(uid, vid, is_pause, time) {
    var fd = new FormData();
    fd.append('uid', uid);
    fd.append('vid', vid);
    fd.append('is_pause', is_pause);
    fd.append('time', time);

    $.ajax({
        url: 'https://youtok-api.momochi.me/SavePauseData',
        data: fd,
        processData: false,
        contentType: false,
        type: 'POST',
        success: function (data) {
            console.log('Store pause time in the database!')
        }
    });
}

function onYouTubeIframeAPIReady() {
    let w = '100%';
    let h = '100%';

    console.log('iframe ready');
    for (let i = 0; i < playerAppend && i < videoIDs.length; i++) {
        id = videoIDs[i];
        var events = {
            onStateChange: onPlayerStateChange,
        };
        if (i === 0) {
            events = {
                ...events,
                onReady: onPlayerReady,
            };
        }
        const newPlayer = new YT.Player(`player-${i}`, {
            width: w,
            height: h,
            videoId: id,
            playerVars: {
                rel: 0,
                showinfo: 0,
                controls: 0,
                playsinline: 1,
                modestbranding: 1,
            },
            events: events,
        });

        youtubePlayers.push(newPlayer);
    }
}

function onPlayerStateChange(e) {
    console.log(e.data)
    if (e.data === YT.PlayerState.ENDED) {
        // e.target.playVideo();
        console.log('ENDDDDDDD!!!!!!!!!index:' + currentIndex);
        var playmode = '';
        var xhr = new XMLHttpRequest();
        xhr.open('GET', 'http://youtok-api.momochi.me/GetTreatment?uid=' + test_uid, true);
        xhr.onreadystatechange = function () {
            console.log('xhr.onreadystatechange:' + currentIndex);
            if (xhr.readyState == 4 && xhr.status == 200) {
                var response = JSON.parse(xhr.responseText);
                console.log('Playmode:', response.playmode);
                playmode = response.playmode;
                if (playmode == 'loop') {
                    console.log('!!!!!!!!replay!!!!!!!:' + currentIndex);
                    postWatchTime(videoIDs[currentIndex], currentDate(), false, false);
                    postWatchTime(videoIDs[currentIndex + 1], currentDate(), true, false);
                    isLoop = true;
                    swiper.slideNext();
                } else if (playmode == 'replay') {
                    console.log('@@@@@@@replay@@@@@@@: ' + currentIndex);
                    e.target.playVideo();
                }
            } else if (xhr.readyState == 4) {
                console.log('Error: ' + xhr.status);
            }
        }
        xhr.send();
    }
}

function onPlayerReady(event) {
    // event.target.mute();
    event.target.playVideo();
    setTimeout(function () {
        event.target.playVideo();
    }, 3000);
}

function showCommentList(vid) {
    $.ajax({
        url: 'https://youtok-api.momochi.me/GetVideoComment',
        data: { 'vid': vid },
        type: 'GET',
        success: function (data) {
            // Assuming data is an array of comments
            var commentList = data;

            var commentHTML = '';
            commentList.forEach(function (comment, index) {
                // commentHTML += '<li class="comment-item">' + comment + '</li>';
                commentHTML += '<li class="comment-item">' +
                    '<div class="comment-header">' +
                    '<img src="' + comment.profile_image_url + '" alt="Profile Photo" class="profile-photo">' +
                    '<span class="author-name">' + comment.author_name + '  ' + comment.publish_date + '</span>' +
                    '</div>' +
                    '<div class="comment-text">' + comment.comment + '</div>' +
                    '<div class="like-section">' +
                    '<img src="img/like.svg" alt="Like" class="like-icon">' +
                    '<span class="like-count">' + comment.like_count + '      </span>' +
                    '<img src="img/dislike.svg" alt="Dislike" class="other-icon">' +
                    '<img src="img/comment.svg" alt="Comment" class="other-icon">' +
                    '</div>' +
                    '</li>';
            });

            // Add a text input section for comments
            commentHTML += '<div class="comment-input-section">' +
                '<input type="text" id="comment-input" placeholder="Type your comment">' +
                '<button id="comment-submit">' +
                '<img src="img/send.svg" alt="Submit">' +
                '</button>' +
                '</div>';

            $('#comment-list').html(commentHTML);

            $('#commentModal').modal('show');

            $('#comment-submit').click(function () {
                var commentText = $('#comment-input').val();
                if (commentText) {
                    var fd = new FormData();
                    fd.append('uid', test_uid);
                    fd.append('vid', vid);
                    fd.append('new_comment', commentText);
                    $.ajax({
                        url: 'https://youtok-api.momochi.me/SaveUserNewComment',
                        data: fd,
                        processData: false,
                        contentType: false,
                        type: 'POST',
                        success: function (data) {
                            console.log('Store a new comment in the database!!!!!')
                        }
                    });
                }
                $('#comment-input').val('');
            });
        },
        error: function (xhr, status, error) {
            console.log('Error:', error);
        }
    });
}

//websocket io
// const socket = io('https://youtok-api.momochi.me');

window.addEventListener('beforeunload', function (event) {
    var xhr = new XMLHttpRequest();
    xhr.open('GET', 'https://youtok-api.momochi.me/notify_disconnect', false);
    xhr.send();
});
window.addEventListener('unload', () => {
    const xhr = new XMLHttpRequest();
    xhr.open('GET', 'https://youtok-api.momochi.me/notify_disconnect', true);
    xhr.send();
});

// var QueryVideoByUID_url = 'https://youtok-api.momochi.me/QueryVideoByUID';
var QueryVideoByUID_url = 'https://youtok-api.momochi.me/GetEverydayVideoListForUser';
QueryVideoByUID_url += '?uid=' + encodeURIComponent(test_uid);

function addMoreVideoPlayers() {
    let w = '100%';
    let h = '100%';
    const startIndex = youtubePlayers.length;
    console.log('@@@@@@@@@@@@addMoreVideoPlayers@@@@@@@@@@@@@@@');
    for (let i = startIndex; i < startIndex + playerAppend && i < videoIDs.length; i++) {
        id = videoIDs[i];
        swiper.appendSlide(`
                <div class="swiper-slide">
                <div class="actions">
                <img id="like-${i}" src="img/like.svg" />
                <p>${like_count_list[i]}</p>
                <img id="dislike-${i}" src="img/dislike.svg" />
                <p>Dislike</p>
                <img id="comment-${i}" src="img/comment.svg" />
                <p>${comment_count_list[i]}</p>
                <img id="share-${i}" src="img/share.svg" />
                <p>Share</p>
            </div>
                    <div id="overlay-${i}" class="overlay"></div>
                    <div id="player-${i}"></div>
                </div>
            `);


        const newPlayer = new YT.Player(`player-${i}`, {
            width: w,
            height: h,
            videoId: id,
            playerVars: {
                rel: 0,
                showinfo: 0,
                controls: 0,
                playsinline: 1,
                modestbranding: 1,
            },
            events: {
                onStateChange: onPlayerStateChange,
            },
        });

        youtubePlayers.push(newPlayer);

        $(`#like-${i}`).click(function () {
            var self = this;
            var fd = new FormData();
            fd.append('uid', test_uid);
            fd.append('vid', videoIDs[i]);
            // fd.append( 'start_time', video_start_time);
            // fd.append( 'end_time', currentDate());
            // fd.append('start_how', gesture);
            // fd.append('end_how', gesture);
            fd.append('liked', $(this).attr('class') === 'active' ? 'false' : 'true');
            fd.append('liked_datetime', currentDate());
            //when clicking "like", unchecking "dislike"
            $(this).attr('class') === 'active' ? 'false' : $(`#dislike-${i}`).removeClass('active');
            $.ajax({
                url: 'https://youtok-api.momochi.me/SaveVideoInteraction',
                data: fd,
                processData: false,
                contentType: false,
                type: 'POST',
                success: function (data) {
                    $(self).toggleClass('active');
                }
            });
        });
        $(`#dislike-${i}`).click(function () {
            var self = this;
            var fd = new FormData();
            fd.append('uid', test_uid);
            fd.append('vid', videoIDs[i]);
            // fd.append( 'start_time', video_start_time);
            // fd.append( 'end_time', currentDate());
            // fd.append('start_how', gesture);
            // fd.append('end_how', gesture);
            fd.append('disliked', $(this).attr('class') === 'active' ? 'false' : 'true');
            fd.append('disliked_datetime', currentDate());
            //when clicking "dislike", unchecking "like"
            $(this).attr('class') === 'active' ? 'false' : $(`#like-${i}`).removeClass('active');

            $.ajax({
                url: 'https://youtok-api.momochi.me/SaveVideoInteraction',
                data: fd,
                processData: false,
                contentType: false,
                type: 'POST',
                success: function (data) {
                    $(self).toggleClass('active');
                }
            });
        });
        $(`#comment-${i}`).click(function () {
            // $(this).toggleClass('active');
            showCommentList(videoIDs[i]);
        });
        $(`#share-${i}`).click(function () {
            var self = this;
            var fd = new FormData();
            fd.append('uid', test_uid);
            fd.append('vid', videoIDs[i]);
            // fd.append( 'start_time', video_start_time);
            // fd.append( 'end_time', currentDate());
            // fd.append('start_how', gesture);
            // fd.append('end_how', gesture);
            fd.append('share', $(this).attr('class') === 'active' ? 'false' : 'true');
            fd.append('share_datetime', currentDate());

            $.ajax({
                url: 'https://youtok-api.momochi.me/SaveVideoInteraction',
                data: fd,
                processData: false,
                contentType: false,
                type: 'POST',
                success: function (data) {
                    $(self).toggleClass('active');
                }
            });
        });
        $(`#overlay-${i}`).click(function () {
            if (youtubePlayers[i].getPlayerState() == YT.PlayerState.PAUSED) {
                youtubePlayers[i].playVideo();
                postPauseTime(test_uid, videoIDs[i], 'false', currentDate())
            }
            else {
                youtubePlayers[i].pauseVideo();
                postPauseTime(test_uid, videoIDs[i], 'true', currentDate())
            }
        });

    }
    swiper.update();
}

$.ajax({
    url: QueryVideoByUID_url,
    type: 'GET',
    success: function (data) {
        console.log(data);
        videoIDs = data["video_id_list"];
        like_count_list = data['likeCount_list'];
        comment_count_list = data['commentCount_list'];
        console.log('like_count_list!!!!!!: ' + like_count_list);
        console.log('comment_count_list!!!!!!: ' + comment_count_list);
        console.log('video id list: ' + videoIDs);
        console.log('Number of videos: ', videoIDs.length);

        for (let i = 0; i < playerAppend && i < videoIDs.length; i++) {
            id = videoIDs[i];
            swiper.appendSlide(`
                    <div class="swiper-slide">
                        <div class="actions">
                            <img id="like-${i}" src="img/like.svg" />
                            <p>${formatNumber(Number(like_count_list[i]))}</p>
                            <img id="dislike-${i}" src="img/dislike.svg" />
                            <p>Dislike</p>
                            <img id="comment-${i}" src="img/comment.svg" />
                            <p>${formatNumber(Number(comment_count_list[i]))}</p>
                            <img id="share-${i}" src="img/share.svg" />
                            <p>Share</p>
                        </div>
                        <div id="overlay-${i}" class="overlay"></div>
                        <div id="player-${i}"></div>
                    </div>
                `);

            $(`#like-${i}`).click(function () {
                var self = this;
                var fd = new FormData();
                fd.append('uid', test_uid);
                fd.append('vid', videoIDs[i]);
                // fd.append( 'start_time', video_start_time);
                // fd.append( 'end_time', currentDate());
                // fd.append('start_how', gesture);
                // fd.append('end_how', gesture);
                fd.append('liked', $(this).attr('class') === 'active' ? 'false' : 'true');
                fd.append('liked_datetime', currentDate());
                //when clicking "like", unchecking "dislike"
                $(this).attr('class') === 'active' ? 'false' : $(`#dislike-${i}`).removeClass('active');
                $.ajax({
                    url: 'https://youtok-api.momochi.me/SaveVideoInteraction',
                    data: fd,
                    processData: false,
                    contentType: false,
                    type: 'POST',
                    success: function (data) {
                        $(self).toggleClass('active');
                    }
                });
            });
            $(`#dislike-${i}`).click(function () {
                var self = this;
                var fd = new FormData();
                fd.append('uid', test_uid);
                fd.append('vid', videoIDs[i]);
                // fd.append( 'start_time', video_start_time);
                // fd.append( 'end_time', currentDate());
                // fd.append('start_how', gesture);
                // fd.append('end_how', gesture);
                fd.append('disliked', $(this).attr('class') === 'active' ? 'false' : 'true');
                fd.append('disliked_datetime', currentDate());
                //when clicking "dislike", unchecking "like"
                $(this).attr('class') === 'active' ? 'false' : $(`#like-${i}`).removeClass('active');

                $.ajax({
                    url: 'https://youtok-api.momochi.me/SaveVideoInteraction',
                    data: fd,
                    processData: false,
                    contentType: false,
                    type: 'POST',
                    success: function (data) {
                        $(self).toggleClass('active');
                    }
                });
            });
            $(`#comment-${i}`).click(function () {
                // $(this).toggleClass('active');
                showCommentList(videoIDs[i]);
            });
            $(`#share-${i}`).click(function () {
                var self = this;
                var fd = new FormData();
                fd.append('uid', test_uid);
                fd.append('vid', videoIDs[i]);
                // fd.append( 'start_time', video_start_time);
                // fd.append( 'end_time', currentDate());
                // fd.append('start_how', gesture);
                // fd.append('end_how', gesture);
                fd.append('share', $(this).attr('class') === 'active' ? 'false' : 'true');
                fd.append('share_datetime', currentDate());

                $.ajax({
                    url: 'https://youtok-api.momochi.me/SaveVideoInteraction',
                    data: fd,
                    processData: false,
                    contentType: false,
                    type: 'POST',
                    success: function (data) {
                        $(self).toggleClass('active');
                    }
                });
            });
            $(`#overlay-${i}`).click(function () {
                if (youtubePlayers[i].getPlayerState() == YT.PlayerState.PAUSED) {
                    youtubePlayers[i].playVideo();
                    postPauseTime(test_uid, videoIDs[i], 'false', currentDate())
                }
                else {
                    youtubePlayers[i].pauseVideo();
                    postPauseTime(test_uid, videoIDs[i], 'true', currentDate())
                }
            });

        }

        swiper.update();

        initial_time = currentDate();
        console.log("&&&&&&&&&&&&&&&&&&initial time%%%%%%%%%%%%%:" + initial_time);
        postWatchTime(videoIDs[0], initial_time, true, true);

        var tag = document.createElement('script');
        tag.src = "https://www.youtube.com/iframe_api";

        var firstScriptTag = document.getElementsByTagName('script')[0];
        firstScriptTag.parentNode.insertBefore(tag, firstScriptTag);

    },
    error: function (xhr, status, error) {
        console.log('Error:', error);
    }
});

swiper = new Swiper('.swiper-container', {
    direction: "vertical",
    // pagination: {
    //     el: '.swiper-pagination',
    // },
    navigation: {
        // nextEl: '.swiper-button-next',
        // prevEl: '.swiper-button-prev',
    },
});

swiper.on('transitionStart', function () {
    console.log('youtubePlayers.length: ' + youtubePlayers.length)
    for (const yt of youtubePlayers) {
        if (yt && typeof yt.pauseVideo === 'function') {
            yt.pauseVideo();
        } else {
            console.error('yt is not a valid YouTube player.');
        }
    }
});

swiper.on('transitionEnd', function () {
    var index = this.realIndex;
    currentIndex = index;
    console.log('!!index: ' + index);
    var slide = document.getElementsByClassName('swiper-slide')[index];
    var slideVideo = slide.getElementsByTagName('iframe')[0];
    var slideVideoId = slideVideo.getAttribute('id');

    console.log('!!slide: ' + slide);
    console.log('!!slideVideo: ' + slideVideo);
    console.log('!!slideVideoId: ' + slideVideoId);

    if (currentIndex === 10 || currentIndex % 20 === 10) {
        addMoreVideoPlayers();
    }

    // if (currentIndex === 25 || currentIndex % 50 === 25) {
    //     queryMoreVideos();
    // }

    if (slideVideo != null || slideVideo != undefined) {
        // youtubePlayers[index].mute();
        youtubePlayers[index].playVideo();
        // store start_time and end_time
        if (!isLoop){
            postWatchTime(videoIDs[index], currentDate(), true, true);
            if (index != 0)
            {
                postWatchTime(videoIDs[index - 1], currentDate(), false, true);
            }
            isLoop = false;
        }
    }
});

function formatNumber(number) {
    if (number >= 1000000) {
        return (number / 1000000).toFixed(1) + 'm';
    } else if (number >= 1000) {
        return (number / 1000).toFixed(1) + 'k';
    } else {
        return number.toString();
    }
}