'use strict';

const Config = require(APP_ROOT + '/lib/config');
const fs = require('fs');
const appRootPath = require('app-root-path');

describe.only('Config Loader', () => {
    let packageConf, config;

    beforeEach( () => {
        packageConf = { name: 'test', version: '1.2.3' };
        sinon.stub(Config.prototype, 'getPackage').returns(packageConf);
        sinon.stub(appRootPath, 'toString').returns('/real/root');
        config = new Config('/root/path');
    });

    afterEach( () => {
        if (Config.prototype.getPackage.restore) {
            Config.prototype.getPackage.restore();
        }
        appRootPath.toString.restore();
    });

    it('exports a class function', () => {
        Config.should.be.a.function;
    });

    describe('constructor', () => {
        it('should app root to passed in app root', () => {
            config.appRoot.should.equal('/root/path');
        });

        it('should default the app root using the appRootPath library', () => {
            config = new Config();
            config.appRoot.should.equal('/real/root');
        });
    });

    describe('getPackage', () => {
        beforeEach( () => {
            Config.prototype.getPackage.restore();
            sinon.stub(Config.prototype, 'loadFile').returns(packageConf);
        });

        afterEach(() => {
            Config.prototype.loadFile.restore();
        });

        it('should run loadFile for the app root package.json', () => {
            config.getPackage();
            Config.prototype.loadFile.should.have.been.calledOnce.and.calledWithExactly(
                'package.json'
            );
        });

        it('should return value returned from loadFile', () => {
            config.getPackage().should.equal(packageConf);
        });
    });

    describe('getDefaults', () => {
        it('should return computed app config', () => {
            config.getDefaults().should.deep.equal({
                APP_NAME: 'test',
                APP_VERSION: '1.2.3',
                APP_ROOT: '/root/path'
            });
        });
    });

    describe('loadFile', () => {
        beforeEach( () => {
            sinon.stub(fs, 'existsSync').returns(true);
            sinon.stub(fs, 'readFileSync').returns('{"foo":"bar"}');
        });

        afterEach( () => {
            fs.existsSync.restore();
            fs.readFileSync.restore();
        });

        it('should check if the file exists', () => {
            config.loadFile('/filename');
            fs.existsSync.should.have.been.calledWithExactly('/filename');
        });

        it('should return an json decoded file content', () => {
            config.loadFile('/filename').should.deep.equal({ foo: 'bar' });
        });

        it('should return an empty object if file not found', () => {
            fs.existsSync.returns(false);
            config.loadFile('/filename').should.deep.equal({});
        });

        it('should cache the file content', () => {
            config.loadFile('/filename');
            config.fileCache.should.deep.equal({
                '/filename': { foo: 'bar' }
            });
        });

        it('should return cached content if found', () => {
            config.fileCache = {
                '/filename': { foo: 'boo' }
            };
            let result = config.loadFile('/filename');
            result.should.deep.equal({ foo: 'boo' });
            fs.existsSync.should.not.have.been.called;
            fs.readFileSync.should.not.have.been.called;
        });

        it('should throw an error if config file is invalid', () => {
            fs.readFileSync.returns('{"foo":"bar"');
            expect( () => config.loadFile('/filename') ).to.throw('Error loading config');
        });
    });

    describe('config sources', () => {

        beforeEach(() => {
            config.config = {
                deep: {
                    field: 'original value',
                    second: 'field'
                },
                another: 'field'
            };
        });

        describe('addFile', () => {
            it('should deepMerge the decoded JSON file with the default config', () => {
                config.addFile(__dirname + '/fixtures/test.json');

                config.config.should.deep.equal({
                    deep: {
                        field: 'new value',
                        second: 'field'
                    },
                    another: 'field'
                });
            });

            it('should deepMerge the decoded YAML file with the default config', () => {
                config.addFile(__dirname + '/fixtures/test.yaml');

                config.config.should.deep.equal({
                    deep: {
                        field: 'new value',
                        second: 'field'
                    },
                    another: 'field'
                });
            });

            it('should deepMerge the decoded JSON5 file with the default config', () => {
                config.addFile(__dirname + '/fixtures/test.json5');

                config.config.should.deep.equal({
                    deep: {
                        field: 'new value',
                        second: 'field'
                    },
                    another: 'field'
                });
            });
        });

        describe('addString', () => {

            it('should deepMerge the decoded JSON string with the default config', () => {
                let str = '{ "deep": { "field": "new value" } }';

                config.addString(str);

                config.config.should.deep.equal({
                    deep: {
                        field: 'new value',
                        second: 'field'
                    },
                    another: 'field'
                });
            });

            it('should deepMerge the decoded JSON5 string with the default config', () => {
                let str = '{ deep: { field: "new value" } }';

                config.addString(str);

                config.config.should.deep.equal({
                    deep: {
                        field: 'new value',
                        second: 'field'
                    },
                    another: 'field'
                });
            });
        });

        describe('addScript', () => {
            it('should run decoded string as a script', () => {
                let str = 'deep.field = "new value"';

                config.addScript(str);

                config.config.should.deep.equal({
                    deep: {
                        field: 'new value',
                        second: 'field'
                    },
                    another: 'field'
                });
            });
        });

        describe('addConfig', () => {
            it('should deepMerge the config object with the default config', () => {
                let obj = { deep: { field: 'new value' } };

                config.addConfig(obj);

                config.config.should.deep.equal({
                    deep: {
                        field: 'new value',
                        second: 'field'
                    },
                    another: 'field'
                });
            });
        });
    });

    describe('toJSON', () => {
        it('should return the current merged config', () => {
            let currentConfig = {};
            config.config = currentConfig;
            let result = config.toJSON();

            result.should.equal(currentConfig);
        });

        it('it should default to the default config', () => {
            let result = config.toJSON();

            result.should.deep.equal({
                APP_NAME: 'test',
                APP_ROOT: '/root/path',
                APP_VERSION: '1.2.3'
            });
        });
    });


    it('should load config files from disk, merge them and return config data', () => {
        config.addFile(__dirname + '/fixtures/test1.json');
        config.addFile(__dirname + '/fixtures/test2.json');
        config.addFile(__dirname + '/fixtures/test3.json');
        let result = config.toJSON();
        result.should.deep.equal({
            APP_NAME: 'test',
            APP_ROOT: '/root/path',
            APP_VERSION: '1.2.3',
            deepObject: {
                array1: [
                    'new value'
                ],
                obj1: {
                    'deep-object': 'deep-value'
                },
                value1: 'test3-deep'
            },
            value1: 'test2-value1',
            value2: 'test3-value2',
            value3: 'test1-value3',
            value4: 'test2-value4',
            value5: 'test3-value5'
        });
    });

});
