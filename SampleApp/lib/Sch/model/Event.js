/*

Ext Scheduler 2.5.2
Copyright(c) 2009-2014 Bryntum AB
http://bryntum.com/contact
http://bryntum.com/license

*/
/**

@class Sch.model.Event
@extends Sch.model.Range

This class represent a single event in your schedule. Its a subclass of the {@link Sch.model.Range}, which is in turn subclass of {@link Sch.model.Customizable} and {@link Ext.data.Model}.
Please refer to documentation of those classes to become familar with the base interface of the task.

The Event model has a few predefined fields as seen below. If you want to add new fields or change the options for the existing fields,
you can do that by subclassing this class (see example below).

Fields
------

- `Id`          - (mandatory) unique identificator of task
- `Name`        - name of the event (task title)
- `StartDate`   - start date of the task in the ISO 8601 format
- `EndDate`     - end date of the task in the ISO 8601 format,
- `ResourceId`  - The id of the associated resource
- `Resizable`   - A field allowing you to easily control how an event can be resized. You can set it to: true, false, 'start' or 'end' as its value.
- `Draggable`   - A field allowing you to easily control if an event can be dragged. (true or false)
- `Cls`         - A field containing a CSS class to be added to the rendered event element.

Subclassing the Event model class
--------------------

    Ext.define('MyProject.model.Event', {
        extend      : 'Sch.model.Event',

        fields      : [
            // adding new field
            { name: 'MyField', type : 'number', defaultValue : 0 }
        ],

        myCheckMethod : function () {
            return this.get('MyField') > 0
        },
        ...
    });

If you want to use other names for the StartDate, EndDate, ResourceId and Name fields you can configure them as seen below:

    Ext.define('MyProject.model.Event', {
        extend      : 'Sch.model.Event',

        startDateField  : 'taskStart',
        endDateField    : 'taskEnd',

        // just rename the fields
        resourceIdField : 'userId',
        nameField       : 'taskTitle',

        fields      : [
            // completely change the definition of fields
            { name: 'taskStart', type: 'date', dateFormat : 'Y-m-d' },
            { name: 'taskEnd', type: 'date', dateFormat : 'Y-m-d' },
        ]
        ...
    });

Please refer to {@link Sch.model.Customizable} for additional details.

*/
Ext.define('Sch.model.Event', {
    extend: 'Sch.model.Range',

    customizableFields: [
        { name: 'Id' },
        { name: 'ResourceId' },
        { name: 'Draggable', type: 'boolean', persist: false, defaultValue : true },   // true or false
        { name: 'Resizable', persist: false, defaultValue : true }                     // true, false, 'start' or 'end'
    ],

    /**
    * @cfg {String} resourceIdField The name of the field identifying the resource to which an event belongs. Defaults to "ResourceId".
    */
    resourceIdField: 'ResourceId',

    /**
    * @cfg {String} draggableField The name of the field specifying if the event should be draggable in the timeline
    */
    draggableField: 'Draggable',

    /**
    * @cfg {String} resizableField The name of the field specifying if/how the event should be resizable.
    */
    resizableField: 'Resizable',

    /**
    * Returns either the resource associated with this event (when called w/o `resourceId`) or resource with specified id.
    *
    * @param {String} resourceId (optional)
    * @return {Sch.model.Resource}
    */
    getResource: function (resourceId, eventStore) {
        if (this.stores && this.stores.length > 0 || eventStore) {
            /*custom implementation-bug fix*/
            if (this.stores[0] == Ext.getStore('reports.DrillSchedule')) {
                var rs = (eventStore || Ext.getStore('rigSchedule.ScheduledJob')).resourceStore;
            }
            /*custom implementation-bug fix*/
            else
                var rs = (eventStore || this.stores[0]).resourceStore;

            resourceId = resourceId || this.get(this.resourceIdField);

            if (Ext.data.TreeStore && rs instanceof Ext.data.TreeStore) {
                return rs.getNodeById(resourceId) || rs.getRootNode().findChildBy(function(r) {
                    return r.internalId === resourceId;
                });
            } else {
                return rs.getById(resourceId) || rs.data.map[resourceId];
            }
        }

        return null;
    },

    /**
    * Sets the resource which the event should belong to.
    *
    * @param {Sch.model.Resource/Mixed} resource The new resource
    */
    setResource: function (resourceOrId) {
        this.set(this.resourceIdField, (resourceOrId instanceof Ext.data.Model) ? resourceOrId.getId() || resourceOrId.internalId : resourceOrId);
    },

    /**
    * Assigns this event to the specified resource, alias for 'setResource'
    *
    * @param {Sch.model.Resource/Mixed} resource The new resource for this event
    */
    assign: function (resourceOrId) {
        this.setResource.apply(this, arguments);
    },

    /**
    * Unassigns this event from the specified resource
    *
    * @param {Sch.model.Resource/Mixed} resource The resource to unassign from this event
    */
    unassign: function (resourceOrId) {
        // TODO
        //this.setResourceId(null);
    },

    /**
    * @method isDraggable
    *
    * Returns true if event can be drag and dropped
    * @return {Mixed} The draggable state for the event.
    */
    isDraggable: function () {
        return this.getDraggable();
    },

    /**
     * @method isAssignedTo
     * Returns true if this event is assigned to a certain resource.
     *
     * @param {Sch.model.Resource} resource The resource to query for
     * @return {Boolean}
     */
    isAssignedTo: function (resource) {
        return this.getResource() === resource;
    },

    /**
    * @method setDraggable
    *
    * Sets the new draggable state for the event
    * @param {Boolean} draggable true if this event should be draggable
    */

    /**
    * @method isResizable
    *
    * Returns true if event can be resized, but can additionally return 'start' or 'end' indicating how this event can be resized.
    * @return {Mixed} The resource Id
    */
    isResizable: function () {
        return this.getResizable();
    },

    /**
    * @method setResizable
    *
    * Sets the new resizable state for the event. You can specify true/false, or 'start'/'end' to only allow resizing one end of an event.
    * @param {Boolean} resizable true if this event should be resizable
    */

    /**
    * @method getResourceId
    *
    * Returns the resource id of the resource that the event belongs to.
    * @return {Mixed} The resource Id
    */

    /**
    * @method setResourceId
    *
    * Sets the new resource id of the resource that the event belongs to.
    * @param {Mixed} resourceId The resource Id
    */

    /**
    * Returns false if a linked resource is a phantom record, i.e. it's not persisted in the database.
    * @return {Boolean} valid
    */
    isPersistable: function () {
        var resources = this.getResources();
        var persistable = true;

        Ext.each(resources, function(r) {
            if (r.phantom) {
                persistable = false;
                return false;
            }
        });

        return persistable;
    },

    forEachResource: function (fn, scope) {
        var rs = this.getResources();
        for (var i = 0; i < rs.length; i++) {
            if (fn.call(scope || this, rs[i]) === false) {
                return;
            }
        }
    },

    getResources : function(eventStore) {
        var resource    = this.getResource(null, eventStore);

        return resource ? [ resource ] : [];
    }
});
