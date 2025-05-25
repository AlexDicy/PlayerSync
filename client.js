let webSocket;
let shouldKeepAlive = true;
let shouldSkipEvents = false;
let shouldSkipEventsTimeout = null;

function start(videoElement) {
  if (!videoElement) {
    throw new Error("Video element is required");
  }

  let keepAliveTimer;

  // webSocket = new WebSocket(`ws://localhost:8080`);
  webSocket = new WebSocket(`wss://playersync.onrender.com`);
  webSocket.onopen = () => {
    console.log("WebSocket connection established");
    keepAliveTimer = setInterval(() => {
      if (webSocket.readyState === WebSocket.OPEN) {
        webSocket.send(JSON.stringify({type: 'ping'}));
      }
    }, 5000);
  };
  webSocket.onmessage = (event) => {
    if (shouldSkipEvents) {
      return;
    }
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
      case 'ping':
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
    clearInterval(keepAliveTimer);
    if (shouldKeepAlive) {
      setTimeout(() => start(videoElement), 1000); // Attempt to reconnect after 1 second
    }
  };

  videoElement.addEventListener('play', () => {
    if (webSocket.readyState === WebSocket.OPEN) {
      skipEvents();
      webSocket.send(JSON.stringify({type: 'play'}));
    }
  });

  videoElement.addEventListener('pause', () => {
    if (webSocket.readyState === WebSocket.OPEN) {
      skipEvents();
      webSocket.send(JSON.stringify({type: 'pause'}));
    }
  });

  videoElement.addEventListener('seeked', () => {
    if (webSocket.readyState === WebSocket.OPEN) {
      skipEvents();
      webSocket.send(JSON.stringify({type: 'seek', currentTime: videoElement.currentTime}));
    }
  });
}

function skipEvents() {
  shouldSkipEvents = true;
  if (shouldSkipEventsTimeout) {
    clearTimeout(shouldSkipEventsTimeout);
  }
  shouldSkipEventsTimeout = setTimeout(() => {
    shouldSkipEvents = false;
    shouldSkipEventsTimeout = null;
  }, 120);
}

function stop() {
  shouldKeepAlive = false;
  if (webSocket) {
    webSocket.close();
  }
}
