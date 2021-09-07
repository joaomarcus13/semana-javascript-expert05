import FileHelper from './fileHelper.js';
import { logger } from './logger.js';
import { dirname, resolve } from 'path';
import { fileURLToPath } from 'url';
const __dirname = dirname(fileURLToPath(import.meta.url));
const defaultDawnloadsFolder = resolve(__dirname, '../', 'downloads');

export default class Routes {
  io;
  constructor(downloadsFolder = defaultDawnloadsFolder) {
    this.downloadsFolder = downloadsFolder;
    this.fileHelper = FileHelper;
  }

  setSocketInstance(io) {
    this.io = io;
  }

  async defaultRoute(req, res) {
    res.end('hello world');
  }

  async options(req, res) {
    res.writeHead(204);
    res.end('hello world');
  }

  async post(req, res) {
    logger.info('iae post ');
    res.end('hello world');
  }

  async get(req, res) {
    const files = await this.fileHelper.getFilesStatus(this.downloadsFolder);

    res.writeHead(200);
    res.end(JSON.stringify(files));
  }

  handler(req, res) {
    res.setHeader('Access-Control-Allow-Origin', '*');
    const chosen = this[req.method.toLowerCase()] || this.defaultRoute;

    return chosen.apply(this, [req, res]);
  }
}
