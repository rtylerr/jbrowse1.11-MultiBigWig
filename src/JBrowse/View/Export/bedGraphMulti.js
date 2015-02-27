define("JBrowse/View/Export/bedGraphMulti", [ 'dojo/_base/declare',
         'dojo/_base/array',
         'JBrowse/View/Export/bedGraph'
       ],
       function( declare, array, bedGraph ) {

return declare( bedGraph,
 /**
  * @lends JBrowse.View.Export.bedGraphMulti
  */
{
	// overrides:
    _printHeader: function() {
        // print the track definition
		this.featureIndex = this.featureIndex || 0;
        this.print( 'track type=bedGraph' );
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
    }
});
});