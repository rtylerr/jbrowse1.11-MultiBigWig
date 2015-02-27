/**
	Subclass of JBrowse/Store/BigWig
**/
define([
    "dojo/_base/declare",
    'JBrowse/Store/BigWig'
], function(declare, bigWig){
    return declare('JBrowse/Store/BigWigForMulti', bigWig, {
	
	// save args (BigWig constructor will be called directly after this one...)
	constructor: function( args ) {
		this.initArgs = args;
	},
	
	// override this method to add source to stats (to be used in MultiBigWig)
	_getGlobalStats: function( successCallback, errorCallback ) {
		var s = this._globalStats || {};
		
		if( !( 'source' in s ))
			s.source = this.initArgs.source;

		// calc mean and standard deviation if necessary
		if( !( 'scoreMean' in s ))
			s.scoreMean = s.basesCovered ? s.scoreSum / s.basesCovered : 0;
		if( !( 'scoreStdDev' in s ))
			s.scoreStdDev = this._calcStdFromSums( s.scoreSum, s.scoreSumSquares, s.basesCovered );

		successCallback( s );
	}

})});