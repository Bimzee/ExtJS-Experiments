/*

Ext Scheduler 2.5.2
Copyright(c) 2009-2014 Bryntum AB
http://bryntum.com/contact
http://bryntum.com/license

*/
/**

@class Sch.mixin.SchedulerView

A mixin for {@link Ext.view.View} classes, providing "scheduling" functionality to the consuming view. A consuming class
should have already consumed the {@link Sch.mixin.TimelineView} mixin.

Generally, should not be used directly, if you need to subclass the view, subclass the {@link Sch.view.SchedulerGridView} instead.

*/
Ext.define('Sch.mixin.SchedulerView', {
    extend : 'Sch.mixin.AbstractSchedulerView',

    mixins: ['Sch.mixin.Localizable'],

    requires: [
        'Sch.tooltip.Tooltip',
        'Sch.feature.DragCreator',
        'Sch.feature.DragDrop',
        'Sch.feature.ResizeZone',
        'Sch.column.Resource',
        'Sch.view.Calendar',
        'Ext.XTemplate'
    ],

    /**
     * @property {Sch.feature.SchedulerDragZone} eventDragZone
     * Accessor to the event dragzone (available only if the drag drop feature is enabled)
     */

    /**
    * @cfg {String} eventResizeHandles Defines which resize handles to use. Possible values: 'none', 'start', 'end', 'both'. Defaults to 'end'
    */
    eventResizeHandles: 'end',

    /**
    * An empty function by default, but provided so that you can perform custom validation on
    * the item being dragged. This function is called during a drag and drop process and also after the drop is made.
    * To control what 'this' points to inside this function, use 
    * {@link Sch.panel.TimelineGridPanel#validatorFnScope} or {@link Sch.panel.TimelineTreePanel#validatorFnScope}.
    * @param {Sch.model.Event[]} dragRecords an array containing the records for the events being dragged
    * @param {Sch.model.Resource} targetResourceRecord the target resource of the the event
    * @param {Date} date The date corresponding to the drag proxy position
    * @param {Number} duration The duration of the item being dragged in milliseconds
    * @param {Event} e The event object
    * @return {Boolean} true if the drop position is valid, else false to prevent a drop
    */
    dndValidatorFn: Ext.emptyFn,

    /**
    * An empty function by default, but provided so that you can perform custom validation on
    * an item being resized. To control what 'this' points to inside this function, use 
    * {@link Sch.panel.TimelineGridPanel#validatorFnScope} or {@link Sch.panel.TimelineTreePanel#validatorFnScope}.
    * @param {Sch.model.Resource} resourceRecord the resource of the row in which the event is located
    * @param {Sch.model.Event} eventRecord the event being resized
    * @param {Date} startDate
    * @param {Date} endDate
    * @param {Event} e The event object
    * @return {Boolean} true if the resize state is valid, else false
    */
    resizeValidatorFn: Ext.emptyFn,

    /**
    * An empty function by default, but provided so that you can perform custom validation on the item being created.
    * To control what 'this' points to inside this function, use 
    * {@link Sch.panel.TimelineGridPanel#validatorFnScope} or {@link Sch.panel.TimelineTreePanel#validatorFnScope}.
    * @param {Sch.model.Resource} resourceRecord the resource for which the event is being created
    * @param {Date} startDate
    * @param {Date} endDate
    * @param {Event} e The event object
    * @return {Boolean} true if the creation event is valid, else false
    */
    createValidatorFn: Ext.emptyFn,

    // Scheduled events: click events --------------------------
    /**
     * @event eventclick
     * Fires when an event is clicked
     * @param {Sch.mixin.SchedulerView} view The scheduler view instance
     * @param {Sch.model.Event} eventRecord The event record of the clicked event
     * @param {Ext.EventObject} e The event object
     */

    /**
     * @event eventmousedown
     * Fires when a mousedown event is detected on a rendered event
     * @param {Sch.mixin.SchedulerView} view The scheduler view instance
     * @param {Sch.model.Event} eventRecord The event record
     * @param {Ext.EventObject} e The event object
     */

    /**
     * @event eventmouseup
     * Fires when a mouseup event is detected on a rendered event
     * @param {Sch.mixin.SchedulerView} view The scheduler view instance
     * @param {Sch.model.Event} eventRecord The event record
     * @param {Ext.EventObject} e The event object
     */

    /**
     * @event eventdblclick
     * Fires when an event is double clicked
     * @param {Sch.mixin.SchedulerView} view The scheduler view instance
     * @param {Sch.model.Event} eventRecord The event record of the clicked event
     * @param {Ext.EventObject} e The event object
     */

    /**
     * @event eventcontextmenu
     * Fires when contextmenu is activated on an event
     * @param {Sch.mixin.SchedulerView} view The scheduler view instance
     * @param {Sch.model.Event} eventRecord The event record of the clicked event
     * @param {Ext.EventObject} e The event object
     */

    /**
     * @event eventmouseenter
     * Fires when the mouse moves over an event
     * @param {Sch.mixin.SchedulerView} view The scheduler view instance
     * @param {Sch.model.Event} eventRecord The event record
     * @param {Ext.EventObject} e The event object
     */
    /**
     * @event eventmouseout
     * Fires when the mouse moves out of an event
     * @param {Sch.mixin.SchedulerView} view The scheduler view instance
     * @param {Sch.model.Event} eventRecord The event record
     * @param {Ext.EventObject} e The event object
     */

    // Resizing events start --------------------------
    /**
     * @event beforeeventresize
     * Fires before a resize starts, return false to stop the execution
     * @param {Sch.mixin.SchedulerView} view The scheduler view instance
     * @param {Sch.model.Event} record The record about to be resized
     * @param {Ext.EventObject} e The event object
     */

    /**
     * @event eventresizestart
     * Fires when resize starts
     * @param {Sch.mixin.SchedulerView} view The scheduler view instance
     * @param {Sch.model.Event} record The event record being resized
     */

    /**
     * @event eventpartialresize
     * Fires during a resize operation and provides information about the current start and end of the resized event
     * @param {Sch.mixin.SchedulerView} view The scheduler view instance
     * @param {Sch.model.Event} record The event record being resized
     * @param {Date} startDate The new start date of the event
     * @param {Date} endDate The new end date of the event
     * @param {Ext.Element} element The proxy element being resized
     */

    /**
     * @event beforeeventresizefinalize
     * Fires before a succesful resize operation is finalized. Return false from a listener function to prevent the finalizing to
     * be done immedieately, giving you a chance to show a confirmation popup before applying the new values.
     * @param {Sch.mixin.SchedulerView} view The scheduler view instance
     * @param {Object} resizeContext An object containing, 'start', 'end', 'newResource' properties.
     * @param {Ext.EventObject} e The event object
     */

    /**
     * @event eventresizeend
     * Fires after a succesful resize operation
     * @param {Mixed} view The scheduler view instance
     * @param {Sch.model.Event} record The updated event record
     */
    // Resizing events end --------------------------

    // Dnd events start --------------------------
    /**
     * @event beforeeventdrag
     * Fires before a dnd operation is initiated, return false to cancel it
     * @param {Sch.mixin.SchedulerView} view The scheduler view instance
     * @param {Sch.model.Event} record The record corresponding to the node that's about to be dragged
     * @param {Ext.EventObject} e The event object
     */

    /**
     * @event eventdragstart
     * Fires when a dnd operation starts
     * @param {Sch.mixin.SchedulerView} scheduler The scheduler object
     * @param {Array} records the records being dragged
     */

    /**
     * @event beforeeventdropfinalize
     * Fires before a succesful drop operation is finalized.
     * @param {Sch.mixin.SchedulerView} view The scheduler view instance
     * @param {Object} dragContext An object containing, 'start', 'end', 'newResource' properties.
     * @param {Ext.EventObject} e The event object
     */

    /**
     * @event eventdrop
     * Fires after a succesful drag and drop operation
     * @param {Sch.mixin.SchedulerView} view The scheduler view instance
     * @param {Sch.model.Event[]} records the affected records (if copies were made, they were not inserted into the store)
     * @param {Boolean} isCopy True if the records were copied instead of moved
     */

    /**
     * @event aftereventdrop
     * Fires when after a drag n drop operation, even when drop was performed on an invalid location
     * @param {Mixed} view The scheduler view instance
     */
    // Dnd events end --------------------------

    // Drag create events start --------------------------
    /**
     * @event beforedragcreate
     * Fires before a drag starts, return false to stop the execution
     * @param {Sch.mixin.SchedulerView} view The scheduler view instance
     * @param {Sch.model.Resource} resource The resource record
     * @param {Date} date The clicked date on the timeaxis
     * @param {Ext.EventObject} e The event object
     */

    /**
     * @event dragcreatestart
     * Fires before a drag starts, return false to stop the execution
     * @param {Sch.mixin.SchedulerView} view The scheduler view instance
     * @param {Ext.Element} el The proxy element
     */

    /**
     * @event beforedragcreatefinalize
     * Fires before a succesful resize operation is finalized. Return false from a listener function to prevent the finalizing to
     * be done immedieately, giving you a chance to show a confirmation popup before applying the new values.
     * @param {Sch.mixin.SchedulerView} view The scheduler view instance
     * @param {Object} createContext An object containing, 'start', 'end', 'resourceRecord' properties.
     * @param {Ext.EventObject} e The event object
     * @param {Ext.Element} el The proxy element
     */

    /**
     * @event dragcreateend
     * Fires after a successful drag-create operation
     * @param {Sch.mixin.SchedulerView} view The scheduler view instance
     * @param {Sch.model.Event} newEventRecord The newly created event record (added to the store in onEventCreated method)
     * @param {Sch.model.Resource} resource The resource record to which the event belongs
     * @param {Ext.EventObject} e The event object
     * @param {Ext.Element} el The proxy element
     */

    /**
     * @event afterdragcreate
     * Always fires after a drag-create operation
     * @param {Sch.mixin.SchedulerView} view The scheduler view instance
     * @param {Ext.Element} el The proxy element
     */
    // Drag create events end --------------------------

    /**
     * @event beforeeventadd
     * Fires after a successful drag-create operation, before the new event is added to the store. Return false to prevent the event from being added to the store.
     * @param {Sch.mixin.SchedulerView} view The scheduler view instance
     * @param {Sch.model.Event} newEventRecord The newly created event record
     */

    /**
     * @event scheduleclick
     * Fires after a click on the schedule area
     * @param {Sch.mixin.SchedulerView} schedulerView The scheduler view object
     * @param {Date} clickedDate The clicked date
     * @param {Number} rowIndex The row index
     * @param {Sch.model.Resource} resource The resource, an event occured on
     * @param {Ext.EventObject} e The event object
     */

    /**
     * @event scheduledblclick
     * Fires after a doubleclick on the schedule area
     * @param {Sch.mixin.SchedulerView} schedulerView The scheduler view object
     * @param {Date} clickedDate The clicked date
     * @param {Number} rowIndex The row index
     * @param {Sch.model.Resource} resource The resource, an event occured on
     * @param {Ext.EventObject} e The event object
     */

    /**
     * @event schedulecontextmenu
     * Fires after a context menu click on the schedule area
     * @param {Sch.mixin.SchedulerView} schedulerView The scheduler view object
     * @param {Date} clickedDate The clicked date
     * @param {Number} rowIndex The row index
     * @param {Sch.model.Resource} resource The resource, an event occured on
     * @param {Ext.EventObject} e The event object
     */

    /**
     * @cfg {Object} l10n
     * A object, purposed for the class localization. Contains the following keys/values:

     - loadingText : 'Loading events...'
     */

    calendarViewClass       : 'Sch.view.Calendar',

    _initializeSchedulerView : function() {
        this.callParent(arguments);

        this.on({
            destroy     : this._destroy,
            afterrender : this._afterRender,
            itemupdate  : this.onRowUpdated,
            scope       : this
        });

        var me = this;

        if (!this.eventPrefix) {
            throw 'eventPrefix missing';
        }

        if (Ext.isArray(me.eventTpl)) {
            var clone       = Ext.Array.clone(me.eventTpl),
                resizeTpl   = '<div class="sch-resizable-handle sch-resizable-handle-{0}"></div>';
                
            var eventResizeHandles  = this.eventResizeHandles;

            if (eventResizeHandles === 'start' || eventResizeHandles === 'both') {
                clone.splice(2, 0, Ext.String.format(resizeTpl, 'start'));
            }
            if (eventResizeHandles === 'end' || eventResizeHandles === 'both') {
                clone.splice(2, 0, Ext.String.format(resizeTpl, 'end'));
            }

            me.eventTpl     = new Ext.XTemplate(clone.join('').replace('{{evt-prefix}}', this.eventPrefix));
        }
    },

    inheritables: function () {
        return {

            // Configuring underlying grid view
            loadingText :   this.L('loadingText'),
            overItemCls :   '',
            trackOver   :   false,

            // EOF: Configuring underlying grid view

            setReadOnly: function (readOnly) {
                if (this.dragCreator) {
                    this.dragCreator.setDisabled(readOnly);
                }
                this.callParent(arguments);
            },

            repaintEventsForResource : function(resourceRecord, refreshSelections) {
                // For vertical, we always repaint all events (do per-column repaint is not supported)
                var index = this.mode === 'horizontal' ? this.indexOf(resourceRecord) : 0;

                if (this.mode === 'horizontal') {
                    this.eventLayout.horizontal.clearCache(resourceRecord);
                }

                if (index >= 0) {
                    this.refreshNode(index);
                    this.lockingPartner.refreshNode(index);

                    if (refreshSelections) {
                        var selModel = this.getSelectionModel();
                        var events = resourceRecord.getEvents();

                        Ext.each(events, function(ev) {
                            if (selModel.isSelected(ev)) {
                               this.onEventSelect(ev, true);
                            }
                        }, this);
                    }
                }
            },

            repaintAllEvents : function() {
                if (this.mode === 'horizontal') {
                    this.refresh();
                } else {
                    // All events are rendered in first row, no need to do a full refresh
                    this.refreshNode(0);
                }
            },


            handleScheduleEvent : function(e) {
                var te = e.getTarget('.' + this.eventCls, 3),
                    t  = !te && e.getTarget('.' + this.timeCellCls, 3);

                if (t) {
                    var clickedDate     = this.getDateFromDomEvent(e, 'floor');
                    var resourceNode    = this.findRowByChild(t);
                    var index           = this.indexOf(resourceNode);

                    var resource;

                    if (this.mode == 'horizontal') {
                        resource        = this.getRecordForRowNode(resourceNode);
                    } else {
                        var cellNode    = e.getTarget(this.timeCellSelector, 5);

                        if (cellNode) {
                            var cellIndex   = typeof cellNode.cellIndex == 'number' ? cellNode.cellIndex : cellNode.getAttribute('data-cellIndex');
                            var header      = this.headerCt.getGridColumns()[ cellIndex ];

                            resource        = header && header.model;
                        }
                    }

                    this.fireEvent('schedule' + e.type, this, clickedDate, index, resource, e);
                }
            },


            onEventDataRefresh: function () {
                this.clearRowHeightCache();
                this.callParent(arguments);
            },


            onUnbindStore: function(store) {
                store.un({
                    refresh     : this.clearRowHeightCache,
                    clear       : this.clearRowHeightCache,
                    load        : this.clearRowHeightCache,

                    scope       : this
                });
                this.callParent(arguments);
            },

            // our listeners must go before any other listeners, that's why we override the 'bindStore'
            // instead of `onBindStore`
            bindStore: function (store) {
                store && store.on({
                    refresh     : this.clearRowHeightCache,
                    clear       : this.clearRowHeightCache,
                    load        : this.clearRowHeightCache,

                    scope       : this
                });
                this.callParent(arguments);
            }
        };
    },


    _afterRender: function () {
        this.bindEventStore(this.eventStore, true);

        this.setupEventListeners();

        this.configureFunctionality();

        var resizer = this.headerCt.resizer;

        if (resizer) {
            resizer.doResize = Ext.Function.createSequence(resizer.doResize, this.afterHeaderResized, this);
        }
    },

    // private, clean up
    _destroy: function () {
        this.bindEventStore(null);
    },


    clearRowHeightCache : function () {
        if (this.mode === 'horizontal') {
            this.eventLayout.horizontal.clearCache();
        }
    },


    configureFunctionality: function () {
        var vfScope = this.validatorFnScope || this;

        if (this.eventResizeHandles !== 'none' && Sch.feature.ResizeZone) {
            this.resizePlug = new Sch.feature.ResizeZone(Ext.applyIf({
                schedulerView: this,

                validatorFn: function (resourceRecord, eventRecord, startDate, endDate) {
                    return (this.allowOverlap || this.isDateRangeAvailable(startDate, endDate, eventRecord, resourceRecord)) &&
                            this.resizeValidatorFn.apply(vfScope, arguments) !== false;
                },

                validatorFnScope: this
            }, this.resizeConfig || {}));
        }

        if (this.enableEventDragDrop !== false && Sch.feature.DragDrop) {

            this.dragdropPlug = new Sch.feature.DragDrop(this, {
                validatorFn: function (dragRecords, targetResourceRecord, date, duration) {
                    return (this.allowOverlap || this.isDateRangeAvailable(date, Sch.util.Date.add(date, Sch.util.Date.MILLI, duration), dragRecords[0], targetResourceRecord)) &&
                            this.dndValidatorFn.apply(vfScope, arguments) !== false;
                },

                validatorFnScope: this,

                dragConfig: this.dragConfig || {}
            });
        }

        if (this.enableDragCreation !== false && Sch.feature.DragCreator) {
            this.dragCreator = new Sch.feature.DragCreator(Ext.applyIf({
                schedulerView: this,
                disabled: this.readOnly,
                validatorFn: function (resourceRecord, startDate, endDate) {
                    return (this.allowOverlap || this.isDateRangeAvailable(startDate, endDate, null, resourceRecord)) &&
                            this.createValidatorFn.apply(vfScope, arguments) !== false;
                },
                validatorFnScope: this
            }, this.createConfig || {}));
        }
    },

    // ---------------------------------------
    // Interaction listeners

    onBeforeDragDrop: function (s, rec, e) {
        return !this.readOnly && !e.getTarget().className.match('sch-resizable-handle');
    },

    onDragDropStart: function () {
        if (this.dragCreator) {
            this.dragCreator.setDisabled(true);
        }

        if (this.tip) {
            this.tip.hide();
            this.tip.disable();
        }

        if (this.overScheduledEventClass) {
            this.setMouseOverEnabled(false);
        }
    },

    onDragDropEnd: function () {
        if (this.dragCreator) {
            this.dragCreator.setDisabled(false);
        }

        if (this.tip) {
            this.tip.enable();
        }

        if (this.overScheduledEventClass) {
            this.setMouseOverEnabled(true);
        }
    },

    onBeforeDragCreate: function (s, resourceRecord, date, e) {
        return !this.readOnly && !e.ctrlKey;
    },

    onDragCreateStart: function () {
        if (this.overScheduledEventClass) {
            this.setMouseOverEnabled(false);
        }

        if (this.tip) {
            this.tip.hide();
            this.tip.disable();
        }
    },

    onDragCreateEnd: function (s, newEventRecord) {
        // If an event editor is defined, it has to manage how/if/when the event is added to the event store
        if (!this.getEventEditor()) {
            if (this.fireEvent('beforeeventadd', this, newEventRecord) !== false) {
                this.onEventCreated(newEventRecord);
                this.eventStore.append(newEventRecord);
            }
            this.dragCreator.getProxy().hide();
        }

        if (this.overScheduledEventClass) {
            this.setMouseOverEnabled(true);
        }
    },

    // Empty but provided so that you can override it to supply default record values etc.
    onEventCreated: function (newEventRecord) {
    },

    onAfterDragCreate: function () {
        if (this.overScheduledEventClass) {
            this.setMouseOverEnabled(true);
        }

        if (this.tip) {
            this.tip.enable();
        }
    },

    onBeforeResize: function () {
        return !this.readOnly;
    },

    onResizeStart: function () {
        if (this.tip) {
            this.tip.hide();
            this.tip.disable();
        }

        if (this.dragCreator) {
            this.dragCreator.setDisabled(true);
        }
    },

    onResizeEnd: function () {
        if (this.tip) {
            this.tip.enable();
        }

        if (this.dragCreator) {
            this.dragCreator.setDisabled(false);
        }
    },

    // EOF Interaction listeners
    // ---------------------------------------


    setupEventListeners: function () {
        this.on({
            beforeeventdrag     : this.onBeforeDragDrop,
            eventdragstart      : this.onDragDropStart,
            aftereventdrop      : this.onDragDropEnd,

            beforedragcreate    : this.onBeforeDragCreate,
            dragcreatestart     : this.onDragCreateStart,
            dragcreateend       : this.onDragCreateEnd,
            afterdragcreate     : this.onAfterDragCreate,

            beforeeventresize   : this.onBeforeResize,
            eventresizestart    : this.onResizeStart,
            eventresizeend      : this.onResizeEnd,

            scope               : this
        });
    },

    afterHeaderResized: function () {
        var resizer = this.headerCt.resizer;

        // if we perform resize on panel with forceFit cfg set to true events will be sized incorrectly
        if (resizer && this.getMode() !== 'horizontal') {
            // if forceFit is enabled columns cannot be resized
            if (this.panel.forceFit) {
                this.setColumnWidth(resizer.origWidth);
            } else {
                var w = resizer.dragHd.getWidth();            
                this.setColumnWidth(w);
            }
        }
    },

    columnRenderer: function (val, meta, record, row, col) {
        return this[this.mode].columnRenderer(val, meta, record, row, col);
    },

    onRowUpdated : function(resourceRecord) {

        // Only relevant for horizontal mode
        if (this.getMode() === 'horizontal') {

            if (this.hasListener('eventrepaint')) {
                Ext.each(resourceRecord.getEvents(this.eventStore), function(event) {
                    var node = this.getEventNodeByRecord(event);

                    if (node) {
                        this.fireEvent('eventrepaint', this, event, node);
                    }
                }, this);
            }
        }
    }
});
