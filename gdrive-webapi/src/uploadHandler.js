import Busboy from 'busboy';
import { pipeline } from 'stream/promises';
import fs from 'fs';
import { logger } from './logger.js';
export default class UploadHandler {
  constructor({ io, socketId, downloadsFolder, messageTimeDelay = 200 }) {
    this.io = io;
    this.socketId = socketId;
    this.downloadsFolder = downloadsFolder;
    this.ON_UPLOAD_EVENT = 'file-upload';
    this.messageTimeDelay = messageTimeDelay;
  }

  canExecute(lastExecution) {
    return Date.now() - lastExecution >= this.messageTimeDelay;
  }

  handleFileBytes(filename) {
    this.lastMessageSent = Date.now();
    async function* handleData(source) {
      let processedToAlread = 0;

      for await (const chunk of source) {
        yield chunk;
        processedToAlread += chunk.length;
        if (!this.canExecute(this.lastMessageSent)) {
          continue;
        }
        this.lastMessageSent = Date.now();
        this.io
          .to(this.socketId)
          .emit(this.ON_UPLOAD_EVENT, { processedToAlread, filename });

        logger.info(
          `File [${filename}] got ${processedToAlread} bytes to ${this.socketId}`
        );
      }
    }
    return handleData.bind(this);
  }

  async onFile(fieldname, file, filename) {
    const saveTo = `${this.downloadsFolder}/${filename}`;
    await pipeline(
      //1º passo - pegar uma readable stream (file)
      file,
      //2º passo - filtrar, converter, transformar dados (handleFileBytes(onData))
      this.handleFileBytes.apply(this, [filename]),

      //3º passo - saida do processo uma writeable stream
      fs.createWriteStream(saveTo)
    );
    logger.info(`File [${filename}] finished`);
  }

  registerEvents(headers, onFinish) {
    const busboy = new Busboy({ headers });
    busboy.on('file', this.onFile.bind(this));
    busboy.on('finish', onFinish);
    return busboy;
  }
}
