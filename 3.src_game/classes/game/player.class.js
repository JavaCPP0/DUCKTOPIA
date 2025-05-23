import { config } from '../../config/config.js';
import { gameSession, userSession } from '../../sessions/session.js';
import CustomError from '../../utils/error/customError.js';

class Player {
  constructor(id, atk, x, y) {
    this.id = id;

    this.maxHp = config.game.player.playerMaxHealth;
    this.hp = config.game.player.playerMaxHealth;
    this.maxHunger = config.game.player.playerMaxHunger;
    this.hunger = config.game.player.playerMaxHunger;
    this.speed = config.game.player.playerSpeed;
    this.characterType = config.game.characterType.RED;

    this.lv = 1;
    this.atk = atk; //10
    this.inventory = Array.from({ length: 18 }, () => 0);
    this.equippedWeapon = null;
    this.equippedArmors = {
      top: null,
      bottom: null,
      shoes: null,
      helmet: null,
      accessory: null,
    };
    this.x = x;
    this.y = y;
    this.isAlive = true;

    //위치 변경 요청 패킷간의 시간차
    this.packetTerm = 0;
    this.lastPosUpdateTime = Date.now();

    // hunger
    this.hungerCounter = 0;
    this.lastHungerUpdate = 0;
  }

  changePlayerHp(amount, game) {
    // 플레이어 체력 감소 및 회복 (체력 회복은 음수로 보냄)
    // 데미지를 받는 경우 (amount > 0)에만 방어력 적용
    if (amount > 0) {
      // 방어력 계산
      const defense = this.calculateArmorEffects(game);

      // 비율 감산 방식 적용 (감쇠 곡선)
      const damageReductionFactor = 100 / (100 + defense);

      // 최종 데미지 계산 (최소 1의 데미지는 입도록 함)
      amount = Math.max(1, Math.floor(amount * damageReductionFactor));
    }

    this.hp = Math.min(Math.max(this.hp - amount, 0), this.maxHp);
    if (this.hp <= 0) {
      this.playerDead();
    }
    return this.hp;
  }

  getData() {
    return {
      characterType: this.characterType,
      hp: this.hp,
      weapon: this.equippedWeapon,
      armors: this.equippedArmors,
      atk: this.atk,
    };
  }

  getData() {
    return {
      characterType: this.characterType,
      hp: this.hp,
      weapon: this.equippedWeapon,
      atk: this.atk,
    };
  }
  getPlayerPos() {
    return { x: this.x, y: this.y };
  }

  changePlayerPos(x, y) {
    const nextTime = Date.now();
    const timeDiff = nextTime - this.lastPosUpdateTime / 1000;
    const distance = Math.sqrt((this.x - x) ** 2 + (this.y - y) ** 2);
    if (distance / timeDiff <= this.speed * 1.1) {
      this.x = x;
      this.y = y;
    } else {
      const seta = Math.atan2(this.y - y, this.x - x);
      this.x += +timeDiff * Math.cos(seta);
      this.y += +timeDiff * Math.sin(seta);
    }

    this.lastPosUpdateTime = nextTime;
    return { x: this.x, y: this.y };
  }

  //player 메서드 여기에 만들어놓고 나중에 옮기기
  playerPositionUpdate = (dx, dy) => {
    this.x = dx;
    this.y = dy;
  };

  /** Hunger System */
  // 허기 초기화
  initHungerUpdate() {
    this.lastHungerUpdate = Date.now();
  }

  // 허기 감소 카운팅 함수
  hungerCheck() {
    if (!this.isAlive) return;

    const now = Date.now();
    const deltaTime = now - this.lastHungerUpdate;
    this.hungerCounter += deltaTime;
    this.lastHungerUpdate = now;

    if (this.hungerCounter < config.game.player.playerHungerPeriod) return;

    // game 접근
    const user = userSession.getUser(this.id);
    const game = gameSession.getGame(user.getGameId());

    if (this.hunger > 0) {
      this.changePlayerHunger(-config.game.player.playerHungerDecreaseAmount);

      // 캐릭터 hunger 동기화 패킷 전송
      const decreaseHungerPacket = [
        config.packetType.S_PLAYER_HUNGER_UPDATE_NOTIFICATION,
        {
          playerId: this.id,
          hunger: this.hunger,
        },
      ];

      game.broadcast(decreaseHungerPacket);
    } else {
      // 체력 감소

      this.hp -= config.game.player.playerHpDecreaseAmountByHunger;
      if (this.hp <= 0) this.playerDead();
      else {
        // 캐릭터 hp 동기화 패킷 전송
        const decreaseHpPacket = [
          config.packetType.S_PLAYER_HP_UPDATE_NOTIFICATION,
          {
            playerId: this.id,
            hp: this.hp,
          },
        ];

        game.broadcast(decreaseHpPacket);
      }
    }

    this.hungerCounter = 0;

    // console.log('현재 아이디 : ', this.user.id, ', 현재 허기 : ', this.hunger, ', 현재 체력 : ', this.hp);
  }

  changePlayerHunger(amount) {
    this.hunger = Math.min(Math.max(this.hunger + amount, 0), this.maxHunger);

    if (this.hunger === this.maxHunger) {
      this.lastHungerUpdate = Date.now();
      this.hungerCounter = 0;
    }

    return this.hunger;
  }

  /** end of Hunger System */

  //플레이어 어택은 데미지만 리턴하기
  getPlayerAtkDamage(totalAtk) {
    return totalAtk + Math.floor(Math.random() * this.atk);
  }

  playerDead() {
    this.isAlive = false;
    const user = userSession.getUser(this.id);
    const game = gameSession.getGame(user.getGameId());
    const packet = [config.packetType.S_PLAYER_DEATH_NOTIFICATION, { playerId: this.id }];
    game.broadcast(packet);
    return this.isAlive;
  }

  findItemIndex(itemCode) {
    const targetIndex = this.inventory.findIndex((item) => item.itemCode === itemCode);
    return targetIndex;
  }

  addItem(itemCode, count, index) {
    if (index === -1) {
      //아이템을 이미 갖고 있는지
      const item = this.inventory.find((item) => item && item.itemCode === itemCode);
      //있다면 카운트만 증가
      if (item) item.count += count;
      else {
        //없으면 새로 만들어서 push
        const item = { itemCode: itemCode, count: count };

        const checkRoom = (ele) => ele === 0;
        const emptyIndex = this.inventory.findIndex(checkRoom);
        this.inventory.splice(emptyIndex, 1, item);
      }
      return item;
    } else {
      const item = this.inventory.find((item) => item && item.itemCode === itemCode);
      if (item) item.count += count;
      else {
        //없으면 새로 만들어서 push
        const item = { itemCode: itemCode, count: count };
        this.inventory.splice(index, 1, item);
      }
      return item;
    }
  }

  removeItem(itemCode, count) {
    const removedItem = this.inventory.find((item) => item && item.itemCode === itemCode);
    const removedItemIndex = this.inventory.findIndex((item) => item && item.itemCode === itemCode);
    if (!removedItem) {
      throw new CustomError('인벤토리에서 아이템을 찾을 수 없습니다.');
    }

    if (removedItem.count > count) {
      removedItem.count -= count;
    } else {
      //아이템을 제거
      this.inventory.splice(removedItemIndex, 1, 0);
    }
  }

  // 무기 장착
  equipWeapon(itemCode) {
    if (this.equippedWeapon === null) {
      const weapon = this.inventory.find((item) => item.itemCode === itemCode);
      if (!weapon) throw new CustomError(`인벤토리에서 장착하려는 아이템을 찾지 못했습니다.`);

      this.equippedWeapon = { itemCode: weapon.itemCode, count: 1 };
      this.removeItem(itemCode, 1);
    } else {
      const temp = this.equippedWeapon;
      const weapon = this.inventory.find((item) => item.itemCode === itemCode);
      if (!weapon) throw new CustomError(`인벤토리에서 장착하려는 아이템을 찾지 못했습니다.`);

      this.equippedWeapon = { itemCode: weapon.itemCode, count: 1 };
      this.removeItem(itemCode, 1);
      this.addItem(temp.itemCode, 1, -1);
    }

    return this.equippedWeapon;
  }

  //무기 탈착
  detachWeapon(itemCode) {
    const checkRoom = (ele) => ele === 0;
    const emptyIndex = this.inventory.findIndex(checkRoom);

    if (this.equippedWeapon === null) {
      throw new CustomError(`탈착할 아이템이 없습니다.`);
    }

    if (emptyIndex === -1) {
      throw new CustomError(`인벤토리에 빈공간이 없습니다`);
    }

    if (itemCode === this.equippedWeapon.itemCode) {
      const temp = this.equippedWeapon;
      this.equippedWeapon = null;
      this.addItem(temp.itemCode, 1, -1);
    } else {
      throw new CustomError(`잘못된 요청입니다.`);
    }

    return { itemCode: itemCode, count: 1 };
  }

  // 방어구 장착
  equipArmor(armorType, itemCode) {
    if (this.equippedArmors[armorType] === null) {
      const armor = this.inventory.find((item) => item.itemCode === itemCode);
      this.equippedArmors[armorType] = { itemCode: armor.itemCode, count: 1 };
      this.removeItem(itemCode, 1);
    } else {
      const temp = this.equippedArmors[armorType];
      const armor = this.inventory.find((item) => item.itemCode === itemCode);
      this.equippedArmors[armorType] = { itemCode: armor.itemCode, count: 1 };
      this.removeItem(itemCode, 1);
      this.addItem(temp.itemCode, 1, -1);
    }

    return this.equippedArmors[armorType];
  }

  //방어구 탈착
  detachArmor(armorType, itemCode) {
    if (this.equippedArmors[armorType] === null) {
      throw new CustomError(`탈착할 아이템이 없습니다.`);
    } else if (itemCode === this.equippedArmors[armorType].itemCode) {
      const temp = this.equippedArmors[armorType];
      this.equippedArmors[armorType] = null;
      this.addItem(temp.itemCode, 1, -1);
    } else {
      throw new CustomError(`잘못된 요청입니다.`);
    }

    return { itemCode: itemCode, count: 1 };
  }

  // 방어구 효과 계산 (방어력 등)
  calculateArmorEffects(game) {
    let totalDefense = 0;
    const armorDefenseDetails = {}; // 디버깅용 상세 정보

    // 각 방어구 타입별로 방어력 계산
    Object.entries(this.equippedArmors).forEach(([armorType, armor]) => {
      if (armor !== null) {
        // 방어구 데이터 조회
        let armorData;
        let dataSource = null;

        // 방어구 타입에 따라 다른 데이터 소스에서 조회
        switch (armorType) {
          case 'helmet':
            dataSource = game.itemManager.armorHelmetData;
            armorData = dataSource?.find((item) => item.code === armor.itemCode);
            break;
          case 'top':
            dataSource = game.itemManager.armorTopData;
            armorData = dataSource?.find((item) => item.code === armor.itemCode);
            break;
          case 'bottom':
            dataSource = game.itemManager.armorBottomData;
            armorData = dataSource?.find((item) => item.code === armor.itemCode);
            break;
          case 'shoes':
            dataSource = game.itemManager.armorShoesData;
            armorData = dataSource?.find((item) => item.code === armor.itemCode);
            break;
          case 'accessory':
            dataSource = game.itemManager.armorAccessoryData;
            armorData = dataSource?.find((item) => item.code === armor.itemCode);
            break;
        }

        // 디버깅 로그용 정보 저장
        armorDefenseDetails[armorType] = {
          itemCode: armor.itemCode,
          hasDataSource: !!dataSource,
          dataSourceLength: dataSource?.length || 0,
          armorData: armorData ? { ...armorData } : null,
          defense: armorData?.defense || 0,
        };

        // 방어구 데이터가 있고 defense 속성이 있으면 방어력에 추가
        if (armorData && armorData.defense) {
          totalDefense += armorData.defense;
        }
      }
    });

    return totalDefense;
  }

  getPlayerHp() {
    return this.hp;
  }

  revival(pos_x, pos_y) {
    if (this.isAlive) {
      return;
    } else {
      this.isAlive = true;
      this.hp = this.maxHp;
      this.x = pos_x;
      this.y = pos_y;
    }
  }
}

export default Player;
