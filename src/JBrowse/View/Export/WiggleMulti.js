define("JBrowse/View/Export/WiggleMulti", [ 'dojo/_base/declare',
         'dojo/_base/array',
         'JBrowse/View/Export'
       ],
       function( declare, array, ExportBase ) {

return declare( ExportBase,
 /**
  * @lends JBrowse.View.Export.WiggleMulti
  * (This is a replcement for JBrowse.View.Export.Wiggle, inheriting directly from 'JBrowse/View/Export')
  */
{	
	constructor: function( args ) {
        this._printHeader();
    },
	
    _printHeader: function() {
        this.featureIndex = this.featureIndex || 0;	
		this.print( 'track type=wiggle_0' );
        if( this.track ) {
			if( this.track.name && this.store.bigWigs[this.featureIndex] ) {
				var fileName = this.store.bigWigs[this.featureIndex].initArgs.source.replace(/\.bw$/, '');
                this.print(' name="'+this.track.name+' ('+fileName+')"');
			}
            var metadata = this.track.getMetadata();
            if( metadata.key )
                this.print(' description="'+metadata.key+'"');
        }
        this.print("\n");
		this.featureIndex++;
    },
	
    /**
     * print the Wiggle step
     * @private
     */
    _printStep: function( span, ref ) {
        this.print( 'variableStep'+ (ref ? ' chrom='+ref : '' ) + ' span='+span+"\n" );
    },
	
	exportRegion: function( region, callback ) {
        var curspan;
        var curref;
        this.store.getFeatures(
            region,
            dojo.hitch( this, function(f) {
                var span = f.get('end') - f.get('start');
                var ref = f.get('seq_id');
                if( !( curspan == span && ref == curref ) ) {
                    this._printStep( span, ref == curref ? null : ref );
                    curref = ref;
                    curspan = span;
                }
                this.print( (f.get('start')+1) + "\t" + f.get('score') + "\n" );
            }),
            dojo.hitch( this, function() {
                callback( this.output );
				
				// reset these for next file
				curspan = undefined;
				curref = undefined;
            })
        );
    }
});
});