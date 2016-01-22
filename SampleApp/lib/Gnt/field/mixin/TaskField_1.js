/*

Ext Gantt 2.2.23
Copyright(c) 2009-2014 Bryntum AB
http://bryntum.com/contact
http://bryntum.com/license

*/
/**
@class Gnt.field.mixin.TaskField

A mixin with common functionality for all fields used to edit {@link Gnt.model.Task} information.

*/
Ext.define('Gnt.field.mixin.TaskField', {

    taskField               : '',

    /**
     * @cfg {Gnt.model.Task} task Task being edited. Field will apply all it's value changes directly to this task (if {@link #instantUpdate} is `true`).
     */
    task                    : null,

    /**
     * @cfg {Gnt.data.TaskStore} taskStore Task store should provided if task being edited is not in any task store yet and thus does not have a calendar.
     * In such case we'll retrieve a calendar from the task store (project calendar).
     */
    taskStore               : null,

    /**
     * @cfg {Number} suppressTaskUpdate A number flag, when greater than 0 prevents task updates.
     */
    suppressTaskUpdate      : 0,

    /**
     * @cfg {Boolean} highlightTaskUpdates When set to `true`, field will highlight itself when its value is changed due to changes in some other field.
     * For example when changing the end date of the task, its duration will change as well and will highlight itself.
     */
    highlightTaskUpdates    : true,

    /**
     * @cfg {String} highlightColor A color to use when highlighting the field. See {@link #highlightTaskUpdates} option.
     */
    highlightColor          : '#009900',

    lastHighlight           : 0,

    /**
     * @cfg {Boolean} instantUpdate Set to `false` to prevent automatic applying changes to task on each {@link #setValue} call.
     * To apply changes manually one can use {@link #applyChanges} method.
     */
    instantUpdate           : true,

    /**
     * Binds task to the field.
     * @param {Gnt.model.Task} task Task to bind.
     */
    setTask : function (task) {
        if (!task) return;

        this.destroyTaskListener();

        this.updateReadOnly(task);

        this.task = task;

        task.on('taskupdated', this.onTaskUpdateProcess, this);

        // we need calendar to be assigned to task or task should be part of taskStore with
        // assigned calendar, if we dont`t have it lets imitate it by binding task to provided taskStore
        if (!task.getCalendar(true) && !task.getTaskStore(true)) {

            task.taskStore = task.getTaskStore(true) || this.taskStore;

            if (!task.taskStore) throw 'Configuration issue: Gnt.data.taskStore instance should be provided.';
            if (!task.getCalendar(true) && !task.taskStore.getCalendar()) throw 'Configuration issue: Gnt.data.Calendar instance should be provided.';
        }

        this.setSuppressTaskUpdate(true);
        if (this.onSetTask) this.onSetTask(task);
        this.setSuppressTaskUpdate(false);
    },


    setSuppressTaskUpdate : function (inc) {
        inc ? this.suppressTaskUpdate++ : this.suppressTaskUpdate--;
    },


    getSuppressTaskUpdate : function () {
        return this.suppressTaskUpdate;
    },


    updateReadOnly : function (task) {
        if (!this.disabled) {
            if (this.editable === false) {
                // let's take into account Task.isEditable() result
                if (!task.isEditable(task[this.taskField])) {
                    this.setReadOnly(true);
                // when editable is false `readOnly` should be set to `true`
                } else if (this.inputEl) {
                    this.setReadOnly(false);
                    this.inputEl.dom.readOnly = true;
                }

            } else {
                // let's take into account Task.isEditable() result
                this.setReadOnly(!task.isEditable(task[this.taskField]));
            }
        }
    },


    onTaskUpdateProcess : function (task, initiator) {
        if (initiator !== this) {
            var prev    = this.getValue();

            // update field editability
            this.updateReadOnly(task);

            this.setSuppressTaskUpdate(true);
            if (this.onTaskUpdate) {
                this.onTaskUpdate(task, initiator);
            } else {
                if (this.onSetTask) this.onSetTask();
            }
            this.setSuppressTaskUpdate(false);

            if (this.highlightTaskUpdates) {
                var curr    = this.getValue(),
                    isDate  = Ext.isDate(prev);

                if (isDate && (prev - curr !== 0) || (!isDate && String(prev) !== String(curr))) {
                    this.highlightField();
                }
            }
        }
    },

    highlightField : function (color, options) {
        if (this.rendered && (new Date() - this.lastHighlight > 1000)) {
            this.lastHighlight = new Date();
            this.inputEl.highlight(color || this.highlightColor, options || { attr : 'color' });
        }
    },

    destroyTaskListener : function () {
        if (this.task) {
            this.task.un('taskupdated', this.onTaskUpdateProcess, this);
        }
    }

});
