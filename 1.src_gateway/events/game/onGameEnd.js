import { serverSession } from '../../sessions/session.js';

const onGameEnd = (socket) => async () => {
  console.log('[게임 서버] 연결이 종료되었습니다.');
  serverSession.deleteServer(socket.id);

  // 진짜 종료 시켜주기
  socket.end();
  socket.destroy();
};

export default onGameEnd;
