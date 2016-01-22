/*

Ext Gantt 2.2.23
Copyright(c) 2009-2014 Bryntum AB
http://bryntum.com/contact
http://bryntum.com/license

*/
/**
 * @class Gnt.feature.TaskDragDrop
 * @extends Ext.dd.DragZone
 * @private
 * 
 * Internal plugin enabling drag and drop for tasks
 */
Ext.define("Gnt.feature.TaskDragDrop", {
    extend : "Ext.dd.DragZone",

    requires : [
        'Gnt.Tooltip',
        'Ext.dd.StatusProxy'
    ],

    /**
     * @cfg useTooltip {Boolean} `false` to not show a tooltip while dragging
     */
    useTooltip      : true,

    /**
     * @cfg tooltipConfig {Object} A custom config object to apply to the {@link Gnt.Tooltip} instance.
     */
    tooltipConfig   : null,

    /**
     * @cfg {Function} validatorFn An empty function by default. 
     * Provide to perform custom validation on the item being dragged. 
     * This function is called during the drag and drop process and also after the drop is made.
     * @param {Ext.data.Model} record The record being dragged
     * @param {Date} date The date corresponding to the current start date
     * @param {Number} duration The duration of the item being dragged, in minutes
     * @param {Ext.EventObject} e The event object
     * @return {Boolean} true if the drop position is valid, else false to prevent a drop
     */
    validatorFn     : function (record, date, duration, e) { return true; },

    /**
     * @cfg {Object} validatorFnScope
     * The scope for the validatorFn, defaults to the gantt view instance
     */
    validatorFnScope : null,

    /**
     * @cfg {Boolean} showExactDropPosition When enabled, the task being dragged always "snaps" to the exact start date / duration that it will have after being drop.
     */
    showExactDropPosition : false,

    // has to be set to `false` - we'll register the gantt view in the ScrollManager manually
    containerScroll : false,

    dropAllowed     : "sch-gantt-dragproxy",
    dropNotAllowed  : "sch-gantt-dragproxy",

    // cached value of the validity of the drop position
    valid           : false,

    // Reference to the gantt view
    gantt           : null,

    // Don't seem to need these
    onDragEnter     : Ext.emptyFn,
    onDragOut       : Ext.emptyFn,

    tip             : null,

    constructor : function (el, config) {
        config          = config || {};
        Ext.apply(this, config);

        // Drag drop won't work in IE8 if running in an iframe
        // https://www.assembla.com/spaces/bryntum/tickets/712#/activity/ticket:
        if (Ext.isIE && (Ext.isIE8 || Ext.isIE7 || Ext.ieVersion < 9) && window.top !== window) {
            Ext.dd.DragDropManager.notifyOccluded = true;
        }

        this.proxy      = this.proxy || new Ext.dd.StatusProxy({
            shadow               : false,
            dropAllowed          : "sch-gantt-dragproxy",
            dropNotAllowed       : "sch-gantt-dragproxy",
            // HACK, we want the proxy inside the gantt chart, otherwise drag drop breaks in fullscreen mode
            ensureAttachedToBody : Ext.emptyFn
        });

        this.gantt.rtl && this.proxy.addCls('sch-rtl'); 

        var me          = this,
            gantt       = me.gantt;

        if (me.useTooltip) {
            me.tip      = new Gnt.Tooltip(Ext.apply({
                cls   : 'gnt-dragdrop-tip',
                gantt : gantt
            }, me.tooltipConfig));
        }

        me.callParent([ el, Ext.apply(config, { ddGroup : gantt.id + '-task-dd' }) ]);

        me.scroll       = false;
        me.isTarget     = true;
        me.ignoreSelf   = false;

        // Stop task drag and drop when a resize handle, a terminal or a parent task is clicked
        me.addInvalidHandleClass('sch-resizable-handle');
        me.addInvalidHandleClass(Ext.baseCSSPrefix + 'resizable-handle');
        me.addInvalidHandleClass('sch-gantt-terminal');
        me.addInvalidHandleClass('sch-gantt-progressbar-handle');
        me.addInvalidHandleClass('sch-rollup-task');

        gantt.ownerCt.el.appendChild(this.proxy.el);

        gantt.on({
            destroy : me.destroy,
            scope   : me
        });
    },
    
    
    destroy : function () {
        if (this.tip) {
            this.tip.destroy();
        }
        this.callParent(arguments);
    },


    // @OVERRIDE
    autoOffset : function (x, y) {
        this.setDelta(0, 0);
    },

    // @OVERRIDE
    setXConstraint : function (iLeft, iRight, iTickSize) {
        this.leftConstraint = iLeft;
        this.rightConstraint = iRight;

        this.minX = iLeft;
        this.maxX = iRight;
        if (iTickSize) {
            this.setXTicks(this.initPageX, iTickSize);
        }

        this.constrainX = true;
    },

    // @OVERRIDE
    setYConstraint : function (iUp, iDown, iTickSize) {
        this.topConstraint = iUp;
        this.bottomConstraint = iDown;

        this.minY = iUp;
        this.maxY = iDown;
        if (iTickSize) {
            this.setYTicks(this.initPageY, iTickSize);
        }

        this.constrainY = true;
    },

    constrainTo : function (constrainingRegion, elRegion, offsetX, offsetY) {
        this.resetConstraints();
        
        this.initPageX  = constrainingRegion.left + offsetX;
        this.initPageY  = elRegion.top + offsetY;
        
        this.setXConstraint(constrainingRegion.left, constrainingRegion.right, this.xTickSize);
        this.setYConstraint(elRegion.top - 1, elRegion.top - 1, this.yTickSize);
    },

    
    onDragOver : function (e) {
        var data        = this.dragData,
            task        = data.record,
            gantt       = this.gantt;
            
        if (!data.hidden) {
            Ext.fly(data.sourceNode).hide();
            data.hidden = true;
        }

        var timeDiff    = gantt.getDateFromCoordinate(e.getXY()[ 0 ]) - data.sourceDate;
        var realStart   = new Date(data.origStart - 0 + timeDiff);
        
        var proxyEl     = this.proxy.el;
        
        var newStart;
        // the time diff method can be used for continuous time axis only
        // fallback to proxy element position resolving for filtered time axis
        if (gantt.timeAxis.isContinuous()) {
            newStart        = gantt.timeAxis.roundDate(realStart, gantt.snapRelativeToEventStartDate ? data.origStart : false);
        } else {
            // Adjust x position for certain task types
            var x           = proxyEl.getX() + (gantt.rtl ? proxyEl.getWidth() : 0) + gantt.getXOffset(task) - data.offsets[ 0 ]; 
            newStart        = gantt.getDateFromXY([ x, 0 ], 'round');
        }
        
        if (this.showExactDropPosition && gantt.taskStore.skipWeekendsDuringDragDrop && !task.isManuallyScheduled()) {
            var el              = Ext.fly(data.ddel.id);
            var offsetX         = 0;
            var afterDropStart  = task.skipNonWorkingTime(newStart, !task.isMilestone());
            
            if (realStart.getTime() != afterDropStart.getTime()) {
                offsetX         = gantt.timeAxisViewModel.getDistanceBetweenDates(realStart, afterDropStart);
            }
            
            var newEnd          = task.recalculateEndDate(afterDropStart);
            
            if (realStart > gantt.timeAxis.getStart()) {
                el.setWidth(gantt.timeAxisViewModel.getDistanceBetweenDates(
                        afterDropStart,
                        Sch.util.Date.min(newEnd, gantt.timeAxis.getEnd()))
                );
                
                if (offsetX) {
                    proxyEl.setX(proxyEl.getX() + offsetX);
                }
            }
        }
        
        if (!newStart || newStart - data.start === 0) return;

        data.start      = newStart;
        
        this.valid      = this.validatorFn.call(
            this.validatorFnScope || gantt,
            task,
            newStart,
            data.duration,
            e
        ) !== false;
        
        if (this.tip) {
            var end = task.calculateEndDate(newStart, task.getDuration(), task.getDurationUnit());

            this.updateTip(task, newStart, end, this.valid);
        }
    },

    
    startDrag : function() {
        var ScrollManager               = Ext.dd.ScrollManager;
        
        this.gantt.el.ddScrollConfig    = {
            // this line required for ExtJS 4.2.1 only in 4.2.2 increment will be read from ScrollManager itself if missing
            increment       : ScrollManager.increment,
            hthresh         : ScrollManager.hthresh,
            // disable the vertical container scroll while dragging the task
            vthresh         : -1
        };
        
        return this.callParent(arguments);
    },

    
    endDrag : function() {
        // remove previous constraints for container scroll
        delete this.gantt.el.ddScrollConfig;
        
        return this.callParent(arguments);
    },
    
    
    onStartDrag : function () {
        var rec = this.dragData.record;

        if (this.tip) {
            // Showing and updating the tooltip takes about 100ms due to Ext JS relayouts, cancel them
            Ext.suspendLayouts();

            this.tip.enable();
            this.tip.show(this.dragData.ddel);

            this.updateTip(rec, rec.getStartDate(), rec.getEndDate());

            Ext.resumeLayouts();
        }
        
        this.gantt.fireEvent('taskdragstart', this.gantt, rec);
    },

    
    updateTip : function (record, start, end, isValid) {
        isValid     = isValid !== false;

        if (record.isMilestone() && start - Ext.Date.clearTime(start, true) === 0) {
            start   = Sch.util.Date.add(start, Sch.util.Date.MILLI, -1);
            end     = Sch.util.Date.add(end, Sch.util.Date.MILLI, -1);
        }

        this.tip.update(start, end, isValid, record);
    },

    // On receipt of a mousedown event, see if it is within a draggable element.
    // Return a drag data object if so. The data object can contain arbitrary application
    // data, but it should also contain a DOM element in the ddel property to provide
    // a proxy to drag.
    getDragData : function (e) {
        var g               = this.gantt,
            sourceNode      = e.getTarget(g.eventSelector);

        if (sourceNode && !e.getTarget('.sch-gantt-baseline-item')) {
            var sourceTask          = g.resolveTaskRecord(sourceNode),
                isMilestone         = sourceTask.isMilestone();

            if (g.fireEvent('beforetaskdrag', g, sourceTask, e) === false) {
                return null;
            }
            
            var xy                  = e.getXY();

            var copy                = sourceNode.cloneNode(true),
                increment           = this.showExactDropPosition ? 0 : g.getSnapPixelAmount(),
                origXY              = Ext.fly(sourceNode).getXY();

            var offsets             = [ xy[ 0 ] - origXY[ 0 ], xy[ 1 ] - origXY[ 1 ] ];

            copy.id                 = Ext.id();
            var height              = Ext.fly(sourceNode).getHeight();
            var width               = Ext.fly(sourceNode).getWidth();

            // Height needs to be hardcoded since it's percentage based when the task bar is inside the row/cell
            Ext.fly(copy).setHeight(height - (Ext.isIE7 && !isMilestone ? 2 : 0));

            if (Ext.isIE8m && isMilestone) {
                Ext.fly(copy).setSize(height + 5, height + 5);
            }
           
            if (!g.rtl) {
                copy.style.left = -offsets[0] + 'px';
            }
            else {
                copy.style.left = width - offsets[0] + 'px';
            }

            this.constrainTo(
                Ext.fly(g.findItemByChild(sourceNode)).getRegion(), 
                Ext.fly(sourceNode).getRegion(),
                offsets[ 0 ], offsets[ 1 ]
            );

            this.valid = false;
            
            if (increment >= 1) {
                this.setXConstraint(this.leftConstraint, this.rightConstraint, increment);
            }

            return {
                sourceNode  : sourceNode,
                repairXY    : origXY,
                offsets     : offsets,
                ddel        : copy,
                record      : sourceTask,
                duration    : Sch.util.Date.getDurationInMinutes(sourceTask.getStartDate(), sourceTask.getEndDate()),
                
                sourceDate  : g.getDateFromCoordinate(xy[ 0 ]),
                origStart   : sourceTask.getStartDate(),
                start       : null
            };
        }
        return null;
    },

    // Override, get rid of weird highlight fx in default implementation
    afterRepair : function () {
        Ext.fly(this.dragData.sourceNode).show();
        if (this.tip) {
            this.tip.hide();
        }
        this.dragging = false;
    },

    // Provide coordinates for the proxy to slide back to on failed drag.
    // This is the original XY coordinates of the draggable element.
    getRepairXY : function () {
        this.gantt.fireEvent('aftertaskdrop', this.gantt);
        return this.dragData.repairXY;
    },

    onDragDrop : function (e, id) {
        var me          = this,
            target      = me.cachedTarget || Ext.dd.DragDropMgr.getDDById(id),
            dragData    = me.dragData,
            gantt       = me.gantt,
            task        = dragData.record,
            start       = dragData.start,
            doFinalize  = true;

        dragData.ddCallbackArgs = [ target, e, id ];

        if (this.tip) {
            this.tip.disable();
        }

        if (this.valid && start && task.getStartDate() - start !== 0) {
            dragData.finalize   = function () { me.finalize.apply(me, arguments); };
            
            // Allow implementor to take control of the flow, by returning false from this listener,
            // to show a confirmation popup etc.
            doFinalize          = gantt.fireEvent('beforetaskdropfinalize', me, dragData, e) !== false;
        }
        
        if (doFinalize) {
            this.finalize(this.valid);
        }
    },
    
    finalize    : function (updateRecords) {
        var dragData    = this.dragData,
            gantt       = this.gantt,
            task        = dragData.record,
            start       = dragData.start,
            wasChanged  = false;

        if (updateRecords) {
            // Done this way since it might be dropped on a holiday, and then gets bumped back to its original value
            gantt.taskStore.on('update', function () { wasChanged = true; }, null, { single : true });
            
            task.setStartDate(start, true, gantt.taskStore.skipWeekendsDuringDragDrop);
    
            if (wasChanged) {
                gantt.fireEvent('taskdrop', gantt, task);
                // For our good friend IE9, the pointer cursor gets stuck without the defer
                if (Ext.isIE9) {
                    this.proxy.el.setStyle('visibility', 'hidden');
                    Ext.Function.defer(this.onValidDrop, 10, this, dragData.ddCallbackArgs);
                } else {
                    this.onValidDrop.apply(this, dragData.ddCallbackArgs);
                }
            } else {
                this.onInvalidDrop.apply(this, dragData.ddCallbackArgs);
            }
        } else {
            this.onInvalidDrop.apply(this, dragData.ddCallbackArgs);
        }
        
        gantt.fireEvent('aftertaskdrop', gantt, task);
    },

    // HACK: Override for IE, if you drag the task bar outside the window or iframe it crashes (missing e.target)
    // https://www.assembla.com/spaces/bryntum/tickets/716
    onInvalidDrop : function(target, e, id) {
        if (Ext.isIE && !e) {
            e = target;
            target = target.getTarget() || document.body;
        }

        return this.callParent([target, e, id]);
    }
});

