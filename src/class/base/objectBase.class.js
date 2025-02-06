class ObjectBase {
    constructor(id, x, y, range, speed) {
        // 오브젝트 고유 ID
        this.id = id
        // 오브젝트 위치
        this.x = x;
        this.y = y;
        // 오브젝트의 방향
        this.directX = 0;
        this.directY = 0;
        // 오브젝트 속도
        this.speed = speed;
        // 오브젝트 인식범위
        this.awakeRange = range;
        // 활성화 여부
        this.awake = false;
        // 타겟 ID 
        this.targetId = null;
        // 좌표 계산용 시간
        this.timestamp = 0;
    }

    // 오브젝트 활성화 메서드
    // 반환값은 id or -1(깨어나지 않음)
    awake(x, y, targetId) {
        if (this.awake) return this.id
        // 대상과의 거리 확인 및 만족 시, 활성화
        if (Math.sqrt((this.x - x) ** 2 + (this.y - y) ** 2) <= this.awakeRange ) {
            this.targetId = targetId
            this.awake = true;
            this.timestamp = Date.now();
            return this.id
        }
        return -1 
    }

    // 오브젝트 움직임 메서드
    // target으로 향하는 방향, 속도, 좌표, 시작 시간 전달
    // 실패 시 -1 , 목표지점 도착 시 1 반환
    move(targets) {
        if (this.targetId === null) return -1
        // [1] 대상 찾기
        const target = targets.find((target) => target.id === this.targetId)
        if(!target) {
            this.awake = false
            this.targetId = null;
            return -1
        }

        // [2] 타겟과 자신의 위치로 방향 확인
        const axisX = target.x - this.x
        const axisY = target.y - this.y

        // [3] 벡터 사이즈(거리) 계산
        const vectorSize = Math.sqrt((axisX) ** 2 + (axisY) ** 2);

        // [4] 방향(벡터 좌표) 저장
        const directX = x / vectorSize;
        const directY = y / vectorSize;
    
        // [5] 시간 경과 확인
        const timestamp = Date.now()
        const timeDiff = (this.timestamp - timestamp) / 1000

        // [6] 현재 좌표 계산 및 적용
        this.x = this.x + this.speed * directX * timeDiff
        this.y = this.y + this.speed * directY * timeDiff
        this.timestamp = timestamp
        const position = { x: this.x, y: this.y }

        // [7] 현재 좌표에서 대상과 인식 범위가 닿지 않으면 잠들기
        if (vectorSize > this.awakeRange) {
            this.awake = false
            this.targetId = null;
        }

        // [8] 방향이 이전 값과 비교해 변경되지 않았다면 전달 X
        if (this.directX === directX && this.directY === directY) return -1

        this.directX = directX
        this.directY = directY
        // [9] 현재 방향(벡터 좌표) / 속도 / 위치 / 시간 반환
        return {id: this.id, direct: { x: directX, y: directY }, speed: this.speed, position, timestamp }
    }
}