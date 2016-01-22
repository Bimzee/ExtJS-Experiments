/*

Ext Gantt 2.2.23
Copyright(c) 2009-2014 Bryntum AB
http://bryntum.com/contact
http://bryntum.com/license

*/
/**
@class Gnt.column.Note
@extends Ext.grid.column.Column

A Column showing the `Note` field of the task.

    var gantt = Ext.create('Gnt.panel.Gantt', {
        height      : 600,
        width       : 1000,

        columns         : [
            ...
            {
                xtype       : 'notecolumn',
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
Ext.define("Gnt.column.Note", {
    extend      : "Ext.grid.column.Column",
    mixins      : ['Gnt.mixin.Localizable'],
    alias       : "widget.notecolumn",

    editor      : {
        xtype   : 'textfield'
    },
    
    fieldProperty           : 'noteField',

    constructor : function (config) {
        config = config || {};        

        this.text   = config.text || this.L('text');

        this.callParent(arguments);

        this.scope = this;
    },


    afterRender : function () {
        var panel = this.up('treepanel');

        if (!this.dataIndex) {
            this.dataIndex = panel.store.model.prototype[ this.fieldProperty ];
        }

        this.callParent(arguments);
    },

    renderer : function (value, meta, task) {
        if (!task.isEditable(this.dataIndex)) {
            meta.tdCls = (meta.tdCls || '') + ' sch-column-readonly';
        }
        return value;
    }
});
