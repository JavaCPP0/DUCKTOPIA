import {
  ATK_PER_LV,
  PLAYER_MAX_HUNGER,
  PLAYER_SPEED,
  PLAYER_DEFAULT_RANGE,
  PLAYER_DEFAULT_ANGLE,
} from '../../constants/player.js';

class Player {
  constructor(id, atk, x, y) {
    this.id = id;
    this.user = user; // User Class
    this.maxHp = PLAYER_MAX_HP;
    this.hp = PLAYER_MAX_HP;
    this.hunger = PLAYER_MAX_HUNGER;
    this.lv = 1;
    this.atk = atk;
    this.inventory = [];
    this.equippedWeapon = {};
    this.x = x;
    this.y = y;
    this.isAlive = true;
    this.characterType = CharacterType.RED;
    this.packetTerm = 0; //위치 변경 요청 패킷간의 시간차
    this.speed = PLAYER_SPEED;
    this.lastPosUpdateTime = Date.now();

    this.range = PLAYER_DEFAULT_RANGE;
    this.angle = PLAYER_DEFAULT_ANGLE;
  }

  changePlayerHp(damage) {
    this.hp -= damage;
    return this.hp;
  }

  getPlayerPos() {
    return { x: this.x, y: this.y };
  }

  changePlayerPos(x, y) {
    this.x = x;
    this.y = y;
    return { x: this.x, y: this.y };
  }

  getPlayer() {
    return {
      characterType: this.characterType,
      hp: this.hp,
      weapon: this.weapon,
      atk: this.atk,
    };
  }

  getPlayerData() {
    return {
      playerId: this.id,
      nickname: this.user.name,
      character: this.getCharacter(),
    };
  }

  //player 메서드 여기에 만들어놓고 나중에 옮기기

  playerPositionUpdate = (dx, dy) => {
    this.x = dx;
    this.y = dy;
  };

  calculatePosition = (otherPlayer, x, y) => {
    // 현재 위치와 요청받은 위치로 방향을 구하고 speed와 레이턴시를 곱해 이동거리를 구하고 좌표 예측 검증
    const seta = (Math.atan2(y - this.y, x - this.x) * 180) / Math.PI;
    const distance = this.speed * otherPlayer.packetTerm;

    // 만약 거속시로 구한 거리보다 멀면 서버가 알고있는 좌표로 강제 이동
    if (distance > VALID_DISTANCE) {
      console.error(`유효하지 않은 이동입니다.`);
    }

    const dx = Math.cos(seta) * distance;
    const dy = Math.sin(seta) * distance;

    //서버에 저장하는 좌표는 본인 기준으로 계산된 좌표
    if (this.id === otherPlayer.id) {
      this.playerPositionUpdate(dx, dy);
    }
    return { playerId: this.id, x: this.x, y: this.y };
  };

  calculateLatency = () => {
    //레이턴시 구하기 => 수정할 것)각 클라마다 다른 레이턴시를 가지고 계산
    //레이턴시 속성명도 생각해볼 필요가 있다
    this.packetTerm = Date.now() - this.lastPosUpdateTime; //player값 직접 바꾸는건 메서드로 만들어서 사용
    this.lastPosUpdateTime = Date.now();
  };

  changePlayerHunger(amount) {
    this.hunger += amount;
    return this.hunger;
  }
  //플레이어 어택은 데미지만 리턴하기
  getPlayerAtkDamage() {
    return this.atk + this.lv * ATK_PER_LV + this.equippedWeapon.atk;
  }

  playerDead() {
    this.isAlive = false;
    this.inventory = [];
    return this.isAlive;
  }

  findItemIndex(itemId) {
    const targetIndex = this.inventory.findIndex((item) => (item.id = itemId));
    return targetIndex;
  }

  addItem(item) {
    this.inventory.push(item);
    return this.inventory;
  }

  removeItem(itemId) {
    const targetIndex = this.findItemIndex(itemId);
    this.inventory.splice(targetIndex, 1);
    return this.inventory;
  }

  //이 녀석이 플레이어 내부의 interval에서 돌아가도록 한다.
  //각각의 플레이어마다 interval이 있는 방법과 map에서 관리하는 방법 중에 하나를 고르는 걸 해보자.
  //이 쪽은 일단 유저가 interval을 관리하는 방식
  isDead() {
    if (this.hp <= 0) {
      this.isAlive = false;
    }

    this.reviveInterval = setTimeout(() => {
      if (this.isAlive) {
        clearInterval(this.reviveInterval);
        return;
      } else {
        this.isAlive = true;
        clearInterval(this.reviveInterval);
      }
    }, 1000);
  }

  //공격 사거리 변경
  changeRange(range) {
    this.range = range;
  }

  //공격 각도 변경
  changeAngle(angle) {
    this.angle = angle;
  }

  getRange() {
    return this.range;
  }

  getAngle() {
    return this.angle;
  }

  getUser() {
    return this.user;
  }

  //유저 동기화는 어떤 방식으로 하지?
  //hp, lv, hunger,inventory,equippedWeapon,isAlive같은 status는 변화가 있을때만 동기화하기
  //hp변화(피격) 브로드캐스트용 패킷
  //lv변화 브로드캐스트용 패킷 / 필요한가?
  //hunger변화 브로드캐스트용 패킷 / 필요한가?
  //equippedWeapon변화 브로드캐스트용 패킷
  //isAlive변화 브로드캐스트용 패킷

  //위치 같은 계속 변화하는건 루프(프레임)마다 동기화
  //위치 패킷
  //키업다운때만 동기화
  //위치 패킷은 클라에서 받은 입력(새 좌표)를 받아서 저장하고 저장된 좌표를 나를 제외한 세션의 모든 클라에게 보낸다.
  //너무 자주 보내지 말고 시간을 잘 조절해 보자

  //키보드로 움직이는 게임은 보통 클라에서 먼저 움직이고 서버에 통보하며 통보된 위치를 브로드캐스트

  //가시랜더링 생각해보기

  //허기가0이면 데미지를 받는다
}

export default Player;
