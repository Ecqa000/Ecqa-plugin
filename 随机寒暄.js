import { readdirSync } from 'fs';
import { join } from 'path';

export class example extends plugin {
  constructor() {
    super({
      name: '随机寒暄',
      event: 'message',
      priority: -114514,
      rule: [
        {
          reg: '随机寒暄',
          fnc: 'handleRandomGreeting'
        }
      ]
    });
  }

  async handleRandomGreeting(e) {
    const folderPaths = ['./resources/hx', './resources/hxh'];
    const selectedFolderPath = folderPaths[Math.floor(Math.random() * folderPaths.length)];
    const selectedFiles = readdirSync(selectedFolderPath);
    const randomImage = join(selectedFolderPath, selectedFiles[Math.floor(Math.random() * selectedFiles.length)]);
    await this.e.reply(segment.image(randomImage));
    return;
  }
}
