Ext.require(['Sch.model.Resource',
    'Sch.plugin.*',]);


Ext.define('SampleApp.Application', {
    name: 'SampleApp',

    extend: 'Ext.app.Application',

    views: [
        // TODO: add views here
//        'SampleApp.view.Schedule.Settings',
//        'SampleApp.view.Schedule.ResourceSchedule',
//        'SampleApp.view.Schedule.Navigation'
    ],

    controllers: [
        'Main',
        'EmployeeList',
//        'Navigation',
//        'Layout',
        'Scheduler'
        // TODO: add controllers here
    ],

    stores: [
        // TODO: add stores here
    ]
});
