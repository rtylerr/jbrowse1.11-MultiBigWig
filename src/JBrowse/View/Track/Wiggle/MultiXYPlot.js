/**
	Subclass of JBrowse/View/Track/Wiggle/XYPlot, used for drawing a multi-wiggle track
**/
define([
    "dojo/_base/declare",
    'JBrowse/View/Track/Wiggle/XYPlot',
	'dojo/_base/array',
	'dojo/on',
	'JBrowse/Digest/Crc32',
	'./_Scale',
	'JBrowse/Util'
], function(declare, XyPlot, array, on, Digest, Scale, Util){
    return declare('JBrowse/View/Track/Wiggle/MultiXYPlot', XyPlot, {
    
	// overrides:
	exportRegion: function( region, format, callback ) {
        // parse the locstring if necessary
        if( typeof region == 'string' )
            region = Util.parseLocString( region );

        // we can only export from the currently-visible reference
        // sequence right now
        if( region.ref != this.refSeq.name ) {
            console.error("cannot export data for ref seq "+region.ref+", "
                          + "exporting is currently only supported for the "
                          + "currently-visible reference sequence" );
            return;
        }
		
        require( ['JBrowse/View/Export/'+format+'Multi'], dojo.hitch(this,function( exportDriver ) {
            var ed = new exportDriver({
                refSeq: this.refSeq,
                track: this,
                store: this.store
            });
			ed.exportRegion( region, dojo.hitch(ed, function() {
				callback( ed.output );
				
				// clear output after each new file and reprint header
				ed.output = '';
				ed._printHeader();
			}));
        }));
    },	
	
	// overriden method
	fillBlock: function( args ) {
        var blockIndex = args.blockIndex;
        var block = args.block;
        var leftBase = args.leftBase;
        var rightBase = args.rightBase;
        var scale = args.scale;
        var finishCallback = args.finishCallback || function() {};

        var blockWidth = rightBase - leftBase;
        var canvasWidth  = Math.ceil(( rightBase - leftBase ) * scale);
        var canvasHeight = parseInt(( this.config.style || {}).height) || 100;
        this.heightUpdate( canvasHeight, blockIndex );

        try {
            dojo.create('canvas').getContext('2d').fillStyle = 'red';
        } catch( e ) {
            this.fatalError = 'This browser does not support HTML canvas elements.';
            this.fillBlockError( blockIndex, block, this.fatalError );
            return;
        }
	
		this._XYColours = {};
// console.log('b4 _getScaling: leftBase='+leftBase);
        this._getScalingMulti( args, dojo.hitch( this, function( dataScale ) {
            var c = dojo.create(
				'canvas',
				{ height: canvasHeight,
				  width:  this._canvasWidth(block),
				  style: {
					  cursor: 'default',
					  width: "100%",
					  height: canvasHeight + "px"
				  },
				  innerHTML: 'Your web browser cannot display this type of track.',
				  className: 'canvas-track'
				},
				block.domNode
			);
			c.startBase = leftBase;

			var lastSource;
            var features = [];
			// console.log('b4 fillBlock.getFeatures: blockIndex: ' + blockIndex);
// console.log('b4 getFeatures...');
            this.getFeatures(
				{ ref: this.refSeq.name,
				  basesPerSpan: 1/scale,
				  scale: scale,
				  start: leftBase,
				  end: rightBase+1
				},
				function(f) { 
					if (f.data.source != lastSource) {
						features = [];
					}
	// console.log('\tblockInd: ' + blockIndex + ', source: ' + f.get('source'));
					features.push(f); 
					lastSource = f.data.source;
				},
				dojo.hitch( this, function(args) {

					// if the block has been freed in the meantime,
					// don't try to render
					if( ! (block.domNode && block.domNode.parentNode ))
						return;

					this._drawFeaturesMulti( scale, leftBase, rightBase, block, c, features, dataScale, blockIndex );
					this._postDrawMulti( c, features[0], dataScale );

					finishCallback();
				}),
				dojo.hitch( this, function(e) {
					this._handleError( e, args );
				})
			);
        }));
    },
	// 
	_getScalingMulti: function( viewArgs, successCallback, errorCallback ) {

        this._getScalingStats( viewArgs, dojo.hitch(this, function( stats ) {

            //calculate the scaling if necessary
            // if( ! this.lastScaling || ! this.lastScaling.sameStats( stats ) ) {
			var statsFingerprint = Digest.objectFingerprint( stats );
            if( ! this.lastScaling || this.lastScaling._statsFingerprint != statsFingerprint ) {

                var scaling = new Scale( this.config, stats );
                
				//////////////
				// overwrite existing normalise method from Scale as it's not producing correct answers...:
				var thisThing = this;
				scaling.normalize = (function() {
					switch( thisThing.config.scale ) {
					case 'z_score':
						return function( value ) {
							with(scaling)
								return (value+offset-stats.scoreMean) / stats.scoreStdDev-min / range;
						};
					case 'log':
						return function( value ) {
							with(scaling)
								return ( scaling.log(value+offset) - min )/range;
						};
					case 'linear':
					default:
						return function( value ) {
							with(scaling)
								return ( value + offset - min ) / range;
						};
					}
				})();
				//////////////////////////////
				
                // bump minDisplayed to 0 if it is within 0.5% of it
                if( Math.abs( scaling.min / scaling.max ) < 0.005 )
                    scaling.min = 0;

                // update our track y-scale to reflect it
                this.makeYScale({
                    fixBounds: true,
                    min: scaling.min,
                    max: scaling.max
                });

                // and finally adjust the scaling to match the ruler's scale rounding
                scaling.min = this.ruler.scaler.bounds.lower;
                scaling.max = this.ruler.scaler.bounds.upper;
                scaling.range = scaling.max - scaling.min;

                this.lastScaling = scaling;
            }

            successCallback( this.lastScaling );
        }), errorCallback );
    },
	
	/**
	 * Draw a set of wiggle features on the canvas.
	 * @private (overriden)
	 */
	_drawFeaturesMulti: function( scale, leftBase, rightBase, block, canvas, features, dataScale, blockIndex ) {
		var context = canvas.getContext('2d');
		var canvasHeight = canvas.height;
		var canvasWidth = canvas.width;
		var toY = dojo.hitch( this, function( val ) {
		   return canvasHeight * ( 1-dataScale.normalize.call(this, val) );
		});

		// set colour according to source
		var source = (features[0] && features[0].data && features[0].data.source)? features[0].data.source : 'unknown';
		var lineColour = this._getXYColour(source);
		context.strokeStyle = lineColour;

		// step should be proportional to #features and #files in userplot
		var len = features.length;
		var scaleFactor = 5000;
		var step = Math.ceil(len*this.config.urlTemplate.length/scaleFactor);

		// set up cutoff values if show_peaks is set
		var cutoffMinWidth = 6;
		var hiddenPeak = false;		// hidden peak (or trough)
		var cutoffs = {};
		var cutoffColour;
		if (this.config.show_peaks &&  (this.config.show_peaks.file == source || this.config.show_peaks.colour == lineColour)) {
			cutoffs.scoreMax = this.config.show_peaks.cutoff_up || this.config.show_peaks.cutoff;
			cutoffs.pixelsMin = toY(cutoffs.scoreMax);								// pixels in y-axis are flipped
			if (this.config.show_peaks.cutoff_down) {
				cutoffs.scoreMin = this.config.show_peaks.cutoff_down;
				cutoffs.pixelsMax = toY(cutoffs.scoreMin);							// pixels in y-axis are flipped
			}
			cutoffColour = this.config.show_peaks.highlight_colour || 'yellow';
		}
		
	// console.log( 'New block >>> (leftBase,rightBase)=('+leftBase+','+rightBase+')' );
		var prevXY;
		for(var i = 0; i < len; i++) {

			var score = features[i].get('score');
			if (i%step != 0) {
				// if cutoff(s) set, check if any hidden values are higher (or lower) than cutoff(s)
				if (cutoffs.scoreMax != undefined) { 
					hiddenPeak = hiddenPeak || (score > cutoffs.scoreMax); 
				} 
				if (cutoffs.scoreMin != undefined) { 
					hiddenPeak = hiddenPeak || (score < cutoffs.scoreMin); 
				}
				continue;
			}
			var fRect = this._featureRect(scale, leftBase, canvasWidth, features[i] );
			fRect.t = toY( score );

		// console.log( features[i].get('start') +'-'+features[i].get('end')+':'+features[i].get('score') );

			if (!prevXY) {
				prevXY = {x: fRect.l, y: fRect.t};
			}
			
			// draw line
			context.beginPath();
			context.moveTo(prevXY.x, prevXY.y);
			context.lineTo(fRect.l + fRect.w, fRect.t);
			context.stroke();
			
			//
			if (hiddenPeak || 
				(cutoffs.pixelsMin && prevXY.y < cutoffs.pixelsMin && fRect.t < cutoffs.pixelsMin) || 
				(cutoffs.pixelsMax && prevXY.y > cutoffs.pixelsMax && fRect.t > cutoffs.pixelsMax))
			{
				// both left and right side above or below cutoff so draw rectangle across whole block
				context.fillStyle = cutoffColour;
				context.globalAlpha = 0.5;
				this._drawCutoffAreaWithMinWidth(context, prevXY.x, fRect.w, cutoffMinWidth, canvas.height);
				context.globalAlpha = 1;
			}
			else {
				var drawPartials = {
					up: cutoffs.pixelsMin && (prevXY.y < cutoffs.pixelsMin || fRect.t < cutoffs.pixelsMin),
					down: cutoffs.pixelsMax && (prevXY.y > cutoffs.pixelsMax || fRect.t > cutoffs.pixelsMax)
				};
				if (drawPartials.up || drawPartials.down) {
					
					// exactly one of left or right side is below cutoff line, so work out intersection on x-axis
					var gradient = (fRect.t - prevXY.y) / fRect.w;
					context.fillStyle = cutoffColour;
					context.globalAlpha = 0.5;
					
					// draw partial rect for upper cutoff
					if (drawPartials.up) {
						var intersectX = Math.ceil( ( cutoffs.pixelsMin - prevXY.y)/gradient + prevXY.x );
						if (gradient < 0) {
							// draw rectangle from intersection to far right of block
							this._drawCutoffAreaWithMinWidth(context, intersectX, fRect.l + fRect.w - intersectX, cutoffMinWidth, canvas.height);
						} else {
							// draw rectangle from far left of block to intersection
							this._drawCutoffAreaWithMinWidth(context, prevXY.x, intersectX - prevXY.x, cutoffMinWidth, canvas.height); 
						}
					}
					
					// draw partial rect for lower cutoff
					if (drawPartials.down) {
						var intersectX = Math.ceil( ( cutoffs.pixelsMax - prevXY.y)/gradient + prevXY.x );
						if (gradient > 0) {
							// draw rectangle from intersection to far right of block
							this._drawCutoffAreaWithMinWidth(context, intersectX, fRect.l + fRect.w - intersectX, cutoffMinWidth, canvas.height);
						} else {
							// draw rectangle from far left of block to intersection
							this._drawCutoffAreaWithMinWidth(context, prevXY.x, intersectX - prevXY.x, cutoffMinWidth, canvas.height); 
						}
					}
					context.globalAlpha = 1;
				}
			}
			hiddenPeak = false;
			
			prevXY = {x: fRect.l + fRect.w, y: fRect.t};
		}
	},
	_drawCutoffAreaWithMinWidth: function(c, x, w, minWidth, h) {
		if (w <= minWidth) {
			c.fillRect( x + (w-minWidth)/2, 0, minWidth, h );
		} else {
			c.fillRect( x, 0, w, h );
		}
	},
	
	 /**
     * Draw anything needed after the features are drawn.
     */
    _postDrawMulti: function( canvas, firstFeature, dataScale ) {
        var context = canvas.getContext('2d');
        var canvasHeight = canvas.height;
        var toY = dojo.hitch( this, function( val ) {
           return canvasHeight * (1-dataScale.normalize.call(this, val));
        });
				
		var source = ((firstFeature && firstFeature.data.source && firstFeature.data.source)? firstFeature.data.source : 'unknown');
		
        // draw the variance_band if requested (since these are combined stats just draw for first bigWig)
		if( this.config.variance_band && this.store.combinedGlobalStats && source == this.store.bigWigs[0].name) {

			var drawVarianceLine = function( colour, label, min, max ) {
				var top = toY(max);
				var bottom = toY(min);
				var height = Math.max( 1, bottom-top);
				// console.log('lable '+ label + ', top: ' + top + ', bot: ' + bottom+ ', height: ' + height);
				context.fillStyle = colour;
				context.fillRect( 0, top, canvas.width, height );
				context.fillStyle = 'black';
				context.font = '12px sans-serif';
				context.fillText( label, 2, bottom );
				context.fillText( label, 2, top );
			};
			
			//
			var m = this.store.combinedGlobalStats.scoreMean;
			var sd = this.store.combinedGlobalStats.scoreStdDev;
			drawVarianceLine('rgba(212,242,211,0.3)', '2s', m - 2*sd, m + 2*sd);
			drawVarianceLine('rgba(212,242,211,0.3)', '1s', m - sd, m + sd);
			drawVarianceLine('rgba(168,173,19,0.3)', 'mean', m, m);
			
			
			// //  (old version:)
			// drawVarianceLine('rgba(212,242,211,0.3)', '2s', min - 2*this.multiStatsInfo.stdDev.max, max + 2*this.multiStatsInfo.stdDev.max);
			// drawVarianceLine('rgba(212,242,211,0.3)', '1s', min - this.multiStatsInfo.stdDev.max, max + this.multiStatsInfo.stdDev.max);
			// drawVarianceLine('rgba(255,255,0,0.3)', 'mean', this.store.combinedGlobalStats.scoreMean, this.store.combinedGlobalStats.scoreMean);
		}

		// if show_peaks set, draw horizontal cutoff line(s)
		if (this.config.show_peaks && (this.config.show_peaks.file || this.config.show_peaks.colour)) {
			var drawCutoffLine = function(cutoff) {
				if (!cutoff) { return; } 
				
				var cutoffPixels = toY(cutoff);
				context.strokeStyle = 'gray';
				context.beginPath();
				context.moveTo(0, cutoffPixels);
				context.lineTo(canvas.width, cutoffPixels);
				context.stroke();
				
				context.fillStyle = 'gray';
				context.font = '12px sans-serif';
				context.fillText( "cut-off", 20, cutoffPixels-2 );
			}
			drawCutoffLine(this.config.show_peaks.cutoff_up || this.config.show_peaks.cutoff);
			drawCutoffLine(this.config.show_peaks.cutoff_down);
		}
		
        // draw the origin line if it is not disabled
        var originColor = this.config.style.origin_color;
        if( typeof originColor == 'string' && !{'none':1,'off':1,'no':1,'zero':1}[originColor] && source == this.store.bigWigs[0].name) {
            var originY = toY( dataScale.origin );
            context.fillStyle = originColor;
            context.fillRect( 0, originY, canvas.width-1, 1 );
        }
    },
	
	/**
	 * Get the correct colour for this source file
	 * @private
	 */
	_getXYColour: function( source ) {
		
		if (!this._XYColours[source]) {
			for(var i = 0; i < this.config.urlTemplate.length; i++) {
				var file = this.config.urlTemplate[i].file.replace(/.+\/([^\/]+$)/, '$1');
				if (file == source) {
					this._XYColours[source] = this.config.urlTemplate[i].colour || 'black';
					return this._XYColours[source];
				}
			}
			this._XYColours[source] = 'black';		// default
		}
		return this._XYColours[source];
	}
	
	
	
    });
});