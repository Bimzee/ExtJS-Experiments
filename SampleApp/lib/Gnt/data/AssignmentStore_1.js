/*

Ext Gantt 2.2.23
Copyright(c) 2009-2014 Bryntum AB
http://bryntum.com/contact
http://bryntum.com/license

*/
/**
@class Gnt.data.AssignmentStore
@extends Ext.data.Store

A class representing the collection of the assignments between the tasks in the {@link Gnt.data.TaskStore} and resources
in the {@link Gnt.data.ResourceStore}.

Contains the collection of {@link Gnt.model.Assignment} records.

*/

Ext.define('Gnt.data.AssignmentStore', {
    extend      : 'Ext.data.Store',

    requires    : [
        'Gnt.model.Assignment'
    ],

    model       : 'Gnt.model.Assignment',

    ignoreInitial   : true,

    // we set it to true to catch `datachanged` event from `loadData` method and ignore this event from records' CRUD operations
    isLoadingRecords            : false,

    // when we call `removeAll` `datachanged` event fires before `clear`. We listen `datachanged` event to refresh grid and in every case except removeAll assignments cache is correct.
    // this flag handles case when we call `removeAll` method and expect correct cache state
    isRemovingAll   : false,

    /**
     * @property {Gnt.data.TaskStore} taskStore The task store to which this assignment store is associated.
     * Usually is configured automatically, by the task store itself.
     */
    taskStore   : null,

    constructor : function() {
        this.mixins.observable.constructor.apply(this, arguments);

        // subscribing to the CRUD before parent constructor - in theory, that should guarantee, that our listeners
        // will be called first (before any other listeners, that could be provided in the "listeners" config)
        // and state in other listeners will be correct
        this.init();

        this.callParent(arguments);

        this.ignoreInitial      = false;
    },

    init : function() {
        this.on({
            add         : this.onAssignmentAdd,
            update      : this.onAssignmentUpdate,

            load        : this.onAssignmentsLoad,
            datachanged : this.onAssignmentDataChanged,
            // seems we can't use "bulkremove" event, because one can listen to `remove` event on the task store
            // and expect correct state in it
            remove      : this.onAssignmentRemove,
            // note that we don't listen `clear` event because we update assignments cache via `datachanged` event and `isRemovingAll` flag

            scope       : this
        });
    },

    onAssignmentsLoad  : function () {
        var taskStore = this.getTaskStore();
        taskStore && taskStore.fillTasksWithAssignmentInfo();
    },

    onAssignmentDataChanged : function () {
        var taskStore = this.getTaskStore();

        if (taskStore && (this.isLoadingRecords || this.isRemovingAll)) taskStore.fillTasksWithAssignmentInfo();
    },

    //override
    removeAll   : function () {
        this.isRemovingAll = true;
        this.callParent(arguments);
        this.isRemovingAll = false;
    },

    loadRecords    : function () {
        this.isLoadingRecords = true;
        this.callParent(arguments);
        this.isLoadingRecords = false;
    },


    onAssignmentAdd : function (me, assignments) {
        // need to ignore the initial "add" events for data provided in the config
        if (this.ignoreInitial) return;

        for (var i = 0; i < assignments.length; i++) {
            var assignment  = assignments[ i ];
            var task        = assignment.getTask();

            task && task.assignments.push(assignment);
        }
    },


    onAssignmentRemove : function (me, assignment) {
        var taskStore       = this.getTaskStore();

        if (!taskStore) return;

        // assignments are already removed from the assignments store and has no reference to it
        // so `getTaskStore` on the Assignment instance won't work, need to provide `taskStore`
        var task            = assignment.getTask(taskStore);

        task && Ext.Array.remove(task.assignments, assignment);
    },


    onAssignmentUpdate : function (me, assignment, operation) {
        if (operation != Ext.data.Model.COMMIT) {
            var taskStore       = this.getTaskStore();

            if (!taskStore) return;

            var previous        = assignment.previous;

            var newTask         = assignment.getTask();

            if (previous && assignment.taskIdField in previous) {
                var oldTask   = taskStore.getById(previous[ assignment.taskIdField ]);

                // remove from old array
                oldTask && Ext.Array.remove(oldTask.assignments, assignment);

                newTask && newTask.assignments.push(assignment);
            }
        }
    },


    /**
     * Returns the associated task store instance.
     *
     * @return {Gnt.data.TaskStore}
     */
    getTaskStore: function(){
        return this.taskStore;
    },


    /**
     * Returns the associated resource store instance.
     *
     * @return {Gnt.data.ResourceStore}
     */
    getResourceStore: function(){
        return this.getTaskStore().resourceStore;
    },


    getByInternalId : function (id) {
        return this.data.getByKey(id) || this.getById(id);
    },

    removeAssignmentsForResource : function(resource) {
        var resourceId = resource.getId();

        if (resourceId) {

            var toRemove = this.queryBy(function(assignment) {
                return assignment.getResourceId() === resourceId;
            }).items;

            this.remove(toRemove);
        }
    },

    // TODO: need to put this into a separate mixin (smth like Sch.data.mixin.CustomizableStore)
    fireEvent : function (event, store, record, operation, modifiedFieldNames) {
        // for suspended "update" events we have to append "previous" to arguments to access them once event is resumed back
        if (this.eventsSuspended && event == 'update' && operation == Ext.data.Model.EDIT) {
            return this.callParent([ event, store, record, operation, modifiedFieldNames, Ext.apply({}, record.previous) ]);
        }

        return this.callParent(arguments);
    }
});
