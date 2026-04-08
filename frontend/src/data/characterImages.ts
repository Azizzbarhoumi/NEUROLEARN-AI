import { CharacterKey } from '@/contexts/UserContext';

import hiroImg from '@/assets/characters/hiro.png';
import sakuraImg from '@/assets/characters/sakura.png';
import kaiImg from '@/assets/characters/kai.png';
import lunaImg from '@/assets/characters/luna.png';
import renImg from '@/assets/characters/ren.png';
import mikaImg from '@/assets/characters/mika.png';
import leoImg from '@/assets/characters/leo.png';
import yukiImg from '@/assets/characters/yuki.png';

const characterImages: Record<string, string> = {
  hiro: hiroImg,
  sakura: sakuraImg,
  kai: kaiImg,
  luna: lunaImg,
  ren: renImg,
  mika: mikaImg,
  leo: leoImg,
  yuki: yukiImg,
};

export function getCharacterImage(key: CharacterKey): string {
  return key ? characterImages[key] || '' : '';
}
