Ext.define('SampleApp.controller.Main', {
    extend: 'Ext.app.Controller',
    stores: ['SampleApp.store.WeatherPointStore',
        'SampleApp.store.WellListStore',
        'SampleApp.store.GanttChartStore'],
    refs: [
        {
            ref: 'exampleImage',
            selector: '[xtype=app-main] image[itemId=afeTypeExpand]'
        },
        {
            ref: 'collapseImage',
            selector: '[xtype=app-main] image[itemId=afeTypeCollapse]'
        },
        {
            ref: 'expandWellList',
            selector:'[xtype=app-main] image[itemId=WellListExpand]'
        },
        {
            ref: 'collapseWellList',
            selector: '[xtype=app-main] image[itemId=WellListCollapse]'
        },
        {
            ref: 'gridView',
            selector: '[xtype=app-main] [xtype=gridWellList]'
        },
        {
            ref: 'chartView',
            selector: '[xtype=app-main] container[itemId=afetChart]'
        },
        {
            ref: 'AFETGrid',
            selector: '[xtype=app-main] container[itemId=afetGrid]'
        },
        {
            ref: 'btnAFETGrid',
            selector: '[xtype=app-main] button[itemId=btnGrid]'
        },
        {
            ref: 'btnAFETChart',
            selector: '[xtype=app-main] button[itemId=btnChart]'
        },
        {
            ref: 'PanelAFET',
            selector:['[xtype=app-main] container[itemId=testPanel]']
        },
        {
            ref:'testPanel',
            selector:'[xtype=app-main] panel[itemId=testPanel]'
        },
        {
            ref:'ganttChard',
            selector:'[xtype=app-main] container[itemId=gandChart]'
        }
    ],
    init: function () {
        this.control({
            '[xtype=app-main] image[itemId=afeTypeExpand]': {
                render: this.onImageRender
            },
            '[xtype=app-main] image[itemId=afeTypeCollapse]': {
                render: this.onImageCollapse
            },
            '[xtype=app-main] button[itemId=btnGrid]': {
                click: this.onBtnGridClick
            },
            '[xtype=app-main] button[itemId=btnChart]': {
                click: this.onBtnChartClick
            },
            '[xtype=app-main] image[itemId=WellListExpand]': {
                render: this.onWellListExpand
            },
            '[xtype=app-main] image[itemId=WellListCollapse]': {
                render: this.onWellListCollapse
            }
        });
    },
    onWellListCollapse: function(image, evt){
        image.getEl().on('click',this.onWellListCollapseClick);
    },
    onWellListCollapseClick: function(image){
        var objList=SampleApp.getApplication().getController('Main');
        objList.getTestPanel().show();
         objList.getExpandWellList().show();
        objList.getCollapseWellList().hide();
    },
    onWellListExpand: function(image, evt) {
        image.getEl().on('click',this.onWellListExpandClick);
    },
    onWellListExpandClick: function(image){
        //debugger;
        var objList=SampleApp.getApplication().getController('Main');
        objList.getTestPanel().hide();
        objList.getExpandWellList().hide();
        objList.getCollapseWellList().show();
    },
    onBtnChartClick: function () {
        var objBtn2 = SampleApp.getApplication().getController('Main');
        //debugger;
        objBtn2.getAFETGrid().hide();
        objBtn2.getBtnAFETChart().hide();
        objBtn2.getChartView().show();
        objBtn2.getBtnAFETGrid().show();
    },
    onBtnGridClick: function () {
        var objGrid = SampleApp.getApplication().getController('Main');
        objGrid.getChartView().hide();
        //debugger;
        objGrid.getBtnAFETGrid().hide();
        objGrid.getBtnAFETChart().show();
        objGrid.getAFETGrid().show();

    },
    onImageRender: function (image, evt) {
        image.getEl().on('click', this.onImageClick);
    },
    onImageClick: function (image) {
//        debugger;
        var objGrid = SampleApp.getApplication().getController('Main');
        objGrid.getGridView().hide();

        objGrid.getCollapseImage().show();
        objGrid.getExampleImage().hide();    
    },
    onImageCollapse: function (image, evnt) {
        image.getEl().on('click', this.onImageCollapseClick);
    },
    onImageCollapseClick: function (image) {
//        debugger;
        var objGrid = SampleApp.getApplication().getController('Main');
        objGrid.getGridView().show();

        objGrid.getExampleImage().show();
        objGrid.getCollapseImage().hide();
    }

});
