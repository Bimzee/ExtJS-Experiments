/*

Ext Gantt 2.2.23
Copyright(c) 2009-2014 Bryntum AB
http://bryntum.com/contact
http://bryntum.com/license

*/
/**
@class Gnt.field.Calendar
@extends Ext.form.field.ComboBox

A specialized field allowing a user to select particular calendar for a task.
This class inherits from the standard Ext JS "combo box" field, so any standard `Ext.form.field.ComboBox`
configs can be used.
*/

Ext.define('Gnt.field.Calendar', {
    extend                  : 'Ext.form.field.ComboBox',

    requires                : ['Ext.data.Store', 'Gnt.model.Calendar', 'Gnt.data.Calendar'],

    mixins                  : ['Gnt.field.mixin.TaskField', 'Gnt.mixin.Localizable'],

    alias                   : 'widget.calendarfield',
    alternateClassName      : ['Gnt.column.calendar.Field'],

    taskField               : 'calendarIdField',

    /**
     * @cfg {String} pickerAlign The align for combo-box's picker.
     */
    pickerAlign             : 'tl-bl?',

    /**
     * @cfg {Boolean} matchFieldWidth Defines if the picker dropdown width should be explicitly set to match the width of the field. Defaults to true.
     */
    matchFieldWidth         : true,

    editable                : true,

    triggerAction           : 'all',

    valueField              : 'Id',

    displayField            : 'Name',

    queryMode               : 'local',

    forceSelection          : true,

    allowBlank              : true,

    constructor : function(config) {
        var me = this;

        Ext.apply(this, config);

        this.store  = this.store || {
            xclass : 'Ext.data.Store',
            model  : 'Gnt.model.Calendar'
        };

        if (!(this.store instanceof Ext.data.Store)) {
            this.store = Ext.create(this.store);
        }

        this.setSuppressTaskUpdate(true);
        this.callParent(arguments);
        this.setSuppressTaskUpdate(false);

        // load calendars list
        this.updateCalendarsStore();

        // listen to new calendars creation/removal and update the field store
        Ext.data.StoreManager.on({
            add     : function (index, store, key) {
                if (store instanceof Gnt.data.Calendar) {
                    this.updateCalendarsStore();
                }
            },
            remove  : function (index, store, key) {
                if (store instanceof Gnt.data.Calendar) {
                    this.updateCalendarsStore();
                }
            },
            scope   : this
        });

        this.on({
            show    : this.setReadOnlyIfEmpty,
            scope   : this
        });

        if (this.task) this.setTask(this.task);
    },


    destroy : function () {
        this.destroyTaskListener();

        this.callParent();
    },


    updateCalendarsStore : function () {
        this.store.loadData(this.getCalendarData());
    },


    // @private
    // Sets field to readonly if no calendars found.
    setReadOnlyIfEmpty : function () {
        this.setReadOnly(!this.store.count());
    },


    getCalendarData : function () {
        var result = [];
        Ext.Array.each(Gnt.data.Calendar.getAllCalendars(), function(cal) {
            result.push({
                Id      : cal.calendarId,
                Name    : cal.name || cal.calendarId
            });
        });
        return result;
    },


    onSetTask : function () {
        // set field to readonly if no calendars
        this.setReadOnlyIfEmpty();

        this.setValue(this.task.getCalendarId());
    },


    onTaskUpdate : function (task, initiator) {
        // set field to readonly if no calendars
        this.setReadOnlyIfEmpty();

        this.setValue(this.task.getCalendarId());
    },


    // will be used in the column's renderer
    valueToVisible : function (value, task) {
        var me              = this,
            displayTplData  = [];

        var record = this.findRecordByValue(value);

        if (record) {
            displayTplData.push(record.data);
        } else if (Ext.isDefined(me.valueNotFoundText)) {
            displayTplData.push(me.valueNotFoundText);
        }

        return me.displayTpl.apply(displayTplData);
    },


    // @OVERRIDE
    getValue : function () {
        return this.value;
    },


    /**
     * This method applies the changes from the field to the bound task or to the task provided as 1st argument.
     * If {@link #instantUpdate} option is enabled this method is called automatically after any change in the field.
     *
     * @param {Gnt.model.Task} [toTask] The task to apply the changes to. If not provided, changes will be applied to the last bound task
     * (with {@link #task} config option or {@link #setTask) method)
     */
    applyChanges : function (toTask) {
        toTask = toTask || this.task;

        toTask.setCalendarId(this.value);
    },


    getErrors : function (value) {
        if (value) {
            var record = this.findRecordByDisplay(value);
            if (record) {
                if (this.task && !this.task.isCalendarApplicable(record.getId())) return [ this.L('calendarNotApplicable') ];
            }
        }

        return this.callParent(arguments);
    },


    // @OVERRIDE
    setValue : function (value) {

        this.callParent([ value ]);

        // we keep '' for empty field
        if (undefined === value || null === value || '' === value) this.value = '';

        if (!this.getSuppressTaskUpdate() && this.task) {

            if (this.task.getCalendarId() != this.value) {
                // apply changes to task
                this.applyChanges();

                this.task.fireEvent('taskupdated', this.task, this);
            }

        }
    },


    // @OVERRIDE
    assertValue : function () {
        var raw = this.getRawValue();
        if (!raw && this.value) {
            this.setValue('');
        } else {
            this.callParent(arguments);
        }
    }
});
