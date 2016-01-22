/*

Ext Gantt 2.2.23
Copyright(c) 2009-2014 Bryntum AB
http://bryntum.com/contact
http://bryntum.com/license

*/
/**

@class Gnt.column.Dependency
@extends Ext.grid.column.Column
@private

An internal private class serving as base class for Predecessor and Successor column classes.

*/
Ext.define("Gnt.column.Dependency", {
    extend      : "Ext.grid.column.Column",

    requires    : [
        'Gnt.field.Dependency'
    ],

    separator   : ';',
    type        : 'predecessors',        // Or 'successors'

    field       : null,

    /**
     * @cfg {Boolean} useSequenceNumber Set to `true` to use auto-generated sequential identifiers
     * to reference other tasks (see {@link Gnt.model.Task#getSequenceNumber} for definition).
     * If value is `false`then the "real" id (that is stored in the database) will be used.
     */
    useSequenceNumber : false,

    constructor : function (config) {
        config      = config || {};

        var field   = config.field || config.editor;

        delete config.field;
        delete config.editor;

        Ext.apply(this, config);

        config.editor   = field || Ext.create('Gnt.field.Dependency', {
            type              : this.type,
            separator         : this.separator,
            useSequenceNumber : this.useSequenceNumber
        });

        if (!(config.editor instanceof Gnt.widget.DependencyField)) {
            config.editor = Ext.ComponentManager.create(config.editor, 'dependencyfield');
        }

        config.field = config.editor;

        this.scope      = this;

        this.callParent([ config ]);

    },

    afterRender : function() {
        var panel = this.up('ganttpanel');

        // Make top Gantt panel aware of the need for refreshing locked grid after changes in the dependency store
        panel.registerLockedDependencyListeners();

        this.callParent(arguments);
    },

    getContainingPanel : function() {
        if (!this.panel) {
            this.panel = this.up('tablepanel');
        }

        return this.panel;
    },

    setDirtyClass : function (meta, task) {
        var view    = this.getContainingPanel().getView();
        if (view.markDirty && this.field.isDirty(task)) {
            meta.tdCls   = view.dirtyCls;
        }
    },

    renderer    : function (value, meta, task) {
        if (!task.isEditable(this.dataIndex)) {
            meta.tdCls      = (meta.tdCls || '') + ' sch-column-readonly';
        } else {
            this.setDirtyClass(meta, task);
        }

        return this.field.getDisplayValue(task);
    }
});
