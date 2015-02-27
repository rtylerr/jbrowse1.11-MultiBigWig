/**
	Container for all bigwig files used for multi-wiggle tracks
**/
define([
	"dojo/_base/declare", 
	"JBrowse/Store/BigWig",
	"JBrowse/Store/BigWigForMulti"
], function(declare, BigWig, BigWigForMulti){

	return declare(null, {
    // return declare('JBrowse/Store/MultiBigWig', BigWig, {		// (N.B. this would create a subclass of BigWig)

		// create array of bigWigs
		constructor: function(args){
			this.bigWigs = [];
			dojo.forEach( args.urlTemplate, function(urlTemplate, i) {
				this.bigWigs.push(new BigWigForMulti({
					baseUrl: args.baseUrl,
					browser: args.browser,
					compress: args.compress,
					refSeq: args.refSeq,
					subfeatures: args.subfeatures,
					type: args.type,
					urlTemplate: args.baseUrl + urlTemplate.file,
					source: urlTemplate.file.replace(/.+\/([^\/]+$)/, '$1')
				}));
			}, this);			
		},
		
		// combine the region stats for each big wig file...	
		getRegionStats: function(region, successCallback, errorCallback){

			var maxIndex = this.bigWigs.length - 1;
			this.combinedRegionStats = {sourcesCombined: {}, sourceCount: 0, scoreSum: 0, scoreSumSquares: 0};
			var mbw = this;		
			dojo.forEach( this.bigWigs, function(bw, i) {
				if (i < maxIndex) {
					// for the first n-1 big wigs, just combine the stats (don't call callback)
					bw.getRegionStats(region, dojo.hitch(this, function( stats ) {
						
						if (!mbw.combinedRegionStats.sourcesCombined[stats.source]) {
							// only combine for new big wig file (i.e. stats.source not seen before)
							mbw.combineStats.call(mbw, mbw.combinedRegionStats, stats);
						}
					}), errorCallback);
				} else {
					// for the last big wig, combine the stats and call the callback (to continue drawing...)
					bw.getRegionStats(region, function( stats ) {
						if (!mbw.combinedRegionStats.sourcesCombined[stats.source]) {
							// only combine for new big wig file (i.e. stats.source not seen before)
							mbw.combineStats.call(mbw, mbw.combinedRegionStats, stats);
						}
						try {
							successCallback(mbw.combinedRegionStats);
						} catch(err) {
							console.log(err);
						}
					} , errorCallback);
				}
			});
		},

		// same as for region stats...
	    getGlobalStats: function( successCallback, errorCallback ) {
			
			var maxIndex = this.bigWigs.length - 1;
			this.combinedGlobalStats = {sourcesCombined: {}, sourceCount: 0, scoreSum: 0, scoreSumSquares: 0};
			var mbw = this;		
			dojo.forEach( this.bigWigs, function(bw, i) {
				if (i < maxIndex) {
					// for the first n-1 big wigs, just combine the stats (don't call callback)
					bw.getGlobalStats(dojo.hitch(this, function( stats ) {
						if (!mbw.combinedGlobalStats.sourcesCombined[stats.source]) {
							// only combine for new big wig file (i.e. stats.source not seen before)
							mbw.combineStats.call(mbw, mbw.combinedGlobalStats, stats);
						}
					}), errorCallback);
				} else {
					// for the last big wig, combine the stats and call the callback (to continue drawing...)
					bw.getGlobalStats(function( stats ) {
						if (!mbw.combinedGlobalStats.sourcesCombined[stats.source]) {
							// only combine for new big wig file (i.e. stats.source not seen before)
							mbw.combineStats.call(mbw, mbw.combinedGlobalStats, stats);
						}
						try {
							successCallback(mbw.combinedGlobalStats);
						} catch(err) {
							console.log(err);
						}
					} , errorCallback);
				}
			});
		},
		combineStats: function(stats, combineWith) {
			stats.sourcesCombined[combineWith.source] = true;
			stats.sourceCount++;
			
			// combine combineWith...
			stats.basesCovered = combineWith.basesCovered;
			stats.scoreMin = Math.min(stats.scoreMin || combineWith.scoreMin, combineWith.scoreMin);
			stats.scoreMax = Math.max(stats.scoreMax || combineWith.scoreMax, combineWith.scoreMax);
			stats.scoreMean = ((stats.scoreMean || combineWith.scoreMean) + combineWith.scoreMean)/2;
			stats.scoreSum += combineWith.scoreSum;
			stats.scoreSumSquares += combineWith.scoreSumSquares;
			stats.scoreStdDev = this.bigWigs[0]._calcStdFromSums(
				stats.scoreSum,
				stats.scoreSumSquares,
				stats.basesCovered * stats.sourceCount 
			);
		},
		
		// iterate over each bigwig
		getFeatures: function( query, featCallback, endCallback, errorCallback ) {
			dojo.forEach( this.bigWigs, function(bw, i) {
				bw.getFeatures( query, featCallback, endCallback, errorCallback );
			});
		},
		
	});
});
