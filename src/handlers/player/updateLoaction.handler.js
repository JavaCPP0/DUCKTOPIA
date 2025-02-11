import { LOCATION_REQ_TIME_TERM, VALID_DISTANCE } from '../../constants/player.js';
import makePacket from '../../utils/packet/makePacket.js';
import { PACKET_TYPE } from '../../config/constants/header.js';

const updateLocationHandler = ({ socket, payload }) => {
  try {
    const { x, y } = payload;

    // 유저 객체 조회
    const user = userSession.getUser(socket);
    if (!user) {
      throw new Error('유저 정보가 없습니다.');
    }

    // RoomId 조회
    const roomId = user.getRoomId();
    if (!roomId) {
      throw new Error(`User(${user.id}): RoomId 가 없습니다.`);
    }

    // 룸 객체 조회
    const room = roomSession.getRoom(roomId);
    if (!room) {
      throw new Error(`Room ID(${roomId}): Room 정보가 없습니다.`);
    }

    // 게임 객체(세션) 조회
    const game = room.getGame();
    if (!game) {
      throw new Error(`Room ID(${roomId}): Game 정보가 없습니다.`);
    }

    // 플레이어 객체 조회
    const player = game.getPlayer(user.id);
    if (!player) {
      throw new Error(`Room ID(${roomId})-User(${user.id}): Player 정보가 없습니다.`);
    }

    const latency = player.calculateLatency();
    const payload = player.playerPositionUpdate(x, y);
    const notification = makePacket([PACKET_TYPE.PLAYER_UPDATE_POSITION_NOTIFICATION], payload);

    game.players.forEach((otherPlayer) => {
      // 계산한 좌표 전송(브로드캐스트)
      //const payload = player.calculatePosition(otherPlayer,x,y);
      //payload 인코딩
      otherPlayer.socket.write(notification);
    });
  } catch (error) {
    handleError(socket, error);
  }
};

export default updateLocationHandler;
