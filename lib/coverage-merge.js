'use strict';

var path = require('path');
var getConfig = require('./config');
var dir = require('node-dir');
var Promise = require('rsvp').Promise;

/**
 * Merge together coverage files created when running in multiple threads,
 * for example when being used with ember exam and parallel runs.
 */
module.exports = {
  name: 'coverage-merge',
  description: 'Merge multiple coverage files together.',
  run: function () {
    var istanbul = require('istanbul-api');
    var config = this._getConfig();

    var coverageFolderSplit = config.coverageFolder.split('/');
    var coverageFolder = coverageFolderSplit.pop();
    var coverageRoot = this.project.root + '/' + coverageFolderSplit.join('/');
    var coverageDirRegex = new RegExp(coverageFolder + '_.*');

    let reporter = istanbul.createReporter();
    reporter.dir = path.join(coverageRoot, coverageFolder);
    let map = istanbul.libCoverage.createCoverageMap();

    return new Promise(function (resolve, reject) {
      dir.readFiles(coverageRoot, { matchDir: coverageDirRegex, match: /coverage-final\.json/ },
        function (err, coverageSummary, next) {
          if (err) {
            reject(err);
          }
          map.merge(JSON.parse(coverageSummary));
          next();
        },
        function (err) {
          if (err) {
            reject(err);
          }

          if (config.reporters.indexOf('json-summary') === -1) {
            config.reporters.push('json-summary');
          }

          reporter.addAll(config.reporters);
          reporter.write(map);
          resolve();
        });
    });
  },

  /**
   * Get project configuration
   * @returns {Configuration} project configuration
   */
  _getConfig: function () {
    return getConfig(this.project.configPath());
  }
};
