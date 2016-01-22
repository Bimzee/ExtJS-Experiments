/*

Ext Scheduler 2.5.2
Copyright(c) 2009-2014 Bryntum AB
http://bryntum.com/contact
http://bryntum.com/license

*/
/**
@class Sch.data.CrudManager

Class implementing central collection of all project stores.
It allows to load all of them by a single server request and persist all of their changes by one request as well.
This class uses AJAX as a transport mechanism and JSON as a data encoding format.

For usage details please see [this guide](#!/guide/scheduler_crud_manager).

# Scheduler stores

The class supports Scheduler specific stores (namely: resource and event stores).
For these stores the class has separate configs ({@link #resourceStore}, {@link #eventStore})
to register them.

    var crudManager = Ext.create('Sch.data.CrudManager', {
        autoLoad        : true,
        resourceStore   : resourceStore,
        eventStore      : eventStore,
        transport       : {
            load    : {
                url     : 'php/read.php'
            },
            sync    : {
                url     : 'php/save.php'
            }
        }
    });

# Loading order

The class is aware of the proper loading order for Scheduler specific stores so you don't need to worry about it.
And if you provide any extra stores (using {@link #stores} config) on a construction step
they will get to the start of collection before the Scheduler specific stores.
So if you need to change that loading order you should use {@link #addStore} method to register your store:

    var crudManager = Ext.create('Sch.data.CrudManager', {
        resourceStore   : resourceStore,
        eventStore      : eventStore,
        // extra user defined stores will get to the start of collection
        // so they will be loaded first
        stores          : [ store1, store2 ],
        transport       : {
            load    : {
                url     : 'php/read.php'
            },
            sync    : {
                url     : 'php/save.php'
            }
        }
    });

    // append store3 to the end so it will be loaded last
    crudManager.addStore(store3);

    // now when we registered all the stores let's load them
    crudManager.load();

*/
Ext.define('Sch.data.CrudManager', {
    extend          : 'Sch.crud.AbstractManager',

    mixins          : ['Sch.crud.encoder.Json', 'Sch.crud.transport.Ajax'],

    /**
     * @cfg {Gnt.data.ResourceStore/Object} resourceStore A store with resources or its descriptor.
     */
    /**
     * @property {Object} resourceStore The resource store descriptor.
     */
    resourceStore   : null,
    /**
     * @cfg {Gnt.data.EventStore/Object} eventStore A store with events or its descriptor.
     */
    /**
     * @property {Object} eventStore The event store descriptor.
     */
    eventStore      : null,

    constructor : function (config) {
        config  = config || {};

        var resourceStore   = config.resourceStore,
            eventStore      = config.eventStore,
            // list of stores to add
            stores          = [];

        // resource store
        if (resourceStore) {
            if (resourceStore instanceof Ext.data.AbstractStore) {
                resourceStore   = { store : resourceStore, storeId : resourceStore.storeId };
            }

            delete config.resourceStore;
            this.resourceStore  = resourceStore;
            stores.push(resourceStore);
        }

        // event store
        if (eventStore) {
            if (eventStore instanceof Ext.data.AbstractStore) {
                eventStore  = { store : eventStore, storeId : eventStore.storeId };
            }

            delete config.eventStore;
            this.eventStore  = eventStore;
            stores.push(eventStore);
        }

        // all the Scheduler related stores will go after the user defined stores from the config.stores
        if (stores.length) {
            config.stores   = (config.stores || []).concat(stores);
        }

        this.callParent([ config ]);
    },

    /**
     * Returns the resource store bound to the CRUD manager.
     * @return {Sch.data.ResourceStore} The resource store.
     */
    getResourceStore : function () {
        return this.resourceStore && this.resourceStore.store;
    },

    /**
     * Returns the event store bound to the CRUD manager.
     * @return {Sch.data.EventStore} The event store.
     */
    getEventStore : function () {
        return this.eventStore && this.eventStore.store;
    }
});
