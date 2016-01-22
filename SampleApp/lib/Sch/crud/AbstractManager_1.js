/*

Ext Scheduler 2.5.2
Copyright(c) 2009-2014 Bryntum AB
http://bryntum.com/contact
http://bryntum.com/license

*/
/**
 @class Sch.crud.AbstractManager
 @abstract

 This is an abstract class serving as the base for the Sch.data.CrudManager class.
 It implements basic mechanisms to organize batch interaction with a server.
 Yet it does not contain methods related to _data transferring_ and _encoding_.
 These methods are supposed to be provided in sub-classes by consuming appropriate mixins.

 For example this is how the class can be used to implement an XML encoding system:

        // let's make new CrudManager using AJAX as a transport system and XML for encoding
        Ext.define('MyCrudManager', {
            extend  : 'Sch.crud.AbstractManager',

            mixins  : ['Sch.crud.encoder.Xml', 'Sch.crud.transport.Ajax']
        });

 Data transferring and encoding methods
 ======================================

 Here are the methods that must be provided by subclasses of this class:

 - {@link #sendRequest}
 - {@link #cancelRequest}
 - {@link #encode}
 - {@link #decode}

 */
Ext.define('Sch.crud.AbstractManager', {

    mixins                  : {
        observable          : 'Ext.util.Observable'
    },

    /**
     * @property {Integer} revision
     * @readonly
     * The server revision stamp.
     * The _revision stamp_ is a number which should be incremented after each server-side change.
     * This property reflects the current version of the data retrieved from the server and gets updated after each {@link #load} and {@link #sync} call.
     */
    revision                : null,

    /**
     * @property {Object[]} stores
     * List of registered stores to be organized into a single batch.
     * Each store is represented by a _store descriptor_, an object having following structure:
     * @cfg {String} stores.storeId Unique store identifier.
     * @cfg {Ext.data.Store/Ext.data.TreeStore} stores.store Store itself.
     * @cfg {String} [stores.phantomIdField] Set this if store model has a predefined field to keep phantom record identifier.
     * @cfg {String} [stores.idProperty] id field name, if it's not specified then class will try to get it from a store model.
     */
    /**
     * @cfg {Ext.data.Store[]/Ext.data.TreeStore[]/Object[]} stores
     * Sets the list of stores to be organized in a single batch.
     * Each store must have a unique 'storeId' property which will be used as a key for the data transfered to and from the server.
     * You can either provide a store instance or an object having the following structure:
     *
     * @cfg {String} stores.storeId Unique store identifier.
     * @cfg {Ext.data.Store/Ext.data.TreeStore} stores.store The store itself.
     * @cfg {String} [stores.phantomIdField] Set this if the store model has a predefined field to keep phantom record identifier.
     * @cfg {String} [stores.idProperty] id field name, if it's not specified then class will try to get it from a store model.
     */
    stores                  : null,
    storesIndex             : null,
    activeRequests          : null,
    delayedSyncs            : null,

    /**
     * @method sendRequest
     * @abstract
     * Sends request to the server.
     * @param {Object} request The request to send. An object having following properties:
     * @param {String} request.data {@link #encode Encoded} request.
     * @param {String} request.type Request type, can be either `load` or `sync`
     * @param {Function} request.success Callback to be started on successful request transferring
     * @param {Function} request.failure Callback to be started on request transfer failure
     * @param {Object} request.scope A scope for the above `success` and `failure` callbacks
     * @return {Object} The request descriptor.
     */

    /**
     * @method cancelRequest
     * @abstract
     * Cancels request to the server.
     * @param {Object} request The request to cancel (a value returned by corresponding {@link #sendRequest} call).
     */

    /**
     * @method encode
     * @abstract
     * Encodes request to the server.
     * @param {Object} request The request to encode.
     * @returns {String} The encoded request.
     */

    /**
     * @method decode
     * @abstract
     * Decodes response from the server.
     * @param {String} response The response to decode.
     * @returns {Object} The decoded response.
     */

    /**
     * @cfg {Object} transport
     * @abstract
     * Configuration for the mixin providing transport methods.
     */
    transport               : null,

    /**
     * @cfg {String} phantomIdField
     * Field name to be used to transfer a phantom record identifier.
     */
    phantomIdField          : '$PhantomId',

    /**
     * @cfg {Boolean} autoLoad
     * `true` to automatically call {@link #load} method after creation.
     */
    autoLoad                : false,

    autoSyncTimerId         : null,
    /**
     * @cfg {Integer} autoSyncTimeout
     * The timeout in milliseconds to wait before persisting changes to the server.
     * Used when {@link #autoSync} is set to `true`.
     */
    autoSyncTimeout         : 100,
    /**
     * @cfg {Boolean} autoSync
     * `true` to automatically persist stores changes after every edit to any of stores records.
     * Please note that sync request will not be invoked immediately but only after {@link #autoSyncTimeout} interval.
     */
    autoSync                : false,
    /**
     * @property {Object[]} syncApplySequence
     * An array of stores presenting an alternative sync responses apply order.
     * Each store is represented by a _store descriptor_, an object having following structure:
     * @cfg {String} stores.storeId Unique store identifier.
     * @cfg {Ext.data.Store/Ext.data.TreeStore} stores.store Store itself.
     * @cfg {String} [stores.phantomIdField] Set this if store model has a predefined field to keep phantom record identifier.
     * @cfg {String} [stores.idProperty] id field name, if it's not specified then class will try to get it from a store model.
     */
    /**
     * @cfg {Array} syncApplySequence
     * An array of store identifiers sets an alternative sync responses apply order.
     * By default the order in which sync responses are applied to the stores is the same as they registered in.
     * But in case of some tricky dependencies between store this order can be changed:

            Ext.create('MyCrudManager', {
                // register stores (they will be loaded in the same order: 'store1' then 'store2' and finally 'store3')
                stores : ['store1', 'store2', 'store3'],
                // but we gonna apply changes from server to them in an opposite order
                syncApplySequence : ['store3', 'store2', 'store1']
            });

     */
    syncApplySequence       : null,

    ignoreUpdates           : 0,

    createMissingRecords    : false,


    constructor : function (config) {

        config = config || {};

        this.addEvents(
            'beforeload',
            'loadcanceled',
            'load',
            'loadfail',
            'beforeloadapply',
            'nochanges',
            'haschanges',
            'beforesync',
            'synccanceled',
            'sync',
            'syncfail',
            'beforesyncapply',
            'syncdelayed'
        );

        this.mixins.observable.constructor.call(this, config);

        this.activeRequests     = {};
        this.delayedSyncs       = [];
        this.transport          = this.transport || {};

        delete this.stores;
        this.stores             = [];
        this.addStore(config.stores);

        if (config.syncApplySequence) {
            // reset this.syncApplySequence since addStoreToApplySequence() will build it
            this.syncApplySequence  = null;
            this.addStoreToApplySequence(config.syncApplySequence);
        }

        if (this.autoLoad) this.load();
    },


    updateStoreIndex : function () {
        var storesIndex = {};

        var store;
        for (var i = 0, l = this.stores.length; i < l; i++) {
            store   = this.stores[i];
            if (store.storeId) {
                storesIndex[store.storeId] = this.stores[i];
            }
        }

        this.storesIndex = storesIndex;
    },

    /**
     * Returns a registered store descriptor.
     * @param {String/Ext.data.AbstractStore} storeId The store identifier or registered store instance.
     * @returns {Object} The descriptor of the store.
     * Store descriptor is an object having following structure:
     *
     *  - `storeId` The store identifier that will be used as a key in requests.
     *  - `store` The store itself.
     *  - `idProperty` The idProperty of the store.
     *  - `phantomIdField` The field holding unique Ids of phantom records (if store has such model).
     */
    getStore : function (storeId) {
        if (!storeId) return;

        if (storeId instanceof Ext.data.AbstractStore) {
            for (var i = 0, l = this.stores.length; i < l; i++) {
                if (this.stores[i].store === storeId) return this.stores[i];
            }
        }

        return this.storesIndex[storeId];
    },


    /**
     * Adds a store to the collection.
     * Order in which stores are kept in the collection is very essential sometimes.
     * Exactly in this order the loaded data will be put into each store.

    // append stores to the end of collection
    crudManager.addStore([
        store1,
        store2,
        // store descriptor
        {
            storeId : 'foo',
            store   : store3
        }
    ]);

     * @param {Ext.data.AbstractStore/Object/Ext.data.AbstractStore[]/Object[]} store The store to add or its _descriptor_ (or array of stores or descriptors).
     * Where _store descriptor_ is an object having following properties:
     * @param {String} store.storeId The store identifier that will be used as a key in requests.
     * @param {Ext.data.AbstractStore} store.store The store itself.
     * @param {String} [store.idProperty] The idProperty of the store. If not specified will be taken from the store model.
     * @param {String} [store.phantomIdField] The field holding unique Ids of phantom records (if store has such model).

     * @param {Integer} [position] The relative position of the store. If `fromStore` is specified the this position will be taken relative to it.
     * If not specified then store(s) will be appended to the end of collection.
     * Otherwise it will be just a position in stores collection.

        // insert stores store4, store5 to the start of collection
        crudManager.addStore([ store4, store5 ], 0);

     * @param {Object} [fromStore] The store relative to which position should be calculated. Must be defined as a store descriptor (the result of {@link #getStore} call).

        // insert store6 just before a store having storeId equal to 'foo'
        crudManager.addStore(store6, 0, crudManager.getStore('foo'));

        // insert store7 just after store3 store
        crudManager.addStore(store7, 1, crudManager.getStore(store3));

     */
    addStore : function (store, position, fromStore) {
        if (!store) return;

        if (!Ext.isArray(store)) store = [store];

        var s, data = [], model;
        // loop over list of stores to add
        for (var i = 0, l = store.length; i < l; i++) {
            s       = store[i];

            if (s instanceof Ext.data.AbstractStore) {
                model   = s.getModel && s.getModel() || s.model;
                model   = model && model.prototype;

                s = {
                    store           : s,
                    storeId         : s.storeId,
                    phantomIdField  : model && model.phantomIdField
                };

            } else {
                s.storeId   = s.storeId || s.store.storeId;

                model       = s.store.getModel && s.store.getModel() || s.store.model;
                model       = model && model.prototype;

                if (s.stores) {
                    if (!Ext.isArray(s.stores)) s.stores = [s.stores];

                    for (var j = 0, n = s.stores.length; j < n; j++) {
                        if ('string' === typeof s.stores[j]) {
                            s.stores[j] = { storeId : s.stores[j] };
                        }
                    }
                }
            }

            if (!s.idProperty) {
                s.idProperty    = model && model.idProperty;
            }

            data.push(s);

            s.store.crudManager = this;

            // listen to stores' changes
            this.mon(s.store, {
                add     : this.onStoreChange,
                append  : this.onStoreChange,
                insert  : this.onStoreChange,
                update  : this.onStoreChange,
                remove  : this.onStoreChange,
                clear   : this.onStoreChange,
                scope   : this
            });
        }

        // if no position specified then append stores to the end
        if (typeof position === 'undefined') {

            this.stores.push.apply(this.stores, data);

        // if position specified
        } else {
            var pos = position;
            // if specified the store relative to which we should insert new one(-s)
            if (fromStore) {
                // get its position
                pos += Ext.Array.indexOf(this.stores, fromStore);
            }
            // insert new store(-s)
            this.stores.splice.apply(this.stores, [].concat([pos, 0], data));
        }

        this.updateStoreIndex();
    },

    /**
     * Removes a store from collection. If the store was registered in alternative sync sequence list
     * it will be removed from there as well.

    // remove store having storeId equal to "foo"
    crudManager.removeStore("foo");

    // remove store3
    crudManager.removeStore(store3);

     * @param {Object/String/Ext.data.AbstractStore} store The store to remove. Either the store descriptor, store identifier or store itself.
     */
    removeStore : function (store) {
        for (var i = 0, l = this.stores.length; i < l; i++) {
            var s   = this.stores[i];
            if (s === store || s.store === store || s.storeId === store) {

                // un-listen to store changes
                this.mun(s.store, {
                    add     : this.onStoreChange,
                    append  : this.onStoreChange,
                    insert  : this.onStoreChange,
                    update  : this.onStoreChange,
                    remove  : this.onStoreChange,
                    clear   : this.onStoreChange,
                    scope   : this
                });

                delete this.storesIndex[s.storeId];
                this.stores.splice(i, 1);
                if (this.syncApplySequence) {
                    this.removeStoreFromApplySequence(store);
                }

                break;
            }
        }
    },

    /**
     * Adds a store to the alternative sync responses apply sequence.
     * By default the order in which sync responses are applied to the stores is the same as they registered in.
     * But this order can be changes either on construction step using {@link #syncApplySequence} option
     * or but calling this method.
     *
     * **Please note**, that if the sequence was not initialized before this method call then
     * you will have to do it yourself like this for example:

        // alternative sequence was not set for this crud manager
        // so let's fill it with existing stores keeping the same order
        crudManager.addStoreToApplySequence(crudManager.stores);

        // and now we can add our new store

        // we will load its data last
        crudManager.addStore(someNewStore);
        // but changes to it will be applied first
        crudManager.addStoreToApplySequence(someNewStore, 0);

     * add registered stores to the sequence along with the store(s) you want to add
     *
     * @param {Ext.data.AbstractStore/Object/Ext.data.AbstractStore[]/Object[]} store The store to add or its _descriptor_ (or array of stores or descriptors).
     * Where _store descriptor_ is an object having following properties:
     * @param {String} store.storeId The store identifier that will be used as a key in requests.
     * @param {Ext.data.AbstractStore} store.store The store itself.
     * @param {String} [store.idProperty] The idProperty of the store. If not specified will be taken from the store model.
     * @param {String} [store.phantomIdField] The field holding unique Ids of phantom records (if store has such model).

     * @param {Integer} [position] The relative position of the store. If `fromStore` is specified the this position will be taken relative to it.
     * If not specified then store(s) will be appended to the end of collection.
     * Otherwise it will be just a position in stores collection.

        // insert stores store4, store5 to the start of sequence
        crudManager.addStoreToApplySequence([ store4, store5 ], 0);

     * @param {Object} [fromStore] The store relative to which position should be calculated. Must be defined as a store descriptor (the result of {@link #getStore} call).

        // insert store6 just before a store having storeId equal to 'foo'
        crudManager.addStoreToApplySequence(store6, 0, crudManager.getStore('foo'));

        // insert store7 just after store3 store
        crudManager.addStoreToApplySequence(store7, 1, crudManager.getStore(store3));

     */
    addStoreToApplySequence : function (store, position, fromStore) {
        if (!store) return;

        if (!Ext.isArray(store)) store = [store];

        var data = [];
        // loop over list of stores to add
        for (var i = 0, l = store.length; i < l; i++) {
            var storeId = store[i];
            if ('object' == typeof storeId) storeId = storeId.storeId || storeId.store.storeId;

            var s   = this.getStore(storeId);
            if (s) data.push(s);
        }

        if (!this.syncApplySequence) this.syncApplySequence = [];

        // if no position specified then append stores to the end
        if (typeof position === 'undefined') {
            this.syncApplySequence.push.apply(this.syncApplySequence, data);

        // if position specified
        } else {
            var pos = position;
            // if specified the store relative to which we should insert new one(-s)
            if (fromStore) {
                // get its position
                pos += Ext.Array.indexOf(this.syncApplySequence, fromStore);
            }
            // insert new store(-s)
            this.syncApplySequence.splice.apply(this.syncApplySequence, [].concat([pos, 0], data));
        }
    },


    /**
     * Removes a store from the alternative sync sequence.

    // remove store having storeId equal to "foo"
    crudManager.removeStore("foo");

    // remove store3
    crudManager.removeStore(store3);

     * @param {Object/String/Ext.data.AbstractStore} store The store to remove. Either the store descriptor, store identifier or store itself.
     */
    removeStoreFromApplySequence : function (store) {
        for (var i = 0, l = this.syncApplySequence.length; i < l; i++) {
            var s   = this.syncApplySequence[i];
            if (s === store || s.store === store || s.storeId === store) {
                this.syncApplySequence.splice(i, 1);
                break;
            }
        }
    },


    onStoreChange : function () {
        if (this.ignoreUpdates) return;

        var me  = this;

        /**
         * @event haschanges
         * Fires when some of registered stores records gets changed.

        crudManager.on('haschanges', function (crud) {
            // enable persist changes button when some store gets changed
            saveButton.enable();
        });

         * @param {Sch.crud.AbstractManager} crudManager The CRUD manager.
         */
        this.fireEvent('haschanges', this);

        if (this.autoSync) {
            // add deferred call if it's not scheduled yet
            if (!this.autoSyncTimerId) {
                this.autoSyncTimerId    = setTimeout(function() {
                    me.autoSyncTimerId  = null;
                    me.sync();
                }, this.autoSyncTimeout);
            }
        }
    },

    /**
     * Returns `true` if any of registered stores (or some particular store) has non persisted changes.

    // if we have any unsaved changes
    if (crudManager.hasChanges()) {
        // persist them
        crudManager.sync();
    // otherwise
    } else {
        alert("There are no unsaved changes...");
    }

     * @param {String/Ext.data.AbstractStore} [storeId] The store identifier or store instance to check changes for.
     * If not specified then will check changes for all of the registered stores.
     * @returns {Boolean} `true` if there are not persisted changes.
     */
    hasChanges : function (storeId) {
        var store;

        if (storeId) {
            store   = this.getStore(storeId);
            if (!store) return;

            return Boolean(store.store.getModifiedRecords() || store.store.getRemovedRecords());
        }

        for (var i = 0, l = this.stores.length; i < l; i++) {
            store   = this.stores[i].store;
            if (store.getModifiedRecords() || store.getRemovedRecords()) return true;
        }

        return false;
    },


    getLoadPackage : function (options) {
        var pack    = {
            type        : 'load',
            requestId   : this.getRequestId(),
            stores      : []
        };

        var stores      = this.stores,
            packStores  = pack.stores;

        for (var i = 0, l = stores.length; i < l; i++) {

            var store       = stores[i],
                opts        = options && options[store.storeId],
                pageSize    = store.pageSize || store.store.pageSize;

            if (opts || pageSize) {

                var params  = Ext.apply({
                    storeId     : store.storeId,
                    page        : 1,
                    pageSize    : pageSize
                }, opts);

                stores[i].currentPage   = params.page;

                packStores.push(params);

            } else {

                packStores.push(store.storeId);

            }
        }

        return pack;
    },

    prepareAdded : function (list, phantomIdField, stores) {
        var result  = [];

        for (var i = 0, l = list.length; i < l; i++) {
            var record  = list[i],
                data    = {},
                fields  = record.fields.items;

            if (!data.hasOwnProperty(phantomIdField)) {
                data[phantomIdField]    = record.internalId;
            }

            for (var f = 0, fLen = fields.length; f < fLen; f++) {
                var field   = fields[f];

                if (field.persist && record.data.hasOwnProperty(field.name)) {
                    if (field.serialize) {
                        data[field.name]    = field.serialize(record.data[field.name], record);
                    } else {
                        data[field.name]    = record.data[field.name];
                    }
                }
            }

            // if the store has embedded ones
            if (stores) {
                this.processSubStores(record, data, stores);
            }

            result.push(data);
        }

        return result;
    },

    prepareUpdated : function (list, stores) {
        var result  = [], data, record;

        for (var i = 0, l = list.length; i < l; i++) {
            record      = list[i];
            data        = record.getChanges();
            data[record.idProperty] = record.getId();

            // HACK: tough fix for ExtJS bug when `parentId` field doesn't get into
            // getChanges() results
            var parentId    = record.fields.getByKey('parentId');
            if (parentId && parentId.persist && !data.hasOwnProperty('parentId')) {
                data.parentId   = record.data.parentId;
            }
            // .. and the same magic for `index` field
            var index       = record.fields.getByKey('index');
            if (index && index.persist && !data.hasOwnProperty('index')) {
                data.index  = record.data.index;
            }

            // process fields to get rid of non-persistable ones
            // and use "serialize" when it's presented
            for (var f in data) {
                var field   = record.fields.get(f);

                if (!field.persist) {
                    delete data[f];

                } else if (field.serialize) {
                    data[f]    = field.serialize(data[f], record);
                }
            }

            // if the store has embedded ones
            if (stores) {
                this.processSubStores(record, data, stores);
            }

            result.push(data);
        }

        return result;
    },

    prepareRemoved : function (list) {
        var result  = [], data;

        for (var i = 0, l = list.length; i < l; i++) {
            data    = {};
            data[list[i].idProperty] = list[i].getId();

            result.push(data);
        }

        return result;
    },

    processSubStores : function (record, data, stores) {
        for (var j = 0, n = stores.length; j < n; j++) {
            var id      = stores[j].storeId,
                store   = record.get(id);
            // if embedded store is assigned to the record
            if (store) {
                // let's collect its changes as well
                var changes     = this.getStoreChanges(Ext.apply({ store : store }, stores[j]));

                if (changes) {
                    data[id]    = Ext.apply(changes, { $store : true });
                } else {
                    delete data[id];
                }
            } else {
                delete data[id];
            }
        }
    },

    getStoreChanges : function (store, phantomIdField) {

        phantomIdField  = phantomIdField || store.phantomIdField || this.phantomIdField;

        var s           = store.store,
            added       = s.getNewRecords(),
            updated     = s.getUpdatedRecords(),
            removed     = s.getRemovedRecords(),
            // sub-stores
            stores      = store.stores;

        var result;

        if (added.length) added       = this.prepareAdded(added, phantomIdField, stores);
        if (updated.length) updated   = this.prepareUpdated(updated, stores);
        if (removed.length) removed   = this.prepareRemoved(removed);

        // if this store has changes
        if (added.length || updated.length || removed.length) {

            result  = {};

            if (added.length) result.added       = added;
            if (updated.length) result.updated   = updated;
            if (removed.length) result.removed   = removed;
        }

        return result;
    },


    getChangeSetPackage : function () {
        var pack    = {
            type        : 'sync',
            requestId   : this.getRequestId(),
            revision    : this.revision
        };

        var stores  = this.stores,
            found   = 0;

        for (var i = 0, l = stores.length; i < l; i++) {
            var store           = stores[i],
                phantomIdField  = store.phantomIdField || this.phantomIdField,
                storeId         = store.storeId;

            var changes = this.getStoreChanges(store, phantomIdField);
            if (changes) {
                found++;

                pack[storeId]   = changes;
            }
        }

        return found ? pack : null;
    },


    getSubStoresData : function (rows, subStores, idProperty, isTree) {
        if (!rows) return;

        var result = [];

        var processRow  = function (row, subStores) {
            for (var j = 0, m = subStores.length; j < m; j++) {
                var storeId = subStores[j].storeId;
                // if row contains data for this sub-store
                if (row[storeId]) {
                    // keep them for the later loading
                    result.push({
                        id          : row[idProperty],
                        storeDesc   : subStores[j],
                        data        : row[storeId]
                    });
                    // and remove reference from the row
                    delete row[storeId];
                }
            }
        };

        var i = 0, l = rows.length;

        // if it's a TreeStore
        if (isTree) {
            // loop over nodes
            for (; i < l; i++) {
                processRow(rows[i], subStores);

                // also let's grab sub-stores from node children
                var childrenSubData = this.getSubStoresData(rows[i].children, subStores, idProperty, true);
                if (childrenSubData) {
                    result  = result.concat(childrenSubData);
                }
            }
        // if it's a "flat" store
        } else {
            for (; i < l; i++) processRow(rows[i], subStores);
        }

        return result;
    },


    loadDataToStore : function (storeDesc, data) {
        var store       = storeDesc.store,
            // nested stores list
            subStores   = storeDesc.stores,
            idProperty  = storeDesc.idProperty || 'id',
            isTree      = store instanceof Ext.data.TreeStore,
            subData;

        var rows        = data && data.rows;

        // apply server provided meta data to the store
        store.metaData  = data && data.metaData;

        if (rows) {
            if (subStores) subData  = this.getSubStoresData(rows, subStores, idProperty, isTree);

            store.__loading         = true;

            if (isTree) {
                store.proxy.data    = rows;
                store.load();
            } else {
                store.totalCount    = data.total;
                store.currentPage   = storeDesc.currentPage;
                store.loadData(rows);

                store.fireEvent('load', store, store.getRange(), true);
            }

            if (subData) {
                // load sub-stores as well (if we have them)
                for (var i = 0, l = subData.length; i < l; i++) {
                    var subDatum  = subData[i];

                    this.loadDataToStore(
                        Ext.apply({
                            store   : store[isTree ? 'getNodeById' : 'getById'](subDatum.id).get(subDatum.storeDesc.storeId)
                        }, subDatum.storeDesc),
                        subDatum.data
                    );
                }
            }

            store.__loading         = false;
        }
    },


    loadData : function (response) {
        // we load data to the stores in the order they're kept in this.stores array
        for (var i = 0, l = this.stores.length; i < l; i++) {
            var storeDesc   = this.stores[i],
                data        = response[storeDesc.storeId];

            if (data) this.loadDataToStore(storeDesc, data);
        }
    },


    applyChangesToRecord : function (record, changes, stores) {
        var fields      = record.fields,
            data        = record.data,
            done        = {},
            editStarted = false,
            name;


        // if this store has sub-stores assigned to some fields
        if (stores) {
            // then first we apply changes to that stores
            for (var j = 0, n = stores.length; j < n; j++) {
                name    = stores[j].storeId;

                if (changes.hasOwnProperty(name)) {
                    // remember that we processed this field
                    done[name]  = true;
                    var store   = record.get(name);

                    if (store) {
                        this.applyChangesToStore(Ext.apply({ store : store }, stores[j]), changes[name]);
                    } else {
                        Ext.log("Can't find store for the response sub-package");
                    }
                }
            }
        }

        for (var i = 0, l = fields.getCount(); i < l; i++) {
            name    = fields.getAt(i).name;

            if (changes.hasOwnProperty(name) && !done[name]) {
                var value   = changes[name];

                if (!record.isEqual(data[name], value)) {
                    // we call beginEdit/endEdit only if real changes were applied
                    if (!editStarted) {
                        editStarted     = true;
                        record.beginEdit();
                    }
                    // for the record ID we will use setId() call
                    if (name === record.idProperty) {
                        record.setId(value);
                    } else {
                        record.set(name, value);
                    }
                }
            }
        }

        this.ignoreUpdates++;

        // we call beginEdit/endEdit only if real changes were applied
        if (editStarted) record.endEdit();

        this.ignoreUpdates--;

        record.commit();
    },


    applyChangesToStore : function (store, storeResponse) {
        var j, k, id;

        var phantomIdField  = store.phantomIdField || this.phantomIdField,
            idProperty      = store.idProperty,
            s               = store.store;

        if (!idProperty) {
            var model   = s.getModel && s.getModel() || s.model;
            model       = model && model.prototype;
            idProperty  = model && model.idProperty || 'id';
        }

        var findByKey   = function (id) { return s.data.getByKey(id); },
            findById    = function (id) { return s.getById(id); },
            findNode    = function (id) { return s.getNodeById(id); },
            addRecord, removeRecord;

        var findByPhantomFn, findByIdFn;

        // if it's a tree store
        if (s instanceof Ext.data.TreeStore) {
            findByPhantomFn = findByIdFn = findNode;

            addRecord       = function (data) {
                var parent  = (data.parentId && s.getNodeById(data.parentId)) || s.getRootNode();

                return parent.appendChild(data);
            };

            removeRecord    = function (record) {
                return record.parentNode.removeChild(record);
            };

        // plain store
        } else {
            findByPhantomFn = findByKey;
            findByIdFn      = findById;
            addRecord       = function (data) { return s.add(data)[0]; };
            removeRecord    = function (record) { return s.remove(record); };
        }

        var rows    = storeResponse.rows,
            removed = storeResponse.removed,
            record;

        // process added/updated records
        if (rows) {

            var data, phantomId,
                // sub-stores
                stores  = store.stores;

            for (j = 0, k = rows.length; j < k; j++) {
                data        = rows[j];
                phantomId   = data[phantomIdField];
                id          = data[idProperty];
                record      = null;

                // if phantomId is provided then we will use it to find added record
                if (phantomId != null) {

                    record  = findByPhantomFn(phantomId);

                // if id is provided then we will use it to find updated record
                } else if (idProperty) {

                    record  = findByIdFn(id);

                }

                if (record) {
                    this.applyChangesToRecord(record, data, stores);
                } else {
                    this.ignoreUpdates++;

                    // create new record in the store
                    record  = addRecord(data);

                    this.ignoreUpdates--;

                    record.commit();
                }
            }
        }

        // process removed records
        if (removed) {
            var done    = false;
            for (j = 0, k = removed.length; j < k; j++) {
                id  = removed[j][idProperty];
                // just find the record in s.removed array and remove it from there
                for (var jj = 0, kk = s.removed.length; jj < kk; jj++) {
                    if (s.removed[jj].getId() == id) {
                        s.removed.splice(jj, 1);
                        done    = true;
                        break;
                    }
                }
            }

            // if removed record isn`t removed on the client side yet
            if (!done) {
                record  = findByIdFn(id);
                if (record) {
                    this.ignoreUpdates++;

                    removeRecord(record);

                    Ext.Array.remove(s.removed, record);

                    this.ignoreUpdates--;
                } else {
                    Ext.log("Can't find record to remove from the response package");
                }
            }
        }
    },


    applyChangeSetResponse : function (response) {
        // we apply received changes to the stores in the order they're kept in either this.syncApplySequence or this.stores array
        var stores  = this.syncApplySequence || this.stores;
        for (var i = 0, l = stores.length; i < l; i++) {
            var storeResponse   = response[stores[i].storeId];

            if (storeResponse) {
                this.applyChangesToStore(stores[i], storeResponse);
            }
        }
    },

    /**
     * Generates unique request identifier.
     * @protected
     * @template
     * @return {Integer} The request identifier.
     */
    getRequestId : function () {
        return Ext.Date.now();
    },


    onLoad : function (rawResponse, responseOptions) {
        var response    = this.decode(rawResponse);

        if (!response || !response.success) {
            /**
             * @event loadfail
             * Fires when {@link #load load request} gets failed.
             * @param {Sch.crud.AbstractManager} crudManager The CRUD manager.
             * @param {Object} response The decoded server response object.
             * @param {Object} responseOptions The response options.
             */
            this.fireEvent('loadfail', this, response, responseOptions);

            this.warn('CrudManager: Load failed, please inspect the server response', rawResponse);
            return response;
        }

        this.revision = response.revision;

        // reset last requested package ID
        this.activeRequests.load   = null;

        /**
         * @event beforeloadapply
         * Fires before loaded data get applied to the stores. Return `false` to prevent data applying.
         * This event can be used for server data preprocessing. To achieve it user can modify the `response` object.
         * @param {Sch.crud.AbstractManager} crudManager The CRUD manager.
         * @param {Object} response The decoded server response object.
         */
        if (this.fireEvent('beforeloadapply', this, response) !== false) {
            this.loadData(response);

            /**
             * @event load
             * Fires on successful {@link #load load request} completion after data gets loaded to the stores.
             * @param {Sch.crud.AbstractManager} crudManager The CRUD manager.
             * @param {Object} response The decoded server response object.
             * @param {Object} responseOptions The server response options.
             */
            this.fireEvent('load', this, response, responseOptions);

            /**
             * @event nochanges
             * Fires after {@link #method-load load} or {@link #method-sync sync} request completion when there is no un-persisted changes.

            crudManager.on('nochanges', function (crud) {
                // disable persist changes button when there is no changes
                saveButton.disable();
            });

             * @param {Sch.crud.AbstractManager} crudManager The CRUD manager.
             */
            this.fireEvent('nochanges', this);
        }

        return response;
    },

    onSync : function (rawResponse, responseOptions) {
        var response    = this.decode(rawResponse);

        if (!response || !response.success) {
            /**
             * @event syncfail
             * Fires when {@link #sync sync request} gets failed.
             * @param {Sch.crud.AbstractManager} crudManager The CRUD manager.
             * @param {Object} response The decoded server response object.
             * @param {Object} responseOptions The response options.
             */
            this.fireEvent('syncfail', this, response, responseOptions);

            this.warn('CrudManager: Sync failed, please inspect the server response', rawResponse);

            return response;
        }

        this.revision = response.revision;

        /**
         * @event beforesyncapply
         * Fires before sync response data get applied to the stores. Return `false` to prevent data applying.
         * This event can be used for server data preprocessing. To achieve it user can modify the `response` object.
         * @param {Sch.crud.AbstractManager} crudManager The CRUD manager.
         * @param {Object} response The decoded server response object.
         */
        if (this.fireEvent('beforesyncapply', this, response) !== false) {
            this.applyChangeSetResponse(response);

            /**
             * @event sync
             * Fires on successful {@link #sync sync request} completion.
             * @param {Sch.crud.AbstractManager} crudManager The CRUD manager.
             * @param {Object} response The decoded server response object.
             * @param {Object} responseOptions The server response options.
             */
            this.fireEvent('sync', this, response, responseOptions);

            if (!this.hasChanges()) {
                this.fireEvent('nochanges', this);
            }
        }

        return response;
    },

    /**
     * Loads data to the stores registered in the crud manager. For example:

        crudManager.load(
            // here are request parameters
            {
                store1 : { page : 3, smth : 'foo' },
                store2 : { page : 2, bar : '!!!' }
            },
            // here is callback
            function () { alert('OMG! It works!') },
            // here is errback
            function (response) { alert('Oops: '+response.message); }
        );

     * ** Note: ** If there is an incomplete load request in progress then system will try to cancel it by {@link #cancelRequest} calling.

     * @param {Object} [parameters] The request parameters. This argument can be omitted like this:

        crudManager.load(
            // here is callback
            function () { alert('OMG! It works!') },
            // here is errback
            function (response) { alert('Oops: '+response.message); }
        );

     * When presented it should be an object where keys are store Ids and values are, in turn, objects
     * of parameters related to the corresponding store. And these parameters will be transferred with a load request.

            {
                store1 : { page : 3, smth : 'foo' },
                store2 : { page : 2, bar : '!!!' }
            },

     * @param {Function} [callback] An optional callback to be started on successful request completion.
     * There is also a {@link #event-load load} event which can be used for load request completion processing.
     * @param {Function} [errback] A callback to be started on request failure.
     * There is also an {@link #loadfail} event which can be used for load request failures processing.
     * @param {Object/Function} [scope] A scope to be used for `callback` and `errback` calls.
     */
    load : function (callback, errback, scope) {
        var options;

        if (typeof callback === 'object') {
            options     = callback;
            callback    = errback;
            errback     = scope;
            scope       = arguments[3];
        }

        var pack    = this.getLoadPackage(options);

        /**
         * @event beforeload
         * Fires before {@link #load load request} is sent. Return `false` to cancel load request.
         * @param {Sch.crud.AbstractManager} crudManager The CRUD manager.
         * @param {Object} request The request object.
         */
        if (this.fireEvent('beforeload', this, pack) !== false) {
            scope   = scope || this;

            // if another load request is in progress let's cancel it
            if (this.activeRequests.load) {
                this.cancelRequest(this.activeRequests.load.desc);

                this.fireEvent('loadcanceled', this, pack);
            }

            this.activeRequests.load = { id : pack.requestId };

            this.activeRequests.load.desc = this.sendRequest({
                data        : this.encode(pack),
                type        : 'load',
                success     : function (rawResponse, responseOptions) {
                    var response = this.onLoad(rawResponse, responseOptions);

                    if (errback && (!response || !response.success)) {
                        errback.call(scope, response, rawResponse);

                    } else if (callback) {
                        callback.call(scope, response, rawResponse);
                    }
                },
                failure     : function (rawResponse, responseOptions) {
                    this.onLoad(rawResponse, responseOptions);

                    if (errback) errback.apply(scope, arguments);

                    // reset last requested package ID
                    this.activeRequests.sync = null;
                },
                scope       : this
            });
        // if loading was canceled let's fire event
        } else {
            /**
             * @event loadcanceled
             * Fired after {@link #load load request} was canceled by some {@link #beforeload} listener
             * or due to incomplete prior load request.
             * @param {Sch.crud.AbstractManager} crudManager The CRUD manager.
             * @param {Object} request The request object.
             */
            this.fireEvent('loadcanceled', this, pack);
        }
    },

    /**
     * Persists changes made on the registered stores to the server.
     * Request runs asynchronously so if user need to execute some code after request completion it has to be provided in the `callback` function:
     *
     *      // persist and run a callback on request completion
     *      sync(function(){ alert("Changes saved..."); }, function(response){ alert("Error: "+response.message); });
     *
     * ** Note: ** If there is an incomplete sync request in progress then system will queue the call and delay it until previous request completion.
     * In this case {@link #syncdelayed} event will be fired.
     *
     * ** Note: ** Please take a look at {@link #autoSync} config. This option allows to persist changes automatically after any data modification.
     *
     * @param {Function} [callback] A function to start on successful request completion.
     * There is also a {@link #event-sync sync} event which can be used for sync request completion processing.
     *
     * **Note:** If there is no changes to persist then callback will be started immediately without sending any request
     * and {@link #event-sync sync} event will not be fired.
     * @param {Function} [errback] A function to start on request failure.
     * There is also an {@link #syncfail} event which can be used for sync request failures processing.
     * @param {Object} [scope] A scope for above `callback` and `errback` functions.
     */
    sync : function (callback, errback, scope) {
        if (this.activeRequests.sync) {
            // let's delay this call and start it only after server response
            this.delayedSyncs.push(arguments);

            /**
             * @event syncdelayed
             * Fires after {@link #sync sync request} was delayed due to incomplete previous one.
             * @param {Sch.crud.AbstractManager} crudManager The CRUD manager.
             * @param {Object} arguments The arguments of {@link #sync} call.
             */
            this.fireEvent('syncdelayed', this, arguments);

            return;
        }

        // get current changes set package
        var pack    = this.getChangeSetPackage();

        scope       = scope || this;

        // if no data to persist we run callback and exit
        if (!pack) {
            if (callback) callback.call(scope, null, null);

            return;
        }

        /**
         * @event beforesync
         * Fires before {@link #sync sync request} is sent. Return `false` to cancel sync request.

        crudManager.on('beforesync', function() {
            // cannot persist changes before at least one record is added
            // to the `someStore` store
            if (!someStore.getCount()) return false;
        });

         * @param {Sch.crud.AbstractManager} crudManager The CRUD manager.
         * @param {Object} request The request object.
         */
        if (this.fireEvent('beforesync', this, pack) === false) {
            // if this sync was canceled let's fire event about it
            /**
             * @event synccanceled
             * Fires after {@link #sync sync request} was canceled by some {@link #beforesync} listener.
             * @param {Sch.crud.AbstractManager} crudManager The CRUD manager.
             * @param {Object} request The request object.
             */
            this.fireEvent('synccanceled', this, pack);

            return;
        }

        // keep active reaqest Id
        this.activeRequests.sync = { id : pack.requestId };

        // send sync package
        this.activeRequests.sync.desc = this.sendRequest({
            data        : this.encode(pack),
            type        : 'sync',
            success     : function (rawResponse, options) {
                var response    = this.onSync(rawResponse, options);
                var request     = this.activeRequests.sync;

                // reset last requested package descriptor
                this.activeRequests.sync = null;

                if (errback && (!response || !response.success)) {
                    errback.call(scope, response, rawResponse, request);

                } else if (callback) {
                    callback.call(scope, response, rawResponse, request);
                }

                // execute delayed sync() call
                this.runDelayedSync();
            },
            failure     :  function (rawResponse, options) {
                this.onSync(rawResponse, options);

                if (errback) errback.apply(scope, arguments);

                // reset last requested package ID
                this.activeRequests.sync = null;

                // execute delayed sync() call
                this.runDelayedSync();
            },
            scope       : this
        });
    },


    runDelayedSync : function () {
        var args  = this.delayedSyncs.shift();
        if (!args) return;

        this.sync.apply(this, args);
    },

    /**
     * Commits all records changes of all the registered stores.
     */
    commit : function () {
        for (var i = 0, l = this.stores.length; i < l; i++) {
            this.stores[i].store.commitChanges();
        }
    },

    /**
     * Rejects all records changes on all stores and re-insert any records that were removed locally. Any phantom records will be removed.
     */
    reject : function () {
        for (var i = 0, l = this.stores.length; i < l; i++) {
            this.stores[i].store.rejectChanges();
        }
    },

    warn : function() {
        if ('console' in window) {
            var c = console;
            c.log && c.log.apply && c.log.apply(c, arguments);
        }
    },

    // Used to help the UI know if the manager is already working and a loadmask should be shown when a consuming UI panel is created.
    isLoading               : function() {
        return !!this.activeRequests.load;
    }
});
