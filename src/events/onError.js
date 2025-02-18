import { userSession } from "../sessions/session.js";

const onError = (socket) => (err) => {
  console.error('소켓 오류:', err);
  console.log('클라이언트 연결이 종료되었습니다.');

  // 세션에서 제거
  userSession.deleteUser(socket);

  // 진짜 종료 시켜주기
  socket.end();
  socket.destroy();
};

export default onError;
