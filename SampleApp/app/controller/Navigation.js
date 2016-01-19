Ext.define('SampleApp.controller.Navigation', {
    extend: 'Ext.app.Controller',
    models: [
        'NavigationItem'
    ],
    stores: [
        'NavigationItems'
    ],
    views: [
        'Navigation'
    ],
    refs: [{
            ref: 'CenterContainer',
            selector: 'panel[id=centerContainer]'
        }],
    init: function () {
        this.control({
            'Navigation': {
                selectionchange: this.onSelectionChange
            }
        });
    },
    onSelectionChange: function (selModel, selected) {
        var item = selected[0];

        switch (item.get('id')) {
            case 'schedule':
                this.getCenterContainer().getLayout().setActiveItem(1);
                break;

            case 'employeeList':
                this.getCenterContainer().getLayout().setActiveItem(0);
                break;
        }
    }
});