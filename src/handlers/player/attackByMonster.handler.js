import CustomError from '../../utils/error/customError.js';

const attackByMonsterReqHandler = (game, playerId, damage) => {
  const player = game.findPlayerIngame(playerId);

  if (!player) {
    throw new CustomError(`피격당한 유저를 찾을 수 없습니다.`);
  }
  if (!player.isAlive) {
    throw new CustomError(`이미 사망한 플레이어에게 공격중입니다.`);
  }

  //리팩토링 무조건..
  const hp = player.changePlayerHp(damage);

  const payload = {
    playerHpUpdateNotification: {
      hp,
    },
  };

  //임시코드: 패킷 인코딩하고 파싱하는 로직
  const message = dataType.create(payload);
  const playerHpUpdateNotification = dataType.encode(message).finish();

  const notification = payloadParser(playerHpUpdateNotification);

  game.players.forEach((player) => {
    if (player.id !== playerId) player.socket.write(notification);
  });

  //만약 방금 피해를 받고 사망했다면
  if (player.isAlive) {
    const payload = {
      playerDeadNotification: {
        playerId,
      },
    };

    //임시 패킷 인코딩하고 파싱하는 로직
    const message = dataType.create(payload);
    const playerHpUpdateNotification = dataType.encode(message).finish();

    const notification = payloadParser(playerHpUpdateNotification);

    game.players.forEach((player) => {
      if (player.id !== playerId) player.socket.write(notification);
    });
  }
};

export default attackByMonsterReqHandler;
