/*

Ext Scheduler 2.5.2
Copyright(c) 2009-2014 Bryntum AB
http://bryntum.com/contact
http://bryntum.com/license

*/
Ext.define('Sch.eventlayout.Table', {
    extend  : 'Sch.eventlayout.Horizontal',
    
    layoutEventsInBands : function (bandIndex, events) {
        var view        = this.view;
        var timeAxis    = view.timeAxis;
        
        do {
            var event   = events[0],
                bandTop = bandIndex === 0 ? view.barMargin : (bandIndex * this.timeAxisViewModel.rowHeightHorizontal - (bandIndex - 1) * view.barMargin);
                
            if (bandTop >= view.cellBottomBorderWidth) {
                bandTop -= view.cellBottomBorderWidth;
            }
    
            while (event) {
                var tick    = Math.floor(timeAxis.getTickFromDate(event.start));
                var left    = this.timeAxisViewModel.getPositionFromDate(timeAxis.getAt(tick).getStartDate());
                var width   = this.timeAxisViewModel.getTickWidth();
                
                // Apply band height to the event cfg
                event.top   = bandTop;
                event.left  = left;
                event.width = width;
    
                // Remove it from the array and continue searching
                Ext.Array.remove(events, event);
                
                event       = this.findClosestSuccessor(event, events);
            }
    
            bandIndex++;
        } while (events.length > 0);

        // Done!
        return bandIndex;
    },
    
    findClosestSuccessor    : function(event, events) {
        var minGap = Infinity,
            closest,
            eventEnd = event.end,
            gap;
            
        var timeAxis    = this.view.timeAxis;
        var tickIndex   = Math.floor(timeAxis.getTickFromDate(event.start));
        var tick        = timeAxis.getAt(tickIndex);

        for (var i = 0, l = events.length; i < l; i++) {
            gap = events[i].start - eventEnd;

            if (gap >= 0 && gap < minGap && events[i].start >= tick.getEndDate()) {
                closest = events[i];
                minGap = gap;
            }
        }
        return closest;
    }
});