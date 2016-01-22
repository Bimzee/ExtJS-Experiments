/*

Ext Scheduler 2.5.2
Copyright(c) 2009-2014 Bryntum AB
http://bryntum.com/contact
http://bryntum.com/license

*/
Ext.define("Sch.eventlayout.Horizontal", {
    
    timeAxisViewModel       : null,
    view                    : null,
    
    nbrOfBandsByResource    : null,
    
    
    
    constructor : function(config) {
        Ext.apply(this, config);
        
        this.nbrOfBandsByResource       = {};
    },
    
    
    clearCache : function (resource) {
        if (resource)
            delete this.nbrOfBandsByResource[ resource.internalId ];
        else
            this.nbrOfBandsByResource   = {};
    },
    
    
    getNumberOfBands : function (resource, resourceEvents) {
        if (!this.view.dynamicRowHeight) return 1;
        
        var nbrOfBandsByResource = this.nbrOfBandsByResource;
        
        if (nbrOfBandsByResource.hasOwnProperty(resource.internalId)) {
            return nbrOfBandsByResource[ resource.internalId ];
        }
        
        return this.calculateNumberOfBands(resource, resourceEvents);
    },
    
    
    getRowHeight : function (resource, resourceEvents) {
        var view                    = this.view;
        var nbrOfBandsRequired      = this.getNumberOfBands(resource, resourceEvents);
        /*Custom Implementation for TieInJobs*/
        var rowHeight = null, event;
        
         
            if (resource && resource.get('TieIn')===true) {
                rowHeight = ((nbrOfBandsRequired * RigScheduler.config.Constants.getTieInJobHeight()) > this.timeAxisViewModel.rowHeightHorizontal) ? (nbrOfBandsRequired * RigScheduler.config.Constants.getTieInJobHeight()) : this.timeAxisViewModel.rowHeightHorizontal;
            } else {
                rowHeight = (nbrOfBandsRequired * this.timeAxisViewModel.rowHeightHorizontal);
            }
        /*Custom Implementation for TieInJobsEnd*/
        return rowHeight - ((nbrOfBandsRequired - 1) * view.barMargin);
    },
    
    
    calculateNumberOfBands : function (resource, resourceEvents) {
        var eventsData      = [];
        // avoid extra `getEventsForResource` call if events are already provided 
        resourceEvents      = resourceEvents || this.view.eventStore.getEventsForResource(resource);
        
        var timeAxis        = this.view.timeAxis;
        
        for (var i = 0; i < resourceEvents.length; i++) {
            var event       = resourceEvents[ i ];
            var start       = event.getStartDate();
            var end         = event.getEndDate();
            
            if (start && end && timeAxis.timeSpanInAxis(start, end)) {
                eventsData[ eventsData.length ] = { start: start, end: end, event: event };
            }
        }
        
        return this.applyLayout(eventsData, resource);
    },
    
    
    // TODO DOC
    applyLayout: function (events, resource) {
        var rowEvents = events.slice();

        // Sort events by start date, and text properties.
        var me = this;

        rowEvents.sort(function(a, b){
            return me.sortEvents(a.event, b.event);
        });

        // return a number of bands required
        return this.nbrOfBandsByResource[ resource.internalId ] = this.layoutEventsInBands(0, rowEvents);
    },

    
    // Override this sorting method to control in what order events are laid out. By default they are sorted by start date, then end date.

    sortEvents : function (a, b) {

        var startA = a.getStartDate(), endA = a.getEndDate();
        var startB = b.getStartDate(), endB = b.getEndDate();

        var sameStart = (startA - startB === 0);

        if (sameStart) {
            return endA > endB ? -1 : 1;
        } else {
            return (startA < startB) ? -1 : 1;
        }
    },

    layoutEventsInBands: function (bandIndex, events) {
        var view        = this.view;
        
        do {/*Custom Implementation Start: Added TieIn Job Check while setting top*/
            var event   = events[0],
                bandTop = bandIndex === 0 ? view.barMargin : (bandIndex * ((event.data && event.data.get('TieIn'))?RigScheduler.config.Constants.getTieInJobHeight():this.timeAxisViewModel.rowHeightHorizontal) - (bandIndex - 1) * view.barMargin);
                /*Custom Implementation End*/
            if (bandTop >= view.cellBottomBorderWidth) {
                bandTop -= view.cellBottomBorderWidth;
            }
    
            while (event) {
                // Apply band height to the event cfg
                event.top   = bandTop;
    
                // Remove it from the array and continue searching
                Ext.Array.remove(events, event);
                
                event       = this.findClosestSuccessor(event, events);
            }
    
            bandIndex++;
        } while (events.length > 0);

        // Done!
        return bandIndex;
    },

    
    findClosestSuccessor: function (event, events) {
        var minGap = Infinity,
            closest,
            eventEnd = event.end,
            gap,
            isMilestone = event.end - event.start === 0;

        for (var i = 0, l = events.length; i < l; i++) {
            gap = events[i].start - eventEnd;

            if (gap >= 0 && gap < minGap &&
                // Two milestones should not overlap
                (gap > 0 || events[i].end - events[i].start > 0 || !isMilestone))
            {
                closest = events[i];
                minGap = gap;
            }
        }
        return closest;
    }
});