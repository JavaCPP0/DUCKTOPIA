import net from 'net';
import onConnection from './events/onConnection.js';

import InitServer from './init/initServer.js';
import { config } from './config/config.js';

const server = net.createServer(onConnection);

const startServer = async () => {
  await InitServer();

  server.listen(config.server.port, config.server.host, () => {
    console.log('[게이트웨이] 서버 시작!!', config.server.host + config.server.port);
  });
};

startServer();
