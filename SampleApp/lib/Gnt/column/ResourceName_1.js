/*

Ext Gantt 2.2.23
Copyright(c) 2009-2014 Bryntum AB
http://bryntum.com/contact
http://bryntum.com/license

*/
/*
 * @class Gnt.column.ResourceName
 * @extends Ext.grid.Column
 * @private
 * Private class used inside Gnt.widget.AssignmentGrid.
 */
Ext.define('Gnt.column.ResourceName', {
    extend         : 'Ext.grid.column.Column',
    alias          : 'widget.resourcenamecolumn',
    mixins         : ['Gnt.mixin.Localizable'],

    dataIndex      : 'ResourceName',
    flex           : 1,
    align          : 'left',

    // Exclude in Gnt.column.AddNew list
    _isGanttColumn : false,

    constructor : function (config) {
        config = config || {};

        this.text   = config.text || this.L('text');
        
        Ext.apply(this, config);

        this.callParent(arguments);
    }
});
