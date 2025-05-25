import {WebSocketServer} from 'ws';

const wss = new WebSocketServer({port: process.env.PORT || 8080});

let clients = [];

wss.on('connection', function connection(ws) {
  console.log('New client connected');
  clients.push(ws);

  ws.on('error', console.error);

  ws.on('message', function message(data) {
    console.log('received: %s', data);
    sendToAllExceptSender(ws, data);
  });

  ws.on('close', () => {
    console.log('Client disconnected');
    clients = clients.filter(client => client !== ws);
  });
});

function sendToAllExceptSender(sender, message) {
  clients.forEach(client => {
    if (client !== sender) {
      try {
        client.send(message);
      } catch (error) {
        console.error('Error sending message to client:', error);
      }
    }
  });
}
