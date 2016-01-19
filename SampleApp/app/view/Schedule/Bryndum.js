
Ext.define("SampleApp.view.Schedule.Bryndum", {
    extend              : 'Sch.panel.SchedulerGrid',
    
    height: ExampleDefaults.height,
    width: ExampleDefaults.width,
    //renderTo: 'example-container',
    enabledHdMenu: false,
    readOnly: true,
    eventBarTextField: 'Name',
    // Setup your static columns
    columns: [
        {header: 'Machines', sortable: true, width: 140, flex: 1, dataIndex: 'Name'}
    ],
    startDate: Ext.Date.clearTime(new Date()),
    endDate: Sch.util.Date.add(Ext.Date.clearTime(new Date()), Sch.util.Date.DAY, 11),
    viewPreset: 'dayAndWeek',
    resourceStore:'SampleApp.store.ResourceStore',
    eventStore: 'SampleApp.store.EventStore',
    border: true,
//    tbar: [
//        {
//            text: 'Highlight after scroll',
//            enableToggle: true,
//            pressed: true,
//            id: 'btnHighlight'
//        },
//        '                     ',
//        {
//            xtype: 'combo',
//            id: 'eventCombo',
//            store: eventStore.collect('Name'),
//            triggerAction: 'all',
//            editable: false,
//            value: "Event-2"
//        },
//        {
//            text: 'Scroll to event',
//            iconCls: 'go',
//            handler: function () {
//                var val = Ext.getCmp('eventCombo').getValue(),
//                        doHighlight = Ext.getCmp('btnHighlight').pressed,
//                        rec = eventStore.getAt(eventStore.find('Name', val));
//
//                if (rec) {
//                    g.getSchedulingView().scrollEventIntoView(rec, doHighlight);
//                }
//            }
//        },
//        '->',
//        {
//            xtype: 'combo',
//            id: 'timeCombo',
//            store: [[0, 'Today'], [2, '2 days from now'], [10, 'Ten days from now']],
//            triggerAction: 'all',
//            editable: false,
//            value: 2
//        },
//        {
//            text: 'Scroll to time',
//            iconCls: 'go',
//            handler: function () {
//                var val = Ext.getCmp('timeCombo').getValue();
//                g.scrollToDate(Sch.util.Date.add(today, Sch.util.Date.DAY, val), true);
//            }
//        },
//        {
//            text: 'Scroll to time (centered)',
//            iconCls: 'go',
//            handler: function () {
//                var val = Ext.getCmp('timeCombo').getValue();
//                g.scrollToDateCentered(Sch.util.Date.add(today, Sch.util.Date.DAY, val), true);
//            }
//        }
//    ]
});


