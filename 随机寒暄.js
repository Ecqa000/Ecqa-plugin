import { readdirSync, existsSync, mkdirSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

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
    const __filename = fileURLToPath(import.meta.url);
    const __dirname = dirname(__filename);
    
    const folderPaths = [
      join(__dirname, 'resources', 'hx'),
      join(__dirname, 'resources', 'hxh')
    ];
    
    const selectedFolderPath = folderPaths[Math.floor(Math.random() * folderPaths.length)];
    
    if (!existsSync(selectedFolderPath)) {
      console.error(`目录不存在: ${selectedFolderPath}`);
      return;
    }
    
    const selectedFiles = readdirSync(selectedFolderPath);
    
    if (selectedFiles.length === 0) {
      console.error(`目录为空: ${selectedFolderPath}`);
      return;
    }
    
    const randomImage = join(selectedFolderPath, selectedFiles[Math.floor(Math.random() * selectedFiles.length)]);
    
    console.log(`即将发送图片路径: ${randomImage}`);
    
    await this.e.reply(segment.image(randomImage));
    return;
  }
}
