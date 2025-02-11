const attackByMonsterReqHandler = (socket,payload) => {

  try {
        const { playerId, damage } = payload;

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

    const payload = player.changePlayerHp(damage);
    const notification = makePacket([PACKET_TYPE.PLAYER_UPDATE_HP_NOTIFICATION], payload);


    game.players.forEach((player) => {
      if (player.id !== playerId) player.socket.write(notification);
    });

    //만약 방금 피해를 받고 사망했다면
    if (player.isAlive) {
      const payload = playerId;

      //임시 패킷 인코딩하고 파싱하는 로직
      const notification = makePacket([PACKET_TYPE.PLAYER_DEATH_NOTIFICATION], payload);


      game.players.forEach((player) => {
        if (player.id !== playerId) player.socket.write(notification);
      });
    }
  } catch (e) {
    console.error(e);
  }
};

export default attackByMonsterReqHandler;
