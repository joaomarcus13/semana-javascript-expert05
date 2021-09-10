import {
  describe,
  test,
  expect,
  jest,
  beforeAll,
  afterAll,
} from '@jest/globals';
import fs from 'fs';
// import jest from 'jest-mock';
import FileHelper from '../../src/fileHelper';
import FormData from 'form-data';
import TestUtil from '../_util/testUtil';
import { logger } from './../../src/logger';
import { tmpdir } from 'os';
import { join } from 'path';
import Routes from '../../src/routes';

describe('#routes integration suite', () => {
  let defaultDownloadsFolder = '';
  beforeAll(async () => {
    defaultDownloadsFolder = await fs.promises.mkdtemp(
      join(tmpdir(), 'donwloads-')
    );
  });

  afterAll(async () => {
    // console.log('defaultDownloadsFolder', defaultDownloadsFolder);
    await fs.promises.rm(defaultDownloadsFolder, { recursive: true });
  });

  beforeEach(() => {
    jest.spyOn(logger, 'info').mockImplementation();
  });
  describe('#getFileStatus', () => {
    const ioObj = {
      to: (id) => ioObj,
      emit: (event, message) => {},
    };

    test('should upload file to the folder', async () => {
      const filename = 'pomodoroapp.jpg';
      const fileStream = fs.createReadStream(
        `./test/integration/mocks/${filename}`
      );
      const response = TestUtil.generateWriteableStream(() => {});

      const form = new FormData();
      form.append('photo', fileStream);

      const defaultParams = {
        req: Object.assign(form, {
          headers: form.getHeaders(),
          method: 'POST',
          url: '?socketId=10',
        }),
        res: Object.assign(response, {
          setHeader: jest.fn(),
          writeHead: jest.fn(),
          end: jest.fn(),
        }),
        values: () => Object.values(defaultParams),
      };

      const routes = new Routes(defaultDownloadsFolder);
      routes.setSocketInstance(ioObj);
      const dir = await fs.promises.readdir(defaultDownloadsFolder);
      expect(dir).toEqual([]);
      await routes.handler(...defaultParams.values());
      const dirAfter = await fs.promises.readdir(defaultDownloadsFolder);
      expect(dirAfter).toEqual([filename]);

      expect(defaultParams.res.writeHead).toHaveBeenCalledWith(200);
      // const expectedResult = JSON.stringify({
      //   result: 'Files uploaded with success',
      // });
      // expect(defaultParams.res.end).toHaveBeenCalledWith(expectedResult);
    });
  });
});
