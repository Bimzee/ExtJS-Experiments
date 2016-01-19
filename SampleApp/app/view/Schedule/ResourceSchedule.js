Ext.define("SampleApp.view.Schedule.ResourceSchedule", {
    
    requires: ["SampleApp.view.Schedule.Navigation",
        "SampleApp.view.Schedule.Settings",],
    extend                  : 'Sch.panel.SchedulerGrid',
    alias                   : 'widget.resourceschedule',
    title                   : 'RESOURCE SCHEDULE',
    flex                    : 1,
    layout                  : 'border',
    hidden                  : true,

    // Use the same layout and appearance as the Gantt chart
    lockedGridConfig        : { width : 300, region : 'west'},
    viewConfig              : { preserveScrollOnRefresh : true },

    // Scheduler configs
    viewPreset              : 'weekAndDayLetter',
    enableDragCreation      : false,
    barMargin               : 2,
    rowHeight               : 30,
    assignmentStore         : null,
    workingTimeStore        : null,
    zonesPlugin             : null,

    initComponent : function() {
        Ext.apply(this, {
            // Broken in Ext JS 4
//            features : [{
//                groupHeaderTpl: '{name}',
//                ftype : 'grouping'
//            }],
            plugins : [
                new Sch.plugin.TreeCellEditing({ }),

                // Reuse store for weekend highlighting
                this.zonesPlugin = new Sch.plugin.Zones({
                    store : this.workingTimeStore
                })
            ],
            columns                 : [
                { text : 'Name', flex:1, dataIndex : 'Name', editor : { xtype : 'textfield' }}
            ]
        });

        this.callParent(arguments);
    },

    // "help" scheduler out with milestone rendering
    eventRenderer : function(event, meta) {
        if (event.isMilestone()) {
            meta.cls = 'sch-event-milestone';
        }

        return event.getName();
    }
});