import { config } from '../config/config.js';
import { errorHandler } from '../utils/error/errorHandler.js';
import onEnd from './onEnd.js';
import handlers from '../handlers/index.js';

const onData = (socket) => async (data) => {
  socket.buffer = Buffer.concat([socket.buffer, data]);
  const packetTypeByte = config.header.packetTypeByte;
  const versionLengthByte = config.header.versionLengthByte;
  let versionByte = 0;
  const payloadLengthByte = config.header.payloadLengthByte;
  let payloadByte = 0;
  const defaultLength = packetTypeByte + versionLengthByte;

  try {
    while (socket.buffer.length >= defaultLength) {
      try {
        versionByte = socket.buffer.readUInt8(packetTypeByte);
        payloadByte = socket.buffer.readUInt32BE(defaultLength + versionByte);
      } catch (err) {
        onEnd(socket)();
        break;
      }
      // 가변 길이 확인

      const headerLength = defaultLength + versionByte + payloadLengthByte;

      // buffer의 길이가 충분한 동안 실행
      // console.log(idx++, 'bufer Leng:', socket.buffer.length);
      if (socket.buffer.length < headerLength + payloadByte) break;
      const packet = socket.buffer.subarray(0, headerLength + payloadByte);
      // console.log(
      //   `현재 ${packet.readUInt16BE(0)}의 packet 길이 ${headerLength + payloadByte} 입니다.`,
      // );

      // 남은 패킷 buffer 재할당
      socket.buffer = socket.buffer.subarray(headerLength + payloadByte);

      // 값 추출 및 버전 검증
      const version = packet.toString('utf8', defaultLength, defaultLength + versionByte);
      if (version !== config.client.version) {
        console.log('형식 오류 패킷 발생');
        onEnd(socket)();
        break;
      }
      const packetType = packet.readUInt16BE(0);
      const payloadBuffer = packet.subarray(headerLength, headerLength + payloadByte);

      const handler = handlers[packetType];

      await handler({ socket, payloadBuffer, packetType });
      // console.log('게임 서버 연결');
      // console.timeEnd('check');
    }
  } catch (e) {
    errorHandler(socket, e);
  }
};

export default onData;
