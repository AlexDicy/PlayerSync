let webSocket;
let shouldKeepAlive = true;

function start(videoElement) {
  if (!videoElement) {
    throw new Error("Video element is required");
  }

  webSocket = new WebSocket(`ws://localhost:8080`);
  webSocket.onopen = () => {
    console.log("WebSocket connection established");
  };
  webSocket.onmessage = (event) => {
    console.log("Message from server:", event.data);
    const message = JSON.parse(event.data);
    switch (message.type) {
      case 'play':
        videoElement.play();
        break;
      case 'pause':
        videoElement.pause();
        break;
      case 'seek':
        videoElement.currentTime = message.currentTime;
        break;
      default:
        console.warn("Unknown message type:", message.type);
    }
  };

  webSocket.onerror = (error) => {
    console.error("WebSocket error:", error);
  };

  webSocket.onclose = () => {
    console.log("WebSocket connection closed");
    if (shouldKeepAlive) {
      setTimeout(() => start(videoElement), 1000); // Attempt to reconnect after 1 second
    }
  };

  videoElement.addEventListener('play', () => {
    if (webSocket.readyState === WebSocket.OPEN) {
      webSocket.send(JSON.stringify({type: 'play'}));
    }
  });

  videoElement.addEventListener('pause', () => {
    if (webSocket.readyState === WebSocket.OPEN) {
      webSocket.send(JSON.stringify({type: 'pause'}));
    }
  });

  videoElement.addEventListener('seeked', () => {
    if (webSocket.readyState === WebSocket.OPEN) {
      webSocket.send(JSON.stringify({type: 'seek', currentTime: videoElement.currentTime}));
    }
  });
}

function stop() {
  shouldKeepAlive = false;
  if (webSocket) {
    webSocket.close();
  }
}
