/*

Ext Gantt 2.2.23
Copyright(c) 2009-2014 Bryntum AB
http://bryntum.com/contact
http://bryntum.com/license

*/
/**
@class Gnt.column.PercentDone
@extends Ext.grid.column.Number

A Column representing the `PercentDone` field of the task. The column is editable when adding a
`Sch.plugin.TreeCellEditing` plugin to your Gantt panel. The overall setup will look like this:

    var gantt = Ext.create('Gnt.panel.Gantt', {
        height      : 600,
        width       : 1000,

        columns         : [
            ...
            {
                xtype       : 'percentdonecolumn',
                width       : 80
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


*/
Ext.define("Gnt.column.PercentDone", {
    extend      : "Ext.grid.column.Number",
    alias       : "widget.percentdonecolumn",

    mixins      : ['Gnt.mixin.Localizable'],

    width       : 50,
    format      : '0',
    align       : 'center',

    editor      : {
        xtype               : 'percentfield',
        decimalPrecision    : 0,
        minValue            : 0,
        maxValue            : 100
    },
    
    fieldProperty           : 'percentDoneField',


    constructor : function (config) {
        config          = config || {};



        this.text   = config.text || this.L('text');

        this.callParent(arguments);

        this.scope      = this;
    },


    afterRender: function() {
        var panel       = this.up('treepanel');

        if (!this.dataIndex) {
            this.dataIndex = panel.store.model.prototype[ this.fieldProperty ];
        }

        this.callParent(arguments);
    },


    renderer    : function (value, meta, task) {
        if (!task.isEditable(this.dataIndex)) {
            meta.tdCls      = (meta.tdCls || '') + ' sch-column-readonly';
        }
        return this.defaultRenderer(value, meta, task);
    }

});
