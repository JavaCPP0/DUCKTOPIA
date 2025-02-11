import { PACKET_TYPE } from '../../config/constants/header.js';
import { findUserByEmail } from '../../db/user/user.db.js';
import { userSession } from '../../sessions/session.js';
import makePacket from '../../utils/packet/makePacket.js';
import bcrypt from 'bcrypt';

let newId = 1; // (TODO) 임시로!!

const signInHandler = async ({ socket, payload }) => {
  try {
    const { email, password } = payload;

    // 1. 사용자 존재 여부 DB에서 확인
    const userData = await findUserByEmail(email);

    if (!userData) {
      throw new Error('아이디 또는 비밀번호가 일치하지 않습니다.');
    }

    // 2. 비밀번호 일치 여부 확인
    if (!(await bcrypt.compare(password, userData.password))) {
      throw new Error('아이디 또는 비밀번호가 일치하지 않습니다.');
    }

    // 3. 소켓을 이용해서 유저 찾기
    const user = userSession.getUser(socket);

    if (!user) {
      throw new Error('소켓을 찾을 수 없습니다.');
    }

    // 4. 중복 로그인 유저 세션에서 체크
    const existingUser = userSession.users.forEach((user, key, map) => {
      if (user.email === email) return user;
    });

    if (existingUser) {
      throw new Error('이미 접속 중인 유저입니다.');
    }

    // 5. 찾은 유저에 로그인 정보 추가
    user.login(userData.user_id, userData.email, userData.name); // TODO 나중에 newId -> email로 변경하기

    newId += 1; // TODO 나중에 삭제

    console.log(`${user.name} 님이 로그인하였습니다.`);

    // 5. 패킷 전송
    const loginResponse = makePacket(PACKET_TYPE.LOGIN_RESPONSE, {
      success: true,
      myInfo: user.getUserData(),
      // name: userData.name,
    });

    socket.write(loginResponse);
  } catch (error) {
    console.log(error);
  }
};

export default signInHandler;
