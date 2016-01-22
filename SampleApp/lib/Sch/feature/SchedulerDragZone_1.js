/*
 
 Ext Scheduler 2.5.2
 Copyright(c) 2009-2014 Bryntum AB
 http://bryntum.com/contact
 http://bryntum.com/license
 
 */
/**
 @class Sch.feature.SchedulerDragZone
 @extends Ext.dd.DragZone
 
 A custom scheduler dragzone that also acts as the dropzone, and optionally
 constrains the drag to the resource area that contains the dragged element.
 
 Generally it should not need to be used directly.
 To configure drag and drop use {@link Sch.mixin.SchedulerPanel#cfg-dragConfig SchedulerPanel} dragConfig instead.
 
 @constructor
 @param {Object} config The object containing the configuration of this model.
 */
Ext.define("Sch.feature.SchedulerDragZone", {
    extend: "Ext.dd.DragZone",
    requires: [
        'Sch.tooltip.Tooltip',
        'Ext.dd.StatusProxy',
        // a missing require of Ext.dd.DragDrop:
        // http://www.sencha.com/forum/showthread.php?276603-4.2.1-Ext.dd.DragDrop-missing-Ext.util.Point-in-dependency-quot-requires-quot
        'Ext.util.Point'
    ],
    repairHighlight: false,
    repairHighlightColor: 'transparent',
    // this has to be set to `false` because we will manually register the view element in the ScrollManager
    // we don't need to register the dragged element in it
    containerScroll: false,
    dropAllowed: "sch-dragproxy",
    dropNotAllowed: "sch-dragproxy",
    /**
     * @cfg {Boolean} showTooltip Specifies whether or not to show tooltip while dragging event
     */
    showTooltip: true,
    /**
     * @cfg {Ext.tip.ToolTip/Object} tip
     *
     * The tooltip instance to show while dragging event or a configuration object
     */
    tip: null,
    tipIsProcessed: false,
    schedulerView: null,
    // The last 'good' coordinates received by mousemove events (needed when a scroll event happens, which doesn't contain XY info)
    lastXY: null,
    /**
     * @type {Boolean} showExactDropPosition When enabled, the event being dragged always "snaps" to the exact start date that it will have after drop.
     */
    showExactDropPosition: false,
    /**
     * @cfg {Boolean} enableCopy true to enable copy by pressing modifier key
     * (see {@link #enableCopyKey enableCopyKey}) during drag drop.
     */
    enableCopy: false,
    /**
     *
     * @cfg {String} enableCopyKey
     * Modifier key that should be pressed during drag drop to copy item.
     * Available values are 'CTRL', 'ALT', 'SHIFT'
     */
    enableCopyKey: 'SHIFT',
    /**
     * @cfg {Object} validatorFn
     *
     * An empty function by default, but provided so that you can perform custom validation on
     * the item being dragged. This function is called during the drag and drop process and also after the drop is made
     * @param {Sch.model.Event[]} dragRecords an array containing the records for the events being dragged
     * @param {Sch.model.Resource} targetResourceRecord the target resource of the the event
     * @param {Date} date The date corresponding to the current mouse position
     * @param {Number} duration The duration of the item being dragged
     * @param {Event} e The event object
     * @return {Boolean} true if the drop position is valid, else false to prevent a drop
     */
    validatorFn: function(dragRecords, targetResourceRecord, date, duration, e) {
        return true;
    },
    /**
     * @cfg {Object} validatorFnScope
     * The scope for the {@link #validatorFn}
     */
    validatorFnScope: null,
    copyKeyPressed: false,
    constructor: function(el, config) {
        // Drag drop won't work in IE8 if running in an iframe
        // https://www.assembla.com/spaces/bryntum/tickets/712#/activity/ticket:
        if (Ext.isIE8m && window.top !== window) {
            Ext.dd.DragDropManager.notifyOccluded = true;
        }

        var proxy = this.proxy = this.proxy || new Ext.dd.StatusProxy({
            shadow: false,
            dropAllowed: this.dropAllowed,
            dropNotAllowed: this.dropNotAllowed,
            // HACK, we want the proxy inside the scheduler, so that when user drags the event
            // out of the scheduler el, the event should be cropped by the scheduler edge
            ensureAttachedToBody: Ext.emptyFn
        });

        this.callParent(arguments);
        this.isTarget = true;
        this.scroll = false;
        this.ignoreSelf = false;

        var schedulerView = this.schedulerView;

        schedulerView.el.appendChild(proxy.el);

        if (schedulerView.rtl) {
            proxy.addCls('sch-rtl');
        }

        // Activate the auto-scrolling behavior during the drag drop process
        schedulerView.on({
            eventdragstart: function() {
                Sch.util.ScrollManager.activate(schedulerView.el, schedulerView.constrainDragToResource && schedulerView.getMode());
            },
            aftereventdrop: function() {
                Sch.util.ScrollManager.deactivate();
            },
            scope: this
        });
    },
    destroy: function() {
        this.callParent(arguments);

        if (this.tip) {
            this.tip.destroy();
        }
    },
    // @OVERRIDE
    autoOffset: function(x, y) {
        this.setDelta(0, 0);
    },
    // private
    setupConstraints: function(constrainRegion, elRegion, xOffset, yOffset, isHorizontal, tickSize, constrained) {
        this.clearTicks();

        var xTickSize = isHorizontal && !this.showExactDropPosition && tickSize > 1 ? tickSize : 0;
        var yTickSize = !isHorizontal && !this.showExactDropPosition && tickSize > 1 ? tickSize : 0;

        this.resetConstraints();

        this.initPageX = constrainRegion.left + xOffset;
        this.initPageY = constrainRegion.top + yOffset;

        var width = elRegion.right - elRegion.left;
        var height = elRegion.bottom - elRegion.top;

        // if `constrained` is false then we haven't specified getDateConstraint method and should constrain mouse position to scheduling area
        // else we have specified date constraints and so we should limit mouse position to smaller region inside of constrained region using offsets and width.
        if (isHorizontal) {
            if (constrained) {
                this.setXConstraint(constrainRegion.left + xOffset, constrainRegion.right - width + xOffset, xTickSize);
            } else {
                this.setXConstraint(constrainRegion.left, constrainRegion.right, xTickSize);
            }
            this.setYConstraint(constrainRegion.top + yOffset, constrainRegion.bottom - height + yOffset, yTickSize);
        } else {
            this.setXConstraint(constrainRegion.left + xOffset, constrainRegion.right - width + xOffset, xTickSize);
            if (constrained) {
                this.setYConstraint(constrainRegion.top + yOffset, constrainRegion.bottom - height + yOffset, yTickSize);
            } else {
                this.setYConstraint(constrainRegion.top, constrainRegion.bottom, yTickSize);
            }
        }
    },
    // @OVERRIDE
    setXConstraint: function(iLeft, iRight, iTickSize) {
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
    setYConstraint: function(iUp, iDown, iTickSize) {
        this.topConstraint = iUp;
        this.bottomConstraint = iDown;

        this.minY = iUp;
        this.maxY = iDown;
        if (iTickSize) {
            this.setYTicks(this.initPageY, iTickSize);
        }

        this.constrainY = true;
    },
    // These cause exceptions, and are not needed
    onDragEnter: Ext.emptyFn,
    onDragOut: Ext.emptyFn,
    setVisibilityForSourceEvents: function(show) {
        Ext.each(this.dragData.eventEls, function(el) {
            el[ show ? 'show' : 'hide' ]();
        });
    },
    // private
    onDragOver: function(e) {
        var xy = e.type === 'scroll' ? this.lastXY : e.getXY();

        this.checkShiftChange();

        var dd = this.dragData,
                start = dd.startDate,
                resource = dd.newResource,
                eventRecs = dd.eventRecords,
                view = this.schedulerView;
//                s = this.schedulerView,
//                result = RigScheduler.config.Util.getLinkedRecords(eventRecs[0], view.eventStore);

        if (!dd.originalHidden) {
            // Hide dragged event elements at this time
            this.setVisibilityForSourceEvents(false);

            dd.originalHidden = true;
        }

        this.updateDragContext(e);

        if (this.showExactDropPosition) {
            var isHorizontal = view.isHorizontal();
            var timeDiff = view.getDateFromCoordinate(isHorizontal ? xy[0] : xy[1]) - dd.sourceDate;
            var realStart = new Date(dd.origStart - 0 + timeDiff);
            var offset = view.timeAxisViewModel.getDistanceBetweenDates(realStart, dd.startDate);

            if (dd.startDate > view.timeAxis.getStart()) {
                var proxyEl = this.proxy.el;
                if (offset) {
                    if (view.isHorizontal()) {
                        proxyEl.setX(xy[0] + (this.schedulerView.rtl ? -offset : offset));
                    } else {
                        proxyEl.setY(xy[1] + offset);
                    }
                }
            }
        }

        if (dd.startDate - start !== 0 || resource !== dd.newResource) {
            this.schedulerView.fireEvent('eventdrag', this.schedulerView, dd.eventRecords, dd.startDate, dd.newResource, dd);
        }

        var startDate = Ext.Date.format(dd.startDate, 'm/d/Y'); //Ext.Date.format(Sch.util.Date.add(dd.startDate, Sch.util.Date.DAY, -dd.eventRecords[0].get('MobDays')), 'm/d/Y');
        var endDate = Ext.Date.format(dd.endDate, 'm/d/Y'); //Ext.Date.format(Sch.util.Date.add(dd.endDate, Sch.util.Date.DAY, dd.eventRecords[0].get('DeMobDays')), 'm/d/Y');

        if (this.showTooltip) {
//            this.tip.update(dd.startDate, dd.endDate, dd.valid);
            if (eventRecs.length === 1) {
                var viewStart = view.timeAxis.getStart(),
                        viewEnd = view.timeAxis.getEnd(),
                        width = 0,
                        offsetLeft = dd.refElement.dom.offsetLeft;

                if (dd.newResource && (dd.resourceRecord !== dd.newResource)) {
                    var M = Math,
                            mobStartX = view.getXFromDate(Sch.util.Date.max(Sch.util.Date.add(dd.startDate, Sch.util.Date.DAY, -(dd.newResource.get('MobDays'))), viewStart)),
                            mobEndtX = view.getXFromDate(Sch.util.Date.max(dd.startDate, viewStart)),
                            deMobStartX = view.getXFromDate(Sch.util.Date.max(dd.endDate, viewStart)),
                            deMobEndtX = view.getXFromDate(Sch.util.Date.max(Sch.util.Date.add(dd.endDate, Sch.util.Date.DAY, dd.newResource.get('DemobDays')), viewStart)),
                            mobWidth = M.max(1, M.abs(mobEndtX - mobStartX)), // - view.eventBorderWidth;
                            deMobWidth = M.max(1, M.abs(deMobEndtX - deMobStartX)) - view.eventBorderWidth,
                            width = mobWidth + dd.refElement.dom.offsetWidth + deMobWidth;
                    offsetLeft -= mobWidth;
                } else {
                    for (var i = 0; i < dd.eventEls.length; i++) {
                        width += dd.eventEls[i].dom.offsetWidth;
                    }
                    offsetLeft -= dd.eventEls[1].dom.offsetWidth;
                }
                var tip = Ext.get('scheduler-drag-tip');
                if (tip) {
                    tip.setStyle({
                        width: width + 'px',
                        height: dd.refElement.dom.offsetHeight + 'px',
                        top: dd.refElement.dom.offsetTop + 'px',
                        left: offsetLeft + 'px'
                    });
                    if (dd.newResource) {
                        resource = dd.newResource;
                    } else {
                        resource = dd.resourceRecord;
                    }
                    if (!RigScheduler.config.Util.validateSchedulerDrop(eventRecs, resource, dd.startDate)) {
                        tip.removeCls('x-dd-drop-ok');
                        tip.addCls('x-dd-drop-nodrop');
                    } else {
                        tip.removeCls('x-dd-drop-nodrop');
                        tip.addCls('x-dd-drop-ok');
                    }
//                    Ext.fly(tip).update('<div class="x-dd-drop-icon" style="height: 100%;float: left;width: 30px;margin-top: 0px;display: block !important;"></div><div style="width: ' + (dd.refElement.dom.offsetWidth - 35) + 'px;float: left;margin-left: 35px;padding: 5px;font-family:Open Sans;color: white;font-size: 13px;"><div class="textWrap">' + dd.eventRecords[0].get('EntityName') + '</div><div class="textWrap">' + startDate + ' - ' + endDate + '</div></div>');
                    Ext.fly(tip).update('<div class="x-dd-drop-icon" style="height: 100%;float: left;width: 30px;margin-top: 0px;display: block !important;"></div><div style="width: ' + (dd.refElement.dom.offsetWidth - 35) + 'px;float: left;margin-left: 35px;padding: 5px;font-family:Open Sans;color: white;font-size: 13px;"></div>');
                }
            }
        }



        var entityName = '',
                dateStr = '',
                i,
                isGroupSchedule = true,
                sourceEventGroupKey = eventRecs[0].get('GroupKey'),
                std = null,
                stdate = null;

        if (eventRecs.length > 1) {
            for (i = 1; i < eventRecs.length; i++) {
                if (eventRecs[i].get('GroupKey') !== sourceEventGroupKey) {
                    isGroupSchedule = false;
                    break;
                }
            }
        } else {
            isGroupSchedule = false;
        }

        if (eventRecs.length > 1) {
            for (i = 0; i < eventRecs.length; i++) {
                if (std) {
                    if (eventRecs[i].get('ScheduledStartDate') < std) {
                        std = eventRecs[i].get('ScheduledStartDate');
                    }
                } else {
                    std = eventRecs[i].get('ScheduledStartDate');
                }
            }
            entityName = 'Multiple Wells';
            if (RigScheduler.config.Constants.IsGroupingEnabled === true && isGroupSchedule === true) {
                stdate = Sch.util.Date.add(std, Sch.util.Date.MILLI, dd.timeDiff);
            } else {
                stdate = Sch.util.Date.add(std, Sch.util.Date.MILLI, dd.timeDiff);
            }
            dateStr = Ext.Date.format(stdate, 'm/d/Y');
        } else {
            entityName = eventRecs[0].get('EntityName');
            dateStr = startDate + ' - ' + endDate;
        }
        Ext.ComponentQuery.query('container[itemId=startDateContainer]')[0].show();
        Ext.ComponentQuery.query('container[itemId=scheduleNameContainer]')[0].hide();
        Ext.ComponentQuery.query('container[itemId=startDateContainer]')[0].items.items[1].setText(entityName + ' ');
        Ext.ComponentQuery.query('container[itemId=startDateContainer]')[0].items.items[3].setText(dateStr);

        if (e.type !== 'scroll') {
            this.lastXY = e.getXY();
        }
    },
    getCoordinate: function(coord) {
        switch (this.schedulerView.getMode()) {
            case 'horizontal'   :
                return coord[0];
                /* pass through */
            case 'vertical'     :
                return coord[1];
                /* pass through */
            case 'calendar'     :
                return coord;
                /* pass through */
        }
    },
    getDragData: function(e) {
        var s = this.schedulerView,
                t = e.getTarget(s.eventSelector);

        if (!t)
            return;

        var eventRecord = s.resolveEventRecord(t);

        // there will be no event record when trying to drag the drag creator proxy for example
        if (!eventRecord || eventRecord.isDraggable() === false || s.fireEvent('beforeeventdrag', s, eventRecord, e) === false) {
            return null;
        }

        var xy = e.getXY(),
                eventEl = Ext.get(t),
                eventXY = eventEl.getXY(),
                offsets = [xy[0] - eventXY[0], xy[1] - eventXY[1]],
                eventRegion = eventEl.getRegion();


        var isHorizontal = s.getMode() == 'horizontal';
        var resource = s.resolveResource(t);

        if (s.constrainDragToResource && !resource)
            throw 'Resource could not be resolved for event: ' + eventRecord.getId();

        var dateConstraints = s.getDateConstraints(s.constrainDragToResource ? resource : null, eventRecord);

        this.setupConstraints(
                s.getScheduleRegion(s.constrainDragToResource ? resource : null, eventRecord),
                eventRegion,
                offsets[0], offsets[1],
                isHorizontal,
                s.getSnapPixelAmount(),
                Boolean(dateConstraints)
                );

        var origStart = eventRecord.getStartDate(),
                origEnd = eventRecord.getEndDate(),
                timeAxis = s.timeAxis,
                relatedRecords = this.getRelatedRecords(eventRecord),
                //eventEls = [eventEl, Ext.get(t).up('div').first(), Ext.get(Ext.get(t).up('div').dom.childNodes[2])];
                eventEls = [eventEl, Ext.get(t).up('div').first(), Ext.get(Ext.get(t).up('div').dom.childNodes[3]), Ext.get(Ext.get(t).up('div').dom.childNodes[1])];

        // Collect additional elements to drag
        /*Custom implementation Start*/
//        if (eventRecord.get('parentId') && eventRecord.get('parentId') !== "" && eventRecord.get('parentId') !== 0)
//        {
//            if (eventEls.indexOf(Ext.get('link-' + (eventRecord.get('parentId')))) === -1 && Ext.get('link-' + (eventRecord.get('parentId')))) {
//                eventEls.push(Ext.get('link-' + (eventRecord.get('parentId'))));
//            }
//        }
//        if (eventRecord.get('childId') && eventRecord.get('childId') !== "" && eventRecord.get('childId') !== 0)
//        {
//            if (eventEls.indexOf(Ext.get('link-' + (eventRecord.get('childId')))) === -1 && Ext.get('link-' + (eventRecord.get('childId')))) {
//                eventEls.push(Ext.get('link-' + (eventRecord.get('childId'))));
//            }
//        }
        /*Custom implementation End*/
        Ext.Array.each(relatedRecords, function(r) {
            var el = s.getElementFromEventRecord(r);

            if (el) {
                eventEls.push(el);
                /*Custom implementation Start*/
                eventEls.push(Ext.get(el.dom).up('div').first());
//                eventEls.push(Ext.get(Ext.get(el.dom).up('div').dom.childNodes[2]));
//
//                if (r.get('parentId') && r.get('parentId') !== "" && r.get('parentId') !== 0)
//                {
//                    if (eventEls.indexOf(Ext.get('link-' + (r.get('parentId')))) === -1 && Ext.get('link-' + (r.get('parentId')))) {
//                        eventEls.push(Ext.get('link-' + (r.get('parentId'))));
//                    }
//                }
//                if (r.get('childId') && r.get('childId') !== "" && r.get('childId') !== 0)
//                {
//                    if (eventEls.indexOf(Ext.get('link-' + (r.get('childId')))) === -1 && Ext.get('link-' + (r.get('childId')))) {
//                        eventEls.push(Ext.get('link-' + (r.get('childId'))));
//                    }
//                }

                eventEls.push(Ext.get(Ext.get(el.dom).up('div').dom.childNodes[3]));
                eventEls.push(Ext.get(Ext.get(el.dom).up('div').dom.childNodes[1]));
                /*Custom implementation End*/

            }
        });

        var dragData = {
            offsets: offsets,
            repairXY: eventXY,
            prevScroll: s.getScroll(),
            dateConstraints: dateConstraints,
            eventEls: eventEls,
            eventRecords: [eventRecord].concat(relatedRecords),
            relatedEventRecords: relatedRecords,
            resourceRecord: resource,
            sourceDate: s.getDateFromCoordinate(this.getCoordinate(xy)),
            origStart: origStart,
            origEnd: origEnd,
            startDate: origStart,
            endDate: origEnd,
            timeDiff: 0,
            startsOutsideView: origStart < timeAxis.getStart(),
            endsOutsideView: origEnd > timeAxis.getEnd(),
            duration: origEnd - origStart,
            bodyScroll: Ext.getBody().getScroll(),
            eventObj: e // So we can know if SHIFT/CTRL was pressed
        };

        dragData.ddel = this.getDragElement(eventEl, dragData);

        return dragData;
    },
    onStartDrag: function(x, y) {
        var s = this.schedulerView,
                dd = this.dragData;

        // To make sure any elements made visible by hover are not visible when the original element is hidden (using visibility:hidden)
        dd.eventEls[0].removeCls('sch-event-hover');

        s.fireEvent('eventdragstart', s, dd.eventRecords);

        s.el.on('scroll', this.onViewElScroll, this);
    },
    alignElWithMouse: function(el, iPageX, iPageY) {
        this.callParent(arguments);

        var oCoord = this.getTargetCoord(iPageX, iPageY),
                fly = el.dom ? el : Ext.fly(el, '_dd');

        // original method limits task position by viewport dimensions
        // our drag proxy is located on secondary canvas and can have height larger than viewport
        // so we have to set position relative to bigger secondary canvas
        this.setLocalXY(
                fly,
                oCoord.x + this.deltaSetXY[0],
                oCoord.y + this.deltaSetXY[1]
                );
    },
    onViewElScroll: function(event, target) {
        var proxy = this.proxy,
                s = this.schedulerView,
                dd = this.dragData;

        this.setVisibilityForSourceEvents(false);

        var xy = proxy.getXY();
        var scroll = s.getScroll();
        var newXY = [xy[0] + scroll.left - dd.prevScroll.left, xy[1] + scroll.top - dd.prevScroll.top];

        // this property is taking part in coordinates calculations in alignElWithMouse
        // these adjustments required for correct positioning of proxy on moving mouse after scroll
        var deltaSetXY = this.deltaSetXY;
        this.deltaSetXY = [deltaSetXY[0] + scroll.left - dd.prevScroll.left, deltaSetXY[1] + scroll.top - dd.prevScroll.top];
        dd.prevScroll = scroll;

        proxy.setXY(newXY);

        this.onDragOver(event);
    },
    getCopyKeyPressed: function() {
        return Boolean(this.enableCopy && this.dragData.eventObj[ this.enableCopyKey.toLowerCase() + 'Key' ]);
    },
    checkShiftChange: function() {
        var copyKeyPressed = this.getCopyKeyPressed(),
                dd = this.dragData;

        if (copyKeyPressed !== this.copyKeyPressed) {
            this.copyKeyPressed = copyKeyPressed;

            if (copyKeyPressed) {
                dd.refElements.addCls('sch-event-copy');
                this.setVisibilityForSourceEvents(true);
            } else {
                dd.refElements.removeCls('sch-event-copy');
                this.setVisibilityForSourceEvents(false);
            }
        }
    },
    onKey: function(e) {
        if (e.getKey() === e[ this.enableCopyKey ])
            this.checkShiftChange();
    },
    // HACK, overriding private method, proxy needs to be shown before aligning to it
    startDrag: function() {
        if (this.enableCopy) {
            Ext.EventManager.on(document, "keydown", this.onKey, this);
            Ext.EventManager.on(document, "keyup", this.onKey, this);
        }

        var retVal = this.callParent(arguments);
        var dragData = this.dragData;

        // This is the representation of the original element inside the proxy
        dragData.refElement = this.proxy.el.down('.sch-dd-ref');
        dragData.refElements = this.proxy.el.select('.sch-event');

        // The dragged element should not be in hover state
        dragData.refElement.removeCls('sch-event-hover');

        var s = this.schedulerView,
                result = RigScheduler.config.Util.getLinkedRecords(dragData.eventRecords[0], s.eventStore);

        if (this.showTooltip) {
//            var s               = this.schedulerView,
//                containerEl     = s.up('[lockable=true]').el;
//
//            if (!this.tipIsProcessed) {
//                this.tipIsProcessed = true;
//
//                var tip         = this.tip;
//
//                if (tip instanceof Ext.tip.ToolTip) {
//                    Ext.applyIf(tip, {
//                        schedulerView   : s,
//                        onMyMouseUp     : function (ev) { }
//                    });
//                } else {
//                    this.tip        = new Sch.tooltip.Tooltip(Ext.apply({
//                        schedulerView   : s,
//                        cls             : 'sch-dragdrop-tip',
//                        constrainTo     : containerEl
//                    }, tip));
//                }
//            }
//
//            this.tip.update(dragData.origStart, dragData.origEnd, true);
//            // Seems required as of Ext 4.1.0, to clear the visibility:hidden style.
//            this.tip.el.setStyle('visibility');
//            this.tip.show(dragData.refElement, dragData.offsets[ 0 ]);
            if (dragData.eventRecords.length === 1) {
                var wrapper = Ext.get('scheduler-drag-tip-wrap');
                if (wrapper)
                    wrapper.destroy();
                var width = 0;
                for (var i = 0; i < dragData.eventEls.length; i++) {
                    width += dragData.eventEls[i].dom.offsetWidth;
                }
                wrapper = Ext.get(Ext.core.DomHelper.append(dragData.refElement.dom.parentElement, {
                    tag: 'div',
                    id: 'scheduler-drag-tip-wrap',
                    children: [
                    ]
                }));
                var tip = Ext.get(Ext.core.DomHelper.append(wrapper, {
                    tag: 'div',
                    id: 'scheduler-drag-tip',
                    style: {
                        width: width + 'px',
                        height: dragData.refElement.dom.offsetHeight + 'px',
                        position: 'absolute',
                        top: dragData.refElement.dom.offsetTop + 'px',
                        left: dragData.refElement.dom.offsetLeft - dragData.eventEls[1].dom.offsetWidth + 'px', //dragData.refElement.dom.offsetLeft + 'px',
                        background: 'green',
                        'z-index': 100000
                    },
                    children: [
                    ]
                }));
                var dragProxy = dragData.refElement.up('.sch-dragproxy');
                dragProxy.removeCls('x-dd-drop-nodrop');
                var startDate = Ext.Date.format(dragData.origStart, 'm/d/Y');
                var endDate = Ext.Date.format(dragData.origEnd, 'm/d/Y');
//                Ext.fly(tip).update('<div style="height: 100%;float: left;width: 30px;margin-top: 0px;display: block !important;"></div><div style="width: ' + (dragData.refElement.dom.offsetWidth - 35) + 'px;float: left;margin-left: 35px;padding: 5px;font-family:Open Sans;color: white;font-size: 13px;"><div style="">' + dragData.eventRecords[0].get('EntityName') + '</div><div style="">' + startDate + ' - ' + endDate + '</div></div>');
                Ext.fly(tip).update('<div style="height: 100%;float: left;width: 30px;margin-top: 0px;display: block !important;"></div><div style="width: ' + (dragData.refElement.dom.offsetWidth - 35) + 'px;float: left;margin-left: 35px;padding: 5px;font-family:Open Sans;color: white;font-size: 13px;"><div style=""></div></div>');
            }
        }

        this.copyKeyPressed = this.getCopyKeyPressed();

        if (this.copyKeyPressed) {
            dragData.refElements.addCls('sch-event-copy');
            dragData.originalHidden = true;
        }

        if (dragData.eventRecords.length === 1) {
            var childNodes = dragData.ddel.childNodes;
            var node;
            for (var i = 0; i < childNodes.length; i++) {
                node = Ext.get(childNodes[i].id);
                if (node)
                    node.hide();
            }
        }
        return retVal;
    },
    endDrag: function() {
        var s = this.schedulerView,
                dragData = this.dragData,
                result = RigScheduler.config.Util.getLinkedRecords(dragData.eventRecords[0], s.eventStore);
        s.el.un('scroll', this.onViewElScroll, this);

        if (this.enableCopy) {
            Ext.EventManager.un(document, "keydown", this.onKey, this);
            Ext.EventManager.un(document, "keyup", this.onKey, this);
        }
        this.callParent(arguments);

        // https://www.assembla.com/spaces/bryntum/tickets/1524#/activity/ticket:
        // If drag is done close to the edge to invoke scrolling, the proxy could be left there and interfere
        // with the view sizing if the columns are shrunk.
        this.proxy.el.setStyle({
            left: 0,
            top: 0
        });

//        var div = Ext.get('scheduler-drag-tip-wrap');
//        if (div)
//            div.destroy();

        if (dragData.eventRecords.length === 1) {
            var childNodes = dragData.ddel.childNodes;
            var node;
            for (var i = 0; i < childNodes.length; i++) {
                node = Ext.get(childNodes[i].id);
                if (node)
                    node.show();
            }
        }
    },
    updateRecords: function(context) {
        var me = this,
                schedulerView = me.schedulerView,
                resourceStore = schedulerView.resourceStore,
                newResource = context.newResource,
                draggedEvent = context.eventRecords[0],
                toAdd = [],
                copyKeyPressed = this.getCopyKeyPressed(),
                eventStore = schedulerView.eventStore;

        var resourceRecord = context.resourceRecord;

        if (copyKeyPressed) {
            draggedEvent = draggedEvent.fullCopy();

            toAdd.push(draggedEvent);
        }

        // Process original dragged record
        draggedEvent.beginEdit();

        // in calendar view resources are just time spans, so we have to skip this part
        if (newResource !== resourceRecord && resourceRecord instanceof Sch.model.Resource && newResource instanceof Sch.model.Resource) {
            if (!copyKeyPressed) {
                draggedEvent.unassign(resourceRecord);
            }
            draggedEvent.assign(newResource);
        }

        draggedEvent.setStartDate(context.startDate, true, eventStore.skipWeekendsDuringDragDrop);
        draggedEvent.endEdit();

        // Process related records
        var timeDiff = context.timeDiff,
                isTreeStore = Ext.data.TreeStore && resourceStore instanceof Ext.data.TreeStore;

        var flatResourceStore = isTreeStore ? schedulerView.store : resourceStore;

        var indexDiff = flatResourceStore.indexOf(resourceRecord) - flatResourceStore.indexOf(newResource);

        Ext.each(context.relatedEventRecords, function(related) {
            // grabbing resource early, since after ".copy()" the record won't belong to any store
            // and ".getResource()" won't work
            var relatedResource = related.getResource(null, eventStore),
                    sdate;

            if (copyKeyPressed) {
                related = related.fullCopy();
                toAdd.push(related);
            }

            related.beginEdit();

            // calculate new startDate (and round it) based on timeDiff
            sdate = me.adjustStartDate(related.getStartDate(), timeDiff);
            related.setStartDate(sdate, true, eventStore.skipWeekendsDuringDragDrop);

            var newIndex = flatResourceStore.indexOf(relatedResource) - indexDiff;

            if (newIndex < 0)
                newIndex = 0;
            if (newIndex >= flatResourceStore.getCount())
                newIndex = flatResourceStore.getCount() - 1;

            related.setResource(flatResourceStore.getAt(newIndex));

            related.endEdit();
        });

        if (toAdd.length)
            eventStore.append(toAdd);

        // Tell the world there was a succesful drop
        schedulerView.fireEvent('eventdrop', schedulerView, context.eventRecords, copyKeyPressed);
    },
    isValidDrop: function(oldResource, newResource, sourceEvent) {
        // Not allowed to assign an event twice to the same resource -
        // this may happen when scheduler is loaded with the resource store and task store data from gantt
        // same event (task) may be rendered several times in this case
        if (oldResource !== newResource && sourceEvent.isAssignedTo(newResource)) {
            return false;
        }

        return true;
    },
    resolveResource: function(xy, e) {
        var proxyDom = this.proxy.el.dom;
        var bodyScroll = this.dragData.bodyScroll;

        proxyDom.style.display = 'none';
        var node = document.elementFromPoint(xy[0] - bodyScroll.left, xy[1] - bodyScroll.top);

        // IE8 likes it twice, for simulated events..
        if (Ext.isIE8 && e && e.browserEvent.synthetic) {
            node = document.elementFromPoint(xy[0] - bodyScroll.left, xy[1] - bodyScroll.top);
        }

        proxyDom.style.display = 'block';

        if (!node) {
            return null;
        }

        var view = this.schedulerView;

        if (!node.className.match(view.timeCellCls)) {
            /* Bug Fix */
//            var parent = Ext.fly(node).up('.' + view.timeCellCls);
            var parent = $(node).closest('td')[0];
            if (parent) {
//                node = parent.dom;
                node = parent;
            } else {
                return null;
            }
        }
        return view.resolveResource(node);
    },
//    adjustStartDate: function(startDate, timeDiff) {
//        var s = this.schedulerView;
//        return s.timeAxis.roundDate(new Date(startDate - 0 + timeDiff), s.snapRelativeToEventStartDate ? startDate : false);
//    },
    adjustStartDate: function(startDate, timeDiff) {
        var s = this.schedulerView;
//        console.log(startDate);
//        console.log(timeDiff);
//        console.log(new Date(startDate - 0 + timeDiff));
//        console.log(RigScheduler.config.Util.daylightSavingAdjust(new Date(startDate - 0 + timeDiff)));
//        console.log(s.timeAxis.roundDate(RigScheduler.config.Util.daylightSavingAdjust(new Date(startDate - 0 + timeDiff)), s.snapRelativeToEventStartDate ? startDate : false));
        return RigScheduler.config.Util.daylightSavingAdjust(new Date(startDate - 0 + timeDiff));
//        return s.timeAxis.roundDate(RigScheduler.config.Util.daylightSavingAdjust(new Date(startDate - 0 + timeDiff)), s.snapRelativeToEventStartDate ? startDate : false);
    },
    // private
    updateDragContext: function(e) {
        var dd = this.dragData,
                xy = e.type === 'scroll' ? this.lastXY : e.getXY();

        if (!dd.refElement) {
            return;
        }

        var s = this.schedulerView,
                proxyRegion = dd.refElement.getRegion();

        if (s.timeAxis.isContinuous()) {
            if (
                    (s.isHorizontal() && this.minX < xy[0] && xy[0] < this.maxX) ||
                    (s.isVertical() && this.minY < xy[1] && xy[1] < this.maxY)
                    ) {
                var newDate = s.getDateFromCoordinate(this.getCoordinate(xy));

                dd.timeDiff = newDate - dd.sourceDate;
                // calculate and round new startDate based on actual dd.timeDiff
                dd.startDate = this.adjustStartDate(dd.origStart, dd.timeDiff);
                dd.endDate = new Date(dd.startDate - 0 + dd.duration);
            }

        } else {
            var range = this.resolveStartEndDates(proxyRegion);

            dd.startDate = range.startDate;
            dd.endDate = range.endDate;

            dd.timeDiff = dd.startDate - dd.origStart;
        }

        dd.newResource = s.constrainDragToResource ?
                dd.resourceRecord
                :
                this.resolveResource([proxyRegion.left + dd.offsets[ 0 ], proxyRegion.top + dd.offsets[ 1 ]], e);

        if (dd.newResource) {
            dd.valid = this.validatorFn.call(this.validatorFnScope || this, dd.eventRecords, dd.newResource, dd.startDate, dd.duration, e);
        } else {
            dd.valid = false;
        }
    },
    /**
     * Provide your custom implementation of this to allow additional event records to be dragged together with the original one.
     * @param {Sch.model.Event} eventRecord The eventRecord about to be dragged
     * @return {Sch.model.Event[]} An array of event records to drag together with the original event
     */
    getRelatedRecords: function(sourceEventRecord) {
        var s = this.schedulerView;
        var sm = s.selModel;
        var result = [];
        /*Custom Implementation Start*/
        if (RigScheduler.config.Constants.IsGroupingEnabled === true) {
            result = RigScheduler.config.Util.getLinkedRecords(sourceEventRecord, s.eventStore);
        }
        /*Custom Implementation End*/
        if (sm.selected.getCount() > 1) {
            sm.selected.each(function(rec) {
                if (rec !== sourceEventRecord && rec.isDraggable() !== false) {
                    result.push(rec);
                }
            });
        }

        return result;
    },
    /**
     * This function should return a DOM node representing the markup to be dragged. By default it just returns the selected element(s) that are to be dragged.
     * If dragging multiple events, the clone of the original item should be assigned the special CSS class 'sch-dd-ref'
     * @param {Ext.Element} sourceEl The event element that is the source drag element
     * @param {Object} dragData The drag drop context object
     * @return {HTMLElement} The DOM node to drag
     */
    getDragElement: function(sourceEl, dragData) {
        var eventEls = dragData.eventEls;
        var copy;

        var offsetX = dragData.offsets[ 0 ];
        var offsetY = dragData.offsets[ 1 ];

        if (eventEls.length > 1) {
            var ctEl = Ext.core.DomHelper.createDom({
                tag: 'div',
                cls: 'sch-dd-wrap',
                style: {overflow: 'visible'}
            });

            Ext.Array.each(eventEls, function(el) {
                copy = el.dom.cloneNode(true);

                copy.id = Ext.id();

                if (el.dom === sourceEl.dom) {
                    Ext.fly(copy).addCls("sch-dd-ref");
                }

                ctEl.appendChild(copy);

                var elOffsets = el.getOffsetsTo(sourceEl);

                // Adjust each element offset to the source event element
                Ext.fly(copy).setStyle({
                    left: elOffsets[ 0 ] - offsetX + 'px',
                    top: elOffsets[ 1 ] - offsetY + 'px'
                });
            });

            return ctEl;
        } else {
            copy = sourceEl.dom.cloneNode(true);
            copy.id = Ext.id();

            copy.style.left = -offsetX + 'px';
            copy.style.top = -offsetY + 'px';

            Ext.fly(copy).addCls("sch-dd-ref");

            return copy;
        }
    },
    onDragDrop: function(e, id) {
        this.updateDragContext(e);

        var me = this,
                s = me.schedulerView,
                target = me.cachedTarget || Ext.dd.DragDropMgr.getDDById(id),
                dragData = me.dragData,
                modified = false,
                doFinalize = true;

        // Used later in finalizeDrop
        dragData.ddCallbackArgs = [target, e, id];

        // In case Ext JS 5 stops the 'mouseup' event, turn off the tooltip move tracking manually
        if (this.tip) {
            this.tip.onMyMouseUp();
        }
        Ext.ComponentQuery.query('container[itemId=startDateContainer]')[0].hide();
        Ext.ComponentQuery.query('container[itemId=scheduleNameContainer]')[0].show();
        if (dragData.valid && dragData.startDate && dragData.endDate) {
            dragData.finalize = function() {
                me.finalize.apply(me, arguments);
            };

            // Allow implementor to take control of the flow, by returning false from this listener,
            // to show a confirmation popup etc.
            doFinalize = s.fireEvent('beforeeventdropfinalize', me, dragData, e) !== false;

            // Internal validation, making sure all dragged records fit inside the view
            if (doFinalize && me.isValidDrop(dragData.resourceRecord, dragData.newResource, dragData.eventRecords[ 0 ])) {
                modified = (dragData.startDate - dragData.origStart) !== 0 || dragData.newResource !== dragData.resourceRecord;
            }
        }

        if (doFinalize) {
            me.finalize(dragData.valid && modified);
        }
    },
    finalize: function(updateRecords) {
        var me = this,
                view = me.schedulerView,
                eventStore = view.eventStore,
                dragData = me.dragData;

        if (me.tip) {
            me.tip.hide();
        }

        if (updateRecords) {
            // Catch one more edge case, if a taskStore with calendars is used - there is a possible scenario where the UI isn't
            // repainted. In gantt+scheduler demo, move an event in the scheduler a few px and it disappears since Calendar adjusts its start date and scheduler is unaware of this.
            var updated,
                    checkerFn = function() {
                        updated = true;
                    };

            eventStore.on('update', checkerFn, null, {single: true});
            me.updateRecords(dragData);
            eventStore.un('update', checkerFn, null, {single: true});

            if (!updated) {
                me.onInvalidDrop.apply(me, dragData.ddCallbackArgs);
            } else {
                // For our good friend IE9, the pointer cursor gets stuck without the defer
                if (Ext.isIE9) {
                    me.proxy.el.setStyle('visibility', 'hidden');
                    Ext.Function.defer(me.onValidDrop, 10, me, dragData.ddCallbackArgs);
                } else {
                    me.onValidDrop.apply(me, dragData.ddCallbackArgs);
                }
                view.fireEvent('aftereventdrop', view, dragData.eventRecords);
            }

        } else {
            me.onInvalidDrop.apply(me, dragData.ddCallbackArgs);
        }
    },
    // HACK: Override for IE, if you drag the task bar outside the window or iframe it crashes (missing e.target)
    // https://www.assembla.com/spaces/bryntum/tickets/716
    onInvalidDrop: function(target, e, id) {
        if (Ext.isIE && !e) {
            e = target;
            target = target.getTarget() || document.body;
        }

        if (this.tip) {
            this.tip.hide();
        }

        this.setVisibilityForSourceEvents(true);

        var s = this.schedulerView,
                retVal = this.callParent([target, e, id]);

        s.fireEvent('aftereventdrop', s, this.dragData.eventRecords);

        return retVal;
    },
    resolveStartEndDates: function(proxyRegion) {
        var dd = this.dragData,
                startEnd,
                start = dd.origStart,
                end = dd.origEnd;

        var DATE = Sch.util.Date;

        if (!dd.startsOutsideView) {
            startEnd = this.schedulerView.getStartEndDatesFromRegion(proxyRegion, 'round');
            if (startEnd) {
                start = startEnd.start || dd.startDate;
                end = DATE.add(start, DATE.MILLI, dd.duration);
            }
        } else if (!dd.endsOutsideView) {
            startEnd = this.schedulerView.getStartEndDatesFromRegion(proxyRegion, 'round');
            if (startEnd) {
                end = startEnd.end || dd.endDate;
                start = DATE.add(end, DATE.MILLI, -dd.duration);
            }
        }

        return {
            startDate: start,
            endDate: end
        };
    }

});
