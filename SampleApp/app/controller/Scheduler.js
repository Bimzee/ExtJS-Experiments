Ext.define('SampleApp.controller.Scheduler', {
    extend: 'Ext.app.Controller',
    models: [
        'Booking',
        'Employee'
    ],
    stores: [
        'Bookings',
        'Employees'
    ],
    views: [
        'Scheduler'
    ],
    init: function () {
        this.control({
            'schedulergrid[lockable=true]': {
                afterdragcreate: function () {
                    //Event fired after creating a task with dragging is finished
                },
                activate: function (s) {
                    // Fixes row height sync bug
                    s.getView().refresh();
                }
            }
        });
    },
    onAddNewEvent: function () {
        // TODO, do something
    }
});