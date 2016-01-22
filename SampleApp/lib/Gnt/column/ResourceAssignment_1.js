/*

Ext Gantt 2.2.23
Copyright(c) 2009-2014 Bryntum AB
http://bryntum.com/contact
http://bryntum.com/license

*/
/**

@class Gnt.column.ResourceAssignment
@extends Ext.grid.column.Column

{@img gantt/images/resource-assignment.png}

A Column showing the resource assignments of a task. To make the column editable,
add the {@link Sch.plugin.TreeCellEditing} plugin to your gantt panel:

    var gantt = Ext.create('Gnt.panel.Gantt', {
        height      : 600,
        width       : 1000,

        columns         : [
            ...
            {
                xtype       : 'resourceassignmentcolumn',
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
Ext.define("Gnt.column.ResourceAssignment", {
    extend      : "Ext.grid.column.Column",
    alias       : "widget.resourceassignmentcolumn",
    requires    : ['Gnt.field.Assignment'],
    mixins      : ['Gnt.mixin.Localizable'],

    tdCls       : 'sch-assignment-cell',

    /**
     * @cfg {Boolean} showUnits Set to `true` to show the assignment units (in percent). Default value is `true`.
     */
    showUnits   : true,

    field       : null,

    // Copied from the panel view if cells for this columns should be marked dirty
    dirtyCls    : null,

    constructor : function(config) {
        config      = config || {};



        this.text   = config.text || this.L('text');

        var field   = config.field || config.editor;
        var showUnits = config.showUnits || this.showUnits;

        delete config.field;
        delete config.editor;

        config.editor   = field || {};

        if (!(config.editor instanceof Ext.form.Field)) {
            config.editor   = Ext.ComponentManager.create(Ext.applyIf(config.editor, {
                expandPickerOnFocus : true,
                formatString        : '{0}' + (showUnits ? ' [{1}%]' : '')
            }), 'assignmentfield');
        }

        config.field = config.editor;

        this.callParent([ config ]);

        this.scope          = this;
    },

    afterRender: function() {
        var view       = this.up('treepanel').getView();

        // Check if the current view is configured to highlight dirty cells
        if (view.markDirty) {
            this.dirtyCls = view.dirtyCls;
        }

        this.callParent(arguments);
    },

    renderer : function(value, meta, task) {
        if (this.dirtyCls && this.field.isDirty(task)) {
            meta.tdCls   = this.dirtyCls;
        }

        return this.field.getDisplayValue(task);
    }
});
