/*

Ext Scheduler 2.5.2
Copyright(c) 2009-2014 Bryntum AB
http://bryntum.com/contact
http://bryntum.com/license

*/
/**
@class Sch.selection.EventModel
@extends Ext.selection.Model

This class provides the basic implementation event selection in a grid.

*/
Ext.define("Sch.selection.EventModel", {
    extend      : 'Ext.selection.Model',

    alias       : 'selection.eventmodel',

    requires    : [ 'Ext.util.KeyNav' ],

    /**
     * @cfg {Boolean} deselectOnContainerClick `True` to deselect all events when user clicks on the underlying space in scheduler. Defaults to `true`.
     */
    deselectOnContainerClick : true,

    // Stores selected record on mousedown event to avoid 
    // unselecting record on click
    selectedOnMouseDown : false,

    onVetoUIEvent : Ext.emptyFn, // Some bug in Ext JS 4.2.1 - should be removed later

    /**
     * @event beforedeselect
     * Fired before a record is deselected. If any listener returns false, the
     * deselection is cancelled.
     * @param {Sch.selection.EventModel} this
     * @param {Sch.model.Event} record The selected event
     */

    /**
     * @event beforeselect
     * Fired before a record is selected. If any listener returns false, the
     * selection is cancelled.
     * @param {Sch.selection.EventModel} this
     * @param {Sch.model.Event} record The selected event
     */

    /**
     * @event deselect
     * Fired after a record is deselected
     * @param {Sch.selection.EventModel} this
     * @param {Sch.model.Event} record The selected event
     */

    /**
     * @event select
     * Fired after a record is selected
     * @param {Sch.selection.EventModel} this
     * @param {Sch.model.Event} record The selected event
     */

    bindComponent: function(view) {
        var me = this,
            eventListeners = {
                refresh : me.refresh,
                scope   : me
            };

        me.view = view;
        
        var eventStore = view.eventStore;
        var resourceStore = view.resourceStore;
        
        me.bindStore(eventStore);
        
        // events are redrawn on 'refresh' event, so we have to clear selection at this point
        resourceStore.on('beforeload', me.clearSelectionOnRefresh, me);
        eventStore.on('beforeload', me.clearSelectionOnRefresh, me);

        view.on({
            eventclick     : me.onEventClick,
            eventmousedown : me.onEventMouseDown,
            itemmousedown  : me.onItemMouseDown,
            scope          : this
        });

        view.on(eventListeners);
    },
    
    destroy : function () {
        var me = this;
        
        me.view.resourceStore.un('beforeload', me.clearSelectionOnRefresh, me);
        me.view.eventStore.un('beforeload', me.clearSelectionOnRefresh, me);
        
        me.callParent(arguments);
    },
    
    
    // #1555 - Drag&drop of multiple events works incorrectly at second time
    // There is a bug in extjs version 4.2.2 and less - when store is loaded, selection model contains unbound records.
    // We decided to clear selection after store is loaded.
    // http://www.sencha.com/forum/showthread.php?290474-Selected-records-are-unbound-of-store-after-store-is-refreshed&p=1061396
    clearSelectionOnRefresh    : function () {
        this.clearSelections();
    },


    // @OVERRIDE: Need to override this since the view calls this on 'reconfigure', which could end up being the timeAxis in vertical
    // or the resourceStore when switching back to horizontal
    bindStore : function(store) {

        if (store && !store.isEventStore) return;

        this.callParent(arguments);
    },


    onEventMouseDown: function(view, record, e) {
        // Reset previously stored records
        this.selectedOnMouseDown = null;
        
        // Change selection before dragging to avoid moving of unselected events
        if (!this.isSelected(record)) {
            this.selectedOnMouseDown = record;
            this.selectWithEvent(record, e);
        }
    },
    
    onEventClick: function(view, record, e) {
        // Don't change selection if record been already selected on mousedown
        if (!this.selectedOnMouseDown) {
            this.selectWithEvent(record, e);
        }
    },

    onItemMouseDown: function() {
        if (this.deselectOnContainerClick) {
            this.deselectAll();
        }
    },

    onSelectChange: function(record, isSelected, suppressEvent, commitFn) {
         var me      = this,
            view   = me.view,
            store   = me.store,
            eventName = isSelected ? 'select' : 'deselect',
            i = 0;

        if ((suppressEvent || me.fireEvent('before' + eventName, me, record)) !== false &&
                commitFn() !== false) {

            if (isSelected) {
                view.onEventSelect(record, suppressEvent);
            } else {
                view.onEventDeselect(record, suppressEvent);
            }

            if (!suppressEvent) {
                me.fireEvent(eventName, me, record);
            }
        }
    },

    // Not supported.
    selectRange : Ext.emptyFn,

    selectNode: function(node, keepExisting, suppressEvent) {
        var r = this.view.resolveEventRecord(node);
        if (r) {
            this.select(r, keepExisting, suppressEvent);
        }
    },

    deselectNode: function(node, keepExisting, suppressEvent) {
        var r = this.view.resolveEventRecord(node);
        if (r) {
            this.deselect(r, suppressEvent);
        }
    },

    // @OVERRIDE - The super class doesn't handle a TreeStore
    storeHasSelected: function(record) {
        var store = this.store;

        if (record.hasId() && store.getByInternalId(record.internalId)) {
            return true;
        }

        // Should not end up here since superclass code isn't adapted for TreeStore in Ext 4.2.1 (4.2.2 works)
        return this.callParent(arguments);
    }
});