/*

Ext Gantt 2.2.23
Copyright(c) 2009-2014 Bryntum AB
http://bryntum.com/contact
http://bryntum.com/license

*/
/*
 * @class Gnt.column.AssignmentUnits
 * @extends Ext.grid.Column
 * @private
 * Private class used inside Gnt.widget.AssignmentGrid.
 */
Ext.define("Gnt.column.AssignmentUnits", {
    extend      : "Ext.grid.column.Number",
    mixins      : ['Gnt.mixin.Localizable'],
    alias       : "widget.assignmentunitscolumn",

    dataIndex   : 'Units',
    format      : '0 %',
    align       : 'left',

    // Exclude in Gnt.column.AddNew list
    _isGanttColumn      : false,

    constructor : function (config) {
        config = config || {};        

        this.text   = config.text || this.L('text');

        this.callParent(arguments);
    },

    defaultRenderer : function(v) {
        if (v) return this.callParent(arguments);
    }
});
