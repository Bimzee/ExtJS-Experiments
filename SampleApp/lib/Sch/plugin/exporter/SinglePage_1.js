/*

Ext Scheduler 2.5.2
Copyright(c) 2009-2014 Bryntum AB
http://bryntum.com/contact
http://bryntum.com/license

*/
/**
 @class Sch.plugin.exporter.SinglePage
 @extends Sch.plugin.exporter.AbstractExporter

 This class extracts all scheduler data to fit in a single page.

 The exporterId of this exporter is `singlepage`
 */


Ext.define('Sch.plugin.exporter.SinglePage', {

    extend  : 'Sch.plugin.exporter.AbstractExporter',

    /**
     * @cfg {Object} l10n
     * A object, purposed for the class localization. Contains the following keys/values:

     - name    : 'Single page'
     */

    config  : {
        exporterId : 'singlepage'
    },


    getPaperFormat : function () {
        var me          = this,
            realSize    = me.getTotalSize(),
            dpi         = me.exportConfig.DPI || me.getDPI(),
            width       = Ext.Number.toFixed(realSize.width / dpi, 1),
            height      = Ext.Number.toFixed(realSize.height / dpi, 1);

        return width+'in*'+height+'in';
    },


    onRowsCollected : function () {
        var me = this;

        me.startPage();
        me.fillGrids();
        me.commitPage();

        me.onPagesExtracted();
    },


    getPageTplData : function () {
        var me          = this,
            realSize    = me.getTotalSize();

        return Ext.apply(me.callParent(arguments), {
            bodyHeight  : realSize.height,
            showHeader  : false,
            totalWidth  : realSize.width
        });
    },


    fitComponentIntoPage : function () {
        var me          = this,
            lockedGrid  = me.lockedGrid;

        lockedGrid.setWidth(lockedGrid.headerCt.getEl().first().getWidth());
    }

});