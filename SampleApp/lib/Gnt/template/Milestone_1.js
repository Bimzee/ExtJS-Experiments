/*

Ext Gantt 2.2.23
Copyright(c) 2009-2014 Bryntum AB
http://bryntum.com/contact
http://bryntum.com/license

*/
/**
@class Gnt.template.Milestone
@extends Ext.XTemplate

Class used to render a milestone task.
*/
Ext.define("Gnt.template.Milestone", {
    extend : 'Gnt.template.Template',

    /**
     * @cfg {String} innerTpl The template defining the inner visual markup for the milestone task.
     * Please note that this markup may be different depending on the browser used.
     */
    innerTpl :  (Ext.isIE8m || Ext.isIEQuirks ?
        ('<div style="border-width:{[Math.floor(values.side*0.7)]}px" class="sch-gantt-milestone-diamond-top {cls}" unselectable="on" style="{style}"></div>' +
        '<div style="border-width:{[Math.floor(values.side*0.7)]}px" class="sch-gantt-milestone-diamond-bottom {cls}" unselectable="on" style="{style}"></div>') :

        ('<img style="{[values.print ? "height:" + values.side + "px;border-left-width:" + values.side + "px" : ""]};{style}" src="' + Ext.BLANK_IMAGE_URL + '" class="sch-gantt-milestone-diamond {cls}" unselectable="on"/>')),

    getInnerTpl : function (cfg) {
        return '<div ' + (this.isLegacyIE ? 'style="width:{[Math.floor(values.side*0.7)]}px"' : '') + ' id="' + cfg.prefix + '{id}" class="sch-gantt-item sch-gantt-milestone-diamond-ct">' +
            this.innerTpl +

            '<tpl if="isRollup">' +
            '<tpl else>' +
            // Milestone diamond, 2 elements for old IE
            // Dependency terminals
            (cfg.enableDependencyDragDrop ? this.dependencyTerminalMarkup : '') +
           '</tpl>' +

        '</div>';
    }
});