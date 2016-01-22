/*

Ext Gantt 2.2.23
Copyright(c) 2009-2014 Bryntum AB
http://bryntum.com/contact
http://bryntum.com/license

*/
/**
@class Gnt.data.ResourceStore
@extends Sch.data.ResourceStore

A class representing the collection of the resources - {@link Gnt.model.Resource} records.

*/

Ext.define('Gnt.data.ResourceStore', {
    
    requires    : [
        'Gnt.model.Resource'
    ],

    extend      : 'Sch.data.ResourceStore',
    
    
    model       : 'Gnt.model.Resource',
    
    
    /**
     * @property {Gnt.data.TaskStore} taskStore The task store to which this resource store is associated.
     * Usually is configured automatically, by the task store itself.   
     */
    taskStore   : null,


    
    constructor : function () {
        // Call this early manually to be able to add listeners before calling the superclass constructor
        this.mixins.observable.constructor.call(this);
        
        this.on({
            load            : this.normalizeResources,
            remove          : this.onResourceRemoved,
            scope           : this
        });
        
        this.callParent(arguments);
    },
    
    
    normalizeResources : function () {
        // scan through all resources and re-assign the "calendarId" property to get the listeners in place
        this.each(function (resource) {
            if (!resource.normalized) {
                var calendarId      = resource.getCalendarId();
                
                if (calendarId) resource.setCalendarId(calendarId, true);
                
                resource.normalized     = true;
            }
        });
    },

    // Performance optimization possibility: Assignment store datachange will cause a full refresh
    // so removing a resource will currently cause 2 refreshes. Not critical since this is not a very common use case
    onResourceRemoved : function(store, resource) {
        var assignmentStore = this.getAssignmentStore();

        assignmentStore.removeAssignmentsForResource(resource);
    },

    /**
     * Returns the associated task store instance.
     * 
     * @return {Gnt.data.TaskStore}
     */
    getTaskStore: function(){
        return this.taskStore || null;
    },

    
    /**
     * Returns the associated assignment store instance.
     * 
     * @return {Gnt.data.AssignmentStore}
     */
    getAssignmentStore: function(){
        return this.assignmentStore = (this.assignmentStore || this.getTaskStore().getAssignmentStore());
    },
    
    
    getByInternalId : function (id) {
        return this.data.getByKey(id) || this.getById(id);
    }
});