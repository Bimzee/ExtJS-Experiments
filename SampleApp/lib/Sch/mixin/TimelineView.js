/*

Ext Scheduler 2.5.2
Copyright(c) 2009-2014 Bryntum AB
http://bryntum.com/contact
http://bryntum.com/license

*/
/**
@class Sch.mixin.TimelineView

A base mixin for {@link Ext.view.View} classes, giving to the consuming view the "time line" functionality.
This means that the view will be capable to display a list of "events", ordered on the {@link Sch.data.TimeAxis time axis}.

By itself this mixin is not enough for correct rendering. The class, consuming this mixin, should also consume one of the
{@link Sch.view.Horizontal}, {@link Sch.view.Vertical} or {@link Sch.view.Calendar} mixins, which provides the implementation of some mode-specfic methods.

Generally, should not be used directly, if you need to subclass the view, subclass the {@link Sch.view.SchedulerGridView} instead.

*/
Ext.define("Sch.mixin.TimelineView", {
    extend : 'Sch.mixin.AbstractTimelineView',

    requires : [
        'Ext.tip.ToolTip'
    ],

    /**
    * @cfg {String} overScheduledEventClass
    * A CSS class to apply to each event in the view on mouseover (defaults to 'sch-event-hover').
    */
    overScheduledEventClass: 'sch-event-hover',

    ScheduleEventMap    : {
        click           : 'Click',
        mousedown       : 'MouseDown',
        mouseup         : 'MouseUp',
        dblclick        : 'DblClick',
        contextmenu     : 'ContextMenu',
        keydown         : 'KeyDown',
        keyup           : 'KeyUp'
    },

    // allow the panel to prevent adding the hover CSS class in some cases - during drag drop operations
    preventOverCls      : false,

    /**
     * @event beforetooltipshow
     * Fires before the event tooltip is shown, return false to suppress it.
     * @param {Sch.mixin.SchedulerPanel} scheduler The scheduler object
     * @param {Sch.model.Event} eventRecord The event record corresponding to the rendered event
     */

    /**
     * @event columnwidthchange
     * @private
     * Fires after the column width has changed
     */

    _initializeTimelineView : function() {
        this.callParent(arguments);

        this.on('destroy', this._onDestroy, this);
        this.on('afterrender', this._onAfterRender, this);

        this.setMode(this.mode);

        this.enableBubble('columnwidthchange');

        this.addCls("sch-timelineview");

        if (this.readOnly) {
            this.addCls(this._cmpCls + '-readonly');
        }

        this.addCls(this._cmpCls);

        if (this.eventAnimations) {
            this.addCls('sch-animations-enabled');
        }
    },

    inheritables : function() {
        return {
            // @OVERRIDE
            processUIEvent: function(e){
                var eventBarNode = e.getTarget(this.eventSelector),
                    map = this.ScheduleEventMap,
                    type = e.type,
                    preventViewEvent = false;

                if (eventBarNode && type in map) {
                    this.fireEvent(this.scheduledEventName + type, this, this.resolveEventRecord(eventBarNode), e);

                    // In Scheduler, clicking or interacting with an event should not trigger itemclick or other itemXXX events
                    // In gantt, a rendered bar corresponds to the row, so let view superclass process the event too
                    preventViewEvent = !(this.getSelectionModel() instanceof Ext.selection.RowModel);
                }

                if (!preventViewEvent) {
                    // For gantt, default actions should be executed too
                    return this.callParent(arguments);
                }
            }
        };
    },


    // private, clean up
    _onDestroy: function () {
        if (this.tip) {
            this.tip.destroy();
        }
    },

    _onAfterRender : function () {
        if (this.overScheduledEventClass) {
            this.setMouseOverEnabled(true);
        }

        if (this.tooltipTpl) {
            this.el.on('mousemove', this.setupTooltip, this, { single : true });
        }

        var bufferedRenderer    = this.bufferedRenderer;

        if (bufferedRenderer) {
            this.patchBufferedRenderingPlugin(bufferedRenderer);
            this.patchBufferedRenderingPlugin(this.lockingPartner.bufferedRenderer);
        }

        this.on('bufferedrefresh', this.onBufferedRefresh, this, { buffer : 10 });

        this.setupTimeCellEvents();

        // The `secondaryCanvasEl` needs to be setup early, for the underlying gridview to know about it 
        // and not remove it on later 'refresh' calls.
        var el = this.getSecondaryCanvasEl();

        // Simple smoke check to make sure CSS has been included correctly on the page
        if (el.getStyle('position').toLowerCase() !== 'absolute') {
            var context = Ext.Msg || window;

            context.alert('ERROR: The CSS file for the Bryntum component has not been loaded.');
        }
    },


    patchBufferedRenderingPlugin : function (plugin) {
        var me                      = this;
        var oldSetBodyTop           = plugin.setBodyTop;

        // @OVERRIDE Overriding buffered renderer plugin
        plugin.setBodyTop           = function (bodyTop, calculatedTop) {
            if (bodyTop < 0) bodyTop = 0;

            var val                 = oldSetBodyTop.apply(this, arguments);

            me.fireEvent('bufferedrefresh', this);

            return val;
        };
    },



    onBufferedRefresh : function() {
        this.getSecondaryCanvasEl().dom.style.top = this.body.dom.style.top;
    },

    setMouseOverEnabled : function(enabled) {
        this[enabled ? "mon" : "mun"](this.el, {
            mouseover : this.onEventMouseOver,
            mouseout  : this.onEventMouseOut,
            delegate  : this.eventSelector,
            scope     : this
        });
    },

    // private
    onEventMouseOver: function (e, t) {
        if (t !== this.lastItem && !this.preventOverCls) {
            this.lastItem = t;

            Ext.fly(t).addCls(this.overScheduledEventClass);

            var eventModel      = this.resolveEventRecord(t);

            // do not fire this event if model can not be found
            // this can be the case for "sch-dragcreator-proxy" elements for example
            if (eventModel) this.fireEvent('eventmouseenter', this, eventModel, e);
        }
    },

    // private
    onEventMouseOut: function (e, t) {
        if (this.lastItem) {
            if (!e.within(this.lastItem, true, true)) {
                Ext.fly(this.lastItem).removeCls(this.overScheduledEventClass);
                this.fireEvent('eventmouseleave', this, this.resolveEventRecord(this.lastItem), e);
                delete this.lastItem;
            }
        }
    },

    // Overridden since locked grid can try to highlight items in the unlocked grid while it's loading/empty
    highlightItem: function(item) {
        if (item) {
            var me = this;
            me.clearHighlight();
            me.highlightedItem = item;
            Ext.fly(item).addCls(me.overItemCls);
        }
    },

    // private
    setupTooltip: function () {
        var me = this,
            tipCfg = Ext.apply({
                delegate    : me.eventSelector,
                target      : me.el,
                anchor      : 'b',
                rtl         : me.rtl,

                show : function() {
                    Ext.ToolTip.prototype.show.apply(this, arguments);

                    // Some extra help required to correct alignment (in cases where event is in part outside the scrollable area
                    // https://www.assembla.com/spaces/bryntum/tickets/626#/activity/ticket:
                    if (this.triggerElement && me.getMode() === 'horizontal') {
                        this.setX(this.targetXY[0]-10);
                        this.setY(Ext.fly(this.triggerElement).getY()-this.getHeight()-10);
                    }
                }
            }, me.tipCfg);

        me.tip = new Ext.ToolTip(tipCfg);

        me.tip.on({
            beforeshow: function (tip) {
                if (!tip.triggerElement || !tip.triggerElement.id) {
                    return false;
                }

                var record = this.resolveEventRecord(tip.triggerElement);

                if (!record || this.fireEvent('beforetooltipshow', this, record) === false) {
                    return false;
                }

                tip.update(this.tooltipTpl.apply(this.getDataForTooltipTpl(record)));
            },

            scope: this
        });
    },

    getTimeAxisColumn : function () {
        if (!this.timeAxisColumn) {
            this.timeAxisColumn = this.headerCt.down('timeaxiscolumn');
        }

        return this.timeAxisColumn;
    },

    /**
    * Template method to allow you to easily provide data for your {@link Sch.mixin.TimelinePanel#tooltipTpl} template.
    * @return {Mixed} The data to be applied to your template, typically any object or array.
    */
    getDataForTooltipTpl : function(record) {
        return Ext.apply({
            _record : record
        }, record.data);
    },

    /**
     * Refreshes the view and maintains the scroll position.
     */
    refreshKeepingScroll : function() {

        Ext.suspendLayouts();

        this.saveScrollState();

        this.refresh();

        if (this.up('tablepanel[lockable=true]').lockedGridDependsOnSchedule) {
            this.lockingPartner.refresh();
        }
        
        // we have to resume layouts before scroll in order to let element recieve it's new width after refresh
        Ext.resumeLayouts(true);
        
        // If el is not scrolled, skip setting scroll state (can be a costly DOM operation)
        // This speeds up initial rendering
        // HACK: reading private scrollState property in Ext JS superclass
        // infinite scroll requires the restore scroll state always
        if (this.scrollState.left !== 0 || this.scrollState.top !== 0 || this.infiniteScroll) {
            this.restoreScrollState();
        }
    },

    setupTimeCellEvents: function () {
        this.mon(this.el, {
            // `handleScheduleEvent` is an abstract method, defined in "SchedulerView" and "GanttView"
            click       : this.handleScheduleEvent,
            dblclick    : this.handleScheduleEvent,
            contextmenu : this.handleScheduleEvent,

            scope       : this
        });
    },

    getTableRegion: function () {
        var tableEl = this.el.down('.' + Ext.baseCSSPrefix + (Ext.versions.extjs.isLessThan('5.0') ? 'grid-table' : 'grid-item-container'));

        // Also handle odd timing cases where the table hasn't yet been inserted into the dom
        return (tableEl || this.el).getRegion();
    },

    // Returns the table element containing the rows of the schedule
    getRowNode: function (resourceRecord) {
        return this.getNodeByRecord(resourceRecord);
    },

    findRowByChild : function(t) {
        return this.findItemByChild(t);
    },

    getRecordForRowNode : function(node) {
        return this.getRecord(node);
    },

    /**
    * Refreshes the view and maintains the resource axis scroll position.
    */
    refreshKeepingResourceScroll : function() {
        var scroll = this.getScroll();

        this.refresh();

        if (this.getMode() === 'horizontal') {
            this.scrollVerticallyTo(scroll.top);
        } else {
            this.scrollHorizontallyTo(scroll.left);
        }
    },

    scrollHorizontallyTo : function(x, animate) {
        var el = this.getEl();
        if (el) {
            el.scrollTo('left', Math.max(0, x), animate);
        }
    },

    scrollVerticallyTo : function(y, animate) {
        var el = this.getEl();
        if (el) {
            el.scrollTo('top', Math.max(0,  y), animate);
        }
    },

    getVerticalScroll : function() {
        var el = this.getEl();
        return el.getScroll().top;
    },

    getHorizontalScroll : function() {
        var el = this.getEl();
        return el.getScroll().left;
    },

    getScroll : function() {
        var scroll = this.getEl().getScroll();

        return {
            top : scroll.top,
            left : scroll.left
        };
    },

    /**
     * @deprecated Use getCoordinateFromDate instead.
     * @BWCOMPAT 2.2
     */
    getXYFromDate : function() {
        var coord = this.getCoordinateFromDate.apply(this, arguments);

        return this.mode === 'horizontal' ? [coord, 0] : [0, coord];
    },

    handleScheduleEvent : function (e) {
    },

    // A slightly modified Ext.Element#scrollIntoView method using an offset for the edges
    scrollElementIntoView: function(el, container, hscroll, animate, highlight) {

        var edgeOffset      = 20,
            dom             = el.dom,
            offsets         = el.getOffsetsTo(container = Ext.getDom(container) || Ext.getBody().dom),

            left            = offsets[0] + container.scrollLeft,
            top             = offsets[1] + container.scrollTop,
            bottom          = top + dom.offsetHeight,
            right           = left + dom.offsetWidth,

            ctClientHeight  = container.clientHeight,
            ctScrollTop     = parseInt(container.scrollTop, 10),
            ctScrollLeft    = parseInt(container.scrollLeft, 10),
            ctBottom        = ctScrollTop + ctClientHeight,
            ctRight         = ctScrollLeft + container.clientWidth,
            newPos;


        if (highlight) {
            if (animate) {
                animate = Ext.apply({
                    listeners: {
                        afteranimate: function() {
                            Ext.fly(dom).highlight();
                        }
                    }
                }, animate);
            } else {
                Ext.fly(dom).highlight();
            }
        }

        if (dom.offsetHeight > ctClientHeight || top < ctScrollTop) {
            newPos = top - edgeOffset;
        } else if (bottom > ctBottom) {
            newPos = bottom - ctClientHeight + edgeOffset;
        }
        if (newPos != null) {
            Ext.fly(container).scrollTo('top', newPos, animate);
        }

        if (hscroll !== false) {
            newPos = null;
            if (dom.offsetWidth > container.clientWidth || left < ctScrollLeft) {
                newPos = left - edgeOffset;
            } else if (right > ctRight) {
                newPos = right - container.clientWidth + edgeOffset;
            }
            if (newPos != null) {
                Ext.fly(container).scrollTo('left', newPos, animate);
            }
        }
        return el;
    }

});
