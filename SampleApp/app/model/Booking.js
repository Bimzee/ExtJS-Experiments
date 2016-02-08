Ext.define('SampleApp.model.Booking', {
    extend: 'Sch.model.Event',
//    startDateField:"plannedStartDate",
//    endDateField :"plannedEndDate",
//    resourceIdField: "milestoneId",
    startDateField: "ActualStartDate",
    endDateField: "ActualEndDate",
    resourceIdField: "MilestoneId",
    eventIdField: "EmpId",
//     idField: "EmpId",
    fields: [
        //Set the fields along with startDateField,endDateField, resourceIdField
//        { name: 'plannedStartDate', type: 'date', dateFormat: 'Y-m-d' },
//        { name: 'plannedEndDate', type: 'date', dateFormat: 'Y-m-d' },

        {name: 'ActualStartDate', type: 'date', dateFormat: 'm-d-Y'},
        {name: 'ActualEndDate', type: 'date', dateFormat: 'm-d-Y'},
        {name: 'isCompleted', type: 'int'}


    ],
    proxy: {
        type: 'ajax',
        url: 'resources/data-bookings.js',
//        url : 'resources/WellTracker.json',
        reader: {
            type: 'json'
        }
    }

});