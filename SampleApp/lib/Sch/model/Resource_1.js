/*

Ext Scheduler 2.5.2
Copyright(c) 2009-2014 Bryntum AB
http://bryntum.com/contact
http://bryntum.com/license

*/
/**
@class Sch.model.Resource
@extends Sch.model.Customizable

This class represent a single Resource in the scheduler chart. Its a subclass of the {@link Sch.model.Customizable}, which is in turn subclass of {@link Ext.data.Model}.
Please refer to documentation of those classes to become familar with the base interface of the resource.

A Resource has only 2 mandatory fields - `Id` and `Name`. If you want to add more fields with meta data describing your resources then you should subclass this class:

    Ext.define('MyProject.model.Resource', {
        extend      : 'Sch.model.Resource',

        fields      : [
            // `Id` and `Name` fields are already provided by the superclass
            { name: 'Company',          type : 'string' }
        ],

        getCompany : function () {
            return this.get('Company');
        },
        ...
    });

If you want to use other names for the Id and Name fields you can configure them as seen below:

    Ext.define('MyProject.model.Resource', {
        extend      : 'Sch.model.Resource',

        nameField   : 'UserName',
        ...
    });

Please refer to {@link Sch.model.Customizable} for details.
*/

// Don't redefine the class, which will screw up instanceof checks etc
if (!Ext.ClassManager.get("Sch.model.Resource")) {

    Ext.define('Sch.model.Resource', {
        extend : 'Sch.model.Customizable',

        idProperty : 'Id',
        config     : Ext.versions.touch ? { idProperty : 'Id' } : null,

        /**
         * @cfg {String} nameField The name of the field that holds the resource name. Defaults to "Name".
         */
        nameField : 'Name',

        customizableFields : [
            'Id',

        /**
         * @method getName
         *
         * Returns the resource name
         *
         * @return {String} The name of the resource
         */
        /**
         * @method setName
         *
         * Sets the resource name
         *
         * @param {String} The new name of the resource
         */
            { name : 'Name', type : 'string' }
        ],

        getEventStore : function () {
            return this.stores[ 0 ] && this.stores[ 0 ].eventStore || this.parentNode && this.parentNode.getEventStore();
        },


        /**
         * Returns an array of events, associated with this resource
         * @param {Sch.data.EventStore} eventStore (optional) The event store to get events for (if a resource is bound to multiple stores)
         * @return {Sch.model.Event[]}
         */
        getEvents : function (eventStore) {
            var id      = this.getId() || this.internalId;

            eventStore  = eventStore || this.getEventStore();
            
            if (eventStore.indexByResource)
                return eventStore.indexByResource[ id ] || [];
            else {
                var events      = [];
                
                for (var i = 0, l = eventStore.getCount(); i < l; i++) {
                    var event   = eventStore.getAt(i);
                    
                    if (event.data[ event.resourceIdField ] === id) events.push(event);
                }
    
                return events;
            }
        }
    });
}
