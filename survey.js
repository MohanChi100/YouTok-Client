document.addEventListener('DOMContentLoaded', function() {
    let keywords = [];

    document.getElementById('addKeyword').addEventListener('click', function() {
        let keywordInput = document.getElementById('keywordInput');
        let keyword = keywordInput.value.trim();
        if (keyword) {
            keywords.push(keyword);
            updateKeywordsList();
            keywordInput.value = '';
        }
    });

    function updateKeywordsList() {
        let list = document.getElementById('keywordsList');
        list.innerHTML = '';
        keywords.forEach(function(keyword) {
            let li = document.createElement('li');
            li.textContent = keyword;
            list.appendChild(li);
        });
    }

    document.getElementById('surveyForm').addEventListener('submit', function(event) {
        event.preventDefault();

        const username = sessionStorage.getItem('username');
        // Required fields
        var uid = username;
        console.log("!!!!!!!!!username: " + uid);
        var sessionDurationMinutes = document.getElementById('watchTime').value;
        var videoCount = document.getElementById('videoCount').value;
        var satisfactionRating = document.querySelector('input[name="rating"]:checked')

        // Check if all required fields are filled
        if (!uid || !sessionDurationMinutes || !videoCount || !satisfactionRating) {
            alert('Please complete all required fields.');
            return;  // Stop the form submission
        }

        // Convert numeric values from strings to integers
        // sessionDurationMinutes = parseInt(sessionDurationMinutes, 10);
        // videoCount = parseInt(videoCount, 10);
        satisfactionRating = parseInt(satisfactionRating.value, 10);

        // Optional fields
        var videoCharacters = document.getElementById('videoCharacters').value;
        var lastVideoDescription = document.getElementById('lastVideoDescription').value;
        var sessionKeywords = document.getElementById('sessionKeywords').value;
        var interestKeywords = keywords.join(', ');
        var favoriteVideoDescription = document.getElementById('favoriteVideoDescription').value;

        console.log('UID:', uid);
        console.log('Session Duration (Minutes):', sessionDurationMinutes);
        console.log('Video Count:', videoCount);
        console.log('Satisfaction Rating:', satisfactionRating);
        console.log('Video Characters:', videoCharacters);
        console.log('Last Video Description:', lastVideoDescription);
        console.log('Session Keywords:', sessionKeywords);
        console.log('Interest Keywords:', interestKeywords);
        console.log('Favorite Video Description:', favoriteVideoDescription);

        // Prepare the survey data object
        var surveyData = {
            uid: uid,
            session_duration_minutes: sessionDurationMinutes,
            video_count: videoCount,
            video_characters: videoCharacters,
            last_video_description: lastVideoDescription,
            session_keywords: sessionKeywords,
            satisfaction_rating: satisfactionRating,
            interest_keywords: interestKeywords,
            favorite_video_description: favoriteVideoDescription
        };

        // Send the survey data to the server
        fetch('https://youtok-api.momochi.me/saveSurveyResponse', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(surveyData)
        })
            .then(response => {
                if (!response.ok) {
                    throw new Error('Network response was not ok');
                }
                return response.json();
            })
            .then(data => {
                console.log('Success:', data);
                alert('Survey Submitted Successfully');
            })
            .catch((error) => {
                console.error('Error:', error);
                alert('An error occurred while submitting the survey');
            });
    });
});
