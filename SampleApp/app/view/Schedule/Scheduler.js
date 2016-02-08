Ext.define("SampleApp.view.Schedule.Scheduler", {
    extend: "Sch.panel.SchedulerGrid",
    alias: 'widget.Scheduler',
    title: 'MileStone Schedule',
    region: 'center',
    viewPreset: 'monthAndYear',
    rowHeight: 32,

    eventStore: 'Scheduler.MileStoneSchedule',
    resourceStore: 'Scheduler.Milestone',

    eventTpl: [
        '<tpl for=".">',
        '<div unselectable="on" id="{{eventprefix}}{id}" style="background: #0F0;right:{right}px;left:{left}px;top:{top}px;height:{height}px;width:{width}px;{style}" class=" sch-event">',
        '{body}',
        '</div>',
        '</tpl>'
    ],

    onEventCreated: function(newRecord) {
        newRecord.set('Milestone', 'Schedule');
    },
    eventRenderer: function(event, resourceRec, tpl) {
        // debugger;
        console.log('Id is ' + event.data.Id);
        tpl.cls = " ";
        tpl.style = " ";
        if (event.data.isActualDate === true) {
            tpl.style = 'background-color: #666666';
            // tpl.cls+=' sch-event-actual';
        } else {
            // tpl.style = 'background-color: #51C44E';
            tpl.cls += ' sch-event-planned';
        }
        return event.data.milestoneStatus;
    },


    initComponent: function() {
        var me = this;
        Ext.apply(me, {
            columns: [{
                header: 'Milestone Name',
                dataIndex: 'milestoneName',
                // dataIndex: 'preReq_name',
                width: 200,
                tdCls: 'user',
                sortable: false
            }]
        });

        this.callParent(arguments);
    },
    listeners: {
        beforeeventresize: function() {
            return false;
        },
        beforeeventadd: function(scheduler, eventRecord, resources, eOpts) {
            return false;
        }
    },

    onRender: function() {
        this.callParent(arguments);
        // Lazy loading only after render
        this.getEventStore().load();
    }

    // eventRenderer: function(event, resourceRecord, renderData, resourceIndex) {

    //     var me = this;
    //     var view = me.getBubbleParent().getView();
    //     //debugger;
    //     //renderData.cls="sch-event-planned";

    //     view.eventBodyTemplate = new Ext.XTemplate(
    //         //'<span class="sch-event-header"></span>'+
    //         '<tpl if="this.isCompleted(values)">',
    //         //'<div class="sch-event-actual" style="position:relative;height:100%;width:100%;">',
    //         '<div style="color:{[this.getColor(values)]}">{Name}</div>',
    //         //'<div class="sch-event-actual">',
    //         '</tpl>', {
    //             isCompleted: function(values) { //debugger;
    //                 // if (values.ActualEndDate!=="") {
    //                 if (values.isCompleted) {
    //                     //return true;
    //                     // renderData.cls += " sch-event-actual";
    //                     // return "background: #F6A923;"
    //                     // renderData.cls += " sch-event-actual";
    //                     renderData.style = 'background:#cecece !important';
    //                     // renderData.cls = " sch-event-actual";

    //                 } else {
    //                     // return false;

    //                     renderData.style = 'background:#51C44Ececece !important';
    //                     // return "background: #0000EE;"
    //                     // renderData.cls += " sch-event-planned";
    //                     // renderData.internalCls = " sch-event-planned";
    //                 }

    //             },
    //             getColor: function(values) {
    //                 if (values.isCompleted) {
    //                     return "background: #F6A923;"
    //                 } else {
    //                     return "background: #0000EE;"
    //                 }
    //             }
    //         }
    //     );


    //     //renderData.cls = " sch-event-header";

    //     return event.data;
    // }


});