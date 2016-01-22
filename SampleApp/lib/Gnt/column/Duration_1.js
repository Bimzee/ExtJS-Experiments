/*

Ext Gantt 2.2.23
Copyright(c) 2009-2014 Bryntum AB
http://bryntum.com/contact
http://bryntum.com/license

*/
/**

@class Gnt.column.Duration
@extends Ext.grid.column.Column

{@img gantt/images/duration-field.png}

A Column representing a `Duration` field of a task. The column is editable, however to enable the editing you will need to add a
`Sch.plugin.TreeCellEditing` plugin to your gantt panel. The overall setup will look like this:

    var gantt = Ext.create('Gnt.panel.Gantt', {
        height      : 600,
        width       : 1000,

        // Setup your grid columns
        columns         : [
            ...
            {
                xtype       : 'durationcolumn',
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

This column uses a field - {@link Gnt.field.Duration} which allows the
user to specify not only the duration value, but also the duration units.

When rendering the name of the duration unit, the {@link Sch.util.Date#getReadableNameOfUnit}
method will be used to retrieve the name of the unit.

*/
Ext.define('Gnt.column.Duration', {
    extend      : 'Ext.grid.column.Column',

    alias       : 'widget.durationcolumn',

    requires    : ['Gnt.field.Duration'],

    mixins      : ['Gnt.mixin.Localizable'],

    /**
     * @cfg {String} text The text to show in the column header.
     * @deprecated Please use {@link #l10n l10n} instead.
     */
    /**
     * @cfg {Object} l10n
     * A object, purposed for the class localization. Contains the following keys/values:

        - text : 'Duration'
     */

    /**
     * @cfg {Number} width The width of the column.
     */
    width       : 80,

    /**
     * @cfg {String} align The alignment of the text in the column.
     */
    align       : 'left',

    /**
     * @cfg {Number} decimalPrecision A number of digits to show after the dot when rendering the value of the field or when editing it.
     * When set to 0, the duration values containing decimals part (like "6.5 days") will be considered invalid.
     */
    decimalPrecision        : 2,

    /**
     * @cfg {Boolean} useAbbreviation When set to `true`, the column will render the abbreviated duration unit name, not full. Abbreviation will also be used
     * when editing the value. Useful if the column width is limited.
     */
    useAbbreviation         : false,

    /**
     * @cfg {Boolean} instantUpdate Setting this to `false` will cause editor to apply its value to task only after it's closed.
     * And if this otion is `true` then each value change will be reflected to task immediately. This option is just translated
     * to the {@link Gnt.field.mixin.TaskField#instantUpdate} config option.
     */
    instantUpdate           : true,

    field                   : null,
    
    fieldProperty           : 'durationField',
    

    constructor : function (config) {
        config      = config || {};

        this.text   = config.text || this.L('text');

        var field   = config.field || config.editor;

        delete config.field;
        delete config.editor;

        Ext.apply(this, config);

        config.editor     = field || Ext.create('Gnt.field.Duration', {
            useAbbreviation         : this.useAbbreviation,
            decimalPrecision        : this.decimalPrecision,
            instantUpdate           : this.instantUpdate
        });

        if (!(config.editor instanceof Gnt.field.Duration)) {

            // apply default instantUpdate state
            Ext.applyIf(config.editor, {
                instantUpdate   : this.instantUpdate
            });

            config.editor       = Ext.ComponentManager.create(config.editor, 'durationfield');
        }

        this.field              = config.editor;
        this.scope              = this;
        this.hasCustomRenderer  = true;

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

        var durationUnit    = task.getDurationUnit();

        return this.field.valueToVisible(value, durationUnit);
    }
});
