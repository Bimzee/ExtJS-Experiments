/*

Ext Scheduler 2.5.2
Copyright(c) 2009-2014 Bryntum AB
http://bryntum.com/contact
http://bryntum.com/license

*/
/**
 * @class 
 * @static
 * @private
 * Private utility class for dealing with scroll triggering based on various mousemove events in the UI
 */
Ext.define('Sch.util.ScrollManager', {
    singleton      : true,

    vthresh        : 25,
    hthresh        : 25,
    increment      : 100,
    frequency      : 500,
    animate        : true,
    animDuration   : 200,
    activeEl       : null,
    scrollElRegion : null,
    scrollProcess  : {},
    pt             : null,
    scrollWidth    : null,
    scrollHeight   : null,

    // "horizontal", "vertical" or "both"
    direction		: 'both',

    constructor : function () {
        this.doScroll = Ext.Function.bind(this.doScroll, this);
    },

    triggerRefresh : function () {

        if (this.activeEl) {

            this.refreshElRegion();

            this.clearScrollInterval();
            this.onMouseMove();
        }
    },

    doScroll : function () {
        var scrollProcess   = this.scrollProcess,
            scrollProcessEl = scrollProcess.el,
            dir             = scrollProcess.dir[0],
            increment       = this.increment;

        // Make sure we don't scroll too far
        if (dir === 'r') {
            increment = Math.min(increment, this.scrollWidth - this.activeEl.dom.scrollLeft - this.activeEl.dom.clientWidth);
        } else if (dir === 'd') {
            increment = Math.min(increment, this.scrollHeight - this.activeEl.dom.scrollTop - this.activeEl.dom.clientHeight);
        }

        scrollProcessEl.scroll(dir, Math.max(increment, 0), {
            duration : this.animDuration,
            callback : this.triggerRefresh,
            scope    : this
        });
    },

    clearScrollInterval : function () {
        var scrollProcess = this.scrollProcess;

        if (scrollProcess.id) {
            clearTimeout(scrollProcess.id);
        }

        scrollProcess.id = 0;
        scrollProcess.el = null;
        scrollProcess.dir = "";
    },

	isScrollAllowed : function(dir){
		
		switch(this.direction){
			case 'both':
				return true;
				
			case 'horizontal':
				return dir === 'right' || dir === 'left';	
		
			case 'vertical':
				return dir === 'up' || dir === 'down';
				
			default:
				throw 'Invalid direction: ' + this.direction;
		
		}
		
	},

    startScrollInterval : function (el, dir) {

       if(!this.isScrollAllowed(dir)){
			return;
       }
        
        // HACK reverse scroll due to bug in Ext JS 4.2.1
        if (Ext.versions.extjs.isLessThan('4.2.2')) {
            if (dir[0] === 'r') dir = 'left';
            else if (dir[0] === 'l') dir = 'right';
        }

        this.clearScrollInterval();
        this.scrollProcess.el = el;
        this.scrollProcess.dir = dir;

        this.scrollProcess.id = setTimeout(this.doScroll, this.frequency);
    },

    onMouseMove : function (e) {

        var pt = e ? e.getPoint() : this.pt,
            x = pt.x,
            y = pt.y,
            scrollProcess = this.scrollProcess,
            id,
            el = this.activeEl,
            region = this.scrollElRegion,
            elDom = el.dom,
            me = this;

        this.pt = pt;

        if (region && region.contains(pt) && el.isScrollable()) {
            if (region.bottom - y <= me.vthresh && (this.scrollHeight - elDom.scrollTop - elDom.clientHeight > 0)) {

                if (scrollProcess.el != el) {
                    this.startScrollInterval(el, "down");
                }
                return;
            } else if (region.right - x <= me.hthresh && (this.scrollWidth - elDom.scrollLeft - elDom.clientWidth > 0) ) {

                if (scrollProcess.el != el) {
                    this.startScrollInterval(el, "right");
                }
                return;
            } else if (y - region.top <= me.vthresh && el.dom.scrollTop > 0) {
                if (scrollProcess.el != el) {
                    this.startScrollInterval(el, "up");
                }
                return;
            } else if (x - region.left <= me.hthresh && el.dom.scrollLeft > 0) {
                if (scrollProcess.el != el) {
                    this.startScrollInterval(el, "left");
                }
                return;
            }
        }

        this.clearScrollInterval();
    },

    refreshElRegion : function () {
        this.scrollElRegion = this.activeEl.getRegion();

    },

    // Pass an element, and optionally a direction ("horizontal", "vertical" or "both")
    activate : function (el, direction) {
        
        this.direction = direction || 'both';
        
        this.activeEl = Ext.get(el);

        this.scrollWidth  = this.activeEl.dom.scrollWidth;
        this.scrollHeight = this.activeEl.dom.scrollHeight;

        this.refreshElRegion();
        this.activeEl.on('mousemove', this.onMouseMove, this);
    },

    deactivate : function () {
        this.clearScrollInterval();

        this.activeEl.un('mousemove', this.onMouseMove, this);
        this.activeEl = this.scrollElRegion = this.scrollWidth = this.scrollHeight = null;

        this.direction = 'both';
    }
});
