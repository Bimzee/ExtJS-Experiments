/*

Ext Gantt 2.2.23
Copyright(c) 2009-2014 Bryntum AB
http://bryntum.com/contact
http://bryntum.com/license

*/
/**

@class Gnt.column.Successor
@extends Gnt.column.Dependency

A Column showing the successors of a task. The column is editable, however to enable the editing you will need to add a
`Sch.plugin.TreeCellEditing` plugin to your gantt panel. The overall setup will look like this:

    var gantt = Ext.create('Gnt.panel.Gantt', {
        height      : 600,
        width       : 1000,

        // Setup your grid columns
        columns         : [
            ...
            {
                xtype       : 'successorcolumn',
                width       : 70
            }
            ...
        ],

        plugins             : [
            Ext.create('Sch.plugin.TreeCellEditing', {
                clicksToEdit: 1
            })
        ],
        ...
    })

This column uses a specialized field - {@link Gnt.field.Dependency} which allows the
user to specify multiple successors including lag. Please refer to {@link Gnt.field.Dependency}
documentation for the expected format when editing data in this column.

*/
Ext.define("Gnt.column.Successor", {
    extend      : "Gnt.column.Dependency",

    mixins      : ['Gnt.mixin.Localizable'],

    alias       : "widget.successorcolumn",

    /**
     * @cfg {String} text The text to show in the column header, defaults to `Successors`.
     * @deprecated Please use {@link #l10n l10n} instead.
     */
    /**
     * @cfg {Object} l10n
     * A object, purposed for the class localization. Contains the following keys/values:

            - text : 'Successors'
     */

    type        : 'successors',

    constructor : function (config) {
        config = config || {};        

        this.text   = config.text || this.L('text');

        this.callParent(arguments);
    }
});
