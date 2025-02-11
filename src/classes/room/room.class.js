import { MAX_USER_AMOUNT } from '../../config/constants/room.js';
import broadcast from '../../utils/packet/broadcast.js';

const RoomStateType = {
  WAIT: 0,
  PREPARE: 1,
  INGAME: 2,
};
Object.freeze(RoomStateType);

class Room {
  constructor(id, name, ownerId) {
    this.users = new Map();
    this.id = id; // 숫자(TODO 나중에 uuid로?)
    this.name = name; // room name
    this.state = RoomStateType.WAIT;
    this.game = null;
    this.ownerId = ownerId;
  }

  // 유저 추가
  addUser(user) {
    // 방 인원 검사
    if (this.users.size >= MAX_USER_AMOUNT) return false;

    // 유저 추가
    this.users.set(user.socket, user);

    return true;
  }

  // 유저 삭제
  removeUser(socket) {
    this.users.delete(socket);
  }

  // 유저 조회
  getUsers() {
    return Array.from(this.users.values());
  }

  // 방 데이터 추출 (패킷 전송 용도로 가공)
  getRoomData() {
    let usersData = [];

    for (const user of this.getUsers()) {
      const userData = user.getUserData();
      usersData.push(userData);
    }

    return {
      roomId: this.id,
      ownerId: this.ownerId,
      name: this.name,
      maxUserNum: MAX_USER_AMOUNT,
      state: this.state,
      users: usersData,
    };
  }

  // 방 상태 변경
  changeState(state) {
    this.state = state;
  }

  // 게임 시작
  startGame() {
    this.changeState(RoomStateType.INGAME);

    // TODO 게임 추가
    this.game = new Game();
  }

  // 게임 종료
  endGame() {
    this.changeState(RoomStateType.WAIT);

    // TODO 게임 삭제

    this.game = null;
  }
  // 게임 조회
  getGame() {
    return this.game;
  }

  notification(one_socket, packet) {
    this.users.forEach((user,socket) => {
      if (socket !== one_socket) socket.write(packet);
    });
  }

  // 여기부터 구동을 위해 추가된 부분 나중에 입맛대로 수정해주세요!
  getUsersData() {
    const roomUsers = Array.from(this.getUsers());

    return roomUsers.map((user) => user.getUserData()); // 유저 데이터를 배열로 변환
  }

  joinUserNotification(packet) {
    const roomUsers = this.getUsers();

    console.log("유저에게 정보 보내기",packet)
    roomUsers.forEach((user) => {
        user.socket.write(packet);
    });
  }

  getUsersPositionData() {
    const roomUsers = Array.from(this.getUsers()); // Iterator → Array

    return roomUsers.map((user, index) => {
        // 새로운 x, y 값 계산
        const newX = index * 3;
        const newY = index * 3;

        // 유저 위치 업데이트
        user.posiup(newX, newY);

        // 업데이트된 위치 정보 반환
        return {
            playerId: user.id,
            x: user.x, // 업데이트된 값
            y: user.y  // 업데이트된 값
        };
    });
  }

  getPositionUpdateNotification() {
    const roomUsers = Array.from(this.getUsers()); // Iterator → Array
  
    return roomUsers.map(user => user.getpsi()) ;
  }
}

export default Room;
