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
        'SampleApp.view.Accordion.AccordionPanel2'
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
            activeOnTop: true
        },
        //Panel 1 for Grid and Chart of AFET data
        {
            //region: 'center',
            xtype: 'panel',
            title: 'AFEType',
            itemId: 'testPanel',
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
            margin: 5
        }
      
    ]
});