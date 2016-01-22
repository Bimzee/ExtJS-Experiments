/*

Ext Gantt 2.2.23
Copyright(c) 2009-2014 Bryntum AB
http://bryntum.com/contact
http://bryntum.com/license

*/
/**

@class Gnt.column.EndDate
@extends Ext.grid.column.Date

A Column showing the `EndDate` field of the tasks. The column is editable when adding a
`Sch.plugin.TreeCellEditing` plugin to your gantt panel. The overall setup will look like this:

    var gantt = Ext.create('Gnt.panel.Gantt', {
        height      : 600,
        width       : 1000,

        columns         : [
            ...
            {
                xtype       : 'enddatecolumn',
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

Note, that this column will provide only a day-level editor (using a subclassed Ext JS DateField). If you need a more precise editing (ie also specify
the start hour/minute) you will need to provide your own field (which should extend {@link Gnt.field.EndDate}). See this [forum thread][1] for more information.

[1]: http://bryntum.com/forum/viewtopic.php?f=16&t=2277&start=10#p13964

Note that the end date of task in gantt is not inclusive, however, this column will compensate the value when rendering or editing.
So for example, if you have a 1 day task which starts at 2011/07/20 and ends at 2011/07/21 (remember end date is not inclusive!),
this column will show the `2011/07/20` when rendering. It will also increase the date by 1 day after being edited.

Also note, that this class inherits from [Ext.grid.column.Date](http://docs.sencha.com/ext-js/4-1/#!/api/Ext.grid.column.Date) and supports its configuration options, notably the "format" option.

*/
Ext.define("Gnt.column.EndDate", {
    extend          : "Ext.grid.column.Date",

    alias           : "widget.enddatecolumn",

    requires        : [
        'Ext.grid.CellEditor',
        'Gnt.field.EndDate'
    ],

    mixins          : ['Gnt.mixin.Localizable'],

    /**
     * @cfg {string} text The text to show in the column header, defaults to `Finish`
     * @deprecated Please use {@link #l10n l10n} instead.
     */
    /**
     * @cfg {Object} l10n
     * A object, purposed for the class localization. Contains the following keys/values:

        - text : 'Finish'
     */

    /**
     * @cfg {Number} width The width of the column.
     */
    width           : 100,

    /**
     * @cfg {String} align The alignment of the text in the column.
     */
    align           : 'left',

    /**
     * @cfg {String} editorFormat A date format to be used when editing the value of the column. By default it is the same as `format` configuration
     * option of the column itself.
     */
    editorFormat    : null,

    /**
     * @cfg {Boolean} adjustMilestones When set to `true`, the start/end dates of the milestones will be adjusted -1 day *during rendering and editing*. The task model will still hold unmodified date.
     */
    adjustMilestones        : true,

    /**
     * @cfg {Boolean} validateStartDate When set to `true`, the column will validate a "startDate <= endDate" condition and won't allow user to save the invalid end date.
     * Set it to `false` if you use different validation mechanism.
     */
    validateStartDate       : true,

    /**
     * @cfg {Boolean} instantUpdate Set to `true` to instantly apply any changes in the field to the task.
     * This option is just translated to the {@link Gnt.field.mixin.TaskField#instantUpdate} config option.
     */
    instantUpdate           : false,

    /**
     * @cfg {Boolean} keepDuration Pass `true` to keep the duration of the task ("move" the task), `false` to change the duration ("resize" the task).
     */
    keepDuration            : false,

    field                   : null,
    
    fieldProperty           : 'endDateField',

    constructor : function (config) {
        config = config || {};

        this.text   = config.text || this.L('text');

        // this will be a real field
        var field   = config.field || config.editor;

        delete config.field;

        var editorCfg = {
            format              : config.editorFormat || config.format || this.format || Ext.Date.defaultFormat,
            instantUpdate       : this.instantUpdate,
            adjustMilestones    : this.adjustMilestones,
            keepDuration        : this.keepDuration,
            validateStartDate   : this.validateStartDate
        };

        Ext.Array.forEach(
            [ 'instantUpdate', 'adjustMilestones', 'keepDuration', 'validateStartDate' ],
            function (prop) {
                if (prop in config) editorCfg[prop] = config[prop];
            },
            this
        );

        config.editor = field || editorCfg;

        if (!(config.editor instanceof Gnt.field.EndDate)) {

            // apply editor configs
            Ext.applyIf(config.editor, editorCfg);

            config.editor = Ext.ComponentManager.create(config.editor, 'enddatefield');
        }

        config.field = config.editor;

        // Make sure Ext 'understands' this column has its own renderer which makes sure this column is always updated
        // if any task field is changed
        this.hasCustomRenderer = true;

        this.callParent([ config ]);

        this.scope      = this;
        this.renderer   = config.renderer || this.rendererFunc;

        this.editorFormat = this.editorFormat || this.format;
    },


    rendererFunc : function (value, meta, task) {
        if (!value) return;

        if (!task.isEditable(this.dataIndex)) {
            meta.tdCls      = (meta.tdCls || '') + ' sch-column-readonly';
        }

        value = this.field.valueToVisible(value, task);

        return Ext.util.Format.date(value, this.format);
    },


    afterRender : function() {
        var tree = this.ownerCt.up('treepanel');

        if (!this.dataIndex) {
            this.dataIndex = tree.store.model.prototype[ this.fieldProperty ];
        }

        this.callParent(arguments);
    }
});
