Ext.define("SampleApp.store.NavigationItems", {
    extend : 'Ext.data.Store',
    model : 'SampleApp.model.NavigationItem',
    data : [
        { id : 'employeeList' , name : 'Employee List' },
        { id : 'schedule' , name : 'Schedule' }
    ]
});