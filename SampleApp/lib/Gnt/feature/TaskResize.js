/*

Ext Gantt 2.2.23
Copyright(c) 2009-2014 Bryntum AB
http://bryntum.com/contact
http://bryntum.com/license

*/
/**
@class Gnt.feature.TaskResize
@extends Ext.util.Observable

A plugin enabling the task resizing feature. Generally there's no need to manually create it,
it can be activated with the {@link Gnt.panel.Gantt#resizeHandles} option of the gantt panel and configured with the {@link Gnt.panel.Gantt#resizeConfig}.


*/
Ext.define("Gnt.feature.TaskResize", {

    requires : [
        'Gnt.Tooltip'
    ],

    constructor : function(config) {
        Ext.apply(this, config);
        var g = this.ganttView;

        g.on({
            destroy : this.cleanUp,
            scope   : this
        });

        g.mon(g.el, 'mousedown', this.onMouseDown, this, { delegate : '.sch-resizable-handle' });

        this.callParent(arguments);
    },

    /**
     * @cfg {Boolean} showDuration true to show the duration instead of the end date when resizing a task
     */
    showDuration : true,
    
    /**
     * @type {Boolean} showExactResizePosition true to see exact task length during resizing
     */
    showExactResizePosition : false,

    /**
      * @cfg useTooltip {Boolean} false to not show a tooltip while resizing
      */
    useTooltip : true,

    /**
     * @cfg tooltipConfig {Object} A custom config object to apply to the {@link Gnt.Tooltip} instance.
     */
    tooltipConfig   : null,

    /**
     * @cfg {Function} validatorFn An empty function by default. 
     * Provide to perform custom validation on the item being resized.
     * @param {Ext.data.Model} record The task being resized
     * @param {Date} startDate
     * @param {Date} endDate
     * @param {Event} e The event object
     * @return {Boolean} isValid True if the creation event is valid, else false to cancel
     */
    validatorFn : Ext.emptyFn,

    /**
     * @cfg {Object} validatorFnScope
     * The scope for the validatorFn
     */
    validatorFnScope : null,

    taskRec     : null,
    isStart     : null,
    ganttView   : null,
    resizable   : null,

    onMouseDown : function(e, t) {
        var ganttView   = this.ganttView,
            domEl       = e.getTarget(ganttView.eventSelector),
            rec         = ganttView.resolveTaskRecord(domEl);

        var isResizable = rec.isResizable();

        // Don't trigger on right clicks
        if (e.button !== 0 || isResizable === false || typeof isResizable === 'string' && !domEl.className.match(isResizable)) {
            return;
        }

        if (ganttView.fireEvent('beforetaskresize', ganttView, rec, e) === false) {
            return;
        }
        e.stopEvent();

        this.taskRec = rec;
        this.isStart = !!t.className.match('sch-resizable-handle-start');

        ganttView.el.on({
            mousemove   : this.onMouseMove,
            mouseup     : this.onMouseUp,
            scope       : this,
            single      : true
        });
    },

    // private
    onMouseMove : function(e, t) {
        var g               = this.ganttView,
            record          = this.taskRec,
            taskEl          = g.getElementFromEventRecord(record),
            rtl             = g.rtl,
            isStart         = this.isStart,
            isWest          = (rtl && !isStart) || (!rtl && isStart),
            widthIncrement  = g.getSnapPixelAmount(),
            currentWidth    = taskEl.getWidth(),
            rowRegion       = taskEl.up(g.getItemSelector()).getRegion();

        this.ganttView.fireEvent('taskresizestart', this.ganttView, this.taskRec);

        this.resizable = Ext.create('Ext.resizer.Resizer', {
            otherEdgeX      : isWest ? taskEl.getRight() : taskEl.getLeft(),
            target          : taskEl,
            record          : record,
            isStart         : isStart,
            isWest          : isWest,
            handles         : isWest ? 'w' : 'e',
            constrainTo     : rowRegion,
            minHeight       : 1,
            minWidth        : widthIncrement,
            widthIncrement  : widthIncrement,
            listeners       : {
                resizedrag  : this.partialResize,
                resize      : this.afterResize,
                scope       : this
            }
        });
        
        // HACK calling private method
        this.resizable.resizeTracker.onMouseDown(e, this.resizable[isWest ? 'west' : 'east'].dom);

        if (this.useTooltip) {

            if(!this.tip) {
                this.tip = Ext.create("Gnt.Tooltip", Ext.apply({
                    mode    : this.showDuration ? 'duration' : 'startend',
                    gantt   : this.ganttView
                }, this.tooltipConfig));
            }

            this.tip.show(taskEl, e.getX() - 15);
            this.tip.update(record.getStartDate(), record.getEndDate(), true, record);

            // Catch case of user not moving the mouse at all
            Ext.getBody().on('mouseup', function(){ this.tip.hide(); }, this, { single : true });
        }
    },

    onMouseUp : function(e, t) {
        var g = this.ganttView;

        g.el.un({
            mousemove   : this.onMouseMove,
            scope       : this,
            single      : true
        });
    },
    
    // private
    partialResize : function (resizer, newWidth, oldWidth, e) {
        var ganttView   = this.ganttView,
            isWest      = resizer.isWest,
            task        = resizer.record,
            cursorDate;

        // we need actual date under cursor
        if (isWest) {
            cursorDate = ganttView.getDateFromCoordinate(resizer.otherEdgeX - Math.min(newWidth, this.resizable.maxWidth), !this.showExactResizePosition ? 'round' : null);
        } else {
            cursorDate = ganttView.getDateFromCoordinate(resizer.otherEdgeX + Math.min(newWidth, this.resizable.maxWidth), !this.showExactResizePosition ? 'round' : null);
        }
        
        if (!cursorDate || resizer.date-cursorDate === 0) {
            return;
        }

        var start, end, newDate;
        
        if (this.showExactResizePosition) {
            var adjustedDate = ganttView.timeAxis.roundDate(cursorDate, ganttView.snapRelativeToEventStartDate ? task.getStartDate() : false);
            adjustedDate    = task.skipNonWorkingTime(adjustedDate, !task.isMilestone());
            
            var target = resizer.target.el,
                exactWidth;
            
            if (isWest) {
                start       = task.skipNonWorkingTime(adjustedDate, !task.isMilestone());
                newDate     = start;
                
                exactWidth    = ganttView.timeAxisViewModel.getDistanceBetweenDates(start, task.getEndDate());
                target.setWidth(exactWidth);
                
                var offsetX = ganttView.timeAxisViewModel.getDistanceBetweenDates(cursorDate, start);
                target.setX(target.getX() + offsetX);
            } else {
                // to calculate endDate properly we have to clone task and set endDate
                var clone = Gnt.util.Data.cloneModelSet([task])[0];
                var taskStore = task.getTaskStore();
                clone.setTaskStore(taskStore);
                clone.setCalendar(task.getCalendar());
                clone.setEndDate(adjustedDate, false, taskStore.skipWeekendsDuringDragDrop);
                
                end = clone.getEndDate();
                newDate     = end;
                
                exactWidth    = ganttView.timeAxisViewModel.getDistanceBetweenDates(task.getStartDate(), end);
                target.setWidth(exactWidth);
            }
        } else {
            start = resizer.isStart ? cursorDate : resizer.record.getStartDate();
            end   = resizer.isStart ? resizer.record.getEndDate() : cursorDate;
            newDate     = cursorDate;
        }

        resizer.date = newDate;

        ganttView.fireEvent('partialtaskresize', ganttView, task, start, end, resizer.el, e);

        if (this.useTooltip) {
            var valid = this.validatorFn.call(this.validatorFnScope || this, task, start, end) !== false;
            this.tip.update(start, end, valid, task);
        }
    },

    // private
    afterResize : function (resizer, w, h, e) {
        if (this.useTooltip) {
            this.tip.hide();
        }
        var me          = this,
            record      = resizer.record,
            oldStart    = record.getStartDate(),
            oldEnd      = record.getEndDate(),
            start       = resizer.isStart ? resizer.date : oldStart,
            end         = resizer.isStart ? oldEnd : resizer.date,
            ganttView   = me.ganttView,
            modified    = false,
            doFinalize  = true;
        
        me.resizeContext    = {
            record          : record,
            start           : start,
            end             : end,
            oldStart        : record.getStartDate(),
            finalize        : function() { me.finalize.apply(me, arguments); }
        };

        if (start && end && // Input sanity check
            (start - oldStart || end - oldEnd) && // Make sure start OR end changed
            me.validatorFn.call(me.validatorFnScope || me, record, start, end, e) !== false) {
                
            doFinalize  = ganttView.fireEvent('beforetaskresizefinalize', me, me.resizeContext, e) !== false;
            modified    = true;

        } else {
            ganttView.refreshKeepingScroll();
        }
        
        if (doFinalize) {
            me.finalize(modified);
        }
    },
    
    finalize    : function (updateRecord) {
        var me          = this,
            view        = me.ganttView,
            context     = me.resizeContext;

        if (updateRecord) {
            // let's make sure that node has fired 'itemupdate' event otherwise scheduling view may present outdated start/end dates
            // For example: we have start date set to Monday and drag it to Sunday then 'itemupdate' won't be fired since
            // start date will be adjusted back to Monday (skip non-working time) and it will not change
            var updated, checkerFn = function() { updated = true; };
                
            view.on('itemupdate', checkerFn, null, { single : true });
    
            var skipWeekends = view.taskStore.skipWeekendsDuringDragDrop;
    
            // start <= end is "normal" case
            // start > end is case when task should be resized to 0
            if (context.start - context.oldStart !== 0) {
                context.record.setStartDate(context.start <= context.end ? context.start : context.end, false, skipWeekends);
            } else {
                context.record.setEndDate(context.start <= context.end ? context.end : context.start, false, skipWeekends);
            }
            // it 'itemupdate' wasn't fired let's refresh node manually
            if (!updated) view.refreshNode(view.store.indexOf(context.record));
        } else {
            view.refreshNode(view.store.indexOf(context.record));
        }
            
        // Destroy resizable
        me.resizable.destroy();
        me.resizeContext = null;
        
        view.fireEvent('aftertaskresize', view, context.record);
    },

    cleanUp : function() {
        if (this.tip) {
            this.tip.destroy();
        }
    }
});
