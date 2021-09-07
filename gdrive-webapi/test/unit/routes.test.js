import { describe, test, expect, jest } from '@jest/globals';

import Routes from '../../src/routes.js';

describe('#routes test suite', () => {
  const defaultParams = {
    req: {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
      method: '',
      body: {},
    },
    res: {
      setHeader: jest.fn(),
      writeHead: jest.fn(),
      end: jest.fn(),
    },
    values: () => Object.values(defaultParams),
  };

  describe('#setSocketInstance', () => {
    test('setSocket should store io instance', () => {
      const routes = new Routes();
      const ioObj = {
        to: (id) => ioObj,
        emit: (event, message) => {},
      };
      routes.setSocketInstance(ioObj);
      expect(routes.io).toStrictEqual(ioObj);
    });
  });

  describe('#handler', () => {
    test('given an inexistent rout it shoul choose default route', () => {
      const routes = new Routes();
      const params = { ...defaultParams };
      params.req.method = 'inexistent';
      routes.handler(...params.values());
      expect(params.res.end).toHaveBeenCalledWith('hello world');
    });

    test('it should set any request with CORS enabled', () => {
      const routes = new Routes();
      const params = { ...defaultParams };
      params.req.method = 'inexistent';
      routes.handler(...params.values());
      expect(params.res.setHeader).toHaveBeenCalledWith(
        'Access-Control-Allow-Origin',
        '*'
      );
    });

    test('given method OPTIONS it should choose options route', async () => {
      const routes = new Routes();
      const params = { ...defaultParams };
      params.req.method = 'OPTIONS';
      await routes.handler(...params.values());
      expect(params.res.writeHead).toHaveBeenCalledWith(204);
      expect(params.res.end).toHaveBeenCalled();
    });

    test('given method POST it should choose post route', async () => {
      const routes = new Routes();
      const params = { ...defaultParams };
      params.req.method = 'POST';
      jest.spyOn(routes, routes.post.name).mockResolvedValue();
      await routes.handler(...params.values());
      expect(routes.post).toHaveBeenCalled();
    });

    test('given method GET it should choose get route', async () => {
      const routes = new Routes();
      const params = { ...defaultParams };
      params.req.method = 'GET';
      // jest.spyOn(routes, routes.get.name).mockResolvedValue();
      const methodGet = jest.spyOn(routes, 'get');
      await routes.handler(...params.values());
      expect(methodGet).toHaveBeenCalled();
    });
  });

  describe('#get', () => {
    test('given method GET it should list all files downloaded', async () => {
      const route = new Routes();
      const params = {
        ...defaultParams,
      };
      const filesStatusesMock = [
        {
          size: '51.8 kB',
          lastModified: '2021-09-06T20:58:59.656Z',
          owner: 'joaom',
          file: 'file.jpg',
        },
      ];
      jest
        .spyOn(route.fileHelper, route.fileHelper.getFilesStatus.name)
        .mockResolvedValue(filesStatusesMock);

      params.req.method = 'GET';
      await route.handler(...params.values());

      expect(params.res.writeHead).toHaveBeenCalledWith(200);

      expect(params.res.end).toHaveBeenCalledWith(
        JSON.stringify(filesStatusesMock)
      );
    });
  });
});
