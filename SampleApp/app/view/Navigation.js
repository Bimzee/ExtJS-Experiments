Ext.define("SampleApp.view.Navigation", {
    extend : "Ext.grid.Panel",
    alias : 'widget.Navigation',
    region : 'west',
    width : 200,
    split : true,
    title : 'Views',

    initComponent : function() {
        var me = this;
        
        Ext.apply(me, {
            store : 'NavigationItems',

            columns: [
                { dataIndex: 'name', flex : 1, text : 'Click an item below...'}
            ]
        });

        this.callParent(arguments);
    }
});