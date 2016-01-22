/*

Ext Gantt 2.2.23
Copyright(c) 2009-2014 Bryntum AB
http://bryntum.com/contact
http://bryntum.com/license

*/
/**

@class Gnt.model.Assignment
@extends Sch.model.Customizable

This class represent a single assignment of a resource to a task in your gantt chart. It is a subclass of the {@link Sch.model.Customizable} class, which in its turn subclasses {@link Ext.data.Model}.
Please refer to documentation of those classes to become familar with the base interface of this class.

An Assignment has the following fields:

- `Id` - The id of the assignment
- `ResourceId` - The id of the resource assigned
- `TaskId` - The id of the task to which the resource is assigned
- `Units` - An integer value representing how much of the resource's availability that is dedicated to this task

The names of these fields can be customized by subclassing this class. Please refer to {@link Sch.model.Customizable} for details.

See also: {@link Gnt.column.ResourceAssignment}

*/


Ext.define('Gnt.model.Assignment', {
    extend  : 'Sch.model.Customizable',

    idProperty : 'Id',

    customizableFields  : [
        { name : 'Id' },

        { name : 'ResourceId' },
        { name : 'TaskId' },
        { name : 'Units', type : 'float', defaultValue : 100 }
    ],

    /**
    * @cfg {String} resourceIdField The name of the field identifying the resource to which an assignment belongs. Defaults to "ResourceId".
    */
    resourceIdField         : 'ResourceId',

    /**
    * @cfg {String} taskIdField The name of the field identifying the task to which an event belongs. Defaults to "TaskId".
    */
    taskIdField             : 'TaskId',

    /**
    * @cfg {String} unitsField The name of the field identifying the units of this assignment. Defaults to "Units".
    */
    unitsField              : 'Units',

    /**
     * Returns true if the Assignment can be persisted (e.g. task and resource are not 'phantoms')
     *
     * @return {Boolean} true if this model can be persisted to server.
     */
    isPersistable : function() {
        var task        = this.getTask(),
            resource    = this.getResource();

        return task && !task.phantom && resource && !resource.phantom;
    },


    /**
     * Returns the units of this assignment
     *
     * @return {Number} units
     */
    getUnits : function () {
        // constrain to be >= 0
        return Math.max(0, this.get(this.unitsField));
    },


    /**
     * Sets the units of this assignment
     *
     * @param {Number} value The new value for units
     */
    setUnits : function (value) {
        if (value < 0) throw "`Units` value for an assignment can't be less than 0";

        this.set(this.unitsField, value);
    },


    /**
     * Convenience method for returning the name of the associated resource.
     *
     * @return {String} name
     */
    getResourceName : function() {
        var resource = this.getResource();

        if (resource) {
            return resource.getName();
        }

        return '';
    },


    /**
     * Returns the task associated with this assignment.
     *
     * @return {Gnt.model.Task} Instance of task
     * @method getTask
     */
    /** @ignore */
    getTask: function (taskStore) {
        // removed assignment will not have "this.stores" so we are providing a way to get the task via provided taskStore
        taskStore = taskStore || this.stores[ 0 ].getTaskStore();
        return taskStore && taskStore.getByInternalId(this.getTaskId());
    },


    /**
     * Returns the resource associated with this assignment.
     *
     * @return {Gnt.model.Resource} Instance of resource
     */
    getResource: function(){
        return this.stores[ 0 ] && this.stores[ 0 ].getResourceStore().getByInternalId(this.getResourceId());
    },

    // We'll be using `internalId` for Id substitution when dealing with phantom records
    getInternalId: function(){
        return this.getId() || this.internalId;
    },


    /**
     * Returns the effort, contributed by the resource of this assignment to a task of this assignment.
     *
     * @param {String} unit Unit to return the effort in. Defaults to the `EffortUnit` field of the task
     *
     * @return {Number} effort
     */
    getEffort : function (unit) {
        var task            = this.getTask(),
            resource        = this.getResource(),
            totalEffort     = 0;

        if (!resource) return 0;

        task.forEachAvailabilityIntervalWithResources(
            {
                startDate   : task.getStartDate(),
                endDate     : task.getEndDate(),
                resources   : [ resource ]
            },
            function (intervalStartDate, intervalEndDate, currentAssignments) {
                var totalUnits;

                for (var i in currentAssignments) totalUnits = currentAssignments[ i ].units;

                totalEffort             += (intervalEndDate - intervalStartDate) * totalUnits / 100;
            }
        );

        return task.getProjectCalendar().convertMSDurationToUnit(totalEffort, unit || task.getEffortUnit());
    }
});
