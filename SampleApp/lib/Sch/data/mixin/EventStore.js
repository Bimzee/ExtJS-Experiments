/*

Ext Scheduler 2.5.2
Copyright(c) 2009-2014 Bryntum AB
http://bryntum.com/contact
http://bryntum.com/license

*/
/**
@class Sch.data.mixin.EventStore

This is a mixin, containing functionality related to managing events. 

It is consumed by the regular {@link Sch.data.EventStore} class and {@link Gnt.data.TaskStore} class 
to allow data sharing between gantt chart and scheduler. Please note though, that datasharing is still
an experimental feature and not all methods of this mixin can be used yet on a TaskStore. 

*/
Ext.define("Sch.data.mixin.EventStore", {
    model : 'Sch.model.Event',
    config : { model : 'Sch.model.Event' },

    requires : [
        'Sch.util.Date'
    ],

    isEventStore : true,

    /**
     * Gets the resource store for this store
     *
     * @return {Sch.data.ResourceStore} resourceStore
     */
    getResourceStore : function () {
        return this.resourceStore;
    },

    /**
     * Sets the resource store for this store
     * 
     * @param {Sch.data.ResourceStore} resourceStore
     */
    setResourceStore : function (resourceStore) {
        // TODO since we allow the same event store to be used with different resource stores
        // having "this.resourceStore" property is not correct, need to cleanup this
        if (this.resourceStore) {
            this.resourceStore.un({
                beforesync  : this.onResourceStoreBeforeSync,
                write       : this.onResourceStoreWrite,
                scope       : this
            });
        }
        
        this.resourceStore    = resourceStore;
        
        if (resourceStore) {
            resourceStore.on({
                beforesync  : this.onResourceStoreBeforeSync,
                write       : this.onResourceStoreWrite,
                scope       : this
            });
        }
    },

    onResourceStoreBeforeSync: function (records, options) {
        var recordsToCreate     = records.create;
        
        if (recordsToCreate) {
            for (var r, i = recordsToCreate.length - 1; i >= 0; i--) {
                r = recordsToCreate[i];
                
                // Save the phantom id to be able to replace the task phantom task id's in the dependency store
                r._phantomId = r.internalId;
            }
        }
    },

    /* 
     * This method will update events that belong to a phantom resource, to make sure they get the 'real' resource id
     */
    onResourceStoreWrite: function (store, operation) {
        if (operation.wasSuccessful()) {
            var me = this,
                rs = operation.getRecords();

            Ext.each(rs, function(resource) {
                if (resource._phantomId && !resource.phantom) {
                    me.each(function (event) {
                        if (event.getResourceId() === resource._phantomId) {
                            event.assign(resource);
                        }
                    });
                }
            });
        }
    },

    /**
    * Checks if a date range is allocated or not for a given resource.
    * @param {Date} start The start date
    * @param {Date} end The end date
    * @param {Sch.model.Event} excludeEvent An event to exclude from the check (or null)
    * @param {Sch.model.Resource} resource The resource
    * @return {Boolean} True if the timespan is available for the resource
    */
    isDateRangeAvailable: function (start, end, excludeEvent, resource) {
        var available = true,
            DATE = Sch.util.Date;

        this.forEachScheduledEvent(function (ev, startDate, endDate) {
            if (DATE.intersectSpans(start, end, startDate, endDate) &&
                resource === ev.getResource() && 
                (!excludeEvent || excludeEvent !== ev)) {
                available = false;
                return false;
            }
        });

        return available;
    },

    /**
    * Returns events between the supplied start and end date
    * @param {Date} start The start date
    * @param {Date} end The end date
    * @param {Boolean} allowPartial false to only include events that start and end inside of the span
    * @return {Ext.util.MixedCollection} the events
    */
    getEventsInTimeSpan: function (start, end, allowPartial) {

        if (allowPartial !== false) {
            var DATE = Sch.util.Date;

            return this.queryBy(function (event) {
                var eventStart = event.getStartDate(),
                    eventEnd = event.getEndDate();

                return eventStart && eventEnd && DATE.intersectSpans(eventStart, eventEnd, start, end);
            });
        } else {
            return this.queryBy(function (event) {
                var eventStart = event.getStartDate(),
                    eventEnd = event.getEndDate();

                return eventStart && eventEnd && (eventStart - start >= 0) && (end - eventEnd >= 0);
            });
        }
    },

    /**
     * Calls the supplied iterator function once for every scheduled event, providing these arguments
     *      - event : the event record
     *      - startDate : the event start date
     *      - endDate : the event end date
     *
     * Returning false cancels the iteration.
     *
     * @param {Function} fn iterator function
     * @param {Object} scope scope for the function
     */
    forEachScheduledEvent : function (fn, scope) {

        this.each(function (event) {
            var eventStart = event.getStartDate(),
                eventEnd = event.getEndDate();

            if (eventStart && eventEnd) {
                return fn.call(scope || this, event, eventStart, eventEnd);
            }
        }, this);
    },

    /**
     * Returns an object defining the earliest start date and the latest end date of all the events in the store.
     * 
     * @return {Object} An object with 'start' and 'end' Date properties (or null values if data is missing).
     */
    getTotalTimeSpan : function() {
        var earliest = new Date(9999,0,1), 
            latest = new Date(0), 
            D = Sch.util.Date;
        
        this.each(function(r) {
            if (r.getStartDate()) {
                earliest = D.min(r.getStartDate(), earliest);
            }
            if (r.getEndDate()) {
                latest = D.max(r.getEndDate(), latest);
            }
        });

        earliest = earliest < new Date(9999,0,1) ? earliest : null;
        latest = latest > new Date(0) ? latest : null;

        return {
            start : earliest || null,
            end : latest || earliest || null
        };
    },

    /**
     * Returns the events associated with a resource
     * 
     * @param {Sch.model.Resource} resource
     * @return {Sch.model.Event[]} the events
     */
    getEventsForResource: function (resource) {
        // `getEvents` method of the resource will use either `indexByResource` or perform a full scan of the event store
        return resource.getEvents(this);
    },

    // This method provides a way for the store to append a new record, and the consuming class has to implement it
    // since Store and TreeStore don't share the add API.
    append : function(record) {
        throw 'Must be implemented by consuming class';
    },

    // Sencha Touch <-> Ext JS normalization
    getModel : function() {
        return this.model;
    },

    // Overridden in Gantt TaskStore
    setAssignmentStore : null,
    getAssignmentStore : null
});