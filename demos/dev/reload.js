// Connect to the server and reload the page if the server sends a reload message
const connectToEvents = () => {
  const events = new EventSource('/events');
  const loadTime = Date.now();
  events.onmessage = (event) => {
    const time = JSON.parse(event.data);
    if (time && time > loadTime) {
      location.reload();
    }
  };
  events.onerror = (error) => {
    console.error(error);
    events.close();
    // Try to reconnect after 1 second in case of errors
    setTimeout(connectToEvents, 1000);
  };
  events.onopen = () => {
    console.log('Connected to live reload server');
  };
};

setTimeout(connectToEvents, 500);
