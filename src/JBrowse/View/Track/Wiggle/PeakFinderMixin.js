// define( "JBrowse/View/Track/PeakFinderMixin", [
		// 'dojo/_base/declare'
	// ],
	// function(
		// declare
	// ) {

// /**
 // * Mixin for a track that can export its data.
 // * @lends JBrowse.View.Track.ExportMixin
 // */
// return declare( null, {

define([
	"dojo/_base/declare",
	'dojo/_base/array',
	'dojo/dom-construct',
	'JBrowse/Util',
	'dijit/form/TextBox',
	'dijit/form/Button',
	'dijit/form/RadioButton',
	'dojo/on',
	'dojo/_base/lang',
], function(declare, array, dom, Util, dijitTextBox, dijitButton, dijitRadioButton, on, lang){

	return declare(null, {
	
	constructor: function(args){
	
	},

	_trackMenuOption: function() {
        
		return { 
			label: 'Find peaks',
			iconClass: 'dijitIconSave',
			//disabled: ! this._canFindPeaks(),
			action: 'bareDialog',
			content: this._exportDialogContent,
			dialog: { id: 'exportDialog', className: 'export-dialog' }
		};
    },
	
	// // _exportDialogContent: function() {
		
		
		// - Choose files:
	// list all files with checkboxes
// - At least one or all:
	// radio 
// - Cutoff:
	// drop down: 1sd, 2sd, 3sd, 4sd
// - ...or cutoff value:
	// textbox
// - Less than or greater than

// button: find regions!


		// var form = dom.create('form', { onSubmit: function() { return false; } });
        // var regionFieldset = dom.create('fieldset', {className: "region"}, form );
        // dom.create('legend', {innerHTML: "Region to save"}, regionFieldset);
		
		
        // // note that the `this` for this content function is not the track, it's the menu-rendering context
        // var possibleRegions = this.track._possibleExportRegions();

        // // for each region, calculate its length and determine whether we can export it
        // array.forEach( possibleRegions, function( region ) {
            // region.length = Math.round( region.end - region.start + 1 );
            // region.canExport = this._canExportRegion( region );
        // },this.track);

        // var setFilenameValue = dojo.hitch(this.track, function() {
            // var region = this._readRadio(form.elements.region);
            // var format = nameToExtension[this._readRadio(form.elements.format)];
            // form.elements.filename.value = ((this.key || this.label) + "-" + region).replace(/[^ .a-zA-Z0-9_-]/g,'-') + "." + format;
        // });

        // var form = dom.create('form', { onSubmit: function() { return false; } });
        // var regionFieldset = dom.create('fieldset', {className: "region"}, form );
        // dom.create('legend', {innerHTML: "Region to save"}, regionFieldset);

        // var checked = 0;
        // array.forEach( possibleRegions, function(r) {
                // var locstring = Util.assembleLocString(r);
                // var regionButton = new dijitRadioButton(
                    // { name: "region", id: "region_"+r.name,
                      // value: locstring, checked: r.canExport && !(checked++) ? "checked" : ""
                    // });
                // regionFieldset.appendChild(regionButton.domNode);
                // var regionButtonLabel = dom.create("label", {"for": regionButton.id, innerHTML: r.description+' - <span class="locString">'
                                   // +         locstring+'</span> ('+Util.humanReadableNumber(r.length)+(r.canExport ? 'b' : 'b, too large')+')'}, regionFieldset);
                // if(!r.canExport) {
                    // regionButton.domNode.disabled = "disabled";
                    // regionButtonLabel.className = "ghosted";
                // }

                // on(regionButton, "click", setFilenameValue);

                // dom.create('br',{},regionFieldset);
        // });


        // var formatFieldset = dom.create("fieldset", {className: "format"}, form);
        // dom.create("legend", {innerHTML: "Format"}, formatFieldset);

        // checked = 0;
        // var nameToExtension = {};
        // array.forEach( this.track._exportFormats(), function(fmt) {
            // if( ! fmt.name ) {
                // fmt = { name: fmt, label: fmt };
            // }
            // if( ! fmt.fileExt) {
                // fmt.fileExt = fmt.name || fmt;
            // }
            // nameToExtension[fmt.name] = fmt.fileExt;
            // var formatButton = new dijitRadioButton({ name: "format", id: "format"+fmt.name, value: fmt.name, checked: checked++?"":"checked"});
            // formatFieldset.appendChild(formatButton.domNode);
            // var formatButtonLabel = dom.create("label", {"for": formatButton.id, innerHTML: fmt.label}, formatFieldset);

            // on(formatButton, "click", setFilenameValue);
            // dom.create( "br", {}, formatFieldset );
        // },this);


        // var filenameFieldset = dom.create("fieldset", {className: "filename"}, form);
        // dom.create("legend", {innerHTML: "Filename"}, filenameFieldset);
        // dom.create("input", {type: "text", name: "filename", style: {width: "100%"}}, filenameFieldset);

        // setFilenameValue();

        // var actionBar = dom.create( 'div', {
            // className: 'dijitDialogPaneActionBar'
        // });

        // // note that the `this` for this content function is not the track, it's the menu-rendering context
        // var dialog = this.dialog;

        // new dijitButton({ iconClass: 'dijitIconDelete', onClick: dojo.hitch(dialog,'hide'), label: 'Cancel' })
            // .placeAt( actionBar );
        // var viewButton = new dijitButton({ iconClass: 'dijitIconTask',
                          // label: 'View',
                          // disabled: ! array.some(possibleRegions,function(r) { return r.canExport; }),
                          // onClick: lang.partial( this.track._exportViewButtonClicked, this.track, form, dialog )
            // })
            // .placeAt( actionBar );

        // // don't show a download button if we for some reason can't save files
        // if( this.track._canSaveFiles() ) {

            // var dlButton = new dijitButton({ iconClass: 'dijitIconSave',
                              // label: 'Save',
                              // disabled: ! array.some(possibleRegions,function(r) { return r.canExport; }),
                              // onClick: dojo.hitch( this.track, function() {
                                // var format = this._readRadio( form.elements.format );
                                // var region = this._readRadio( form.elements.region );
                                // var filename = form.elements.filename.value.replace(/[^ .a-zA-Z0-9_-]/g,'-');
                                // dlButton.set('disabled',true);
                                // dlButton.set('iconClass','jbrowseIconBusy');
                                // this.exportRegion( region, format, dojo.hitch( this, function( output ) {
                                    // dialog.hide();
                                    // this._fileDownload({ format: format, data: output, filename: filename });
                                // }));
                              // })})
                // .placeAt( actionBar );
        // }

        // return [ form, actionBar ];
    // },

})});