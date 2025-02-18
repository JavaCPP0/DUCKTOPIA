import { config } from "../../config/config";
import { roomSession, userSession } from "../../sessions/session";
import makePacket from "../../utils/packet/makePacket";

const coreDamaged = ({socket,payload}) => {
    const { damage } = payload.damage;

    const user = userSession.getUser(socket);
    if (!user) return;

    const room = roomSession.getRoom(user.getRoomId());
    if (!room) return;

    const game = room.getGame()
    if (!game) return;

    const hp = game.coreDamaged(damage);
    game.broadcast(makePacket(config.packetType.CORE_HP_UPDATE_NOTIFICATION, { coreHp: hp }));

    if (hp <= 0) {
        game.gameOver();
        game.broadcast(makePacket(config.packetType.GAME_OVER_NOTIFICATION));
   }
}

export default coreDamaged;