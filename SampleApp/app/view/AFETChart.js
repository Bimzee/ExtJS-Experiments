Ext.define('SampleApp.view.AFETChart', {
    extend: 'Ext.container.Container',
    requires: [
        'Ext.chart.*'
    ],
    xtype: 'chartAFE',
    layout:{
        type:'hbox',
        align:'stretch'
    },
    //include chart item and grid items
    items: [{
            xtype: 'chart',
            animate: false,
            //width: 400,
            //width: '100%',
            height: 450,
            insetPadding: 20,
            store: 'SampleApp.store.WeatherPointStore',
            flex: 1,
            legend: {
                field: 'AFEType',
                position: 'right',
                boxStrokeWidth: 0,
                labelFont: '12px Helvetica'
            },
            series: [{
                    type: 'pie',
                    angleField: 'data1',
                    showInLegend: true,
                    donut: 50,
                    //flex:1,
                    label: {
                        field: 'AFEType',
                        display: 'none',
                        calloutLine: true
                    },
                    highlight:{
                        fill:'#fff',
                        'stroke-width':1,
                        stroke:'#ccc'
                    },
                    tips: {
                        trackMouse: true,
                        width: 140,
                        height: 28,
                        renderer: function (storeItem, item) {
                            this.setTitle(storeItem.get('AFEType') + ': ' + storeItem.get('data1') + '%');
                        }
                    }
                }]
        }]
});


