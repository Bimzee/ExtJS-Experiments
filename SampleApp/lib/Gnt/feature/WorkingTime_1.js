/*

Ext Gantt 2.2.23
Copyright(c) 2009-2014 Bryntum AB
http://bryntum.com/contact
http://bryntum.com/license

*/
/**
@class Gnt.feature.WorkingTime
@extends Sch.plugin.Zones

A simple subclass of the {@link Sch.plugin.Zones} which highlights holidays/weekends on the gantt chart. 
Generally, there's no need to instantiate it manually, it can be activated with the {@link Gnt.panel.Gantt#highlightWeekends} configuration option.

{@img gantt/images/plugin-working-time.png}

Note, that the holidays/weekends will only be shown when the resolution of the time axis is weeks or less.

*/
Ext.define("Gnt.feature.WorkingTime", {
    extend : 'Sch.plugin.Zones',
    
    requires : [
        'Ext.data.Store',
        'Sch.model.Range'
    ],
    
    expandToFitView : true,

    /**
     * @cfg {Gnt.data.Calendar} calendar The calendar to extract the holidays from
     */
    calendar : null,
    

    init : function (ganttPanel) {
        if (!this.calendar) {
            Ext.Error.raise("Required attribute 'calendar' missed during initialization of 'Gnt.feature.WorkingTime'");
        }

        this.bindCalendar(this.calendar);
        
        Ext.apply(this, {
            store : new Ext.data.Store({
                model       : 'Sch.model.Range'
            })
        });
        
        this.callParent(arguments);
        
        ganttPanel.on('viewchange', this.onViewChange, this);
        
        // timeAxis should be already fully initialized at this point
        this.onViewChange();
    },

    bindCalendar : function(calendar) {
        var listeners = {
            datachanged     : this.refresh,
            update          : this.refresh,

            scope           : this,
            delay           : 1
        };
        
        if (this.calendar) {
            this.calendar.un(listeners);
        }

        if (calendar) {
            calendar.on(listeners);
        }

        this.calendar = calendar;
    },
    
    onViewChange : function () {
        var DATE    = Sch.util.Date;
        
        if (DATE.compareUnits(this.timeAxis.unit, DATE.WEEK) > 0) {
            this.setDisabled(true);
        } else {
            this.setDisabled(false);
            
            this.refresh();
        }
    },

    
    refresh : function() {
        var view        = this.schedulerView;
        
        this.store.removeAll(true);
        
        this.store.add(this.calendar.getHolidaysRanges(view.timeAxis.getStart(), view.timeAxis.getEnd(), true));
    },

    destroy : function() {
        this.bindCalendar(null);

        this.callParent(arguments);
    }
});