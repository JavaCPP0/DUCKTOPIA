// item 클래스는 개별 아이템의 속성을 관리함
// 아이템 상태, 아이템 관련 기본 동작 등 하나의 아이템 인스턴스만을 관리함

class Item {
  constructor({ itemData, position }) {
    this.itemData = itemData; // { itemCode: number, count: number }
    this.position = position; // 아이템 위치
    this.isPickedUp = false; // 습득 여부
  }

  // 아이템 위치 업데이트
  updatePosition(x, y) {
    this.position = { x, y };
  }

  // 아이템 습득 처리
  pickup() {
    if (this.isPickedUp) {
      return false;
    }
    this.isPickedUp = true;
    return true;
  }
}

export default Item;
