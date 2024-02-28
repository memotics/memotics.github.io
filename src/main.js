const video = document.getElementById('main-video');
let lastScrollPos = 0;
let isTouchDevice = false;

// Check if the device supports touch events
if ('ontouchstart' in window || navigator.maxTouchPoints) {
    isTouchDevice = true;
}

// Add event listeners based on device type
if (isTouchDevice) {
    document.addEventListener('touchmove', handleTouchMove, { passive: false });
} else {
    document.addEventListener('wheel', handleWheel, { passive: false });
}

function handleWheel(event) {
    // Determine the direction of scroll
    const scrollDirection = event.deltaY > 0 ? 'down' : 'up';

    // Update the last scroll position
    lastScrollPos += event.deltaY;

    updateVideoPlayback(scrollDirection);
}

function handleTouchMove(event) {
    // Get the touch position
    const touchY = event.touches[0].clientY;

    // Determine the direction of touch move
    const touchDirection = touchY > lastScrollPos ? 'up' : 'down';

    // Update the last touch position
    lastScrollPos = touchY;

    updateVideoPlayback(touchDirection);
}

function updateVideoPlayback(direction) {
    // Adjust the video playback based on the scroll direction
    if (direction === 'down') {
        video.currentTime += 0.1; // Forward playback
    } else if (direction === 'up') {
        video.currentTime -= 0.1; // Backward playback
    }
}

// Listen for the ended event of the video to detect when it reaches its end
video.addEventListener('ended', function() {
    // Perform any action you want when the video ends
    console.log('End of video reached!');
    video.style.display = 'none';
    video.style.pointerEvents = "none";
    video.parentElement.style.pointerEvents = "none";
});
