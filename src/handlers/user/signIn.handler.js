import { findUserByEmail } from '../../db/user/user.db.js';
import { userSession } from '../../sessions/session.js';
import makePacket from '../../utils/packet/makePacket.js';
import CustomError from '../../utils/error/customError.js';
import bcrypt from 'bcrypt';
import { config } from '../../config/config.js';

const signInHandler = async ({ socket, payload }) => {
  const { email, password } = payload;

  // 1. 사용자 존재 여부 DB에서 확인
  const userData = await findUserByEmail(email);
  if (!userData) {
    throw new CustomError('아이디 또는 비밀번호가 일치하지 않습니다.');
  }

  // 2. 비밀번호 일치 여부 확인
  if (!(await bcrypt.compare(password, userData.password))) {
    throw new CustomError('아이디 또는 비밀번호가 일치하지 않습니다.');
  }

  // 3. 소켓을 이용해서 유저 찾기
  const user = userSession.getUser(socket);
  if (!user) {
    throw new CustomError('소켓을 찾을 수 없습니다.');
  }

  // 4. 중복 로그인 유저 세션에서 체크
  const existingUser = userSession.checkId(email);
  if (existingUser) {
    throw new CustomError('이미 접속 중인 유저입니다.');
  }

  // 5. 찾은 유저에 로그인 정보 추가
  user.login(userData.id, userData.email, userData.name);
  userSession.addId(email, socket);

  // 6. 패킷 전송
  const loginResponse = makePacket(config.packetType.LOGIN_RESPONSE, {
    success: true,
    user: user.getUserData(),
  });

  socket.write(loginResponse);
};

export default signInHandler;
