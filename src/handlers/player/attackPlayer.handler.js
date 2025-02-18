import { config } from '../../config/config.js';
import makePacket from '../../utils/packet/makePacket.js';
import { roomSession, userSession } from '../../sessions/session.js';
import CustomError from '../../utils/error/customError.js';

const attackPlayerHandler = ({ socket, payload }) => {
  const { playerDirX, playerDirY } = payload;

  // 유저 객체 조회
  const user = userSession.getUser(socket);
  if (!user) {
    throw new CustomError('유저 정보가 없습니다.');
  }

  // RoomId 조회
  const roomId = user.getRoomId();
  if (!roomId) {
    throw new CustomError(`User(${user.id}): RoomId 가 없습니다.`);
  }

  // 룸 객체 조회
  const room = roomSession.getRoom(roomId);
  if (!room) {
    throw new CustomError(`Room ID(${roomId}): Room 정보가 없습니다.`);
  }

  // 게임 객체(세션) 조회
  const game = room.getGame();
  if (!game) {
    throw new CustomError(`Room ID(${roomId}): Game 정보가 없습니다.`);
  }

  // 플레이어 객체 조회
  const player = game.getPlayerById(user.id);
  if (!player) {
    throw new CustomError(`Room ID(${roomId})-User(${user.id}): Player 정보가 없습니다.`);
  }

  // Notification - 다른 플레이어들에게 전달
  const motionPayload = { playerId: player.id, playerDirX, playerDirY };
  const packet = makePacket(config.packetType.S_PLAYER_ATTACK_NOTIFICATION, motionPayload);
  game.notification(socket, packet);
};

export default attackPlayerHandler;
