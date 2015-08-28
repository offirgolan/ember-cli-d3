
var Funnel = require('ember-cli/node_modules/broccoli-funnel');

/* jshint node: true */
'use strict';

var exportedTestHelpers = [
  'data-generator.js',
  'graph.js'
];

module.exports = {
  name: 'ember-cli-d3',
  included: function(app) {
    this._super.included(app);

    this.app.import({
      development: app.bowerDirectory + '/d3/d3.js',
      production: app.bowerDirectory + '/d3/d3.min.js'
    });
    this.app.import('vendor/ember-d3-shim/ember-d3-shim.js');
  },
  treeForTestSupport: function () {
    return new Funnel('tests/helpers', {
      srcDir: '/',
      destDir: 'tests/helpers',
      include: exportedTestHelpers,
      description: 'testHelpers'
    });
  }
};