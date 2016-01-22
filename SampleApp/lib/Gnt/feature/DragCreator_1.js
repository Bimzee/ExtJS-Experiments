/*

Ext Gantt 2.2.23
Copyright(c) 2009-2014 Bryntum AB
http://bryntum.com/contact
http://bryntum.com/license

*/
/**
* @class Gnt.feature.DragCreator
* @private
*
* An internal class which shows a drag proxy while clicking and dragging.
* Create a new instance of this plugin
*/
Ext.define("Gnt.feature.DragCreator", {
    requires : [
        'Ext.Template',
        'Sch.util.DragTracker',
        'Gnt.Tooltip'
    ],

    constructor : function (config) {
        Ext.apply(this, config || {});

        this.init();
    },

    /**
    * @cfg {Boolean} disabled true to start disabled
     */
    disabled: false,

    /**
    * @cfg {Boolean} showDragTip true to show a time tooltip when dragging to create a new event
    */
    showDragTip: true,

    /**
     * @cfg tooltipConfig {Object} A custom config object to apply to the {@link Gnt.Tooltip} instance.
     */
    tooltipConfig   : null,

    /**
    * @cfg {Number} dragTolerance Number of pixels the drag target must be moved before dragging is considered to have started. Defaults to 2.
    */
    dragTolerance: 2,

    /**
    * @cfg {Ext.Template} template The HTML template shown when dragging to create new items
    */

    /**
    * @cfg {Function} validatorFn An empty function by default. 
    * Provide to perform custom validation on the item being created.
    * @param {Ext.data.Model} record the resource for which the task is being created
    * @param {Date} startDate
    * @param {Date} endDate
    * @param {Event} e The event object
    * @return {Boolean} isValid True if the creation event is valid, else false to cancel
    */
    validatorFn: Ext.emptyFn,

    /**
    * @cfg {Object} validatorFnScope
    * The scope for the validatorFn
    */
    validatorFnScope: null,

    /**
    * Enable/disable the plugin
    * @param {Boolean} disabled True to disable this plugin
    */
    setDisabled: function (disabled) {
        this.disabled = disabled;
        if (this.dragTip) {
            this.dragTip.setDisabled(disabled);
        }
    },

    getProxy : function() {
        if (!this.proxy) {
            // Attach this element to the nested gantt panel element (view el is cleared by refreshes)
            this.proxy = this.template.append(this.ganttView.ownerCt.el, {}, true);
        }
        return this.proxy;
    },

    // private
    onBeforeDragStart: function (e) {
        var s = this.ganttView,
            t = e.getTarget('.' + s.timeCellCls, 2);

        if (t) {
            var record = s.resolveTaskRecord(t);
            var dateTime = s.getDateFromDomEvent(e);

            if (!this.disabled &&
                t &&
                !record.getStartDate() &&
                !record.getEndDate() &&
                s.fireEvent('beforedragcreate', s, record, dateTime, e) !== false) {

                e.stopEvent();

                // Save record if the user ends the drag outside the current row
                this.record = record;

                // Start time of the task to be created
                this.originalStart = dateTime;

                // Constrain the dragging within the current row schedule area
                this.rowRegion = s.getScheduleRegion(this.record, this.originalStart);

                // Save date constraints
                this.dateConstraints = s.getDateConstraints(this.resourceRecord, this.originalStart);

                // TODO apply xStep or yStep to drag tracker
                return true;
            }
        }
        return false;
    },

    // private
    onDragStart: function () {
        var me = this,
            view = me.ganttView,
            proxy = me.getProxy();

        me.start = me.originalStart;
        me.end = me.start;

        me.rowBoundaries = {
            top : me.rowRegion.top,
            bottom : me.rowRegion.bottom
        };

        proxy.setRegion({
            top : me.rowBoundaries.top,
            right : me.tracker.startXY[0],
            bottom : me.rowBoundaries.bottom,
            left : me.tracker.startXY[0]
        });

        proxy.show();

        me.ganttView.fireEvent('dragcreatestart', me.ganttView);

        if (me.showDragTip) {
            me.dragTip.update(me.start, me.end, true, this.record);
            me.dragTip.enable();
            me.dragTip.show(proxy);
        }
    },

    // private
    onDrag: function (e) {
        var me = this,
            view = me.ganttView,
            dragRegion = me.tracker.getRegion().constrainTo(me.rowRegion),
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

        me.valid = this.validatorFn.call(me.validatorFnScope || me, this.record, me.start, me.end, e) !== false;

        if (me.showDragTip) {
            me.dragTip.update(me.start, me.end, me.valid, this.record);
        }

        Ext.apply(dragRegion, me.rowBoundaries);

        this.getProxy().setRegion(dragRegion);
    },

    // private
    onDragEnd   : function (e) {
        var me      = this,
            view    = me.ganttView,
            doFinalize  = false;
        
        me.createContext = {
            start          : me.start,
            end            : me.end,
            e              : e,
            record         : me.record,
            finalize       : function () {
                me.finalize.apply(me, arguments);
            }
        };

        if (me.showDragTip) {
            me.dragTip.disable();
        }

        if (!me.start || !me.end || (me.end < me.start)) {
            me.valid = false;
        }

        if (me.valid) {
            doFinalize = view.fireEvent('beforedragcreatefinalize', me, me.createContext, e) !== false;
        }

        if (doFinalize) {
            me.finalize(me.valid);
        }
    },
    
    finalize    : function (doCreate) {
        var me      = this,
            context = me.createContext,
            view    = me.ganttView;
        
        if (doCreate) {
            context.record.setStartEndDate(context.start, context.end, context.record.getTaskStore().skipWeekendsDuringDragDrop);
            view.fireEvent('dragcreateend', view, context.record, context.e);
        }
        
        me.proxy.hide();
        
        view.fireEvent('afterdragcreate', view);
    },

    // private
    init: function () {
        var gv = this.ganttView,
            gridViewBodyEl = gv.el,
            bind = Ext.Function.bind;

        this.lastTime = new Date();
        this.template = this.template || Ext.create("Ext.Template",
            '<div class="sch-gantt-dragcreator-proxy"></div>',
            {
                compiled : true,
                disableFormats : true
            }
        );

        gv.on({
            destroy: this.onGanttDestroy,
            scope: this
        });

        this.tracker = new Sch.util.DragTracker({
            el : gridViewBodyEl,
            tolerance: this.dragTolerance,
            onBeforeStart: bind(this.onBeforeDragStart, this),
            onStart: bind(this.onDragStart, this),
            onDrag: bind(this.onDrag, this),
            onEnd: bind(this.onDragEnd, this)
        });

        if (this.showDragTip) {
            this.dragTip = new Gnt.Tooltip(Ext.apply({
                mode    : 'duration',
                cls     : 'sch-gantt-dragcreate-tip',
                gantt   : gv
            }, this.tooltipConfig));
        }
    },

    onGanttDestroy: function () {
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
    }
});
