/*

Ext Gantt 2.2.23
Copyright(c) 2009-2014 Bryntum AB
http://bryntum.com/contact
http://bryntum.com/license

*/
/**

@class Gnt.column.Name
@extends Ext.tree.Column

A Column representing the `Name` field of a task. The column is editable, however to enable the editing you will need to add a
`Sch.plugin.TreeCellEditing` plugin to your gantt panel. The overall setup will look like this:

    var gantt = Ext.create('Gnt.panel.Gantt', {
        height      : 600,
        width       : 1000,

        // Setup your grid columns
        columns         : [
            ...
            {
                xtype       : 'namecolumn',
                width       : 200
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
Ext.define('Gnt.column.Name', {
    extend      : 'Ext.tree.Column',

    alias       : 'widget.namecolumn',

    mixins      : ['Gnt.mixin.Localizable'],

    /**
     * @cfg {String} text The text to show in the column header.
     * @deprecated Please use {@link #l10n l10n} instead.
     */
    /**
     * @cfg {Object} l10n
     * A object, purposed for the class localization. Contains the following keys/values:

        - text : 'Task Name'
     */

    // Ext 4.2.2 sets this to false
    draggable   : true,
    
    fieldProperty           : 'nameField',

    constructor : function (config) {
        config      = config || {};

        this.text   = config.text || this.L('text');

        var field   = config.field || config.editor;

        delete config.field;
        delete config.editor;

        Ext.apply(this, config);

        config.editor     = field || {
            xtype       : 'textfield',
            allowBlank  : false
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

    renderer : function (value, meta, task) {
        if (!task.isEditable(this.dataIndex)) {
            meta.tdCls      = (meta.tdCls || '') + ' sch-column-readonly';
        }

        return Ext.util.Format.htmlEncode(value);
    }
});
