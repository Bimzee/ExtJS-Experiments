Ext.define("SampleApp.view.Scheduler", {
    extend : "Sch.panel.SchedulerGrid",
    alias : 'widget.Scheduler',
    title: 'Employee Schedule',
    region : 'center',
    viewPreset: 'monthAndYear',
    rowHeight : 32,

    eventStore : 'Bookings',
    resourceStore : 'Employees',

    onEventCreated : function(newRecord) { debugger;
        newRecord.set('Name', 'New task');
    },
    // Specialized template with header and footer
        eventBodyTemplate : new Ext.XTemplate(
        '<span class="sch-event-header">{[fm.date(values.StartDate, "Y-m-d")]}</span>' + 
        '<div class="sch-event-footer">{Name}</div>'
    ),
    
    //eventBarTextField : "Something ",
    eventRenderer: function(event, resourceRec,tpl)
    {
        debugger;
    },
   
//    eventRenderer : function (event, resourceRec, tplData) {
//        var me = this;
//        var view = me.getBubbleParent().getView();
//        
//        debugger;
//        view.eventBodyTemplate  = new Ext.XTemplate(
//                
//                
////                '<tpl if="this.isCompleted(values)">',
////                //'<div class="sch-event-actual" style="position:relative;height:100%;width:100%;">',
////                '<div style="color:{[this.getColor(values)]}">{Name}</div>',
////                //'<div class="sch-event-actual">',
////                '</tpl>', {
////                     isCompleted: function (values) { //debugger;
////                        if(values.Id>0){
////                            tplData.style ='background:#cecece !important';
////                        }
////                        else {
////                              tplData.style ='background:#51C44Ececece !important';
////                        }
////                    },
////                    getColor: function(values){
////                        if(values.isCompleted){
////                            return "background: #F6A923;"
////                        }
////                        else {
////                             return "background: #0000EE;"
////                        }
////                    }
//                
//                
////                '<span class="sch-event"></span>' +
////                    '<div class="sch-event-footer">{Name}</div>'+
////                    '<div class="">{[fm.date(values.StartDate, "Y-m-d")]}</div>'+
////                    '<div class="">Added into div</div>'
//                );
////        if (event.getEndDate() - event.getStartDate() === 0) {
////                    tplData.cls = 'sch-event-planned';
////                    
//////                    return true;
////                } else {
////                    tplData.cls = 'sch-event-actual';
//////                    return true;
////                }
////                return event.get('Id');
//        //This did not worked if nothing is returned
////        eventBodyTemplate : new Ext.XTemplate(
////        '<span class="sch-event-header">{[fm.date(values.StartDate, "Y-m-d")]}</span>' + 
////        '<div class="sch-event-footer">{Name}</div>'
////        );
////    return event.data;
//    },
    initComponent : function() {
        var me = this;
        Ext.apply(me, {
            
            columns: [
//                {header: 'Name', dataIndex: 'preReq_name', width: 150, tdCls : 'user', sortable: true, field : new Ext.form.TextField()},
                {header: 'Name', dataIndex: 'Name', width: 150, tdCls : 'user', sortable: true, field : new Ext.form.TextField()},
//                {header: 'Active', dataIndex: 'Active', width: 50, xtype: 'booleancolumn', trueText: 'Yes', falseText: 'No', align: 'center'}
            ]
        });

        this.callParent(arguments);
    },

    onRender : function() {
        this.callParent(arguments);
        
        // Lazy loading only after render
        this.getEventStore().load();
    }
});

