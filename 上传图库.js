import fetch from 'node-fetch';
import fs from 'fs';
import path from 'path';
import { pipeline } from 'stream';
import { promisify } from 'util';

const streamPipeline = promisify(pipeline);

export class MyPlugin extends plugin {
  constructor() {
    super({
      name: '提取',
      dsc: '自定义插件',
      event: 'message',
      priority: -114514,
      rule: [
        {
          reg: '^#上传图片\\s+\\S+$',
          fnc: 'fetchImageInfo'
        },
        {
          reg: '^#新建文件夹\\S+$',
          fnc: 'createFolder'
        },
        {
          reg: '^#删除文件夹\\S+$',
          fnc: 'deleteFolder'
        }
      ]
    });
  }

  async fetchImageInfo(e) {
    if (!this.e.isMaster)  {
      this.e.reply('你没有权限✘');
      return false;
    }
    
    const source = e.source;
    if (!source || !source.seq) {
      e.reply('无法获取 source 或 source 中没有 seq');
      return false;
    }

    const seq = source.seq;

    const match = e.msg.match(/^#上传图片\s+(\S+)$/);
    if (!match) {
      e.reply('指令格式错误，请使用 #上传图片+文件夹名称');
      return false;
    }
    const folderName = match[1];
    const basePath = path.resolve('plugins/Ecqa-plugin/resources', folderName);

    if (!fs.existsSync(basePath)) {
      fs.mkdirSync(basePath, { recursive: true });
    }

    try {
      const history = await e.group.getChatHistory(seq, 1);
      const imagesInfo = this.extractImageInfo(history);

      if (imagesInfo.length === 0) {
        e.reply('未找到图片信息');
        return false;
      }

      await this.downloadAndSaveImages(imagesInfo, basePath);

      const messages = this.formatImageMessages(imagesInfo, basePath);

      const aw = this.e.runtime.common.makeForwardMsg(e, messages, '--[自定义插件]--');
      await e.reply(aw);

      return true;
    } catch (error) {
      e.reply('获取历史记录失败');
      return false;
    }
  }

  async createFolder(e) {
    if (!this.e.isMaster)  {
      this.e.reply('你没有权限✘');
      return false;
    }

    const match = e.msg.match(/^#新建文件夹(\S+)$/);
    if (!match) {
      e.reply('指令格式错误，请使用 #新建文件夹+文件名');
      return false;
    }
    const folderName = match[1];
    const basePath = path.resolve('plugins/Ecqa-plugin/resources', folderName);

    if (fs.existsSync(basePath)) {
      e.reply(`文件夹已存在: ${basePath}`);
      return false;
    }

    try {
      fs.mkdirSync(basePath, { recursive: true });
      e.reply(`文件夹创建成功: ${basePath}`);
      return true;
    } catch (error) {
      e.reply('创建文件夹失败');
      return false;
    }
  }

  async deleteFolder(e) {
    if (!this.e.isMaster)  {
      this.e.reply('你没有权限✘');
      return false;
    }

    const match = e.msg.match(/^#删除文件夹(\S+)$/);
    if (!match) {
      e.reply('指令格式错误，请使用 #删除文件夹+文件名');
      return false;
    }
    const folderName = match[1];
    const basePath = path.resolve('plugins/Ecqa-plugin/resources', folderName);

    if (!fs.existsSync(basePath)) {
      e.reply(`文件夹不存在: ${basePath}`);
      return false;
    }

    try {
      fs.rmdirSync(basePath, { recursive: true });
      e.reply(`文件夹删除成功: ${basePath}`);
      return true;
    } catch (error) {
      e.reply('删除文件夹失败');
      return false;
    }
  }

  extractImageInfo(history) {
    const imagesInfo = [];

    for (const record of history) {
      for (const item of record.message) {
        if (item.type === 'image') {
          const fileSizeInBytes = item.size;
          const fileSizeInKB = (fileSizeInBytes / 1024).toFixed(2);
          const fileSizeInMB = (fileSizeInBytes / (1024 * 1024)).toFixed(2);

          imagesInfo.push({
            url: item.url,
            file: item.file,
            raw_message: record.raw_message,
            size: {
              bytes: fileSizeInBytes,
              kb: fileSizeInKB,
              mb: fileSizeInMB
            }
          });
        }
      }
    }

    return imagesInfo;
  }

  formatImageMessages(imagesInfo, basePath) {
    const messages = [
      '图片上传成功！✅️',
      `图片被保存到路径: ${basePath}`,
      '-----------[图片信息]-----------'
    ];

    for (const image of imagesInfo) {
      messages.push(
        `图片链接: ${image.url}`,
        `图片文件名: ${image.file}`,
        `图片外显: ${image.raw_message}`,
        `图片大小: ${image.size.bytes} bytes`,
        `图片大小 (KB): ${image.size.kb} KB`,
        `图片大小 (MB): ${image.size.mb} MB`
      );
    }

    messages.push('----------------------');
    return messages;
  }

  async downloadAndSaveImages(imagesInfo, basePath) {
    for (const image of imagesInfo) {
      const response = await fetch(image.url);
      
      if (!response.ok) throw new Error(`Failed to download image: ${response.statusText}`);
      
      const filePath = path.resolve(basePath, image.file);
      
      await streamPipeline(response.body, fs.createWriteStream(filePath));
    }
  }
}
