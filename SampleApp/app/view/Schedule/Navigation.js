Ext.define("SampleApp.view.Schedule.Navigation", {
    extend      : 'Ext.Panel',
    alias       : 'widget.navigation',
    layout      : 'vbox',
    width       : 86,
    weight      : 100,
    region      : 'west',
    defaultType : 'button',
    bodyCls     : 'navigation',
    defaults    : {
        enableToggle : true,
        toggleGroup  : 'nav',
        height       : 64,
        width        : 64,
        margin       : 10
    },
    items       : [
        {
            itemId  : 'gantt',
            cls     : 'icon-diamonds',
            pressed : true
        },
        {
            itemId : 'resourceschedule',
            cls    : 'icon-calendar'
        },
//        {
//            itemId : 'resourcelist',
//            cls    : 'icon-users'
//        },
//        {
//            itemId : 'histogram',
//            cls    : 'icon-bars'
//        },
//        {
//            xtype : 'tbfill'
//        },
        {
            itemId       : 'settings',
            cls          : 'icon-settings',
            enableToggle : false
        }
    ]
});