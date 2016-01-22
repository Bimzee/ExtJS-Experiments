/*

Ext Scheduler 2.5.2
Copyright(c) 2009-2014 Bryntum AB
http://bryntum.com/contact
http://bryntum.com/license

*/
/**
@class Sch.data.EventStore

This is a class holding all the {@link Sch.model.Event events} to be rendered into a {@link Sch.SchedulerPanel scheduler panel}.

*/
Ext.define("Sch.data.EventStore", {
    extend      : 'Ext.data.Store',

    mixins      : [
        'Sch.data.mixin.EventStore'
    ],

    storeId     : 'events',

    model       : 'Sch.model.Event',
    config      : { model : 'Sch.model.Event' },
    alias       : 'store.eventstore',

    // we set it to true to catch `datachanged` event from `loadData` method and ignore this event from records' CRUD operations
    isLoadingRecords            : false,
    
    indexByResource             : null,

    
    constructor : function (config) {
        if (Ext.versions.extjs) {
            this.mixins.observable.constructor.apply(this, arguments);
        }

        this.indexByResource = {};
        
        // subscribing to the CRUD before parent constructor - in theory, that should guarantee, that our listeners
        // will be called first (before any other listeners, that could be provided in the "listeners" config)
        // and state in other listeners will be correct
        this.on({
            add         : this.onEventAdd,
            update      : this.onEventUpdate,

            refresh     : this.onRefresh,

            // seems we can't use "bulkremove" event, because one can listen to `remove` event on the task store
            // and expect correct state in it
            remove      : this.onEventRemove,
            clear       : this.onEventStoreClear,

            // Touch
            addrecords    : this.onEventAdd,
            updaterecord  : this.onEventUpdate,
            removerecords : this.onEventRemove,

            priority    : 100,
            scope       : this
        });

        this.callParent(arguments);

        if (this.getModel() !== Sch.model.Event && !(this.getModel().prototype instanceof Sch.model.Event)) {
            throw 'The model for the EventStore must subclass Sch.model.Event';
        }
    },
    
    
    fillIndexByResource : function () {
        var indexByResource = this.indexByResource = {};
        
        for (var i = 0, len = this.getCount(); i < len; i++) {
            var event       = this.getAt(i);
            var resourceId  = event.data[ event.resourceIdField ];
            
            if (!indexByResource[ resourceId ]) indexByResource[ resourceId ] = [];
            
            indexByResource[ resourceId ].push(event);
        }
    },
    
    
    onEventLoad    : function () {
        this.fillIndexByResource();
    },
    
    
    onEventStoreClear : function () {
        this.fillIndexByResource();
    },
    

    onRefresh   : function () {
        this.fillIndexByResource();
    },
    
    loadRecords    : function () {
        this.isLoadingRecords = true;
        this.callParent(arguments);
        this.isLoadingRecords = false;
    },


    setRecords    : function () {
        this.isLoadingRecords = true;
        this.callParent(arguments);
        this.isLoadingRecords = false;
    },


    onEventAdd : function (me, events) {
        var indexByResource = this.indexByResource;

        for (var i = 0; i < events.length; i++) {
            var event       = events[ i ];
            var resourceId  = event.data[ event.resourceIdField ];
            
            if (!indexByResource[ resourceId ]) indexByResource[ resourceId ] = [];
            
            indexByResource[ resourceId ].push(event);
        }
    },


    onEventRemove : function (me, events) {
        events = Ext.isArray(events) ? events : [events];

        var indexByResource = this.indexByResource;

        for (var i = 0; i < events.length; i++) {
            var event       = events[ i ];
            var resourceId  = event.data[ event.resourceIdField ];

            if (indexByResource[ resourceId ]) Ext.Array.remove(indexByResource[ resourceId ], event);
        }
    },


    onEventUpdate : function (me, event, operation) {
        var previous        = event.previous || {};
        var resourceIdField = event.resourceIdField;

        if (operation != Ext.data.Model.COMMIT && resourceIdField in previous) {
            var indexByResource = this.indexByResource;

            var newResourceId   = event.data[ resourceIdField ];
            var oldResourceId   = previous[ resourceIdField ];
            
            if (indexByResource[ oldResourceId ]) Ext.Array.remove(indexByResource[ oldResourceId ], event);
            
            if (!indexByResource[ newResourceId ]) indexByResource[ newResourceId ] = [];
            
            indexByResource[ newResourceId ].push(event);
        }
    },


    getByInternalId : function(id) {
        // Old Ext 4 way
        if (Ext.versions.extjs && Ext.versions.extjs.isLessThan('5.0')) {
            return this.data.getByKey(id);
        }

        return this.queryBy(function(rec){ return rec.internalId == id; }).first();
    },

    /**
     * Appends a new record to the store
     * @param {Sch.model.Event} record The record to append to the store
     */
    append : function(record) {
        this.add(record);
    }
});