/*

Ext Gantt 2.2.23
Copyright(c) 2009-2014 Bryntum AB
http://bryntum.com/contact
http://bryntum.com/license

*/
/**

 @class Gnt.view.ResourceHistogram
 @extends Sch.view.TimelineGridView

 A view of the resource histogram panel. Use the {@link Gnt.panel.ResourceHistogram#getSchedulingView} method to get its instance from gantt panel.

 */
 Ext.define('Gnt.view.ResourceHistogram', {
    extend              : 'Sch.view.TimelineGridView',

    alias               : 'widget.resourcehistogramview',

    requires    : [
        'Ext.XTemplate',
        'Ext.util.Format',
        'Sch.util.Date',
        'Gnt.model.Resource'
    ],

    _cmpCls             : 'gnt-resourcehistogramview',

    scheduledEventName  : 'bar',

    // private
    eventSelector       : '.gnt-resourcehistogram-bar',

    barTpl              : null,

    barRenderer         : Ext.emptyFn,

    barCls              : 'gnt-resourcehistogram-bar',

    lineTpl             : null,

    lineCls             : 'gnt-resourcehistogram-line',

    limitLineTpl        : null,

    limitLineCls        : 'gnt-resourcehistogram-limitline',

    limitLineWidth      : 1,

    rowHeight           : 60,

    labelMode           : false,

    labelPercentFormat  : '0',

    labelUnitsFormat    : '0.0',

    unitHeight          : null,
    availableRowHeight  : null,

    initComponent : function (config) {


        if (this.barCls) {
            this.eventSelector = '.' + this.barCls;
        }

        // bar template
        if (!this.barTpl) {
            this.barTpl = new Ext.XTemplate(
                '<tpl for=".">',
                    '<div id="{id}" class="'+ this.barCls +' {cls}" gnt-bar-index="{index}" style="left:{left}px;top:{top}px;height:{height}px;width:{width}px"></div>',
                    '<tpl if="text !== \'\'">',
                        '<span class="'+ this.barCls +'-text" style="left:{left}px;">{text}</span>',
                    '</tpl>',
                '</tpl>'
            );
        }

        // scale line template
        if (!this.lineTpl) {
            this.lineTpl = new Ext.XTemplate(
                '<tpl for=".">',
                    '<div class="'+ this.lineCls +' {cls}" style="top:{top}px;"></div>',
                '</tpl>'
            );
        }

        // limit line template
        if (!this.limitLineTpl) {
            this.limitLineTpl = new Ext.XTemplate(
                '<tpl for=".">',
                    '<div class="'+ this.limitLineCls +' {cls}" style="left:{left}px;top:{top}px;width:{width}px;height:{height}px"></div>',
                '</tpl>'
            );
        }

        this.addEvents(
            /**
            * @event barclick
            * Fires when a histogram bar is clicked
            *
            * @param {Gnt.view.ResourceHistogram} view The histogram panel view.
            * @param {Object} context Object containing a description of the clicked bar.
            * @param {Gnt.model.Resource} context.resource The resource record.
            * @param {Date} context.startDate Start date of corresponding period.
            * @param {Date} context.endDate End date of corresponding period.
            * @param {Number} context.allocationMS Resource allocation time in milliseconds.
            * @param {Number} context.totalAllocation Resource allocation (in percents).
            * @param {Gnt.model.Assignment[]} context.assignments List of resource assignments for the corresponding period.
            * @param {Ext.EventObject} e The event object
            */
            'barclick',
            /**
            * @event bardblclick
            * Fires when a histogram bar is double clicked
            *
            * @param {Gnt.view.ResourceHistogram} view The histogram panel view.
            * @param {Object} context Object containing description of clicked bar.
            * @param {Gnt.model.Resource} context.resource The resource record.
            * @param {Date} context.startDate Start date of corresponding period.
            * @param {Date} context.endDate End date of corresponding period.
            * @param {Number} context.allocationMS Resource allocation time in milliseconds.
            * @param {Number} context.totalAllocation Resource allocation (in percents).
            * @param {Gnt.model.Assignment[]} context.assignments List of resource assignments for the corresponding period.
            * @param {Ext.EventObject} e The event object
            */
            'bardblclick',
            /**
            * @event barcontextmenu
            * Fires when contextmenu is activated on a histogram bar
            *
            * @param {Gnt.view.ResourceHistogram} view The histogram panel view.
            * @param {Object} context Object containing description of clicked bar.
            * @param {Gnt.model.Resource} context.resource The resource record.
            * @param {Date} context.startDate Start date of corresponding period.
            * @param {Date} context.endDate End date of corresponding period.
            * @param {Number} context.allocationMS Resource allocation time in milliseconds.
            * @param {Number} context.totalAllocation Resource allocation (in percents).
            * @param {Gnt.model.Assignment[]} context.assignments List of resource assignments for the corresponding period.
            * @param {Ext.EventObject} e The event object
            */
            'barcontextmenu'
        );

        this.callParent(arguments);

        // calculate pixels per scale step
        this.unitHeight = this.getAvailableRowHeight() / (this.scaleMax - this.scaleMin + this.scaleStep);
    },

    onUpdate : function (store, resource, operation, changedFieldNames) {
        // if calendar on resource was changed
        var resourceModel = store.model;

        if (Ext.Array.indexOf(resourceModel.prototype.calendarIdField, changedFieldNames) > -1) {

            // reload allocation data for resource
            this.histogram.loadAllocationData(resource, true);

            // unbind old listeners from resource calendar
            this.histogram.unbindResourceCalendarListeners(resource);

            // if new resource calendar differs from project one
            var calendar    = resource.getOwnCalendar();
            if (calendar && calendar !== this.histogram.calendar) {
                // bind listener on it
                this.histogram.bindResourceCalendarListeners(resource, calendar);
            }
        }

        this.callParent(arguments);
    },

    onDataRefresh : function () {
        // reload allocation data
        this.histogram.loadAllocationData(null, true);

        // bind listeners to resources calendars
        this.histogram.bindCalendarListeners();

        this.callParent(arguments);
    },

    // histogram scale lines renderer
    renderLines : function (histogram) {
        return this.lineTpl.apply(this.prepareLines(histogram));
    },

    // prepare data for scale lines renderer
    prepareLines : function (histogram) {
        var value       = histogram.scaleMin,
            labelStep   = histogram.scaleLabelStep,
            rowHeight   = this.getAvailableRowHeight(),
            tplData     = [],
            line        = {},
            lineCls     = this.lineCls,
            cls         = lineCls+'min';

        // if scale point array specified
        if (histogram.scalePoints) {
            var point;
            for (var i = 0, l = histogram.scalePoints.length; i < l; i++) {
                point = histogram.scalePoints[i];

                tplData.push({
                    value   : point.value,
                    top     : point.top || Math.round(rowHeight - this.unitHeight * (point.value - histogram.scaleMin)),
                    cls     : point.cls + (point.label ? ' '+lineCls+'-label' : '') + (i === 0 ? ' '+lineCls+'-min' : (i == l ? ' '+lineCls+'-max' : ''))
                });
            }

        // otherwise we have to calculate line top-coordinates
        } else {
            // loop from scaleMin up to scaleMax
            while (value <= histogram.scaleMax) {

                tplData.push({
                    value   : value,
                    top     : Math.round(rowHeight - this.unitHeight * (value - histogram.scaleMin)),
                    cls     : cls
                });

                // increment by scale step size
                value   += histogram.scaleStep;

                cls     = value % labelStep ? '' : lineCls+'-label';

                if (value == histogram.scaleMax) cls += ' '+lineCls+'-max';
            }

            // ensure that we have scaleMax as last tplData element (we can step over it for some stepSize values)
            if (tplData.length && tplData[tplData.length - 1].value !== histogram.scaleMax) {
                tplData.push({
                    value   : histogram.scaleMax,
                    top     : Math.round(rowHeight - this.unitHeight * (histogram.scaleMax - histogram.scaleMin)),
                    cls     : (histogram.scaleMax % labelStep ? '' : lineCls+'-label') + ' '+lineCls+'-max'
                });
            }
        }

        return tplData;
    },

    renderLimitLines : function (histogram, data) {
        return this.limitLineTpl.apply(this.prepareLimitLines(histogram, data));
    },

    prepareLimitLines : function (histogram, data) {
        if (!data) return;

        var tplData     = [],
            rowHeight   = this.getAvailableRowHeight(),
            lineCls     = this.limitLineCls,
            prevAllocation;

        for (var i = 0, l = data.length; i < l; i++) {

            var left    = this.getXFromDate(data[i].startDate || histogram.getStart(), true);

            var tplItem = {
                left    : left,
                width   : this.getXFromDate(data[i].endDate || histogram.getEnd(), true) - left,
                top     : '',
                height  : 0,
                cls     : ''
            };

            // get allocation in histogram.scaleUnit units
            var allocation  = histogram.calendar.convertMSDurationToUnit(data[i].allocationMS, histogram.scaleUnit);

            var visible     = true;
            // if the line doesn't fit into row height
            if (allocation * this.unitHeight > rowHeight) {
                allocation  = histogram.scaleMax + histogram.scaleStep;
                visible     = false;

            } else if (allocation < histogram.scaleMin) {
                allocation  = histogram.scaleMin;
                visible     = false;
            }

            // get top-position based on max possible allocation
            tplItem.top     = Math.round(rowHeight - (allocation - histogram.scaleMin) * this.unitHeight);

            if (visible) {
                tplItem.cls += ' '+lineCls+'-top';
            }

            // if it's not the first segment let's calculate current segment height
            if (tplData[0]) {
                tplData.push({
                    left    : left,
                    width   : 1,
                    top     : Math.min(tplItem.top, tplData[tplData.length - 1].top),
                    height  : Math.round(Math.abs(tplData[tplData.length - 1].top - tplItem.top) + this.limitLineWidth),
                    cls     : lineCls + '-top'
                });
            }

            prevAllocation  = allocation;

            tplData.push(tplItem);
        }

        return tplData;
    },

    renderBars : function (histogram, data, resourceId) {
        return this.barTpl.apply(this.prepareBars(histogram, data, resourceId));
    },

    prepareBars : function (histogram, data, resourceId) {
        if (!data) return;

        // loop over periods that we have for the resource
        var tplData     = [],
            rowHeight   = this.getAvailableRowHeight(),
            barCls      = this.barCls,
            tplItem,
            allocation;
        for (var i = 0, l = data.length; i < l; i++) {

            // if resource is allocated
            if (data[i].totalAllocation) {

                // get allocation in units (hours by default)
                allocation          = histogram.calendar.convertMSDurationToUnit(data[i].allocationMS, histogram.scaleUnit);

                tplItem = Ext.apply({
                    id      : resourceId + '-' + i,
                    index   : i,
                    left    : this.getXFromDate(data[i].startDate, true),
                    width   : this.getXFromDate(data[i].endDate, true) - this.getXFromDate(data[i].startDate, true),
                    height  : rowHeight,
                    top     : 0,
                    text    : '',
                    cls     : ''
                }, this.barRenderer(resourceId, data[i]));

                // if label has to be shown
                if (this.labelMode) {
                    // what type of label requested
                    switch (this.labelMode) {
                        case 'percent'  :
                            tplItem.text = Ext.util.Format.number(data[i].totalAllocation, this.labelPercentFormat) + '%';
                            break;

                        case 'units'    :
                            tplItem.text = Ext.util.Format.number(allocation,  this.labelUnitsFormat) + Sch.util.Date.getShortNameOfUnit(histogram.scaleUnit);
                            break;

                        // custom template
                        default         :
                            tplItem.text = this.labelMode.apply({
                                allocation  : allocation,
                                percent     : data[i].totalAllocation
                            });
                    }
                }

                // if the bar fits in row height
                if (allocation <= histogram.scaleMax + histogram.scaleStep) {
                    tplItem.height  = allocation >= histogram.scaleMin ? Math.round((allocation - histogram.scaleMin) * this.unitHeight) : 0;
                    tplItem.top     = rowHeight - tplItem.height;
                // if bar is higher than row height
                } else {
                    // add class to indicate it
                    tplItem.cls     = barCls+'-partofbar';
                }

                // overworking (allocation > 100%)
                if (data[i].totalAllocation > 100) {
                    tplItem.cls = barCls+'-overwork';
                }

                tplData.push(tplItem);
            }
        }
        return tplData;
    },

    columnRenderer : function (val, meta, resource, rowIndex, colIndex) {
        var resourceId  = resource.getInternalId(),
            view        = this.normalGrid.getView(),
            data        = this.allocationData[resourceId],
            bars        = data && data.bars,
            maxBars     = data && data.maxBars;

        // render: scale lines (if requested),
        return (this.showScaleLines ? view.renderLines(this) : '') +
            // histogram bars,
            view.renderBars(this, bars, resourceId) +
            // max resource allocation line (if requested)
            (this.showLimitLines ? view.renderLimitLines(this, maxBars) : '');
    },

    getAvailableRowHeight : function () {
        if (this.availableRowHeight) return this.availableRowHeight;

        this.availableRowHeight    = this.rowHeight - this.cellTopBorderWidth - this.cellBottomBorderWidth;

        return this.availableRowHeight;
    },

    resolveEventRecord : function (el) {
        var node = this.findItemByChild(el);
        if (node) {
            var resource = this.getRecord(node);
            if (resource) {
                var result = {
                    resource    : resource
                };
                var data    = this.histogram.allocationData[resource.getInternalId()];
                var index   = el.getAttribute('gnt-bar-index');
                var bar     = data.bars[index];
                result.startDate        = bar.startDate;
                result.endDate          = bar.endDate;
                result.assignments      = bar.assignments;
                result.allocationMS     = bar.allocationMS;
                result.totalAllocation  = bar.totalAllocation;

                return result;
            }
        }
        return null;
    },

    getDataForTooltipTpl : function (record) {
        return record;
    }

});
