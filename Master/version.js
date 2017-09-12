/* -----------------------------------------------------------------------------
 * @copyright (C) 2017, Alert Logic, Inc
 * @doc
 *
 * Encapsulates the version constant for this azure collector.  The version
 * is a required field in the npm package.json and should be updated for
 * each realease of the collector.
 *
 * @end
 * -----------------------------------------------------------------------------
 */

var package = require('../package.json');

var _getVersion = function() {
    return package.version;
};

module.exports = {
    getVersion : _getVersion
};
