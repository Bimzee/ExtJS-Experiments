/*

Ext Gantt 2.2.23
Copyright(c) 2009-2014 Bryntum AB
http://bryntum.com/contact
http://bryntum.com/license

*/
/**

@class Gnt.field.StartDate
@extends Ext.form.field.Date

A specialized field for editing the task start date value. This class inherits from the `Ext.form.field.Date` field
so any of its configuration options can be used. You can find this field in {@link Gnt.widget.TaskForm}
and in {@link Gnt.column.StartDate} but you can use it in your own components as well (see "Using field standalone" below).

This field requires to be bound to {@link Gnt.model.Task task} instance, which is used for date value processing
(calendars, holidays etc).

#Task interacting

By default field instantly applies all changes to the bound task. This can be turned off with the {@link #instantUpdate} option.

#Using field standalone

To use this field standalone you have to provide {@link Gnt.model.Task task} instance to it. You can make it by two ways:

 - Set the {@link #task} configuration option at field constructing step. Like this:

        var startDateField = Ext.create('Gnt.field.StartDate', {
            task : someTask
        });

 - Or by calling {@link #setTask} method after field was created. Like this:

        startDateField.setTask(someTask);

* **Note:** If task does not belong to any {@link Gnt.data.TaskStore} you also **have to** specify {@link #taskStore} config option for this field otherwise it won't work:

        // some task not inserted in the task store yet
        var someTask    = new Gnt.model.Task({ ... })

        var startDateField = Ext.create('Gnt.field.StartDate', {
            task        : someTask,
            // need to provide a task store instance in this case
            taskStore   : taskStore
        });

* **Note**, that value displayed in the field can be different from the value in the task model when editing milestones.
Please refer to {@link #adjustMilestones} for details.

*/
Ext.define('Gnt.field.StartDate', {
    extend              : 'Ext.form.field.Date',

    requires            : ['Sch.util.Date'],

    mixins              : ['Gnt.field.mixin.TaskField'],

    alias               : 'widget.startdatefield',

    /**
     * @cfg {Boolean} adjustMilestones When set to `true`, the start/end dates of the milestones will be adjusted -1 day *during rendering and editing*. The task model will still hold unmodified date.
     */
    adjustMilestones    : true,

    /**
     * @cfg {Boolean} keepDuration Pass `true` to keep the duration of the task ("move" the task), `false` to change the duration ("resize" the task).
     */
    keepDuration        : true,

    taskField           : 'startDateField',

    constructor : function (config) {
        config      = config || {};

        if (config.task && !config.value) config.value = config.task.getStartDate();

        this.setSuppressTaskUpdate(true);
        this.callParent([ config ]);
        this.setSuppressTaskUpdate(false);

        if (this.task) this.setTask(this.task);
    },

    destroy : function () {
        this.destroyTaskListener();

        this.callParent();
    },

    onSetTask : function () {
        this.setValue(this.task.getStartDate());
    },

    // @OVERRIDE
    rawToValue : function (rawValue) {
        if (!rawValue) return null;

        return this.visibleToValue(this.parseDate(rawValue));
    },

    // @OVERRIDE
    valueToRaw : function (value) {
        if (!value) return value;

        return Ext.Date.format(this.valueToVisible(value), this.format);
    },

    valueToVisible : function (value, task) {
        task = task || this.task;

        return task.getDisplayStartDate(this.format, this.adjustMilestones, value, true);
    },

    visibleToValue : function (value) {
        var task = this.task;

        // Special treatment of milestone task dates
        if (task && value) {
            var endDate = task.getEndDate();

            var isMidnight = !this.lastValue || this.lastValue - Ext.Date.clearTime(this.lastValue, true) === 0;

            if (this.adjustMilestones && task.isMilestone() && value - Ext.Date.clearTime(value, true) === 0 && isMidnight) {

                // the standard ExtJS date picker will only allow to choose the date, not time
                // we set the time of the selected date to the earliest availability hour for that date
                // in case the date has no availbility intervals we use the date itself

                value   = task.getCalendar().getCalendarDay(value).getAvailabilityEndFor(value) || value;

            }
        }

        return value;
    },

    // @OVERRIDE
    onExpand: function () {
        var value = this.valueToVisible(this.getValue());

        if (!this.isValid()) {
            value = this.getRawValue();
            if (value) {
                value = Ext.Date.parse(value, this.format);
            }
        }

        this.picker.setValue(Ext.isDate(value) ? value : new Date());
    },

    // @OVERRIDE
    onSelect: function (picker, pickerDate) {
        // if we display the date with hours, then we (probably) want to keep the task end date's hour/minutes
        // after selecting the date from the picker. In the same time picker will clear the time portion
        // so we need to restore it from original date
        // see also: http://www.bryntum.com/forum/viewtopic.php?f=9&t=4294
        var originalDate    = this.task.getStartDate();
        if (Ext.Date.formatContainsHourInfo(this.format) && originalDate) {
            pickerDate.setHours(originalDate.getHours());
            pickerDate.setMinutes(originalDate.getMinutes());
        }

        var me          = this,
            rawValue    = Ext.Date.format(pickerDate, this.format),
            oldValue    = me.getValue(),
            newValue    = this.visibleToValue(pickerDate),
            errors      = this.getErrors(rawValue);

        if (oldValue != newValue) {
            if (errors && errors.length) {
                me.setRawValue(rawValue);
                // unsure if we need to fire 'select' in this case
                //me.fireEvent('select', me, newValue);
                me.collapse();
                me.validate();
            } else {
                me.setValue(newValue);
                me.fireEvent('select', me, newValue);
                me.collapse();
            }
        }
    },

    /**
     * This method applies the changes from the field to the bound task or to the task provided as 1st argument.
     * If {@link #instantUpdate} option is enabled this method is called automatically after any change in the field.
     *
     * @param {Gnt.model.Task} [toTask] The task to apply the changes to. If not provided, changes will be applied to the last bound task
     * (with {@link #task} config option or {@link #setTask) method)
     */
    applyChanges : function (toTask) {
        toTask          = toTask || this.task;

        var taskStore   = toTask.getTaskStore(true) || this.taskStore;

        // invoke all the Task magic
        toTask.setStartDate(this.value, this.keepDuration, taskStore.skipWeekendsDuringDragDrop);
    },

    setVisibleValue : function (value) {
        this.setValue(this.rawToValue(Ext.Date.format(value, this.format)));
    },

    getVisibleValue : function () {
        if (!this.getValue()) return null;
        return Ext.Date.parse(this.valueToRaw(this.getValue()), this.format);
    },

    // @OVERRIDE
    /**
     * Sets the value of the field.
     *
     * **Note**, that this method accept the actual start date value, as it is stored in the data model.
     * The displayed value can be different, when editing milestones.
     *
     * @param {Date} value New value of the field.
     */
    setValue : function (value, forceUpdate) {
        this.callParent([ value ]);

        var task        = this.task;

        if ((forceUpdate || this.instantUpdate) && !this.getSuppressTaskUpdate() && task && task.taskStore && value) {
            // apply changes to task
            this.applyChanges();

            // potentially value can be changed during setStartDate() call
            // because of skipping holidays
            // so let`s check it after call and set final value again
            var startDate = task.getStartDate();

            if (startDate - this.getValue() !== 0) {
                this.callParent([ startDate ]);
            }

            task.fireEvent('taskupdated', task, this);
        }
    },

    // @OVERRIDE
    /**
     * Returns the value of the field.
     *
     * **Note**, that this method returns the actual start date value, as it is stored in the data model.
     * The displayed value can be different, when editing milestones.
     *
     * @return {Date}
     */
    getValue : function () {
        return this.value;
    },
    
    /*
     * We overrode 'getValue' method and broke default 'checkChange' method. 
     * This fix is required for validation on-the-fly (as user type).
     * https://www.assembla.com/spaces/bryntum/tickets/1361
     */
    checkChange: function() {
        if (!this.suspendCheckChange) {
            var me = this,
                // we use raw value since 'getValue' method doesn't fir this goal after override
                newVal = me.rawToValue((me.inputEl ? me.inputEl.getValue() : Ext.value(me.rawValue, ''))),
                oldVal = me.lastValue;
                
            if (!me.isEqual(newVal, oldVal) && !me.isDestroyed) {
                me.lastValue = newVal;
                me.fireEvent('change', me, newVal, oldVal);
                me.onChange(newVal, oldVal);
            }
        }
    },

    // @private
    // it's called in editor.completeEdit()
    assertValue : function () {
        var me          = this,
            oldRaw      = me.rawValue,
            newRaw      = me.getRawValue(),
            oldValue    = me.getValue(),
            newValue    = me.rawToValue(newRaw),
            focusTask   = me.focusTask;

        if (focusTask) {
            focusTask.cancel();
        }
        
        // AND changed to OR because raw values check always return false and values check seem to be enough
        if ((oldRaw != newRaw) || (newValue - oldValue !== 0)) {
            // set value only if field is valid
            if (!me.validateOnBlur || me.isValid()) {
                // at this point `setValue` should apply any changes from the field to the task
                // even if `instantUpdate` is disabled
                me.setValue(newValue, true);
            }
        }
    },

    // @OVERRIDE
    beforeBlur : function () {
        this.assertValue();
    }
});
