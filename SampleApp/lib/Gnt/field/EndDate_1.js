/*

Ext Gantt 2.2.23
Copyright(c) 2009-2014 Bryntum AB
http://bryntum.com/contact
http://bryntum.com/license

*/
/**
@class Gnt.field.EndDate
@extends Ext.form.field.Date

A specialized field for editing the task end date value. This class inherits from the `Ext.form.field.Date` field
and any of its configuration options can be used. You can find this field used in the {@link Gnt.widget.TaskForm}
and in the {@link Gnt.column.StartDate} classes but you can also use it in your own components.
See "Using field standalone" in the documentation of {@link Gnt.field.StartDate}.

This field must be bound to a {@link Gnt.model.Task task} instance, which is used for date value processing
(calendars, holidays etc).

#Task interaction

By default the field instantly applies all changes to the bound task. This can be turned off with the {@link #instantUpdate} option.

#Using field standalone

Please refer to {@link Gnt.field.StartDate} for details.

* **Note**, that the value displayed in the field can be different from the value in the data model when editing milestones
or when the date does not contain any time information (hours/minutes etc). This is because in our component, an end date represents a distinct point
on the timeaxis. For example: if from a user perspective, a task starts at 2013/01/01 and ends at 2013/01/02 -
this means that the task actually ends at 2013/01/02 23:59:59.9999. In the task model we store
2013/01/03 00:00:00, but in the field we show 2013/01/02. See also {@link #adjustMilestones}.

*/
Ext.define('Gnt.field.EndDate', {

    extend              : 'Ext.form.field.Date',

    requires            : ['Sch.util.Date'],

    mixins              : ['Gnt.field.mixin.TaskField', 'Gnt.mixin.Localizable'],

    alias               : 'widget.enddatefield',

    /**
     * @cfg {Boolean} adjustMilestones When set to `true`, the start/end dates of the milestones will be adjusted -1 day *during rendering and editing*. The task model will still hold the raw unmodified date.
     */
    adjustMilestones    : true,

    /**
     * @cfg {Boolean} keepDuration Pass `true` to keep the duration of the task ("move" the task), `false` to change the duration ("resize" the task).
     */
    keepDuration        : false,

    taskField           : 'endDateField',

    /**
     * @cfg {Boolean} validateStartDate When set to `true`, the field will validate a "startDate <= endDate" condition and will not allow user to save invalid value.
     * Set it to `false` if you use different validation mechanism.
     */
    validateStartDate   : true,

    /**
     * @cfg {String} endBeforeStartText Text shown when field value is less than start date of corresponding task.
     * @deprecated Please use {@link #l10n l10n} instead.
     */
    /**
     * @cfg {Object} l10n
     * A object, purposed for the class localization. Contains the following keys/values:

            - endBeforeStartText : 'End date is before start date'
     */

    constructor : function (config) {
        config      = config || {};

        Ext.apply(this, config);

        if (config.task && !config.value) config.value = config.task.getEndDate();

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
        this.setValue(this.task.getEndDate());
    },

    rawToValue : function (rawValue) {
        if (!rawValue) return null;

        return this.visibleToValue(this.parseDate(rawValue));
    },

    valueToRaw : function (value) {
        if (!value) return value;

        return Ext.Date.format(this.valueToVisible(value), this.format);
    },

    valueToVisible : function (value, task) {
        task = task || this.task;

        return task.getDisplayEndDate(this.format, this.adjustMilestones, value, true);
    },

    visibleToValue : function (value) {
        if (value && this.task) {

            if (!Ext.Date.formatContainsHourInfo(this.format) && value - Ext.Date.clearTime(value, true) === 0) {
                // the standard ExtJS date picker will only allow to choose the date, not time
                // we set the time of the selected date to the latest availability hour for that date
                // in case the date has no availbility intervals we use the date itself
                value = this.task.getCalendar().getCalendarDay(value).getAvailabilityEndFor(value) ||
                    Sch.util.Date.add(value, Sch.util.Date.DAY, 1);
            }

        } else {
            value = null;
        }

        return value;
    },

    // @OVERRIDE
    getErrors : function (value) {
        var errors = this.callParent([value]);
        if (errors && errors.length) {
            return errors;
        }

        if (this.validateStartDate) {
            value = this.rawToValue(value);
            if (this.task && value) {
                if (value < this.task.getStartDate()) {
                    return [this.L('endBeforeStartText')];
                }
            }
        }
    },

    // @OVERRIDE
    onExpand : function () {
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
    onSelect : function (picker, pickerDate) {
        // if we display the date with hours, then we (probably) want to keep the task end date's hour/minutes
        // after selecting the date from the picker. In the same time picker will clear the time portion
        // so we need to restore it from original date
        // see also: http://www.bryntum.com/forum/viewtopic.php?f=9&t=4294
        var originalDate    = this.task.getEndDate();
        if (Ext.Date.formatContainsHourInfo(this.format) && originalDate) {
            pickerDate.setHours(originalDate.getHours());
            pickerDate.setMinutes(originalDate.getMinutes());
        }

        var me          = this;
        var oldValue    = me.getValue();
        var newValue    = this.visibleToValue(pickerDate);
        var rawValue    = Ext.Date.format(pickerDate, this.format);

        if (oldValue != newValue) {
            if (this.getErrors(rawValue)) {
                me.setRawValue(rawValue);
                // don`t know if we need to fire in this case
                //me.fireEvent('select', me, newValue);
                me.collapse();
                me.validate();
            } else {
                me.setValue(newValue, true);
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

        if (this.value) {
            toTask.setEndDate(this.value, this.keepDuration, taskStore.skipWeekendsDuringDragDrop);
        } else {
            toTask.setEndDate(null);
        }
    },

    setVisibleValue : function (value) {
        this.setValue(this.rawToValue(Ext.Date.format(value, this.format)));
    },

    getVisibleValue : function () {
        if (!this.getValue()) return null;
        return Ext.Date.parse(this.valueToRaw(this.getValue()), this.format);
    },

    /**
     * Sets the value of the field.
     *
     * **Note**, that this method accept the actual end date value, as it is stored in the data model.
     * The displayed value can be different, when date does not contain time information or when editing milestones.
     *
     * @param {Date} value New value of the field.
     */
    setValue : function (value, forceUpdate) {
        this.callParent([ value ]);

        if ((forceUpdate || this.instantUpdate) && !this.getSuppressTaskUpdate() && this.task) {

            // invoke all the Task magic
            this.applyChanges();

            // potentially value can be changed during applyChanges() call
            // because of skipping holidays
            // so let`s check it after call and set final value again
            var endDate = this.task.getEndDate();
            if (endDate - this.getValue() !== 0) {
                this.callParent([ endDate ]);
            }

            this.task.fireEvent('taskupdated', this.task, this);
        }
    },

    /**
     * Returns the value of the field.
     *
     * **Note**, that this method returns the actual end date value, as it is stored in the data model.
     * The displayed value can be different, when date does not contain time information or when editing milestones.
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
