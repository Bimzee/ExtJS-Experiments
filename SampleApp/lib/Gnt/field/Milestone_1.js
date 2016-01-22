/*

Ext Gantt 2.2.23
Copyright(c) 2009-2014 Bryntum AB
http://bryntum.com/contact
http://bryntum.com/license

*/
/**
@class Gnt.field.Milestone
@extends Ext.form.field.ComboBox

A specialized field allowing a user to convert regular task to milestone and back.

*/
Ext.define('Gnt.field.Milestone', {
    extend                  : 'Ext.form.field.ComboBox',
    requires                : 'Ext.data.JsonStore',
    mixins                  : ['Gnt.field.mixin.TaskField', 'Gnt.mixin.Localizable'],

    alias                   : 'widget.milestonefield',

    instantUpdate           : false,
    allowBlank              : false,
    forceSelection          : true,
    displayField            : 'text',
    valueField              : 'value',
    queryMode               : 'local',

    constructor : function (config) {

        Ext.apply(this, config);

        this.store  = new Ext.data.JsonStore({
            fields  : ['value', 'text'],
            data    : [
                { value : 0, text : this.L('no') },
                { value : 1, text : this.L('yes') }
            ]
        });

        this.setSuppressTaskUpdate(true);
        this.callParent(arguments);
        this.setSuppressTaskUpdate(false);

        if (this.task) {
            this.setTask(this.task);
        }
    },

    destroy : function () {
        this.destroyTaskListener();

        this.callParent();
    },

    onSetTask : function () {
        this.setValue(this.task.isMilestone() ? 1 : 0);
    },

    valueToVisible : function (value) {
        return value ? this.L('yes') : this.L('no');
    },

    // @OVERRIDE
    setValue : function (value) {
        this.callParent([value]);

        if (this.instantUpdate && !this.getSuppressTaskUpdate() && this.task) {

            if (this.task.isMilestone() != Boolean(this.value)) {
                // apply changes to task
                this.applyChanges();

                this.task.fireEvent('taskupdated', this.task, this);
            }

        }
    },

    getValue : function () {
        return this.value;
    },

    applyChanges : function (task) {
        task    = task || this.task;
        if (this.getValue()) {
            task.convertToMilestone();
        } else {
            task.convertToRegular();
        }
    }
});
