/*

Ext Scheduler 2.5.2
Copyright(c) 2009-2014 Bryntum AB
http://bryntum.com/contact
http://bryntum.com/license

*/
/**
@class Sch.plugin.Pan

A plugin (ptype = 'scheduler_pan') enabling panning by clicking and dragging in a scheduling view.

To add this plugin to your scheduler or gantt view:

        var scheduler = Ext.create('Sch.panel.SchedulerGrid', {
            ...

            resourceStore   : resourceStore,
            eventStore      : eventStore,

            plugins         : [
                Ext.create('Sch.plugin.Pan', { enableVerticalPan : true })
            ]
        });
*/
Ext.define("Sch.plugin.Pan", {
    extend        : 'Ext.AbstractPlugin',
    alias         : 'plugin.scheduler_pan',
    lockableScope : 'top',

    /**
     * @cfg {Boolean} enableVerticalPan
     * True to allow vertical panning
     */
    enableVerticalPan : true,

    statics : {
        /**
         * @cfg {Number} KEY_SHIFT Constant for shift key
         */
        KEY_SHIFT : 1,

        /**
         * @cfg {Number} KEY_CTRL Constant for ctrl / meta key
         */
        KEY_CTRL  : 2,

        /**
         * @cfg {Number} KEY_ALT Constant for alt key
         */
        KEY_ALT   : 4,

        /**
         * @cfg {Number} KEY_ALL Constant for all modifier keys (shift, ctrl / meta, alt)
         */
        KEY_ALL   : 7
    },

    /**
     * @cfg {Number} disableOnKey Specifies which key should be pressed to disable panning.
     * See {@link #KEY_SHIFT}, {@link #KEY_CTRL}, {@link #KEY_ALT}, {@link #KEY_ALL}.
     * For example to disable panning when shift or ctrl is pressed:

        Ext.create('Sch.plugin.Pan', {
            disableOnKey : Sch.plugin.Pan.KEY_SHIFT + Sch.plugin.Pan.KEY_CTRL
        })

     */
    disableOnKey : 0,

    panel : null,

    constructor : function (config) {
        Ext.apply(this, config);
    },

    init : function (pnl) {
        this.panel = pnl.normalGrid || pnl;
        this.view = pnl.getSchedulingView();

        this.view.on('afterrender', this.onRender, this);
    },

    onRender : function (s) {
        this.view.el.on('mousedown', this.onMouseDown, this);
    },

    onMouseDown : function (e, t) {
        var self = this.self,
            disableOnKey = this.disableOnKey;

        // Ignore event if #disableOnKey is specified and at least one of the
        // functional keys is pressed
        if ((e.shiftKey && (disableOnKey & self.KEY_SHIFT)) ||
            (e.ctrlKey && (disableOnKey & self.KEY_CTRL)) ||
            (e.altKey && (disableOnKey & self.KEY_ALT))) {
            return;
        }

        // ignore clicks on tasks and events
        if (e.getTarget('.' + this.view.timeCellCls, 10) && !e.getTarget(this.view.eventSelector)) {
            this.mouseX = e.getPageX();
            this.mouseY = e.getPageY();
            Ext.getBody().on('mousemove', this.onMouseMove, this);
            Ext.getDoc().on('mouseup', this.onMouseUp, this);

            // For IE (and FF if using frames), if you move mouse onto the browser chrome and release mouse button
            // we won't know about it. Next time mouse enters the body, cancel any ongoing pan activity as a fallback.
            if (Ext.isIE || Ext.isGecko) {
                Ext.getBody().on('mouseenter', this.onMouseUp, this);
            }

            // required for some weird chrome bug/behavior, when whole panel was scrolled-out
            e.stopEvent();
        }
    },

    onMouseMove : function (e) {
        e.stopEvent();

        var x = e.getPageX(),
            y = e.getPageY(),
            xDelta = x - this.mouseX,
            yDelta = y - this.mouseY;

        this.panel.scrollByDeltaX(-xDelta);
        this.mouseX = x;
        this.mouseY = y;

        if (this.enableVerticalPan) {
            this.panel.scrollByDeltaY(-yDelta);
        }
    },

    onMouseUp : function (e) {
        Ext.getBody().un('mousemove', this.onMouseMove, this);
        Ext.getDoc().un('mouseup', this.onMouseUp, this);

        if (Ext.isIE || Ext.isGecko) {
            Ext.getBody().un('mouseenter', this.onMouseUp, this);
        }
    }
});
