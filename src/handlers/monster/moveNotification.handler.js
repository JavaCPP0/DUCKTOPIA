import { config } from '../../config/config.js';
import { roomSession, userSession } from '../../sessions/session.js';
import makePacket from '../../utils/packet/makePacket.js';
import CustomError from '../../utils/error/customError.js';

//몬스터의 움직임을 동기화하는 핸들러.
//호스트 클라이언트에서 받은 움직임 정보를 여기에서 처리를 해주도록 하자.
const monsterMoveNotificationHandler = async (socket, payload) => {
  const { monsterId, targetId, x, y } = payload;

  //플레이어가 어떤 게임에 속해 있는지 찾기
  const user = userSession.getUser(socket);
  const game = roomSession.getRoom(user.getRoomId()).getGame();
  const monster = game.getMonster(monsterId);
  //const player = game.getPlayerById(targetId);

  //targetId를
  if (user.getUserData().userId !== targetId) {
    throw new CustomError('player bring fail');
  }
  //지정된 몬스터의 좌표를 변경시킨다.

  //플레이어를 기억하는 몬스터만 움직일지 말지 고려도 해볼 수 있음.
  monster.setPosition(x, y);

  const monsterPos = monster.getPosition();

  const monsterMoverPayload = {
    monsterId: monsterId,
    targetId: targetId,
    x: monsterPos.x,
    y: monsterPos.y,
  };

  const packet = makePacket(config.packetType.S_MONSTER_MOVE_NOTIFICATION, monsterMoverPayload);

  //이런 식으로 게임에서 notification을 보내보도록 하자.
  game.broadcast(packet);
};

export default monsterMoveNotificationHandler;
