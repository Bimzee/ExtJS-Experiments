/*

Ext Scheduler 2.5.2
Copyright(c) 2009-2014 Bryntum AB
http://bryntum.com/contact
http://bryntum.com/license

*/
/**
 * @private
 * @class Sch.feature.DragCreator
 * @constructor
 * An internal class which shows a drag proxy while clicking and dragging.
 * Create a new instance of this plugin
 * @param {Object} config The configuration options
 */
Ext.define("Sch.feature.DragCreator", {
    requires : [
        'Ext.XTemplate',
        'Sch.util.Date',
        'Sch.util.ScrollManager',
        'Sch.util.DragTracker',
        'Sch.tooltip.Tooltip',
        'Sch.tooltip.ClockTemplate'
    ],

    /**
     * @cfg {Boolean} disabled true to start disabled
     */
    disabled            : false,

    /**
     * @cfg {Boolean} showHoverTip true to show a time tooltip when hovering over the time cells
     */
    showHoverTip        : true,

    /**
     * @cfg {Boolean} showDragTip true to show a time tooltip when dragging to create a new event
     */
    showDragTip         : true,

    /**
     * @cfg {Ext.tip.ToolTip/Object} dragTip
     * The tooltip instance to show while dragging to create a new event or a configuration object for the default instance of
     * {@link Sch.tooltip.ToolTip}
     */
    dragTip             : null,

    /**
     * @cfg {Number} dragTolerance Number of pixels the drag target must be moved before dragging is considered to have started. Defaults to 2.
     */
    dragTolerance       : 2,



    /**
     * An empty function by default, but provided so that you can perform custom validation on the event being created.
     * Return true if the new event is valid, false to prevent an event being created.
     * @param {Sch.model.Resource} resourceRecord the resource for which the event is being created
     * @param {Date} startDate
     * @param {Date} endDate
     * @param {Ext.EventObject} e The event object
     * @return {Boolean} isValid
     */
    validatorFn         : Ext.emptyFn,

    /**
     * @cfg {Object} validatorFnScope
     * The scope for the validatorFn
     */
    validatorFnScope    : null,

    hoverTipTemplate    : null,

    /**
     * @cfg {Ext.Template/String} template The HTML template shown when dragging to create new items
     */
    template            : '<div class="sch-dragcreator-proxy">' +
                              '<div class="sch-event-inner">&#160;</div>' +
                          '</div>',

    constructor : function (config) {
        Ext.apply(this, config || {});

        this.lastTime = new Date();

        if (!(this.template instanceof Ext.Template)) {
            this.template = new Ext.Template(this.template);
        }

        this.schedulerView.on("destroy", this.onSchedulerDestroy, this);

        // Lazy setup and rendering of the tooltips
        this.schedulerView.el.on('mousemove', this.setupTooltips, this, { single : true });

        this.callParent([config]);
    },


    /**
     * Enable/disable the plugin
     * @param {Boolean} disabled True to disable this plugin
     */
    setDisabled : function (disabled) {
        this.disabled = disabled;
        if (this.hoverTip) {
            this.hoverTip.setDisabled(disabled);
        }

        if (this.dragTip) {
            this.dragTip.setDisabled(disabled);
        }
    },

    getProxy          : function () {
        if (!this.proxy) {
            this.proxy = this.template.append(this.schedulerView.getSecondaryCanvasEl(), {}, true);

            this.proxy.hide = function () {
                this.setTop(-10000);
            };
        }
        return this.proxy;
    },

    // private
    onMouseMove       : function (e) {
        var tip = this.hoverTip;

        // If tip is disabled, return
        if (tip.disabled || this.dragging) {
            return;
        }

        if (e.getTarget('.' + this.schedulerView.timeCellCls, 5) && !e.getTarget(this.schedulerView.eventSelector)) {

            var time = this.schedulerView.getDateFromDomEvent(e, 'floor');

            if (time) {
                if (time - this.lastTime !== 0) {
                    this.updateHoverTip(time);

                    if (tip.hidden) { // HACK, find better solution
                        tip[Sch.util.Date.compareUnits(this.schedulerView.getTimeResolution().unit, Sch.util.Date.DAY) >= 0 ? 'addCls' : 'removeCls']('sch-day-resolution');
                        tip.show();
                    }
                }
            } else {
                tip.hide();
                this.lastTime = null;
            }
        } else {
            tip.hide();
            this.lastTime = null;
        }
    },

    // private
    updateHoverTip    : function (date) {
        if (date) {
            var formattedDate = this.schedulerView.getFormattedDate(date);

            this.hoverTip.update(this.hoverTipTemplate.apply({
                date : date,
                text : formattedDate
            }));
            this.lastTime = date;
        }
    },

    // private
    onBeforeDragStart : function (tracker, e) {
        var s = this.schedulerView,
            t = e.getTarget('.' + s.timeCellCls, 5);

        if (t && !e.getTarget(s.eventSelector)) {
            var resourceRecord = s.resolveResource(t);
            var dateTime = s.getDateFromDomEvent(e);

            if (!this.disabled && t && s.fireEvent('beforedragcreate', s, resourceRecord, dateTime, e) !== false) {

                // Save record if the user ends the drag outside the current row
                this.resourceRecord = resourceRecord;

                // Start time of the event to be created
                this.originalStart = dateTime;

                // Constrain the dragging within the current row schedule area
                this.resourceRegion = s.getScheduleRegion(this.resourceRecord, this.originalStart);

                // Save date constraints
                this.dateConstraints = s.getDateConstraints(this.resourceRecord, this.originalStart);

                // TODO apply xStep or yStep to drag tracker
                return true;
            }
        }
        return false;
    },

    // private
    onDragStart       : function () {
        var me = this,
            view = me.schedulerView,
            proxy = me.getProxy();

        this.dragging = true;

        if (this.hoverTip) {
            this.hoverTip.disable();
        }

        me.start = me.originalStart;
        me.end = me.start;
        me.originalScroll = view.getScroll();

        if (view.getMode() === 'horizontal') {
            me.rowBoundaries = {
                top    : me.resourceRegion.top,
                bottom : me.resourceRegion.bottom
            };

            proxy.setRegion({
                top    : me.rowBoundaries.top,
                right  : me.tracker.startXY[0],
                bottom : me.rowBoundaries.bottom,
                left   : me.tracker.startXY[0]
            });
        } else {
            me.rowBoundaries = {
                left  : me.resourceRegion.left,
                right : me.resourceRegion.right
            };

            proxy.setRegion({
                top    : me.tracker.startXY[1],
                right  : me.resourceRegion.right,
                bottom : me.tracker.startXY[1],
                left   : me.resourceRegion.left
            });
        }

        proxy.show();

        view.fireEvent('dragcreatestart', view, proxy);

        if (me.showDragTip) {
            me.dragTip.enable();
            me.dragTip.update(me.start, me.end, true);
            me.dragTip.show(proxy);

            // for some reason Ext set `visibility` to `hidden` after a couple of `.hide()` calls
            me.dragTip.el.setStyle('visibility', 'visible');
        }

        // TODO: remove this
        Sch.util.ScrollManager.activate(view.el, view.getMode() ==='horizontal' ? 'horizontal' : 'vertical');
    },


    // private
    onDrag            : function (tracker, e) {
        var me = this,
            view = me.schedulerView,
            dragRegion = me.tracker.getRegion(),
            dates = view.getStartEndDatesFromRegion(dragRegion, 'round');

        if (!dates) {
            return;
        }

        me.start = dates.start || me.start;
        me.end = dates.end || me.end;

        var dc = me.dateConstraints;

        if (dc) {
            me.end = Sch.util.Date.constrain(me.end, dc.start, dc.end);
            me.start = Sch.util.Date.constrain(me.start, dc.start, dc.end);
        }

        me.valid = this.validatorFn.call(me.validatorFnScope || me, me.resourceRecord, me.start, me.end) !== false;

        if (me.showDragTip) {
            me.dragTip.update(me.start, me.end, me.valid);
        }

        Ext.apply(dragRegion, me.rowBoundaries);

        var scroll = view.getScroll();
        var proxy = this.getProxy();
        proxy.setRegion(dragRegion);

        if (view.isHorizontal()) {
            proxy.setY(me.resourceRegion.top + me.originalScroll.top - scroll.top);
        }

    },

    eventSwallower : function(e) {
        e.stopPropagation();
        e.preventDefault();
    },

    // private
    onDragEnd         : function (tracker, e) {
        var me          = this,
            s           = me.schedulerView,
            doFinalize  = true,
            t           = e.getTarget(),
            el          = Ext.get(t);

        // When dragging, we don't want a regular scheduleclick to fire - swallow the coming "click" event
        el.on('click', this.eventSwallower);

        setTimeout(function() {
            el.un('click', me.eventSwallower);
        }, 100);

        me.dragging = false;

        if (me.showDragTip) {
            me.dragTip.disable();
        }

        if (!me.start || !me.end || (me.end - me.start <= 0)) {
            me.valid = false;
        }

        me.createContext = {
            start          : me.start,
            end            : me.end,
            resourceRecord : me.resourceRecord,
            e              : e,
            finalize       : function () {
                me.finalize.apply(me, arguments);
            }
        };

        if (me.valid) {
            doFinalize = s.fireEvent('beforedragcreatefinalize', me, me.createContext, e, this.getProxy()) !== false;
        }

        if (doFinalize) {
            me.finalize(me.valid);
        }

        Sch.util.ScrollManager.deactivate();
    },

    finalize : function (doCreate) {
        var context = this.createContext;
        var schedulerView = this.schedulerView;

        if (doCreate) {
            var ev = Ext.create(schedulerView.eventStore.model);

            // HACK, for the Gantt chart assignments to work properly - we need the task to be in the task store before assigning it
            // to the resource.
            if (Ext.data.TreeStore && schedulerView.eventStore instanceof Ext.data.TreeStore) {
                ev.set('leaf', true);
                schedulerView.eventStore.append(ev);
            }

            ev.assign(context.resourceRecord);
            ev.setStartEndDate(context.start, context.end);
            schedulerView.fireEvent('dragcreateend', schedulerView, ev, context.resourceRecord, context.e, this.getProxy());
        } else {
            this.proxy.hide();
        }

        this.schedulerView.fireEvent('afterdragcreate', schedulerView, this.getProxy());

        if (this.hoverTip) {
            this.hoverTip.enable();
        }
    },

    tipCfg : {
        trackMouse   : true,
        bodyCls      : 'sch-hovertip',
        autoHide     : false,
        dismissDelay : 1000,
        showDelay    : 300
    },

    dragging : false,

    setupTooltips : function () {
        var me              = this,
            sv              = me.schedulerView,
            // HACK, we should not "know" about the outer panel
            containerEl     = sv.up('[lockable=true]').el;

        me.tracker = new Sch.util.DragTracker({
            el        : sv.el,
            tolerance : me.dragTolerance,
            listeners : {
                mousedown       : me.verifyLeftButtonPressed,
                beforedragstart : me.onBeforeDragStart,
                dragstart       : me.onDragStart,
                drag            : me.onDrag,
                dragend         : me.onDragEnd,
                scope           : me
            }
        });

        if (this.showDragTip) {
            var dragTip     = this.dragTip;

            if (dragTip instanceof Ext.tip.ToolTip) {
                Ext.applyIf(dragTip, { schedulerView   : sv });

                dragTip.on('beforeshow', function () { return me.dragging; });
            } else {
                this.dragTip = new Sch.tooltip.Tooltip(Ext.apply({
                    cls             : 'sch-dragcreate-tip',
                    constrainTo     : containerEl,
                    schedulerView   : sv,
                    listeners       : {
                        beforeshow      : function () {
                            return me.dragging;
                        }
                    }
                }, dragTip));
            }
        }

        if (me.showHoverTip) {
            var gridViewBodyEl = sv.el;

            me.hoverTipTemplate = me.hoverTipTemplate || new Sch.tooltip.ClockTemplate();

            me.hoverTip = new Ext.ToolTip(Ext.applyIf({
                renderTo : document.body,
                target   : gridViewBodyEl,
                disabled : me.disabled
            }, me.tipCfg));

            me.hoverTip.on('beforeshow', me.tipOnBeforeShow, me);

            sv.mon(gridViewBodyEl, {
                mouseleave : function () {
                    me.hoverTip.hide();
                },
                mousemove  : me.onMouseMove,
                scope      : me
            });
        }
    },

    verifyLeftButtonPressed : function (dragTracker, e) {
        return e.button === 0;
    },


    onSchedulerDestroy : function () {
        if (this.hoverTip) {
            this.hoverTip.destroy();
        }

        if (this.dragTip) {
            this.dragTip.destroy();
        }

        if (this.tracker) {
            this.tracker.destroy();
        }

        if (this.proxy) {
            Ext.destroy(this.proxy);
            this.proxy = null;
        }
    },

    tipOnBeforeShow : function (tip) {
        return !this.disabled && !this.dragging && this.lastTime !== null;
    }
});
