var async = require( 'async' );
CONFIG = require( '../config.js' );
exports.task = function()
{
	async.series([
		require( './build' ).action
	] , this.async() );
};