import { userSession, roomSession } from '../sessions/session.js';

const onEnd = (socket) => () => {
  console.log('Gateway 서버와의 연결이 종료되었습니다.');

  userSession.clearUsers();
  roomSession.clearRooms();

  // 진짜 종료 시켜주기
  socket.end();
  socket.destroy();
};

export default onEnd;
