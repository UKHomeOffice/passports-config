'use strict';

const debug = require('debug')('hmpo:global-config');
const fs = require('fs');
const resolve = require('path').resolve;
const extname = require('path').extname;
const JSON5 = require('json5');
const yaml = require('js-yaml');
const deepMergeExtend = require('deep-clone-merge').extend;
const appRootPath = require('app-root-path');

class Config {
    constructor(appRoot) {
        this.appRoot = appRoot || appRootPath.toString();
        this.fileCache = {};
    }

    addFile(path) {
        let config = this.loadFile(path);
        this.addConfig(config);
        return this;
    }

    addString(str) {
        let config = this.parseFile(str);
        this.addConfig(config);
        return this;
    }

    addScript(str) {
        this.config = this.toJSON();
        const vm = require('vm');
        vm.runInNewContext(str, this.config);
        return this;
    }

    addConfig(config) {
        this.config = deepMergeExtend(this.toJSON(), config);
        return this;
    }

    getPackage() {
        return this.loadFile('package.json');
    }

    getDefaults() {
        return {
            APP_NAME: this.getPackage().name,
            APP_VERSION: this.getPackage().version,
            APP_ROOT: this.appRoot
        };
    }

    parseFile(content, ext) {
        switch (ext) {
        case '.yaml':
        case '.yml':
            return yaml.load(content);
        case '.json':
        case '.json5':
        default:
            return JSON5.parse(content);
        }
    }

    loadFile(path) {
        path = resolve(this.appRoot, path);

        let data = this.fileCache[path];
        if (data) return data;

        if (!fs.existsSync(path)) return this.fileCache[path] = {};

        debug('Loading config file', path);
        try {
            let content = fs.readFileSync(path, 'utf8');
            let ext = extname(path);
            data = this.parseFile(content, ext);
            return this.fileCache[path] = data;
        } catch (err) {
            err.fileName = path;
            err.message = 'Error loading config ' + err.fileName + ': ' + err.message;
            throw err;
        }
    }

    toJSON() {
        return this.config || this.getDefaults();
    }
}

module.exports = Config;
