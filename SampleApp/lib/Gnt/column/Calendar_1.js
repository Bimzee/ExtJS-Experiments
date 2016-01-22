/*

Ext Gantt 2.2.23
Copyright(c) 2009-2014 Bryntum AB
http://bryntum.com/contact
http://bryntum.com/license

*/
/**
 * @class Gnt.column.Calendar
 * @extends Ext.grid.column.Column
 *
 * {@img gannt/images/calendar-field.png}
 *
 * A column representing a 'CalendarId' field of a task. The column is editable, however to enable the editing you will
 * need to add a `Sch.plugin.TreeCellEditing` plugin to your gantt panel. The overall setup will look like this:
 *
 *    var gantt = Ext.create('Gnt.panel.Gantt', {
 *        height      : 600,
 *        width       : 1000,
 *
 *        // Setup your static columns
 *        columns         : [
 *            ...
 *            {
 *                xtype       : 'calendarcolumn',
 *                width       : 80
 *            }
 *            ...
 *        ],
 *
 *        plugins             : [
 *            Ext.create('Sch.plugin.TreeCellEditing', {
 *                clicksToEdit: 1
 *            })
 *        ],
 *        ...
 *   });
 *
 * This column uses a field - {@link Gnt.field.Calendar} as the editor.
 */
Ext.define('Gnt.column.Calendar', {
    extend   : 'Ext.grid.column.Column',
    alias    : 'widget.calendarcolumn',
    requires : [
        'Gnt.model.Calendar',
        'Gnt.field.Calendar'
    ],
    mixins   : ['Gnt.mixin.Localizable'],

    /**
     * @cfg {String} text
     * The text to show in the column header.
     * @deprecated Please use {@link #l10n l10n} instead.
     */

    /**
     * @cfg {Object} l10n
     * A object, purposed for the class localization. Contains the following keys/values:
     *
     *  - text : 'Duration'
     */

    /**
     * @cfg {Number} width
     * The width of the column.
     */
    width : 100,

    /**
     * @cfg {String} align
     * The alignment of the text in the column.
     */
    align : 'left',

    /**
     * @cfg {Boolean} instantUpdate
     * Setting this to `false` will cause editor to apply its value to task only after it's closed.
     * And if this otion is `true` then each value change will be reflected to task immediately. This option
     * is just translated to the {@link Gnt.field.mixin.TaskField#instantUpdate} config option.
     */
    instantUpdate : true,

    store : null,

    fieldProperty           : 'calendarIdField',

    /**
     * @constructor
     */
    constructor : function(config) {
        config  = config || {};

        this.text  = this.text || config.text || this.L('text');

        delete config.text;

        // {{{ Store creation
        this.store = config.store || this.store || {
            xclass : 'Ext.data.Store',
            model  :  'Gnt.model.Calendar',
            data   : this.getCalendarList()
        };

        delete config.store;

        if (!(this.store instanceof Ext.data.Store)) {
            this.store = Ext.create(this.store);
        }

        Ext.data.StoreManager.on({
            add : function (index, store, key) {
                if (store instanceof Gnt.data.Calendar) {
                    this.store.loadData(this.getCalendarList());
                }
            },
            remove : function (index, store, key) {
                if (store instanceof Gnt.data.Calendar) {
                    this.store.loadData(this.getCalendarList());
                }
            },
            scope : this
        });
        // }}}

        // {{{ Editor creation
        this.instantUpdate = ('instantUpdate' in config) ? config.instantUpdate : this.instantUpdate;

        this.editor = config.editor || this.editor || {
            xclass          : 'Gnt.field.Calendar',
            store           : this.store,
            instantUpdate   : this.instantUpdate
        };
        delete config.editor;

        if (!(this.editor instanceof Gnt.field.Calendar)) {
            this.editor = Ext.create(this.editor);
        }
        // }}}

        this.scope = this;

        this.callParent([config]);
    },

    afterRender : function()  {

        if (!this.dataIndex) {
            var tree        = this.up('treepanel');
            this.dataIndex  = tree.store.model.prototype[ this.fieldProperty ];
        }

        this.callParent(arguments);
    },

    renderer : function(value, meta, record, col, index, store) {
        var me = this,
            calRec;

        if (!value) {
            meta.tdCls      = 'gnt-default-value';
            var calendar    = record.getCalendar();
            value = calendar && calendar.calendarId || '';
        }

        if (!record.isEditable(me.dataIndex)) {
            meta.tdCls      = (meta.tdCls || '') + ' sch-column-readonly';
        }

        calRec = this.store.getById(value);
        return calRec ? calRec.getName() : '';
    },

    getCalendarList : function() {
        return Ext.Array.map(Gnt.data.Calendar.getAllCalendars(), function(cal) {
            return {
                Id    : cal.calendarId,
                Name  : cal.name || cal.calendarId
            };
        });
    }
});
