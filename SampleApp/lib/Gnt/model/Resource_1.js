/*

Ext Gantt 2.2.23
Copyright(c) 2009-2014 Bryntum AB
http://bryntum.com/contact
http://bryntum.com/license

*/
/**

@class Gnt.model.Resource
@extends Sch.model.Resource

This class represents a single Resource in your gantt chart.
The inheritance hierarchy of this class includes {@link Sch.model.Customizable} and {@link Ext.data.Model} classes.
Please refer to the documentation of those classes to become familar with the base interface of this class.

A Resource has only 2 mandatory fields - `Id` and `Name`. If you want to add some fields, describing resources - subclass this class:

    Ext.define('MyProject.model.Resource', {
        extend      : 'Gnt.model.Resource',

        fields      : [
            // `Id` and `Name` fields are already provided by the superclass
            { name: 'Company',          type : 'string' }
        ],

        getCompany : function () {
            return this.get('Company')
        },
        ...
    })

The name of any field can be customized in the subclass. Please refer to {@link Sch.model.Customizable} for details.

See also: {@link Gnt.model.Assignment}, {@link Gnt.column.ResourceAssignment}

*/

Ext.define('Gnt.model.Resource', {
    extend      : 'Sch.model.Resource',

    customizableFields : [
        'CalendarId'
    ],

    /**
     * @cfg {String} calendarIdField The name of the field defining the id of the calendar for this specific resource.
     */
    calendarIdField         : 'CalendarId',


    normalized                  : false,
    calendarWaitingListener     : null,


    getTaskStore : function () {
        return this.stores[ 0 ].getTaskStore();
    },


    getEventStore : function () {
        return this.getTaskStore();
    },

    /**
     * Returns an array of tasks associated with this resource
     * @return {Sch.model.Event[]}
     */
    getEvents : function() {
        return this.getTasks();
    },

    /**
     * Returns an array of tasks associated with this resource
     * @return {Gnt.model.Task[]}
     */
    getTasks : function() {
        var tasks = [];

        this.forEachAssignment(function(ass) {
            var t = ass.getTask();
            if (t) {
                tasks.push(t);
            }
        });

        return tasks;
    },


    /**
     * Returns the calendar, based on which is performed the schedule calculations for associated tasks.
     * It will be either the own calendar of this resource (if any) or the calendar of the whole project.
     *
     * @param {Boolean} ownCalendarOnly Pass `true` to return only own calendar.
     *
     * @return {Gnt.data.Calendar} The instance of calendar
     */
    getCalendar: function (ownCalendarOnly) {
        return ownCalendarOnly ? this.getOwnCalendar() : this.getOwnCalendar() || this.getProjectCalendar();
    },


    /**
     * Returns the {@link Gnt.data.Calendar calendar} instance, associated with this resource (if any). See also {@link #calendarIdField}.
     *
     * @return {Gnt.data.Calendar} calendar
     */
    getOwnCalendar : function () {
        var calendarId      = this.getCalendarId();

        return calendarId ? Gnt.data.Calendar.getCalendar(calendarId) : null;
    },


    /**
     * Returns the {@link Gnt.data.Calendar calendar} instance, associated with the project of this resource (with the TaskStore instance
     * this resource belongs to).
     *
     * @return {Gnt.data.Calendar} calendar
     */
    getProjectCalendar : function () {
        return this.stores[ 0 ].getTaskStore().getCalendar();
    },


    /**
     * Sets the {@link Gnt.data.Calendar calendar}, associated with this resource. Calendar must have a {@link Gnt.data.Calendar#calendarId calendarId} property
     * defined, which will be saved in the `CalendarId` field of this task.
     *
     * @param {Gnt.data.Calendar/String} calendar A calendar instance or string with calendar id
     */
    setCalendar: function (calendar) {
        var isCalendarInstance  = calendar instanceof Gnt.data.Calendar;

        if (isCalendarInstance && !calendar.calendarId) throw new Error("Can't set calendar w/o `calendarId` property");

        this.setCalendarId(isCalendarInstance ? calendar.calendarId : calendar);
    },


    setCalendarId : function (calendarId, isInitial) {
        if (calendarId instanceof Gnt.data.Calendar) calendarId = calendarId.calendarId;

        var prevCalendarId  = this.getCalendarId();

        if (prevCalendarId != calendarId || isInitial) {
            if (this.calendarWaitingListener) {
                this.calendarWaitingListener.destroy();
                this.calendarWaitingListener = null;
            }

            var listeners       = {
                calendarchange  : this.adjustToCalendar,
                scope           : this
            };

            var prevInstance        = this.calendar || Gnt.data.Calendar.getCalendar(prevCalendarId);

            // null-ifying the "explicit" property - it should not be used at all generally, only "calendarId"
            this.calendar   = null;

            prevInstance && prevInstance.un(listeners);

            this.set(this.calendarIdField, calendarId);

            var calendarInstance    = Gnt.data.Calendar.getCalendar(calendarId);

            if (calendarInstance) {
                calendarInstance.on(listeners);

                if (!isInitial) this.adjustToCalendar();
            } else {
                this.calendarWaitingListener = Ext.data.StoreManager.on('add', function (index, item, key) {
                    calendarInstance    = Gnt.data.Calendar.getCalendar(calendarId);

                    if (calendarInstance) {
                        this.calendarWaitingListener.destroy();
                        this.calendarWaitingListener = null;

                        calendarInstance.on(listeners);

                        this.adjustToCalendar();
                    }
                }, this, { destroyable : true });
            }
        }
    },


    adjustToCalendar : function () {
        this.forEachTask(function (task) {
            task.adjustToCalendar();
        });
    },


    // We'll be using `internalId` for Id substitution when dealing with phantom records
    getInternalId : function () {
        return this.getId() || this.internalId;
    },


    /**
     * Assigns this resource to a given task. A new {@link Gnt.model.Assignment assignment} will be created
     * and added to the {@link Gnt.data.AssignmentStore} of the project.
     *
     * @param {Gnt.model.Task/Number} taskOrId Either instance of {@link Gnt.model.Task} or id of the task
     * @param {Number} units The value for the "Units" field
     */
    assignTo : function (taskOrId, units) {
        var task    = taskOrId instanceof Gnt.model.Task ? taskOrId : this.getTaskStore().getById(taskOrId);

        return task.assign(this, units);
    },


    unassignFrom : function () {
        return this.unAssignFrom.apply(this, arguments);
    },


    /**
     * Un assigns this resource from the given task. The corresponding {@link Gnt.model.Assignment assignment} record
     * will be removed from the {@link Gnt.data.AssignmentStore} of the project.
     *
     * @param {Gnt.model.Task/Number} taskOrId Either instance of {@link Gnt.model.Task} or id of the task
     */
    unAssignFrom : function (taskOrId) {
        var task    = taskOrId instanceof Gnt.model.Task ? taskOrId : this.getTaskStore().getById(taskOrId);

        task.unAssign(this);
    },


    /**
     * Iterator for each assignment, associated with this resource.
     *
     * @param {Function} func The function to call. This function will receive an {@link Gnt.model.Assignment assignment} instance
     * as the only argument
     *
     * @param {Object} scope The scope to run the function in.
     */
    forEachAssignment : function (func, scope) {
        scope       = scope || this;

        var id      = this.getInternalId();

        this.getTaskStore().getAssignmentStore().each(function (assignment) {
            if (assignment.getResourceId() == id) {
                return func.call(scope, assignment);
            }
        });
    },


    /**
     * Iterator for tasks, assigned to this resource.
     *
     * @param {Function} func The function to call. This function will receive an {@link Gnt.model.Task task} instance
     * as the only argument.
     *
     * @param {Object} scope The scope to run the function in.
     */
    forEachTask : function (func, scope) {
        scope       = scope || this;

        var id      = this.getInternalId();

        this.getTaskStore().getAssignmentStore().each(function (assignment) {
            if (assignment.getResourceId() == id) {
                var task        = assignment.getTask();

                if (task) return func.call(scope, task);
            }
        });
    },


    collectAvailabilityIntervalPoints : function (intervals, getStartPoint, getEndPoint, pointsByTime, pointTimes) {

        var keepStart = Ext.isFunction(getStartPoint) ?
            function (dt) { pointsByTime[ dt ].push(getStartPoint(dt)); } :
            function (dt) { pointsByTime[ dt ].push(getStartPoint); };

        var keepEnd = Ext.isFunction(getEndPoint) ?
            function (dt) { pointsByTime[ dt ].push(getEndPoint(dt)); } :
            function (dt) { pointsByTime[ dt ].push(getEndPoint); };

        for (var k = 0, l = intervals.length; k < l; k++) {
            var interval            = intervals[ k ];

            var intervalStartDate   = interval.startDate - 0;
            var intervalEndDate     = interval.endDate - 0;

            if (!pointsByTime[ intervalStartDate ]) {
                pointsByTime[ intervalStartDate ] = [];

                pointTimes.push(intervalStartDate);
            }

            keepStart(intervalStartDate);

            if (!pointsByTime[ intervalEndDate ]) {
                pointsByTime[ intervalEndDate ] = [];

                pointTimes.push(intervalEndDate);
            }

            keepEnd(intervalEndDate);
        }
    },


    forEachAvailabilityIntervalWithTasks : function (options, func, scope) {
        scope                       = scope || this;

        var startDate               = options.startDate;
        var endDate                 = options.endDate;

        if (!startDate || !endDate) throw "Both `startDate` and `endDate` are required for `forEachAvailabilityIntervalWithTasks`";

        var cursorDate              = new Date(startDate);
        var includeAllIntervals     = options.includeAllIntervals;
        var includeResCalIntervals  = options.includeResCalIntervals;

        var resourceCalendar        = this.getCalendar();

        var assignments             = [];
        var tasks                   = [];
        var tasksCalendars          = [];

        var pointTimes              = [ startDate - 0, endDate - 0 ];
        var pointsByTime            = {};

        pointsByTime[ startDate - 0 ]   = [ { type  : '00-intervalStart' } ];
        pointsByTime[ endDate - 0 ]     = [ { type  : '00-intervalEnd' } ];

        this.forEachAssignment(function (assignment) {
            var task        = assignment.getTask();
            // filter out not existing tasks
            if (!task) return;

            var taskStart   = task.getStartDate();
            var taskEnd     = task.getEndDate();
            var taskId      = task.getInternalId();

            // filter out tasks out of provided [ startDate, endDate ) interval
            if (taskStart > endDate || taskEnd < startDate) return;

            tasks.push(task);
            tasksCalendars.push(task.getCalendar());

            // task start/end dates are points of interest
            this.collectAvailabilityIntervalPoints([{ startDate : taskStart, endDate : taskEnd }],
                {
                    type        : '05-taskStart',
                    assignment  : assignment,
                    taskId      : taskId,
                    units       : assignment.getUnits()
                },
                {
                    type        : '04-taskEnd',
                    taskId      : taskId
                },
                pointsByTime,
                pointTimes
            );

            assignments.push(assignment);
        });

        // if there are no tasks - then there are no common intervals naturally
        if (!tasks.length && !includeAllIntervals && !includeResCalIntervals) return;

        var DATE = Sch.util.Date;

        var i, l, taskId;

        while (cursorDate < endDate) {

            this.collectAvailabilityIntervalPoints(
                resourceCalendar.getAvailabilityIntervalsFor(cursorDate),
                {
                    type    : '00-resourceAvailabilityStart'
                },
                {
                    type    : '01-resourceAvailabilityEnd'
                },
                pointsByTime,
                pointTimes
            );

            // using "for" instead of "each" should be blazing fast! :)
            for (i = 0, l = tasksCalendars.length; i < l; i++) {

                taskId = tasks[ i ].getInternalId();

                // resource specific calendar point
                this.collectAvailabilityIntervalPoints(
                    tasksCalendars[ i ].getAvailabilityIntervalsFor(cursorDate),
                    {
                        type        : '02-taskAvailabilityStart',
                        taskId      : taskId
                    },
                    {
                        type        : '03-taskAvailabilityEnd',
                        taskId      : taskId
                    },
                    pointsByTime,
                    pointTimes
                );

            }

            // does not perform cloning internally!
            cursorDate       = DATE.getStartOfNextDay(cursorDate);
        }

        // we have to define a sorting function here since there is a bug in Chrome
        // which affects large arrays sorting if you don't provide a sorting function (#1365)
        // pointTimes.sort();
        pointTimes.sort(function (a, b) { return a - b; });

        var inInterval          = false,
            inResource          = false,
            currentAssignments  = {},
            inTaskCalendar      = 0,
            inTask              = 0;

        for (i = 0, l = pointTimes.length - 1; i < l; i++) {
            var points      = pointsByTime[ pointTimes[ i ] ];

            points.sort(function (a, b) { return a.type < b.type ? 1 : -1; });

            for (var k = 0, j = points.length; k < j; k++) {
                var point       = points[ k ];

                switch (point.type) {
                    case '00-resourceAvailabilityStart' :
                        inResource = true;
                        break;

                    case '01-resourceAvailabilityEnd' :
                        inResource = false;
                        break;

                    case '02-taskAvailabilityStart' :
                        inTaskCalendar++;
                        break;

                    case '03-taskAvailabilityEnd' :
                        inTaskCalendar--;
                        break;

                    case '05-taskStart' :
                        currentAssignments[ point.taskId ] = point;
                        inTask++;
                        break;

                    case '04-taskEnd' :
                        delete currentAssignments[ point.taskId ];
                        inTask--;
                        break;

                    case '00-intervalStart' :
                        inInterval = true;
                        break;

                    case '00-intervalEnd' : return;
                }
            }

            if (inInterval && (includeAllIntervals || includeResCalIntervals && inResource || inResource && inTaskCalendar && inTask)) {

                var meta = {
                    inResourceCalendar  : !!inResource,
                    inTasksCalendar     : !!inTaskCalendar,
                    inTask              : inTask
                };

                var intervalStartDate       = pointTimes[ i ];
                var intervalEndDate         = pointTimes[ i + 1 ];

                // availability interval is out of [ startDate, endDate )
                if (intervalStartDate > endDate || intervalEndDate < startDate) continue;

                if (intervalStartDate < startDate) intervalStartDate = startDate - 0;
                if (intervalEndDate > endDate) intervalEndDate = endDate - 0;

                if (func.call(scope, intervalStartDate, intervalEndDate, currentAssignments, meta) === false) return false;
            }
        }
    },


    /**
     * This method will generate a report about the resource allocation in the given timeframe.
     * The start and end dates of the timeframe are provided as the "startDate/endDate" properties of the `options` parameter.
     * Options may also contain additional property: `includeAllIntervals` which includes the intervals w/o any
     * assignments in the ouput (see the example below).
     *
     * For example, this resource `R1` has the availability from 10:00 till 17:00 on 2012/06/01 and from 12:00 till 15:00 on 2012/06/02.
     * It is also assigned on 50% to two tasks:
     *
     * - `T1` has availability from 11:00 till 16:00 on 2012/06/01 and from 13:00 till 17:00 on 2012/06/02.
     *   It starts at 11:00 2012/06/01 and ends at 17:00 2012/06/02
     * - `T2` has availability from 15:00 till 19:00 on 2012/06/01 and from 09:00 till 14:00 on 2012/06/02.
     *   It starts at 15:00 2012/06/01 and ends at 14:00 2012/06/02
     *
     * So the allocation information for the period 2012/06/01 - 2012/06/03 (note the 03 in day - it means 2012/06/02 inclusive)
     * will looks like the following (to better understand this example you might want to draw all the information on the paper):
     *

    [
        {
            startDate           : new Date(2012, 5, 1, 11),
            endDate             : new Date(2012, 5, 1, 15),
            totalAllocation     : 50,
            assignments         : [ assignmentForTask1 ],
            assignmentsHash     : { 'T1' : assignmentForTask1 },
            inResourceCalendar  : true,
            inTasksCalendar     : true,
            inTask              : 1
        },
        {
            startDate           : new Date(2012, 5, 1, 15),
            endDate             : new Date(2012, 5, 1, 16),
            totalAllocation     : 100,
            assignments         : [ assignmentForTask1, assignmentForTask2 ],
            assignmentsHash     : {
                'T1' : assignmentForTask1,
                'T2' : assignmentForTask2
            },
            inResourceCalendar  : true,
            inTasksCalendar     : true,
            inTask              : 2
        },
        {
            startDate           : new Date(2012, 5, 1, 16),
            endDate             : new Date(2012, 5, 1, 17),
            totalAllocation     : 50,
            assignments         : [ assignmentForTask2 ],
            inResourceCalendar  : true,
            inTasksCalendar     : true,
            inTask              : 2
        },
        {
            startDate           : new Date(2012, 5, 2, 12),
            endDate             : new Date(2012, 5, 2, 13),
            totalAllocation     : 50,
            assignments         : [ assignmentForTask2 ],
            assignmentsHash     : { 'T2' : assignmentForTask2 },
            inResourceCalendar  : true,
            inTasksCalendar     : true,
            inTask              : 2
        },
        {
            startDate           : new Date(2012, 5, 2, 13),
            endDate             : new Date(2012, 5, 2, 14),
            totalAllocation     : 100,
            assignments         : [ assignmentForTask1, assignmentForTask2 ],
            assignmentsHash     : {
                'T1' : assignmentForTask1,
                'T2' : assignmentForTask2
            },
            inResourceCalendar  : true,
            inTasksCalendar     : true,
            inTask              : 2
        },
        {
            startDate           : new Date(2012, 5, 2, 14),
            endDate             : new Date(2012, 5, 2, 15),
            totalAllocation     : 50,
            assignments         : [ assignmentForTask1 ],
            assignmentsHash     : { 'T1' : assignmentForTask1 },
            inResourceCalendar  : true,
            inTasksCalendar     : true,
            inTask              : 1
        },
    ]

     *
     * As you can see its quite detailed information - every distinct timeframe is included in the report.
     * You can aggregate this information as you need.
     *
     * Setting the `includeAllIntervals` option to true, will include intervals w/o assignments in the report, so the in the
     * example above, the report will start with:
     *

    [
        {
            startDate           : new Date(2012, 5, 1, 00),
            endDate             : new Date(2012, 5, 1, 10),
            totalAllocation     : 0,
            assignments         : [],
            assignmentsHash     : {},
            inResourceCalendar  : false,
            inTasksCalendar     : false,
            inTask              : 0
        },
        {
            startDate           : new Date(2012, 5, 1, 10),
            endDate             : new Date(2012, 5, 1, 11),
            totalAllocation     : 0,
            assignments         : [],
            assignmentsHash     : {},
            inResourceCalendar  : true,
            inTasksCalendar     : false,
            inTask              : 0
        },
        {
            startDate           : new Date(2012, 5, 1, 11),
            endDate             : new Date(2012, 5, 1, 15),
            totalAllocation     : 50,
            assignments         : [ assignmentForTask1 ],
            assignmentsHash     : { 'T1' : assignmentForTask1 }
            inResourceCalendar  : true,
            inTasksCalendar     : true,
            inTask              : 1
        },
        ...
    ]


     *
     * @param {Object} options Object with the following properties:
     *
     * - "startDate" - start date for the report timeframe
     * - "endDate" - end date for the report timeframe
     * - "includeAllIntervals" - whether to include the intervals w/o assignments in the report
     * - "includeResCalIntervals" - whether to include the intervals of resource calendar in the report
     */
    getAllocationInfo : function (options) {
        var info        = [];

        this.forEachAvailabilityIntervalWithTasks(options, function (intervalStartDate, intervalEndDate, currentAssignments, meta) {
            var totalAllocation     = 0,
                assignments         = [],
                assignmentsHash     = {};

            if (meta.inResourceCalendar && meta.inTasksCalendar && meta.inTask) {
                for (var i in currentAssignments) {
                    totalAllocation += currentAssignments[ i ].units;
                    assignments.push(currentAssignments[ i ].assignment);
                    assignmentsHash[i] = currentAssignments[ i ].assignment;
                }
            }

            info.push(Ext.apply({
                startDate           : new Date(intervalStartDate),
                endDate             : new Date(intervalEndDate),

                totalAllocation     : totalAllocation,
                assignments         : assignments,
                assignmentsHash     : assignmentsHash
            }, meta));
        });

        return info;
    }
});
