Ext.define("SampleApp.store.Employees", {
    extend : 'Sch.data.ResourceStore',
    model : 'SampleApp.model.Employee',
    autoLoad:true,
    sorters : 'Name',
    autoSync: false,
    batch : false
});
    