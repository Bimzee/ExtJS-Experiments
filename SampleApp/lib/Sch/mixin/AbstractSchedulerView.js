/*

Ext Scheduler 2.5.2
Copyright(c) 2009-2014 Bryntum AB
http://bryntum.com/contact
http://bryntum.com/license

*/
/**

@class Sch.mixin.AbstractSchedulerView
@private

A mixin for {@link Ext.view.View} classes, providing "scheduling" functionality to the consuming view. A consuming class
should have already consumed the {@link Sch.mixin.TimelineView} mixin.

Generally, should not be used directly, if you need to subclass the view, subclass the {@link Sch.view.SchedulerGridView} instead.

*/
Ext.define('Sch.mixin.AbstractSchedulerView', {
    requires                : [
        'Sch.eventlayout.Horizontal',
        'Sch.view.Vertical',
        'Sch.eventlayout.Vertical'
    ],

    _cmpCls                 : 'sch-schedulerview',
    scheduledEventName      : 'event',

    /**
    * @cfg {Number} barMargin
    * Controls how much space to leave between the event bars and the row borders.
    */
    barMargin               : 1,

    /**
    * @cfg {Boolean} constrainDragToResource Set to true to only allow dragging events within the same resource.
    */
    constrainDragToResource : false,

    // Provided by panel
    allowOverlap            : null,
    readOnly                : null,

    altColCls               : 'sch-col-alt',

    /**
    * @cfg {Boolean} dynamicRowHeight
    * True to layout events without overlapping, meaning the row height will be dynamically calculated to fit any overlapping events.
    */
    dynamicRowHeight        : true,

    /**
    * @cfg {Boolean} managedEventSizing
    * True to size events based on the rowHeight and barMargin settings. Set this to false if you want to control height and top properties via CSS instead.
    */
    managedEventSizing      : true,

    /**
    * @cfg {Boolean} eventAnimations
    * True to animate event updates, currently only used in vertical mode in CSS3 enabled browsers.
    */
    eventAnimations         : true,

    /**
     * @cfg {String} horizontalLayoutCls
     * The class name responsible for the horizontal event layout process. Override this to take control over the layout process.
     */
    horizontalLayoutCls     : 'Sch.eventlayout.Horizontal',


    horizontalEventSorterFn     : null,
    /**
     * @cfg {Function} horizontalEventSorterFn
     *
     *  Override this method to provide a custom sort function to sort any overlapping events. By default,
     *  overlapping events are laid out based on the start date. If the start date is equal, events with earlier end date go first.
     *
     *  Here's a sample sort function, sorting on start- and end date. If this function returns -1, then event a is placed above event b.
     *
     horizontalEventSorterFn : function (a, b) {

            var startA = a.getStartDate(), endA = a.getEndDate();
            var startB = b.getStartDate(), endB = b.getEndDate();

            var sameStart = (startA - startB === 0);

            if (sameStart) {
                return endA > endB ? -1 : 1;
            } else {
                return (startA < startB) ? -1 : 1;
            }
        }
     *
     * @param  {Sch.model.Event} a
     * @param  {Sch.model.Event} b
     * @return {Int}
     */

    /**
     * @cfg {String} verticalLayoutCls
     * The class name responsible for the vertical event layout process. Override this to take control over the layout process.
     */

    verticalLayoutCls       : 'Sch.eventlayout.Vertical',

    /**
     * @cfg {Function} verticalEventSorterFn
     * Override this method to provide a custom sort function to sort any overlapping events. By default,
     * overlapping events are laid out based on the start date. If the start date is equal, events with earlier end date go first.
     *
     * If this function returns -1, then event a is placed above event b.
     * See also {@link #horizontalEventSorterFn} for a description.
     * @param {Sch.model.Event} a
     * @param {Sch.model.Event} b
     * @return {Int}
     */

    verticalEventSorterFn     : null,

    eventCls                : 'sch-event',

    verticalViewClass       : 'Sch.view.Vertical',

    eventTpl: [
        '<tpl for=".">',
            '<div unselectable="on" id="{{evt-prefix}}{id}" style="right:{right}px;left:{left}px;top:{top}px;height:{height}px;width:{width}px;{style}" class="sch-event ' + Ext.baseCSSPrefix + 'unselectable {internalCls} {cls}">',
                '<div unselectable="on" class="sch-event-inner {iconCls}">',
                    '{body}',
                '</div>',
            '</div>',
        '</tpl>'
    ],

    eventStore              : null,
    resourceStore           : null,
    eventLayout             : null,

    /**
     * @event eventrepaint
     * Fires after an event has been repainted by the view.
     * @param {Sch.mixin.AbstractSchedulerView} view The view instance
     * @param {Sch.model.Event} event
     * @param {HTMLElement} node The updated DOM representation of the event
     */

    _initializeSchedulerView        : function() {
        var horLayoutCls = Ext.ClassManager.get(this.horizontalLayoutCls);
        var vertLayoutCls = Ext.ClassManager.get(this.verticalLayoutCls);

        this.eventSelector = '.' + this.eventCls;

        this.eventLayout = {};

        var eventLayoutConfig = { view : this, timeAxisViewModel : this.timeAxisViewModel };

        if (horLayoutCls) {

            this.eventLayout.horizontal = new horLayoutCls(
                Ext.apply(
                    {},
                    eventLayoutConfig,
                    this.horizontalEventSorterFn ? { sortEvents: this.horizontalEventSorterFn } : {}
                )
            );
        }

        if (vertLayoutCls) {
            this.eventLayout.vertical = new vertLayoutCls(
                Ext.apply(
                    {},
                    eventLayoutConfig,
                    this.verticalEventSorterFn ? { sortEvents: this.verticalEventSorterFn } : {}
                )
            );
        }

        this.store              = this.store || this.resourceStore;
        this.resourceStore      = this.resourceStore || this.store;
    },

    generateTplData: function (event, resourceRecord, resourceIndex) {
        var renderData = this[this.mode].getEventRenderData(event, resourceRecord, resourceIndex),
            start       = event.getStartDate(),
            end         = event.getEndDate(),
            internalCls = event.getCls() || '';

        internalCls += ' sch-event-resizable-' + event.getResizable();

        if (event.dirty)                    internalCls += ' sch-dirty ';
        if (renderData.endsOutsideView)     internalCls += ' sch-event-endsoutside ';
        if (renderData.startsOutsideView)   internalCls += ' sch-event-startsoutside ';
        if (this.eventBarIconClsField)      internalCls += ' sch-event-withicon ';
        if (event.isDraggable() === false)  internalCls += ' sch-event-fixed ';
        if (end - start === 0)              internalCls += ' sch-event-milestone ';

        // in calendar mode event can be rendered in miltiple columns yet it remains the same
        // to distinguish them we append resource index to element id
        renderData.id          = event.internalId + (this.getMode() === 'calendar' ? ('-' + resourceIndex) : '');
        renderData.internalCls = internalCls;
        renderData.start       = start;
        renderData.end         = end;
        renderData.iconCls     = event.data[this.eventBarIconClsField] || '';
        renderData.event       = event;

        if (this.eventRenderer) {
            // User has specified a renderer fn, either to return a simple string, or an object intended for the eventBodyTemplate
            var value = this.eventRenderer.call(this.eventRendererScope || this, event, resourceRecord, renderData, resourceIndex);
            if (Ext.isObject(value) && this.eventBodyTemplate) {
                renderData.body = this.eventBodyTemplate.apply(value);
            } else {
                renderData.body = value;
            }
        } else if (this.eventBodyTemplate) {
            // User has specified an eventBodyTemplate, but no renderer - just apply the entire event record data.
            renderData.body = this.eventBodyTemplate.apply(event.data);
        } else if (this.eventBarTextField) {
            // User has specified a field in the data model to read from
            renderData.body = event.data[this.eventBarTextField] || '';
        }
        return renderData;
    },

    /**
    * Resolves the resource based on a dom element
    * @param {HtmlElement} node The HTML element
    * @return {Sch.model.Resource} The resource corresponding to the element, or null if not found.
    */
    resolveResource: function (node) {
        return this[this.mode].resolveResource(node);
    },

    /**
    * Gets the Ext.util.Region representing the passed resource and optionally just for a certain date interval.
    * @param {Sch.model.Resource} resourceRecord The resource record
    * @param {Date} startDate A start date constraining the region
    * @param {Date} endDate An end date constraining the region
    * @return {Ext.util.Region} The region of the resource
    */
    getResourceRegion: function (resourceRecord, startDate, endDate) {
        return this[this.mode].getResourceRegion(resourceRecord, startDate, endDate);
    },

    /**
    * <p>Returns the event record for a DOM element </p>
    * @param {HTMLElement/Ext.Element} el The DOM node or Ext Element to lookup
    * @return {Sch.model.Event} The event record
    */
    resolveEventRecord: function (el) {
        // Normalize to DOM node
        el = el.dom ? el.dom : el;

        if (!(Ext.fly(el).hasCls(this.eventCls))) {
            el = Ext.fly(el).up(this.eventSelector);
        }
        
        // in order to follow up with unique id's we append column number to the element's id
        // this code is required to fix event record lookups
        if (this.getMode() === 'calendar') {
            var id = el.id.split('-');
            id.pop();
            return this.getEventRecordFromDomId(id.join('-'));
        } else {
            return this.getEventRecordFromDomId(el.id);
        }
    },

    // DEPRECATED, remove for 3.0
    getResourceByEventRecord: function (eventRecord) {
        return eventRecord.getResource();
    },

    /**
    * <p>Returns the event record for a DOM id </p>
    * @param {String} id The id of the DOM node
    * @return {Sch.model.Event} The event record
    */
    getEventRecordFromDomId: function (id) {
        var trueId = this.getEventIdFromDomNodeId(id);
        return this.eventStore.getByInternalId(trueId);
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
        return this.eventStore.isDateRangeAvailable(start, end, excludeEvent, resource);
    },

    /**
    * Returns events that are (partly or fully) inside the timespan of the current view.
    * @return {Ext.util.MixedCollection} The collection of events
    */
    getEventsInView: function () {
        var viewStart = this.timeAxis.getStart(),
            viewEnd = this.timeAxis.getEnd();

        return this.eventStore.getEventsInTimeSpan(viewStart, viewEnd);
    },

    /**
    * Returns the current set of rendered event nodes
    * @return {Ext.CompositeElement} The collection of event nodes
    */
    getEventNodes: function () {
        return this.getEl().select(this.eventSelector);
    },

    onEventCreated: function (newEventRecord) {
        // Empty but provided so that you can override it to supply default record values etc.
    },

    getEventStore: function () {
        return this.eventStore;
    },

    registerEventEditor: function (editor) {
        this.eventEditor = editor;
    },

    getEventEditor: function () {
        return this.eventEditor;
    },

    // Call mode specific implementation
    onEventUpdate: function (store, model, operation) {
        this[this.mode].onEventUpdate(store, model, operation);
    },

    // Call mode specific implementation
    onEventAdd: function (s, recs) {
        // TreeStore 'insert' and 'append' events pass a single Model instance, not an array
        if (!Ext.isArray(recs)) recs = [recs];

        this[this.mode].onEventAdd(s, recs);
    },

    // Call mode specific implementation
    onAssignmentAdd : function(store, records) {
        var resources = {};

        Ext.Array.each(records, function(assignment) {
            resources[assignment.getResourceId()] = assignment.getResource();
        });

        for (var o in resources) {
            this.repaintEventsForResource(resources[o]);
        }
    },

    onAssignmentUpdate : function(store, assignment) {
        var oldResourceId = assignment.previous && assignment.previous[assignment.resourceIdField];
        var newResourceId = assignment.getResourceId();

        if (oldResourceId) {
            var oldResource = this.resourceStore.getByInternalId(oldResourceId);

            this.repaintEventsForResource(oldResource);
        }

        if (newResourceId) {
            var newResource = this.resourceStore.getByInternalId(newResourceId);

            this.repaintEventsForResource(newResource);
        }
    },

    onAssignmentRemove : function(store, assignment) {
        var resourceId = assignment.getResourceId();
        var resource   = resourceId && this.resourceStore.getByInternalId(resourceId);

        if (resource) {
            this.repaintEventsForResource(resource);
        }
    },

    // Call orientation specific implementation
    onEventRemove: function (s, recs) {
        this[this.mode].onEventRemove(s, recs);
    },

    bindEventStore: function (eventStore, initial) {

        var me = this;
        var listenerCfg = {
            scope       : me,
            refresh     : me.onEventDataRefresh,

            // Sencha Touch
            addrecords      : me.onEventAdd,
            updaterecord    : me.onEventUpdate,
            removerecords   : me.onEventRemove,

            // Ext JS
            add         : me.onEventAdd,
            update      : me.onEventUpdate,
            remove      : me.onEventRemove,

            // If the eventStore is a TreeStore
            insert      : me.onEventAdd,
            append      : me.onEventAdd
        };

        // In case there is an assigment store used (from Ext Gantt)
        var assignmentListenerCfg = {
            scope       : me,
            refresh     : me.onEventDataRefresh,
            load        : me.onEventDataRefresh,
            update      : me.onAssignmentUpdate,
            add         : me.onAssignmentAdd,
            remove      : me.onAssignmentRemove
        };

        // Sencha Touch fires "refresh" when clearing the store. Avoid double repaints
        if (!Ext.versions.touch) {
            listenerCfg.clear = me.onEventDataRefresh;
        }

        if (!initial && me.eventStore) {
            me.eventStore.setResourceStore(null);

            if (eventStore !== me.eventStore && me.eventStore.autoDestroy) {
                me.eventStore.destroy();
            }
            else {
                if (me.mun) {
                    me.mun(me.eventStore, listenerCfg);

                    var oldAssignmentStore = me.eventStore.getAssignmentStore && me.eventStore.getAssignmentStore();

                    if (oldAssignmentStore) {
                        me.mun(oldAssignmentStore, assignmentListenerCfg);
                    }
                } else {
                    me.eventStore.un(listenerCfg);
                }
            }

            if (!eventStore) {
                if (me.loadMask && me.loadMask.bindStore) {
                    me.loadMask.bindStore(null);
                }
                me.eventStore = null;
            }
        }
        if (eventStore) {
            eventStore = Ext.data.StoreManager.lookup(eventStore);

            if (me.mon) {
                me.mon(eventStore, listenerCfg);
            } else {
                eventStore.on(listenerCfg);
            }
            if (me.loadMask && me.loadMask.bindStore) {
                me.loadMask.bindStore(eventStore);
            }

            me.eventStore = eventStore;

            eventStore.setResourceStore(me.resourceStore);

            var assignmentStore = eventStore.getAssignmentStore && eventStore.getAssignmentStore();

            if (assignmentStore) {
                me.mon(assignmentStore, assignmentListenerCfg);
            }
        }

        if (eventStore && !initial) {
            me.refresh();
        }
    },

    onEventDataRefresh: function () {
        this.refreshKeepingScroll();
    },

    // invoked by the selection model to maintain visual UI cues
    onEventSelect: function (record) {
        var nodes = this.getEventNodesByRecord(record);
        if (nodes) {
            nodes.addCls(this.selectedEventCls);
        }
    },

    // invoked by the selection model to maintain visual UI cues
    onEventDeselect: function (record) {
        var nodes = this.getEventNodesByRecord(record);
        if (nodes) {
            nodes.removeCls(this.selectedEventCls);
        }
    },

    refresh : function() {
        throw 'Abstract method call';
    },

    /**
    * Refreshes the events for a single resource
    * @param {Sch.model.Resource} resource
    */
    repaintEventsForResource : function(record) {
        throw 'Abstract method call';
    },

    /**
     * Refreshes all events in the scheduler view
     */
    repaintAllEvents : function() {
        this.refreshKeepingScroll();
    },

    /**
     * Scrolls an event record into the viewport.
     * If the resource store is a tree store, this method will also expand all relevant parent nodes to locate the event.
     *
     * @param {Sch.model.Event} eventRec, the event record to scroll into view
     * @param {Boolean/Object} highlight, either `true/false` or a highlight config object used to highlight the element after scrolling it into view
     * @param {Boolean/Object} animate, either `true/false` or an animation config object used to scroll the element
     */
    scrollEventIntoView: function (eventRec, highlight, animate, callback, scope) {
        scope                   = scope || this;

        var me                  = this;
        
        var basicScroll         = function (el) {
            // HACK
            if (Ext.versions.extjs) {
                // After a time axis change, the header is resized and Ext JS TablePanel reacts to the size change.
                // Ext JS reacts after a short delay, so we cancel this task to prevent Ext from messing up the scroll sync
                me.up('panel').scrollTask.cancel();

                me.scrollElementIntoView(el, me.el, true, animate);
            } else {
                // Sencha Touch doesn't have the scrollChildFly property on Element instances, use a simple scrollIntoView instead
                el.scrollIntoView(me.el, true, animate);
            }

            if (highlight) {
                if (typeof highlight === "boolean") {
                    el.highlight();
                } else {
                    el.highlight(null, highlight);
                }
            }

            // XXX callback will be called too early, need to wait for scroll & highlight to complete
            callback && callback.call(scope);
        };

        // If resource store is a TreeStore, make sure the resource is expanded all the way up first.
        if (Ext.data.TreeStore && this.resourceStore instanceof Ext.data.TreeStore) {
            var resources            = eventRec.getResources(me.eventStore);
            // eventRec could be a Gantt task model, use getResources and just grab the first

            if (resources.length > 0 && !resources[ 0 ].isVisible()) {
                resources[ 0 ].bubble(function (node) { node.expand(); });
            }
        }

        var timeAxis        = this.timeAxis;
        var startDate       = eventRec.getStartDate();
        var endDate         = eventRec.getEndDate();

        // If el is not in the currently viewed time span, change time span
        if (!timeAxis.dateInAxis(startDate) || !timeAxis.dateInAxis(endDate)) {
            var range = timeAxis.getEnd() - timeAxis.getStart();

            timeAxis.setTimeSpan(new Date(startDate.getTime() - range / 2), new Date(endDate.getTime() + range / 2));
        }

        var el              = this.getElementFromEventRecord(eventRec);

        if (el) {
            basicScroll(el);
        } else {
            if (this.bufferedRenderer) {
                var resourceStore          = this.resourceStore;
                var resource               = eventRec.getResource(null, me.eventStore);

                Ext.Function.defer(function () {
                    var index = resourceStore.getIndexInTotalDataset ? resourceStore.getIndexInTotalDataset(resource) : resourceStore.indexOf(resource);

                    this.bufferedRenderer.scrollTo(index, false, function () {
                        // el should be present now
                        var el = me.getElementFromEventRecord(eventRec);

                        if (el) basicScroll(el);
                    });

                }, 10, this);
            }
        }
    }
});
