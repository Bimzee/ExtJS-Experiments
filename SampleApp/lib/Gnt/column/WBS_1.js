/*

Ext Gantt 2.2.23
Copyright(c) 2009-2014 Bryntum AB
http://bryntum.com/contact
http://bryntum.com/license

*/
/**

@class Gnt.column.WBS
@extends Ext.grid.column.Date

A "calculated" Column which displays the WBS (Work Breakdown Structure) for the tasks - the position of the task in the project tree structure.
*/
Ext.define("Gnt.column.WBS", {
    extend      : "Ext.grid.column.Column",
    alias       : "widget.wbscolumn",
    mixins      : ['Gnt.mixin.Localizable'],

    /**
     * @cfg {String} text The text to show in the column header, defaults to `#`
     * @deprecated Please use {@link #l10n l10n} instead.
     */
    /**
     * @cfg {Object} l10n
     * A object, purposed for the class localization. Contains the following keys/values:

            - text : '#'
     */

    /**
     * @cfg {Number} width The width of the column.
     */
    width       : 40,

    /**
     * @cfg {String} align The alignment of the text in the column.
     */
    align       : 'left',

    sortable    : false,
    dataIndex   : 'index',

    constructor : function (config) {
        config = config || {};        

        this.text   = config.text || this.L('text');

        this.callParent(arguments);
    },

    renderer    : function (value, meta, task) {
        return task.getWBSCode();
    }
});
