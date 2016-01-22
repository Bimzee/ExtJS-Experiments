/*

Ext Gantt 2.2.23
Copyright(c) 2009-2014 Bryntum AB
http://bryntum.com/contact
http://bryntum.com/license

*/
/**

@class Gnt.column.Effort
@extends Gnt.column.Duration

{@img gantt/images/duration-field.png}

A Column representing a `Effort` field of a task. The column is editable, however to enable the editing you will need to add a
`Sch.plugin.TreeCellEditing` plugin to your gantt panel. The overall setup will look like this:

    var gantt = Ext.create('Gnt.panel.Gantt', {
        height      : 600,
        width       : 1000,

        // Setup your grid columns
        columns         : [
            ...
            {
                xtype       : 'effortcolumn',
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

This column uses a field - {@link Gnt.field.Effort} which allows the
user to specify not only the duration value, but also the duration units.

When rendering the name of the duration unit, the {@link Sch.util.Date#getReadableNameOfUnit}
method will be used to retrieve the name of the unit.

*/
Ext.define('Gnt.column.Effort', {
    extend                  : 'Gnt.column.Duration',

    alias                   : 'widget.effortcolumn',

    requires                : ['Gnt.field.Effort'],

    /**
     * @cfg {String} text A text of the header, default value is `Effort`
     * @deprecated Please use {@link #l10n l10n} instead.
     */
    /**
     * @cfg {Object} l10n
     * A object, purposed for the class localization. Contains the following keys/values:

        - text : 'Effort'
     */

    /**
     * @cfg {Number} width The width of the column.
     */
    width                   : 80,

    /**
     * @cfg {String} align The alignment of the text in the column.
     */
    align                   : 'left',

    /**
     * @cfg {Number} decimalPrecision A number of digits to show after the dot when rendering the value of the field or when editing it.
     * When set to 0, the duration values containing decimals part (like "6.5 days") will be considered invalid.
     */
    decimalPrecision        : 2,

    field                   : null,
    
    fieldProperty           : 'effortField',

    constructor : function (config) {
        config      = config || {};

        this.text   = config.text || this.L('text');

        var field   = config.field || config.editor;

        delete config.field;
        delete config.editor;

        Ext.apply(this, config);

        config.editor     = field || Ext.create('Gnt.field.Effort', {
            useAbbreviation         : this.useAbbreviation,
            decimalPrecision        : this.decimalPrecision,
            getDurationMethod       : null,

            instantUpdate           : this.instantUpdate
        });

        if (!(config.editor instanceof Gnt.field.Effort)) {

            // apply default instantUpdate state
            Ext.applyIf(config.editor, {
                useAbbreviation         : this.useAbbreviation,
                decimalPrecision        : this.decimalPrecision,
                getDurationMethod       : null,

                instantUpdate           : this.instantUpdate
            });

            config.editor = Ext.ComponentManager.create(config.editor, 'effortfield');
        }

        this.field = config.editor;
        this.scope = this;
        this.hasCustomRenderer = true;

        this.callParent([ config ]);
    },

    afterRender : function() {
        var tree    = this.up('treepanel');

        if (!this.dataIndex) {
            this.dataIndex = tree.store.model.prototype[ this.fieldProperty ];
        }

        this.callParent(arguments);

    },

    renderer : function (value, meta, task) {
        if (!Ext.isNumber(value)) return '';

        if (!task.isEditable(this.dataIndex)) {
            meta.tdCls      = (meta.tdCls || '') + ' sch-column-readonly';
        }

        var effortUnit      = task.getEffortUnit();

        return this.field.valueToVisible(value, effortUnit);
    }

});
