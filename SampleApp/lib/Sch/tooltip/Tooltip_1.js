/*

Ext Scheduler 2.5.2
Copyright(c) 2009-2014 Bryntum AB
http://bryntum.com/contact
http://bryntum.com/license

*/
/**
@class Sch.tooltip.Tooltip
@extends Ext.ToolTip
@private

Internal plugin showing a tooltip with event start/end information.
*/
Ext.define("Sch.tooltip.Tooltip", {
    extend : "Ext.tip.ToolTip",

    requires : [
        'Sch.tooltip.ClockTemplate'
    ],

    autoHide            : false,
    anchor              : 'b',
    padding             : '0 3 0 0',
    showDelay           : 0,
    hideDelay           : 0,
    quickShowInterval   : 0,
    dismissDelay        : 0,
    trackMouse          : false,
    valid               : true,
    anchorOffset        : 5,
    shadow              : false,
    frame               : false,

    constructor : function(config) {
        var clockTpl = new Sch.tooltip.ClockTemplate();

        this.renderTo = document.body;
        this.startDate = this.endDate = new Date();

        if (!this.template) {
            this.template = Ext.create("Ext.XTemplate",
                '<div class="{[values.valid ? "sch-tip-ok" : "sch-tip-notok"]}">',
                   '{[this.renderClock(values.startDate, values.startText, "sch-tooltip-startdate")]}',
                   '{[this.renderClock(values.endDate, values.endText, "sch-tooltip-enddate")]}',
                '</div>',
                {
                    compiled : true,
                    disableFormats : true,

                    renderClock : function(date, text, cls) {
                        return clockTpl.apply({
                            date : date, 
                            text : text,
                            cls : cls
                        });
                    }
                }
            );
        }

        this.callParent(arguments);
    },
    
    // set redraw to true if you want to force redraw of the tip
    // required to update drag tip after scroll
    update : function(startDate, endDate, valid, redraw) {

        if (this.startDate - startDate !== 0 ||
            this.endDate - endDate !== 0 ||
            this.valid !== valid ||
            redraw) {
            
            // This will be called a lot so cache the values
            this.startDate = startDate;
            this.endDate = endDate;
            this.valid = valid;
            var startText = this.schedulerView.getFormattedDate(startDate),
                endText = this.schedulerView.getFormattedEndDate(endDate, startDate);

            // If resolution is day or greater, and end date is greater then start date
            if (this.mode === 'calendar' && endDate.getHours() === 0 && endDate.getMinutes() === 0 && 
                !(endDate.getYear() === startDate.getYear() && endDate.getMonth() === startDate.getMonth() && endDate.getDate() === startDate.getDate())) {
                endDate = Sch.util.Date.add(endDate, Sch.util.Date.DAY,0);
            }
        
            this.callParent([
                this.template.apply({
                    valid       : valid,
                    startDate   : startDate,
                    endDate     : endDate,
                    startText   : startText,
                    endText     : endText
                })
            ]);
        }
    },
     
    show : function(el, xOffset) {
        if (!el) {
            return;
        }
        
        // xOffset has to have default value
        // when it's 18 tip is aligned to left border
        xOffset = xOffset || 18;

        if (Sch.util.Date.compareUnits(this.schedulerView.getTimeResolution().unit, Sch.util.Date.DAY) >= 0) {
            this.mode = 'calendar';
            this.addCls('sch-day-resolution');
        } else {
            this.mode = 'clock';
            this.removeCls('sch-day-resolution');
        }
        this.mouseOffsets = [xOffset - 18, -7];
        
        this.setTarget(el);
        this.callParent();
        this.alignTo(el, 'bl-tl', this.mouseOffsets);

        this.mon(Ext.getDoc(), 'mousemove', this.onMyMouseMove, this);
        this.mon(Ext.getDoc(), 'mouseup', this.onMyMouseUp, this, { single : true });
    },

    onMyMouseMove : function() {
        this.el.alignTo(this.target, 'bl-tl', this.mouseOffsets);
    },

    onMyMouseUp : function() {
        this.mun(Ext.getDoc(), 'mousemove', this.onMyMouseMove, this);
    },

    afterRender : function() {
        this.callParent(arguments);

        // In slower browsers, the mouse pointer may end up over the tooltip interfering with drag drop etc
        this.el.on('mouseenter', this.onElMouseEnter, this);
    },

    onElMouseEnter : function() {
        this.alignTo(this.target, 'bl-tl', this.mouseOffsets);
    }
}); 
