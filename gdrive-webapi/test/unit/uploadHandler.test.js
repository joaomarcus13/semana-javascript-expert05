import { describe, test, expect, jest, beforeEach } from '@jest/globals';
import fs from 'fs';
import { pipeline } from 'stream/promises';
import { logger } from '../../src/logger';
import UploadHandler from '../../src/uploadHandler';
import TestUtil from '../_util/testUtil';

describe('#UploadHandler test suite', () => {
  const ioObj = {
    to: (id) => ioObj,
    emit: (event, message) => {},
  };

  beforeEach(() => {
    jest.spyOn(logger, 'info').mockImplementation();
  });

  describe('#registerEvents', () => {
    test('should call onFile and onFinish functions onBusboy instance', () => {
      const uploadHandler = new UploadHandler({
        io: ioObj,
        socketId: '01',
      });
      jest.spyOn(uploadHandler, uploadHandler.onFile.name).mockResolvedValue();

      const headers = {
        'content-type': 'multipart/form-data; boundary=',
      };

      //   readable.on('data', (msg) => console.log(msg.toString()));

      const onFinish = jest.fn();
      const busboyInstance = uploadHandler.registerEvents(headers, onFinish);

      const fileStream = TestUtil.generateReadableStream([
        'chunk',
        'of',
        'data',
      ]);
      busboyInstance.emit('file', 'fieldname', fileStream, 'filename.txt');

      busboyInstance.listeners('finish')[0].call();

      expect(uploadHandler.onFile).toHaveBeenCalled();
      expect(onFinish).toHaveBeenCalled();
    });
  });

  describe('#onFile', () => {
    test('given a stream file it should save it on disk', async () => {
      const chunks = ['hey', 'dude'];
      const downloadsFolder = '/tmp';
      const handler = new UploadHandler({
        io: ioObj,
        socketId: '01',
        downloadsFolder,
      });

      const onData = jest.fn();

      jest
        .spyOn(fs, fs.createWriteStream.name)
        .mockImplementation(() => TestUtil.generateWriteableStream(onData));

      const onTransform = jest.fn();

      jest
        .spyOn(handler, handler.handleFileBytes.name)
        .mockImplementation(() =>
          TestUtil.generateTransformStream(onTransform)
        );

      const params = {
        fieldname: 'video',
        file: TestUtil.generateReadableStream(chunks),
        filename: 'mockFile.mov',
      };

      await handler.onFile(...Object.values(params));

      expect(onData.mock.calls.join()).toEqual(chunks.join());
      expect(onTransform.mock.calls.join()).toEqual(chunks.join());

      const expectFilename = `${handler.downloadsFolder}/${params.filename}`;

      expect(fs.createWriteStream).toHaveBeenCalledWith(expectFilename);
    });
  });

  describe('#handleFileBytes', () => {
    test('should call emit function and it is a transform stream', async () => {
      jest.spyOn(ioObj, ioObj.to.name);
      jest.spyOn(ioObj, ioObj.emit.name);

      const handler = new UploadHandler({
        io: ioObj,
        socketId: '01',
      });
      jest.spyOn(handler, handler.canExecute.name).mockReturnValueOnce(true);
      const message = ['hello'];
      const source = TestUtil.generateReadableStream(message);
      const onWrite = jest.fn();
      const target = TestUtil.generateWriteableStream(onWrite);
      await pipeline(source, handler.handleFileBytes('filename.txt'), target);

      expect(ioObj.to).toHaveBeenCalledTimes(message.length);
      expect(ioObj.emit).toHaveBeenCalledTimes(message.length);
      //se o handleFileBytes for um transformStream nosso pipeline vai continuar o processo passando os dados para frente e chamar a guncao do target para cada chunk
      expect(onWrite).toBeCalledTimes(message.length);
      expect(onWrite.mock.calls.join()).toEqual(message.join());
    });

    test('given message timerDelay as 2 secs it should emit only two messages during 2 seconds period', async () => {
      jest.spyOn(ioObj, ioObj.emit.name);
      const messageTimeDelay = 2000;
      const handler = new UploadHandler({
        io: ioObj,
        socketId: '01',
        messageTimeDelay,
      });
      const day = '2021-07-01 01:01';
      //Date.now do this.lastMessageSent em handleBytes
      const onFirstLastMessageSent = TestUtil.getTimeFromDate(`${day}:00`);
      // => hello chegou
      const onFirstCanExecute = TestUtil.getTimeFromDate(`${day}:02`);
      const onSecondUpdateLastMessageSent = onFirstCanExecute;
      // => segundo hello fora da janela de tempo
      const onSecondCanExecute = TestUtil.getTimeFromDate(`${day}:03`);
      // => world
      const onThirdCanExecute = TestUtil.getTimeFromDate(`${day}:04`);

      TestUtil.mockDateNow([
        onFirstLastMessageSent,
        onFirstCanExecute,
        onSecondUpdateLastMessageSent,
        onSecondCanExecute,
        onThirdCanExecute,
      ]);

      const filename = 'filename.txt';
      const messages = ['hello', 'hello', 'world'];

      const source = TestUtil.generateReadableStream(messages);

      await pipeline(source, handler.handleFileBytes(filename));

      expect(ioObj.emit).toHaveBeenCalledTimes(2);
      const [firstCallResult, secondCallResult] = ioObj.emit.mock.calls;
      expect(firstCallResult).toEqual([
        handler.ON_UPLOAD_EVENT,
        { processedToAlread: 'hello'.length, filename: filename },
      ]);
      expect(secondCallResult).toEqual([
        handler.ON_UPLOAD_EVENT,
        { processedToAlread: messages.join('').length, filename: filename },
      ]);
    });
  });

  describe('#canExecute', () => {
    test('should return true when time is later than specified delay', () => {
      const timerDelay = 1000;
      const uploadHandler = new UploadHandler({
        io: {},
        socketId: '',
        messageTimeDelay: timerDelay,
      });

      const tickNow = TestUtil.getTimeFromDate('2021-07-01 00:00:03');
      TestUtil.mockDateNow([tickNow]);
      const tickThreeSecondsBefore = TestUtil.getTimeFromDate(
        '2021-07-01 00:00:00'
      );
      const lastExecution = tickThreeSecondsBefore;
      const result = uploadHandler.canExecute(lastExecution);
      expect(result).toBeTruthy();
    });

    test('should return false when time isnt later than specified delay', () => {
      const timerDelay = 3000;
      const uploadHandler = new UploadHandler({
        io: {},
        socketId: '',
        messageTimeDelay: timerDelay,
      });

      const tickNow = TestUtil.getTimeFromDate('2021-07-01 00:00:01');
      TestUtil.mockDateNow([tickNow]);
      const tickThreeSecondsBefore = TestUtil.getTimeFromDate(
        '2021-07-01 00:00:00'
      );
      const lastExecution = tickThreeSecondsBefore;
      const result = uploadHandler.canExecute(lastExecution);
      expect(result).toBeFalsy();
    });
  });
});
