/*

Ext Scheduler 2.5.2
Copyright(c) 2009-2014 Bryntum AB
http://bryntum.com/contact
http://bryntum.com/license

*/
//@PATCH to fix http://www.sencha.com/forum/showthread.php?261753-4.2-Drag-drop-bug-with-ScrollManager&p=959144#post959144
if (!Ext.ClassManager.get("Sch.patches.ElementScroll")) {

    Ext.define('Sch.patches.ElementScroll', {
        override : 'Sch.mixin.TimelineView',

        _onAfterRender : function () {
            this.callParent(arguments);

            if (Ext.versions.extjs.isLessThan('4.2.1') || Ext.versions.extjs.isGreaterThan('4.2.2')) return;

            this.el.scroll = function (direction, distance, animate) {
                if (!this.isScrollable()) {
                    return false;
                }
                direction = direction.substr(0, 1);
                var me = this,
                    dom = me.dom,
                    side = direction === 'r' || direction === 'l' ? 'left' : 'top',
                    scrolled = false,
                    currentScroll, constrainedScroll;

                if (direction === 'r' || direction === 't' || direction === 'u') {
                    distance = -distance;
                }

                if (side === 'left') {
                    currentScroll = dom.scrollLeft;
                    constrainedScroll = me.constrainScrollLeft(currentScroll + distance);
                } else {
                    currentScroll = dom.scrollTop;
                    constrainedScroll = me.constrainScrollTop(currentScroll + distance);
                }

                if (constrainedScroll !== currentScroll) {
                    this.scrollTo(side, constrainedScroll, animate);
                    scrolled = true;
                }

                return scrolled;
            };
        }
    });
}