Ext.define('SampleApp.view.Main', {
    extend: 'Ext.container.Container',
    requires: [
        'Ext.tab.Panel',
        'Ext.layout.container.Border',
        'Ext.chart.*',
        'Ext.grid.Panel',
        'SampleApp.view.AFETChart',
        'SampleApp.view.GridWellList',
        'SampleApp.view.AFETGrid',
        'SampleApp.view.Accordion.AccordionPanel1',
        'SampleApp.view.Accordion.AccordionPanel2',
        "SampleApp.view.Schedule.Navigation",
        "SampleApp.view.Schedule.ResourceSchedule",
        "SampleApp.view.Schedule.Settings",
        
//        'SampleApp.view.BryndumGantt'
    ],
    xtype: 'app-main',
    layout: {
        type: 'hbox',
        align: 'stretch'
    },
    items: [
        {
            xtype: 'panel',
            title: 'Accordion Exp',
            itemId: 'pnlAccordion',
            height: 250,
            flex: 1,
            padding: '0,0,0,5',
            items: [
                {
                    xtype: 'pnlAccordion1',
                    itemId: 'accrd1'
                },
                {
                    xtype: 'pnlAccordion2',
                    itemId: 'accrd2'
                }
            ],
            layout: 'accordion',
            titleCollapse: false,
            animate: true,
            activeOnTop: true,
            hidden:true,
        },
        //Panel 1 for Grid and Chart of AFET data
        {
            //region: 'center',
            xtype: 'panel',
            title: 'AFEType',
            itemId: 'testPanel',
            hidden:true,
            animCollapse: true,
            height: 250,
            margin: 5,
            flex: 3,
            //Other Components
            items: [
                {
                    xtype: 'chartAFE',
                    itemId: 'afetChart',
                    flex: 1,
                },
                {
                    xtype: 'AFETGrid',
                    itemId: 'afetGrid',
                    flex: 1,
                    hidden: true
                }
            ],
            //Expand & Collapse Images for AFE data panel
            tools: [{
                    xtype: 'image',
                    src: 'resources/images/ic-expand.png',
                    height: 20,
                    width: 20,
                    itemId: 'afeTypeExpand'
                }, {
                    xtype: 'image',
                    src: 'resources/images/ic-collapse.png',
                    height: 20,
                    width: 20,
                    itemId: 'afeTypeCollapse',
                    imgCls: 'cursorCls',
                    hidden: true
                }],
            dockedItems: [{
                    xtype: 'toolbar',
                    dock: 'bottom',
                    items: [{
                            xtype: 'tbfill'
                        }, {
                            xtype: 'button',
                            text: 'Grid',
                            itemId: 'btnGrid'
                        },
                        {
                            xtype: 'button',
                            text: 'Chart',
                            itemId: 'btnChart',
                            hidden: true
                        }]
                }]

        },
        // Grid panel for Well List
        {
            xtype: 'gridWellList',
            flex: 3,
            margin: 5,
            hidden:true
        },
        //GanttChart Example
        {
            xtype: 'Scheduler',startDate : new Date(2014, 0, 1), endDate : new Date(2015, 11, 1),
//            xtype: 'Scheduler',startDate : new Date(2009, 0, 1), endDate : new Date(2014, 11, 1),
            //itemId: 'Schedule.ResourceSchedule',
            flex: 1,
            hidden:false
        },
        {
            
//            xtype:'Component',
//            html:'Sample html',
            tpl: new Ext.XTemplate( 'name: {first} <tpl if="true"> <div style="display:{display}">{last} </div> </tpl>',
                {
                    isCompleted: function(){ debugger; return true},
                }
            ),
            
//            tpl: 'name: {first} <tpl if="this.isCompleted()" > <div style="display:{display}>{last} </div></tpl>', {
//                     isCompleted: function () {
//                         return true,
//                    }
//                },
            data: {
            first: 'hello',
            last: 'world',
            display:'initial'
            },
            
            padding: 20,
            hidden: true,
        },
        

    ],
    
});