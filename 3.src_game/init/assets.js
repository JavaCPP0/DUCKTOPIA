import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

// import.meta.url은 현재 모듈의 URL을 나타내는 문자열
// fileURLToPath는 URL 문자열을 파일 시스템의 경로로 변환

// 현재 파일의 절대 경로. 이 경로는 파일의 이름을 포함한 전체 경로
const __filename = fileURLToPath(import.meta.url);

// path.dirname() 함수는 파일 경로에서 디렉토리 경로만 추출 (파일 이름을 제외한 디렉토리의 전체 경로)
const __dirname = path.dirname(__filename);
const basePath = path.join(__dirname, '../../assets');
let gameAssets = {}; // 전역함수로 선언

const readFileAsync = (filename) => {
  return new Promise((resolve, reject) => {
    fs.readFile(path.join(basePath, filename), 'utf8', (err, data) => {
      if (err) {
        reject(err);
        return;
      }
      resolve(JSON.parse(data));
    });
  });
};

export const loadGameAssets = async () => {
  try {
    const [
      food,
      weapon,
      monster,
      dropTable,
      objects,
      objectDropTable,
      armorTop,
      armorBottom,
      armorHelmet,
      armorShoes,
      armorAccessory,
      upgradeRate,
      profanity,
    ] = await Promise.all([
      readFileAsync('food.json'),
      readFileAsync('weapon.json'),
      readFileAsync('monster.json'),
      readFileAsync('dropTable.json'),
      readFileAsync('objects.json'),
      readFileAsync('objectDropTable.json'),
      readFileAsync('armor_top.json'),
      readFileAsync('armor_bottom.json'),
      readFileAsync('armor_helmet.json'),
      readFileAsync('armor_shoes.json'),
      readFileAsync('armor_accessory.json'),
      readFileAsync('upgradeRate.json'),
      readFileAsync('profanity.json'),
    ]);

    gameAssets = {
      food,
      weapon,
      monster,
      dropTable,
      objects,
      objectDropTable,
      armorTop,
      armorBottom,
      armorHelmet,
      armorShoes,
      armorAccessory,
      upgradeRate,
      profanity,
    };
    return gameAssets;
  } catch (error) {
    throw new Error('Failed to load game assets: ' + error.message);
  }
};

export const getGameAssets = () => {
  return gameAssets;
};
