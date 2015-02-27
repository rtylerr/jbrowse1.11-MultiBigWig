define("JBrowse/View/Export/GFF3Multi", [ 'dojo/_base/declare',
         'dojo/_base/array',
         'JBrowse/View/Export/GFF3'
       ],
       function( declare, array, GFF3 ) {

return declare( GFF3,
 /**
  * @lends JBrowse.View.Export.GFF3Multi
  */
{
	// overrides:
    _printHeader: function() {
        this.print( "##gff-version 3\n");
        if( this.refSeq )
            this.print( "##sequence-region "+this.refSeq.name+" "+(this.refSeq.start+1)+" "+this.refSeq.end+"\n" );
    }
});
});

