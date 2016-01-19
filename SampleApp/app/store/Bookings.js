Ext.define("SampleApp.store.Bookings", {
    extend : 'Sch.data.EventStore',
    model : 'SampleApp.model.Booking',
    autoLoad:false,
    autoSync: false,
    batch : false
});