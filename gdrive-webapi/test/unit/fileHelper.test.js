import { describe, test, expect, jest } from '@jest/globals';
import fs from 'fs';
// import jest from 'jest-mock';
import FileHelper from '../../src/fileHelper';

describe('#fileHelp', () => {
  describe('#getFileStatus', () => {
    test('it should return files statuses in correct format', async () => {
      const statMock = {
        dev: 3525447151,
        mode: 33206,
        nlink: 1,
        uid: 0,
        gid: 0,
        rdev: 0,
        blksize: 4096,
        ino: 281474979084361,
        size: 51776,
        blocks: 104,
        atimeMs: 1630961941020.147,
        mtimeMs: 1630524347363.9788,
        ctimeMs: 1630524348710.2278,
        birthtimeMs: 1630961939656.4468,
        atime: '2021-09-06T20:59:01.020Z',
        mtime: '2021-09-01T19:25:47.364Z',
        ctime: '2021-09-01T19:25:48.710Z',
        birthtime: '2021-09-06T20:58:59.656Z',
      };

      const mockUser = 'joaom';
      process.env.USERNAME = mockUser;
      const fileName = 'file.jpg';

      //mockResilveValue//simula o retorno da funcao
      jest
        .spyOn(fs.promises, fs.promises.readdir.name)
        .mockResolvedValue([fileName]);

      jest
        .spyOn(fs.promises, fs.promises.stat.name)
        .mockResolvedValue(statMock);

      const result = await FileHelper.getFilesStatus('/tmp');

      const expectedResult = [
        {
          size: '51.8 kB',
          lastModified: statMock.birthtime,
          owner: mockUser,
          file: fileName,
        },
      ];

      expect(fs.promises.stat).toHaveBeenCalledWith(`/tmp/${fileName}`);

      expect(result).toMatchObject(expectedResult);
    });
  });
});
