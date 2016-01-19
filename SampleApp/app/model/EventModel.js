Ext.define("SampleApp.model.EventModel", {
    extend              : 'Sch.model.Event',

    fields : [
        {name:'ResourceId', type:'string' },
        {name: 'Name', type: 'string'},
        {name:'StartDate', type:'Sch.util.Date'},
        {name:'EndDate', type:'Sch.util.Date'}
    ]
});