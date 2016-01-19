Ext.define('SampleApp.controller.EmployeeList', {
    extend: 'Ext.app.Controller',
    models: [
        'Employee'
    ],
    stores: [
        'Employees'
    ],
    views: [
        'EmployeeList'
    ],
    init: function () {

        this.control({
            'EmployeeList button[action=AddEmployee]': {
                click: this.onAddNewResource
            },
            'EmployeeList': {
                RemoveResource: this.onRemoveResource
            }
        });
    },
    onAddNewResource: function () {
        var store = this.getEmployeesStore();
        store.insert(0, new store.model({
            Name: 'New guy',
            Salary: 0
        }));
    },
    onRemoveResource: function (grid, rowIndex) {
        grid.getStore().removeAt(rowIndex);
    }
});