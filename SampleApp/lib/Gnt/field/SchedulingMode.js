/*

Ext Gantt 2.2.23
Copyright(c) 2009-2014 Bryntum AB
http://bryntum.com/contact
http://bryntum.com/license

*/
/**

A specialized field, allowing a user to also specify task scheduling mode value.
This class inherits from the standard Ext JS "combo" field, so any usual `Ext.form.field.ComboBox` configs can be used.

The value of this field can be one of the following strings: `Normal`, `Manual`, `FixedDuration`,
`EffortDriven`, `DynamicAssignment`.

@class Gnt.field.SchedulingMode
@extends Ext.form.field.ComboBox

*/
Ext.define('Gnt.field.SchedulingMode', {
    extend                  : 'Ext.form.field.ComboBox',

    mixins                  : ['Gnt.field.mixin.TaskField'],

    alias                   : 'widget.schedulingmodefield',

    alternateClassName      : ['Gnt.column.schedulingmode.Field'],

    taskField               : 'schedulingModeField',

    store                   : [
        [ 'Normal',             'Normal' ],
        [ 'Manual',             'Manual' ],
        [ 'FixedDuration',      'Fixed duration' ],
        [ 'EffortDriven',       'Effort driven' ],
        [ 'DynamicAssignment',  'Dynamic assignment' ]
    ],

    /**
     * @cfg {String} pickerAlign The align for combo-box's picker.
     */
    pickerAlign             : 'tl-bl?',

    /**
     * @cfg {Boolean} matchFieldWidth Whether the picker dropdown's width should be explicitly set to match the width of the field. Defaults to true.
     */
    matchFieldWidth         : true,

    editable                : false,

    forceSelection          : true,

    triggerAction           : 'all',

    constructor : function(config) {
        var me = this;

        Ext.apply(this, config);

        this.setSuppressTaskUpdate(true);
        this.callParent(arguments);
        this.setSuppressTaskUpdate(false);

        if (this.task) this.setTask(this.task);
    },

    destroy : function () {
        this.destroyTaskListener();

        this.callParent();
    },


    onSetTask : function () {
        this.setValue(this.task.getSchedulingMode());
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


    /**
     * This method applies the changes from the field to the bound task or to the task provided as 1st argument.
     * If {@link #instantUpdate} option is enabled this method is called automatically after any change in the field.
     *
     * @param {Gnt.model.Task} [toTask] The task to apply the changes to. If not provided, changes will be applied to the last bound task
     * (with {@link #task} config option or {@link #setTask) method)
     */
    applyChanges : function (toTask) {
        toTask = toTask || this.task;

        toTask.setSchedulingMode(this.getValue());
    },


    getValue : function () {
        return this.value;
    },

    setValue : function (value) {

        this.callParent([ value ]);

        if (this.instantUpdate && !this.getSuppressTaskUpdate() && this.task && this.value) {
            // apply changes to task
            this.applyChanges();

            this.task.fireEvent('taskupdated', this.task, this);

        }
    }

});
