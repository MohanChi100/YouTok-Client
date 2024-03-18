var youtubePlayers = [];
var videoIDs = [];
var like_count_list = [];
var comment_count_list = [];
var gesture = 'grid'
var current_video_id = 'ZC1L8cCJJes';
var thumbnail_list=[];
var video_list=[];
var resultCount=50;

function getQueryParam(name, url) {
    if (!url) url = window.location.href;
    name = name.replace(/[\[\]]/g, '\\$&');
    var regex = new RegExp('[?&]' + name + '(=([^&#]*)|&|#|$)');
    var results = regex.exec(url);
    if (!results) return null;
    if (!results[2]) return '';
    return decodeURIComponent(results[2].replace(/\+/g, ' '));
}

var username = getQueryParam('username');
var test_uid = username || 'participant_test';

function generateThumbnails() {
    var spinner = new Spin.Spinner({
        color: '#ffffff', // CSS color or array of colors
    }).spin(document.getElementsByClassName('grid').item(0));

    if (thumbnail_list.length === 0 || video_list.length === 0) {
        // Request data using AJAX
        var fd = new FormData();
        fd.append('uid', test_uid);
        var queryString = new URLSearchParams(fd).toString();
        $.ajax({
            url: 'https://youtok-api.momochi.me/GetEverydayVideoListForUserThumbnail?' + queryString,
            // url: 'https://youtok-api.momochi.me/GetThumbnailListInLikeTable',
            // data: {fd},
            type: 'GET',
            success: function (data) {
                console.log('get thumbnail list: '+ data);
                data.forEach(video => {

                    const thumbnail = document.createElement('div');
                    thumbnail.className = 'video-thumbnail-div';
                    thumbnail.style.backgroundImage = 'url('+video.thumbnail_path+')';
                    thumbnail_list.push(thumbnail.src);
                    thumbnail.setAttribute('data-video', video.video_id);
                    video_list.push(video.video_id);
                    thumbnail.alt = 'Video';

                    const titleElement = document.createElement('div');
                    titleElement.className = 'video-title';
                    titleElement.textContent = video.title;
                    titleElement.style.overflow = 'hidden';

                    const creatorElement = document.createElement('div');
                    creatorElement.className = 'video-creator';
                    creatorElement.textContent = video.creator;
                    creatorElement.style.color = '#777';

                    const viewcountElement = document.createElement('div');
                    viewcountElement.className = 'video-viewcount';
                    viewcountElement.textContent = formatNumber(Number(video.viewcount)) + ' views';
                    viewcountElement.style.color = '#777';
                    viewcountElement.style.fontSize = 'smaller';

                    const videoContainer = document.createElement('div');
                    videoContainer.className = 'video-container';
                    videoContainer.appendChild(thumbnail);
                    videoContainer.appendChild(titleElement);
                    videoContainer.appendChild(creatorElement);
                    videoContainer.appendChild(viewcountElement);

                    videoContainer.addEventListener('click', () => {
                        const videoId = thumbnail.getAttribute('data-video');
                        console.log('from ajax!!!!!!!!: ' + videoId);
                        current_video_id = videoId;
                        window.location.href = `grid-player.html?username=${test_uid}&video_id=${current_video_id}&like_count=${video.likeCount}&comment_count=${video.commentCount}`;
                    });
                    videoGrid.appendChild(videoContainer);
                });
                spinner.stop();
            }
        });
    }
}

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

function postWatchTime(vid, time, isStart) {
    var fd = new FormData();
    fd.append('uid', test_uid);
    fd.append('vid', vid);
    if (isStart) {
        fd.append('start_time', currentDate());
    } else {
        fd.append('end_time', currentDate());
    }
    fd.append('start_how', gesture);
    fd.append('end_how', gesture);

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

function go_back_to_grid(){
    document.getElementById('back').addEventListener('click', function () {
        postWatchTime(current_video_id, currentDate(), false);
        console.log("BACK!!!!!!!!!!!!!!!!!!!!!!!!!");
        window.history.back();
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

    youtubePlayers = videoIDs.map((id, i) => {
        console.log('video ID : ' + videoIDs[i]);
        var events = {
            onStateChange: onPlayerStateChange,
        };
        if (i === 0) {
            events = {
                ...events,
                onReady: onPlayerReady,
            };
        }

        return new YT.Player(`player-${i}`, {
            width: w,
            height: h,
            videoId: id,
            playerVars: {
                rel: 0, // Set rel=0 to disable related videos when the player starts.
                showinfo: 0,
                controls: 0,
                modestbranding: 1,
            },
            events: events,
        });
    });
}

function onPlayerStateChange(e) {
    if (e.data === YT.PlayerState.ENDED) {
        e.target.playVideo();
    }
    // else if (e.data === YT.PlayerState.PAUSED) {
    //     e.target.setOption('rel', 0);
    //     if (e.target.getIframe().nextElementSibling) {
    //         e.target.getIframe().nextElementSibling.style.display = 'none';
    //     }
    // }
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
        success: function(data) {
            // Assuming data is an array of comments
            var commentList = data;

            var commentHTML = '';
            commentList.forEach(function(comment, index) {
                // commentHTML += '<li class="comment-item">' + comment + '</li>';
                commentHTML += '<li class="comment-item">' +
                    '<div class="comment-header">' +
                    '<img src="' + comment.profile_image_url + '" alt="Profile Photo" class="profile-photo">' +
                    '<span class="author-name">' + comment.author_name + '  '+ comment.publish_date +  '</span>' +
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
                    fd.append( 'uid', test_uid );
                    fd.append( 'vid', vid);
                    fd.append( 'new_comment', commentText);
                    $.ajax({
                        url: 'https://youtok-api.momochi.me/SaveUserNewComment',
                        data: fd,
                        processData: false,
                        contentType: false,
                        type: 'POST',
                        success: function(data){
                            console.log('Store a new comment in the database!!!!!')
                        }
                    });
                }
                $('#comment-input').val('');
            });
        },
        error: function(xhr, status, error) {
            console.log('Error:', error);
        }
    });
}

function loadVideo() {
    current_video_id = getQueryParam('video_id');
    current_like_count = getQueryParam('like_count');
    current_comment_count = getQueryParam('comment_count');
    console.log('from loadvideo!!!!!!!!: ' + current_video_id);
    postWatchTime(current_video_id, currentDate(), true);
    videoIDs.push(current_video_id);
    like_count_list.push(current_like_count);
    comment_count_list.push(current_comment_count);
    videoIDs.forEach((id, i) => {
        $('.swiper-wrapper').append(`
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
            fd.append('start_how', gesture);
            fd.append('end_how', gesture);
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
            fd.append('start_how', gesture);
            fd.append('end_how', gesture);
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
            fd.append('start_how', gesture);
            fd.append('end_how', gesture);
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
                postPauseTime(test_uid, videoIDs[i], 'false', currentDate());
            } else {
                youtubePlayers[i].pauseVideo();
                postPauseTime(test_uid, videoIDs[i], 'true', currentDate());
            }
        });
    })

    const swiper = new Swiper('.swiper-container', {
        direction: "vertical",
        pagination: {
            el: '.swiper-pagination',
        },
        navigation: {
            // nextEl: '.swiper-button-next',
            // prevEl: '.swiper-button-prev',
        },
    });

    swiper.on('transitionStart', function () {
        for (const yt of youtubePlayers) {
            yt.pauseVideo();
        }
        // yt['player1'].pauseVideo();
        // yt['player2'].pauseVideo();
        // yt['player3'].pauseVideo();
    });

    swiper.on('transitionEnd', function () {

        var index = this.realIndex;
        var slide = document.getElementsByClassName('swiper-slide')[index];
        var slideVideo = slide.getElementsByTagName('iframe')[0];
        var slideVideoId = slideVideo.getAttribute('id');

        console.log(index, slide, slideVideo, slideVideoId);

        if (slideVideo != null || slideVideo != undefined) {
            // youtubePlayers[index].mute();
            youtubePlayers[index].playVideo();
            // store start_time and end_time
            postWatchTime(videoIDs[index], currentDate(), true);
            if (index != 0)
                postWatchTime(videoIDs[index - 1], currentDate(), false);
        }
    });

    var tag = document.createElement('script');
    tag.src = "https://www.youtube.com/iframe_api";

    var firstScriptTag = document.getElementsByTagName('script')[0];
    firstScriptTag.parentNode.insertBefore(tag, firstScriptTag);
}

function formatNumber(number) {
    if (number >= 1000000) {
        return (number / 1000000).toFixed(1) + 'm';
    } else if (number >= 1000) {
        return (number / 1000).toFixed(1) + 'k';
    } else {
        return number.toString();
    }
}
