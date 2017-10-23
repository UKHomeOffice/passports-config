const chai = require('chai');
chai.use(require('sinon-chai'));

global.should = chai.should();
global.expect = chai.expect;
global.sinon = require('sinon');
global.APP_ROOT = __dirname + '/../..';
