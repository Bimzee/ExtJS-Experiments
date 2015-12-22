/* 
 * To change this license header, choose License Headers in Project Properties.
 * To change this template file, choose Tools | Templates
 * and open the template in the editor.
 */
Ext.define('SampleApp.view.AFETGrid', {
    extend: 'Ext.container.Container',
    requires: [
        'Ext.grid.Panel'
    ],
    xtype: 'AFETGrid',
    items: [{
            xtype: 'grid',
            title: 'AFE List',
            itemId: 'AFEGrid',
            height: 450,
            margin: 25,
            flex:1,
            //width: 700,
            store: 'SampleApp.store.WeatherPointStore',
            columns: [
                {header: 'AFEType', dataIndex: 'AFEType',flex:1},
                {header: 'Data', dataIndex: 'data1',flex:1}
                
            ]
        }]
});

