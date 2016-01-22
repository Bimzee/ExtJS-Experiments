/*

Ext Gantt 2.2.23
Copyright(c) 2009-2014 Bryntum AB
http://bryntum.com/contact
http://bryntum.com/license

*/
/**
@class Gnt.plugin.Export
@extends Sch.plugin.Export

A plugin (ptype = 'gantt_export') for generating PDF/PNG out of a Gantt panel. NOTE: This plugin will make an Ajax request to the server, POSTing
 the HTML to be exported. The {@link #printServer} url must therefore be on the same domain as your application.

#Configuring/usage

To use this plugin, add it to your Gantt as any other plugin. It is also required to have [PhantomJS][1] and [Imagemagick][2]
installed on the server. The complete process of setting up a backend for this plugin can be found in the readme file inside export examples
as well as on our [blog][3]. Note that export is currently not supported if your view (or store) is buffered.

        var gantt = Ext.create('Sch.panel.Gantt', {
            ...

            plugins         : [
                Ext.create('Gnt.plugin.Export', {
                    // default values
                    printServer: 'server.php'
                })
            ]
        });

Gantt will be extended with three new methods:

* {@link #setFileFormat}, which allows setting the format to which panel should be exported. Default format is `pdf`.

* {@link #showExportDialog}, which shows export settings dialog

        gantt.showExportDialog();

* {@link #doExport} which actually performs the export operation using {@link #defaultConfig} or provided config object :

        gantt.doExport(
            {
                format: "A5",
                orientation: "landscape",
                range: "complete",
                showHeader: true,
                singlePageExport: false
            }
        );

#Export options

In the current state, plugin gives few options to modify the look and feel of the generated document/image throught a dialog window :

{@img scheduler/images/export_dialog.png}

If no changes are made to the form, the {@link #defaultConfig} will be used.

##Export Range

This setting controls the timespan visible on the exported document/image. Three options are available here :

{@img scheduler/images/export_dialog_ranges.png}

###Complete schedule

Whole current timespan will be visible on the exported document.

###Date range

User can select the start and end dates (from the total timespan of the panel) visible on the exported document/image.

{@img scheduler/images/export_dialog_ranges_date.png}

###Current view

Timespan of the exported document will be set to the currently visible part of the time axis. User can control
the width of the time column and height of row.

{@img scheduler/images/export_dialog_ranges_current.png}

##Paper Format

This combo gives control of the size of the generated PDF document by choosing one from a list of supported ISO paper sizes : (`A5`, `A4`, `A3`, `Letter`).
Generated PDF has a fixed DPI value of 72. Dafault format is `A4`.

{@img scheduler/images/export_dialog_format.png}

##Orientation

This setting defines the orientation of the generated document.

{@img scheduler/images/export_dialog_orientation.png}

Default option is the `portrait` (horizontal) orientation :

{@img scheduler/images/export_dialog_portrait.png}

Second option is the `landscape` (vertical) orientation :

{@img scheduler/images/export_dialog_landscape.png}

[1]: http://www.phantomjs.org
[2]: http://www.imagemagick.org
[3]: http://bryntum.com/blog

*/
Ext.define('Gnt.plugin.Export', {
    extend              : 'Sch.plugin.Export',

    alias               : 'plugin.gantt_export',
    alternateClassName  : 'Gnt.plugin.PdfExport',

    //override added to turn off vertical resizer in the dialog
    showExportDialog    : function() {
        this.exportDialogConfig.scrollerDisabled = true;

        this.callParent(arguments);
    },

    /*
    * @private
    * Method exporting panel's HTML to JSON structure. This function is taking snapshots of the visible panel (by changing timespan
    * and hiding rows) and pushing their html to an array, which is then encoded to JSON. Additionally it re-renders dependencies div.
    *
    * @param {Object} calculatedPages Object with values returned from {@link #calculatePages}.
    * @param {Object} params Object with additional properties needed for calculations.
    *
    * @return {Array} htmlArray JSON string created from an array of objects with stringified html.
    */
    getExportJsonHtml   : function (calculatedPages, params) {
        var ganttView       = this.scheduler.getSchedulingView(),
            depView         = ganttView.dependencyView,
            tplData         = depView.painter.getDependencyTplData(ganttView.dependencyStore.getRange()),
            dependencies    = depView.lineTpl.apply(tplData),
            config          = params.config,
            panelHTML;

        if (!config.singlePageExport) {
            panelHTML       = {
                dependencies        : dependencies,
                rowsAmount          : calculatedPages.rowsAmount,
                columnsAmountNormal : calculatedPages.columnsAmountNormal,
                columnsAmountLocked : calculatedPages.columnsAmountLocked,
                timeColumnWidth     : calculatedPages.timeColumnWidth,
                lockedGridWidth     : calculatedPages.lockedGridWidth,
                rowHeight           : calculatedPages.rowHeight
            };
        } else {
            calculatedPages = {};

            panelHTML       = {
                dependencies        : dependencies,
                singlePageExport    : true
            };
        }

        panelHTML.lockedColumnPages = calculatedPages.lockedColumnPages;
        calculatedPages.panelHTML   = panelHTML;

        return this.callParent(arguments);
    },

    /*
    * @private
    * Function returning full width and height of both grids.
    *
    * @return {Object} values Object containing width and height properties.
    */
    getRealSize : function(){
        var realSize = this.callParent(arguments);

        realSize.width += this.scheduler.down('splitter').getWidth();

        return realSize;
    },

    /*
    * @private
    * Resizes panel elements to fit on the print page. This has to be done manually in case of wrapping Gantt
    * inside another, smaller component. This function also adds dependencies to the output html.
    */
    resizePanelHTML : function (HTML) {
        var frag             = this.callParent(arguments),
            normalRowsDeps   = frag.select('.sch-dependencyview-ct').first(),
            splitterHTML     = frag.select('.' + Ext.baseCSSPrefix + 'splitter').first(),
            left             = 0,
            top              = 0,
            lockedColumnsLen, i;

        // if we have skipped ticks before first visible one then we will shift left coordinate of dependencies
        left = HTML.skippedColsBefore * HTML.timeColumnWidth;

        // for multiple pages mode
        if (!HTML.singlePageExport) {
            top                 = HTML.k * HTML.rowsAmount * HTML.rowHeight;
            lockedColumnsLen    = HTML.lockedColumnPages ? HTML.lockedColumnPages.length : 0;
            // column page num
            i                   = HTML.i;

            if (lockedColumnsLen) {
                if (i >= lockedColumnsLen - 1) {

                    var noColumnsCounter = i - lockedColumnsLen + 1;

                    left += (noColumnsCounter === lockedColumnsLen - 1) ? HTML.timeColumnWidth * HTML.columnsAmountLocked :
                        HTML.timeColumnWidth * HTML.columnsAmountLocked + (noColumnsCounter - 1) * HTML.timeColumnWidth * HTML.columnsAmountNormal;

                } else {
                    splitterHTML && splitterHTML.hide();
                }
            } else {
                // for pages except very first one we calculate left shift (to apply to dependency view)
                if (i) {
                    left += (i - 1) * HTML.timeColumnWidth * HTML.columnsAmountNormal + HTML.timeColumnWidth * HTML.columnsAmountLocked;
                }
            }
        }

        normalRowsDeps.dom.innerHTML = HTML.dependencies;

        //move the dependencies div to match the position of the dependency lines
        normalRowsDeps.applyStyles({
            top     : -top + 'px',
            left    : -left + 'px'
        });

        splitterHTML && splitterHTML.setHeight('100%');

        return frag;
    }
});
