var expect = require('chai').expect,
    File = require('vinyl'),
    isWindows = require('is-windows'),
    gutil = require('gulp-util'),
    phpcs = require('../../index.js');

var buildCommand = function(cmd) {
    if (isWindows()) {
        return cmd.replace(/\//g, '\\') + '.cmd';
    }

    return cmd + '.sh';
};

// NOTICE: All path to commands are specified related to the root of the
// project. This is because cwd is "../../" when the tests are run.

describe('PHPCS', function() {
    describe('CLI tool runner', function() {
        it('should fail if the CLI tool cannot be found', function(done) {
            var plugin = phpcs({
                bin: buildCommand('./test/fixture/missed')
            });

            plugin.on('error', function(error) {
                expect(error).to.be.an.instanceof(gutil.PluginError);
                expect(error.message).to.contain('Cannot find');
                expect(error.message).to.contain(buildCommand('./test/fixture/missed'));
                done();
            });

            plugin.write(new File({
                path: '/src/bad_file.php',
                contents: new Buffer('test')
            }));
        });

        it('should ignore empty files', function(done) {
            var plugin = phpcs({
                bin: buildCommand('./test/fixture/error')
            });

            plugin.on('data', function(file) {
                expect(file.isNull()).to.be.true;
                expect(file.phpcsReport).to.be.undefined;

                done();
            });

            plugin.write(new File({
                path: '/src/bad_file.php'
            }));
        });

        it('should do nothing if PHPCS exists with zero exit-code', function(done) {
            var plugin = phpcs({
                bin: buildCommand('./test/fixture/zero')
            });

            plugin.on('data', function(file) {
                expect(file).to.have.property('phpcsReport');
                expect(file.phpcsReport).to.have.property('error').which.is.false;

                done();
            });

            plugin.write(new File({
                path: '/src/bad_file.php',
                contents: new Buffer('test')
            }));
        });

        it('should retrieve stdout "as is" for style errors', function(done) {
            var plugin = phpcs({
                bin: buildCommand('./test/fixture/style_error')
            });

            plugin.on('data', function(file) {
                expect(file).to.have.property('phpcsReport');
                var report = file.phpcsReport;
                expect(report).to.be.an.instanceof(Object);
                expect(report).to.have.property('error').which.is.true;
                expect(report).to.have.property('output').which.is.a('string');
                expect(report.output).to.match(/Give me these lines\r?\nback!/);
                // File name should be also passed to PHPCS in special format
                expect(report.output).to.match(/^phpcs_input_file: \/src\/bad_file\.php\r?\n/);

                done();
            });

            plugin.write(new File({
                path: '/src/bad_file.php',
                contents: new Buffer('Give me these lines\nback!')
            }));
        });

        it('should retrieve error "as is"', function(done) {
            var plugin = phpcs({
                bin: buildCommand('./test/fixture/error')
            });

            plugin.on('error', function(error) {
                expect(error).to.be.an.instanceof(gutil.PluginError);
                expect(error.message).to.be.equal('Execution of Code Sniffer Failed');
                expect(error).to.have.property('stdout');
                expect(error.stdout).to.contain('This is a test error.');

                done();
            });

            plugin.write(new File({
                path: '/src/bad_file.php',
                contents: new Buffer('test')
            }));
        });
    });

    describe('options builder', function() {
        var fakeFile = null;

        beforeEach(function() {
            fakeFile = new File({
                path: '/src/bad_file.php',
                contents: new Buffer('test')
            });
        });

        afterEach(function() {
            fakeFile = null;
        });

        it('should use none of options by default', function(done) {
            var plugin = phpcs({
                bin: buildCommand('./test/fixture/args')
            });

            plugin.on('data', function(file) {
                var output = file.phpcsReport.output.trim();
                expect(output).to.be.equal('');
                done();
            });

            plugin.write(fakeFile);
        });

        it('should use passed in "severity" option "as is"', function(done) {
            var plugin = phpcs({
                bin: buildCommand('./test/fixture/args'),
                severity: 0
            });

            plugin.on('data', function(file) {
                var output = file.phpcsReport.output.trim();
                expect(output).to.be.equal('--severity=0');
                done();
            });

            plugin.write(fakeFile);
        });

        it('should use passed in "warningSeverity" option "as is"', function(done) {
            var plugin = phpcs({
                bin: buildCommand('./test/fixture/args'),
                warningSeverity: 1
            });

            plugin.on('data', function(file) {
                var output = file.phpcsReport.output.trim();
                expect(output).to.be.equal('--warning-severity=1');
                done();
            });

            plugin.write(fakeFile);
        });

        it('should use passed in "errorSeverity" option "as is"', function(done) {
            var plugin = phpcs({
                bin: buildCommand('./test/fixture/args'),
                errorSeverity: 2
            });

            plugin.on('data', function(file) {
                var output = file.phpcsReport.output.trim();
                expect(output).to.be.equal('--error-severity=2');
                done();
            });

            plugin.write(fakeFile);
        });

        it('should use passed in "standard" option "as is"', function(done) {
            var plugin = phpcs({
                bin: buildCommand('./test/fixture/args'),
                standard: 'PSR2'
            });

            plugin.on('data', function(file) {
                var output = file.phpcsReport.output.trim();
                expect(output).to.be.equal('--standard=PSR2');
                done();
            });

            plugin.write(fakeFile);
        });

        it('should use passed in "encoding" option "as is"', function(done) {
            var plugin = phpcs({
                bin: buildCommand('./test/fixture/args'),
                encoding: 'utf8'
            });

            plugin.on('data', function(file) {
                var output = file.phpcsReport.output.trim();
                expect(output).to.be.equal('--encoding=utf8');
                done();
            });

            plugin.write(fakeFile);
        });

        it('should use "-s" flag if "showSniffCode" option is true', function(done) {
            var plugin = phpcs({
                bin: buildCommand('./test/fixture/args'),
                showSniffCode: true
            });

            plugin.on('data', function(file) {
                var output = file.phpcsReport.output.trim();
                expect(output).to.be.equal('-s');
                done();
            });

            plugin.write(fakeFile);
        });

        it('should not use "-s" flag if "showSniffCode" option is false', function(done) {
            var plugin = phpcs({
                bin: buildCommand('./test/fixture/args'),
                showSniffCode: false
            });

            plugin.on('data', function(file) {
                var output = file.phpcsReport.output.trim();
                expect(output).to.be.equal('');
                done();
            });

            plugin.write(fakeFile);
        });

        it('should use passed in "sniffs" option', function(done) {
            var plugin = phpcs({
                bin: buildCommand('./test/fixture/args'),
                sniffs: ['foo', 'bar', 'baz']
            });

            plugin.on('data', function(file) {
                var output = file.phpcsReport.output.trim();
                // Validate the option.
                expect(output).to.match(/^--sniffs=/);
                // Validate used sniffs.
                var usedSniffs = output.split('=')[1].split(',');
                expect(usedSniffs).to.have.members(['foo', 'bar', 'baz']);

                done();
            });

            plugin.write(fakeFile);
        });

        it('should not use "--sniffs" option if an empty array is passed in', function(done) {
            var plugin = phpcs({
                bin: buildCommand('./test/fixture/args'),
                sniffs: []
            });

            plugin.on('data', function(file) {
                var output = file.phpcsReport.output.trim();
                expect(output).to.be.equal('');
                done();
            });

            plugin.write(fakeFile);
        });

        it('should not use "--sniffs" option if not an array is passed in', function(done) {
            var plugin = phpcs({
                bin: buildCommand('./test/fixture/args'),
                sniffs: 'test string'
            });

            plugin.on('data', function(file) {
                var output = file.phpcsReport.output.trim();
                expect(output).to.be.equal('');
                done();
            });

            plugin.write(fakeFile);
        });

        it('should use "--colors" flag if "colors" option is true', function(done) {
            var plugin = phpcs({
                bin: buildCommand('./test/fixture/args'),
                colors: true
            });

            plugin.on('data', function(file) {
                var output = file.phpcsReport.output.trim();
                expect(output).to.be.equal('--colors');
                done();
            });

            plugin.write(fakeFile);
        });

        it('should not use "--colors" flag if "colors" option is false', function(done) {
            var plugin = phpcs({
                bin: buildCommand('./test/fixture/args'),
                colors: false
            });

            plugin.on('data', function(file) {
                var output = file.phpcsReport.output.trim();
                expect(output).to.be.equal('');
                done();
            });

            plugin.write(fakeFile);
        });
    });
});
