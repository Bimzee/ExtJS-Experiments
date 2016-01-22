/*

Ext Gantt 2.2.23
Copyright(c) 2009-2014 Bryntum AB
http://bryntum.com/contact
http://bryntum.com/license

*/
/**

@class Gnt.column.Rollup
@extends Ext.tree.Column

A Column which displays if the task should rollup to the parent task.
*/

Ext.define("Gnt.column.Rollup", {
    extend      : "Ext.grid.Column",
    alias       : "widget.rollupcolumn",
    mixins      : ['Gnt.mixin.Localizable'],
    
    fieldProperty           : 'rollupField',

    constructor : function (config) {
        config = config || {};

        this.text   = config.text || this.L('text');

        this.editor = config.editor || this.editor || {
            xtype : 'combobox',
            store : [
                [ false, this.L('no') ],
                [ true, this.L('yes') ]
            ]
        };

        this.scope      = this;

        this.callParent([ config ]);
    },

    afterRender : function() {

        if (!this.dataIndex) {
            var tree    = this.up('treepanel');

            this.dataIndex = tree.store.model.prototype[ this.fieldProperty ];
        }

        this.callParent(arguments);
    },

    renderer    : function (value, meta, task) {
        if (!task.isEditable(this.dataIndex)) {
            meta.tdCls = (meta.tdCls || '') + ' sch-column-readonly';
        }

        return this.L(value ? 'yes' : 'no');
    }
});

