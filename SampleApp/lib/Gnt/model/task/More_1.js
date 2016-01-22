/*

Ext Gantt 2.2.23
Copyright(c) 2009-2014 Bryntum AB
http://bryntum.com/contact
http://bryntum.com/license

*/
/**

@class Gnt.model.task.More
@mixin
@protected

Internal mixin class providing additional logic and functionality belonging to the Task model class.

*/
Ext.define('Gnt.model.task.More', {

    /**
     * Increases the indendation level of this task in the tree
     */
    indent : function () {
        var prev = this.previousSibling;

        if (prev) {
            var removeContext = {
                parentNode          : this.parentNode,
                previousSibling     : this.previousSibling,
                nextSibling         : this.nextSibling
            };

            var ts = this.getTaskStore();

            // Need to suspend the events here to prevent the taskStore from doing a cascade and thereby triggering UI updates
            // before the indent operation has completed (node first removed, then appended).
            ts.suspendEvents(true);

            // This clears the removeContext object, put it back below
            prev.appendChild(this);

            // http://www.sencha.com/forum/showthread.php?270802-4.2.1-NodeInterface-removeContext-needs-to-be-passed-as-an-arg
            this.removeContext = removeContext;

            // Iterate and drop existing invalid dependencies since a parent task cannot have
            // dependencies to its children etc.
            prev.removeInvalidDependencies();

            ts.resumeEvents();

            prev.set('leaf', false);
            prev.expand();
        }
    },

    /**
     * Decreases the indendation level of this task in the tree
     */
    outdent: function () {
        var parent = this.parentNode;

        if (parent && !parent.isRoot()) {
            var removeContext = {
                parentNode          : this.parentNode,
                previousSibling     : this.previousSibling,
                nextSibling         : this.nextSibling
            };

            if (this.convertEmptyParentToLeaf) {
                parent.set('leaf', parent.childNodes.length === 1);
            }

            var ts = this.getTaskStore();
            ts.suspendEvents(true);

            if (parent.nextSibling) {
                parent.parentNode.insertBefore(this, parent.nextSibling);
            } else {
                parent.parentNode.appendChild(this);
            }

            // This clears the removeContext object, put it back below
            // http://www.sencha.com/forum/showthread.php?270802-4.2.1-NodeInterface-removeContext-needs-to-be-passed-as-an-arg
            this.removeContext = removeContext;

            ts.resumeEvents();

            // recalculate previous parents
            if (ts.recalculateParents && parent.childNodes.length) {
                parent.childNodes[0].recalculateParents();
            }
        }
    },

    removeInvalidDependencies : function() {
        var depStore    = this.getDependencyStore(),
            deps        = this.getAllDependencies();

        for (var i = 0; i < deps.length; i++) {

            if(!deps[i].isValid(true)) {
                depStore.remove(deps[i]);
            }
        }
    },

    /**
     * Returns all dependencies of this task (both incoming and outgoing)
     *
     * @return {Gnt.model.Dependency[]}
     */
    getAllDependencies: function () {
        return this.predecessors.concat(this.successors);
    },

    /**
     * Returns true if this task has at least one incoming dependency
     *
     * @return {Boolean}
     */
    hasIncomingDependencies: function () {
        return this.predecessors.length > 0;
    },

    /**
     * Returns true if this task has at least one outgoing dependency
     *
     * @return {Boolean}
     */
    hasOutgoingDependencies: function () {
        return this.successors.length > 0;
    },

    /**
     * Returns all incoming dependencies of this task
     *
     * @param {Boolean} [doNotClone=false] Whether to **not** create a shallow copy of the underlying {@link Gnt.model.Task#predecessors} property.
     * Passing `true` is more performant, but make sure you don't modify the array in this case.
     *
     * @return {Gnt.model.Dependency[]}
     */
    getIncomingDependencies: function (doNotClone) {
        return doNotClone ? this.predecessors : this.predecessors.slice();
    },


    /**
     * Returns all outcoming dependencies of this task
     *
     * @param {Boolean} [doNotClone=false] Whether to **not** create a shallow copy of the underlying {@link Gnt.model.Task#successors} property.
     * Passing `true` is more performant, but make sure you don't modify the array in this case.
     *
     * @return {Gnt.model.Dependency[]}
     */
    getOutgoingDependencies: function (doNotClone) {
        return doNotClone ? this.successors : this.successors.slice();
    },


    /**
     * @private
     * Internal method, constrains the task according to its incoming dependencies
     * @param {Gnt.data.TaskStore} taskStore The task store
     * @return {Boolean} true if the task was updated as a result.
     */
    constrain: function (taskStore) {
        if (this.isManuallyScheduled()) {
            return false;
        }

        var changed             = false;

        taskStore               = taskStore || this.getTaskStore();

        var constrainContext    = this.getConstrainContext(taskStore);

        if (constrainContext) {
            var startDate       = constrainContext.startDate;
            var endDate         = constrainContext.endDate;

            if (startDate && startDate - this.getStartDate() !== 0) {
                this.setStartDate(startDate, true, taskStore.skipWeekendsDuringDragDrop);

                changed         = true;
            } else if (endDate && endDate - this.getEndDate() !== 0) {
                this.setEndDate(endDate, true, taskStore.skipWeekendsDuringDragDrop);

                changed         = true;
            }
        }

        return changed;
    },


    getConstrainContext: function (providedTaskStore) {
        var incomingDependencies = this.getIncomingDependencies(true);

        if (!incomingDependencies.length) {
            return null;
        }

        var DepType             = Gnt.model.Dependency.Type,
            earliestStartDate   = new Date(0),
            earliestEndDate     = new Date(0),
            projectCalendar     = this.getProjectCalendar(),
            ownCalendar         = this.getCalendar(),
            constrainingTask;

        var dependenciesCalendar    = (providedTaskStore || this.getTaskStore()).dependenciesCalendar;


        Ext.each(incomingDependencies, function (dependency) {
            var fromTask = dependency.getSourceTask();

            if (fromTask) {
                var calendar;

                if (dependenciesCalendar == 'project')
                    calendar    = projectCalendar;
                else if (dependenciesCalendar == 'source')
                    calendar    = fromTask.getCalendar();
                else if (dependenciesCalendar == 'target')
                    calendar    = ownCalendar;
                else
                    throw "Unsupported value for `dependenciesCalendar` config option";

                var lag         = dependency.getLag() || 0,
                    lagUnit     = dependency.getLagUnit(),
                    start       = fromTask.getStartDate(),
                    end         = fromTask.getEndDate();

                switch (dependency.getType()) {
                    case DepType.StartToEnd:
                        start   = calendar.skipWorkingTime(start, lag, lagUnit);
                        if (earliestEndDate < start) {
                            earliestEndDate     = start;
                            constrainingTask    = fromTask;
                        }
                        break;

                    case DepType.StartToStart:
                        start   = calendar.skipWorkingTime(start, lag, lagUnit);
                        if (earliestStartDate < start) {
                            earliestStartDate   = start;
                            constrainingTask    = fromTask;
                        }
                        break;

                    case DepType.EndToStart:
                        end     = calendar.skipWorkingTime(end, lag, lagUnit);
                        if (earliestStartDate < end) {
                            earliestStartDate   = end;
                            constrainingTask    = fromTask;
                        }
                        break;

                    case DepType.EndToEnd:
                        end     = calendar.skipWorkingTime(end, lag, lagUnit);
                        if (earliestEndDate < end) {
                            earliestEndDate     = end;
                            constrainingTask    = fromTask;
                        }
                        break;

                    default:
                        throw 'Invalid dependency type: ' + dependency.getType();
                }
            }
        });

        return {
            startDate           : earliestStartDate > 0 ? earliestStartDate : null,
            endDate             : earliestEndDate > 0 ? earliestEndDate : null,

            constrainingTask    : constrainingTask
        };
    },


    /**
    * @private
    * Internal method, called recursively to query for the longest duration of the chain structure
    * @return {Gnt.model.Task[]} chain An array forming a chain of linked tasks
    */
    getCriticalPaths: function () {
        var cPath = [this],
            ctx = this.getConstrainContext();

        while (ctx) {
            cPath.push(ctx.constrainingTask);

            ctx = ctx.constrainingTask.getConstrainContext();
        }

        return cPath;
    },

    /**
     * Cascades changes for a task, and all its dependent tasks. This is more of a system method, you probably
     * want to use {@link Gnt.data.TaskStore#cascadeChangesForTask} method instead.
     *
     * @param {Gnt.data.TaskStore} [taskStore] The taskStore
     * @param {Object} [context] (private)
     * @param {Gnt.model.Dependency} [triggeringDependency] The dependency triggering the cascade
     */
    cascadeChanges: function (taskStore, context, triggeringDependency) {
        context                     = context || { nbrAffected : 0, affected : {} };
        taskStore                   = taskStore || this.getTaskStore();

        var currentCascadeBatch     = taskStore.currentCascadeBatch;

        if (currentCascadeBatch) {
            if (currentCascadeBatch.visitedCounters[ this.internalId ] > this.predecessors.length) return;

            currentCascadeBatch.addVisited(this);
        }

        if (this.isLeaf() || taskStore.enableDependenciesForParentTasks) {
            var changed     = this.constrain(taskStore);

            if (changed) {

                // update local context
                context.nbrAffected++;
                context.affected[ this.internalId ] = this;

                // update batch context
                if (currentCascadeBatch) currentCascadeBatch.addAffected(this);

                Ext.each(this.getOutgoingDependencies(true), function (dependency) {

                    var toTaskRecord = dependency.getTargetTask();

                    if (toTaskRecord && !toTaskRecord.isManuallyScheduled()) {
                        toTaskRecord.cascadeChanges(taskStore, context, dependency);
                    }
                });
            }
        }

        return context;
    },

    /**
    * Adds the passed task to the collection of child tasks.
    * @param {Gnt.model.Task} subtask The new subtask
    * @return {Gnt.model.Task} The added subtask task
    */
    addSubtask : function(subtask) {
        this.set('leaf', false);
        this.appendChild(subtask);

        this.expand();

        return subtask;
    },


    /**
    * Adds the passed task as a successor and creates a new dependency between the two tasks.
    * @param {Gnt.model.Task} [successor] The new successor
    * @return {Gnt.model.Task} the successor task
    */
    addSuccessor : function (successor) {
        var taskStore   = this.getTaskStore(),
            depStore    = this.getDependencyStore();

        successor               = successor || new this.self();

        successor.calendar      = successor.calendar || this.getCalendar();
        successor.taskStore     = taskStore;

        if (this.getEndDate()) {
            successor.setStartDate(this.getEndDate(), true, taskStore.skipWeekendsDuringDragDrop);
            successor.setDuration(1, Sch.util.Date.DAY);
        }

        this.addTaskBelow(successor);

        var newDependency = new depStore.model();

        newDependency.setSourceTask(this);
        newDependency.setTargetTask(successor);
        newDependency.setType(depStore.model.Type.EndToStart);

        depStore.add(newDependency);

        return successor;
    },

    /**
    * Adds the passed task as a milestone below this task.
    * @param {Gnt.model.Task} milestone (optional) The milestone
    * @return {Gnt.model.Task} the new milestone
    */
    addMilestone : function(milestone) {
        var taskStore = this.getTaskStore();
        milestone = milestone || new this.self();

        var date = this.getEndDate();
        if (date) {
            milestone.calendar = milestone.calendar || this.getCalendar();
            milestone.setStartEndDate(date, date, taskStore.skipWeekendsDuringDragDrop);
        }

        return this.addTaskBelow(milestone);
   },

    /**
    * Adds the passed task as a predecessor and creates a new dependency between the two tasks.
    * @param {Gnt.model.Task} [predecessor] The new predecessor
    * @return {Gnt.model.Task} the new predecessor
    */
    addPredecessor : function(predecessor) {
        var depStore    = this.getDependencyStore();

        predecessor = predecessor || new this.self();
        predecessor.calendar = predecessor.calendar || this.getCalendar();

        predecessor.beginEdit();
        if (this.getStartDate()) {
            predecessor.set(this.startDateField, predecessor.calculateStartDate(this.getStartDate(), 1, Sch.util.Date.DAY));
            predecessor.set(this.endDateField, this.getStartDate());
            predecessor.set(this.durationField, 1);
            predecessor.set(this.durationUnitField, Sch.util.Date.DAY);
        }
        predecessor.endEdit();

        this.addTaskAbove(predecessor);

        var newDependency = new depStore.model();

        newDependency.setSourceTask(predecessor);
        newDependency.setTargetTask(this);
        newDependency.setType(depStore.model.Type.EndToStart);

        depStore.add(newDependency);

        return predecessor;
    },

    /**
    * Returns all the successor tasks of this task
    *
    * @return {Gnt.model.Task[]}
    */
    getSuccessors: function () {
        var deps    = this.successors,
            res     = [];

        for (var i = 0, len = deps.length; i < len; i++) {
            var task = deps[i].getTargetTask();

            if (task) res.push(task);
        }

        return res;
    },

    /**
    * Returns all the predecessor tasks of a this task.
    *
    * @return {Gnt.model.Task[]}
    */
    getPredecessors: function () {
        var deps    = this.predecessors,
            res     = [];

        for (var i = 0, len = deps.length; i < len; i++) {
            var task = deps[i].getSourceTask();

            if (task) res.push(task);
        }

        return res;
    },

    /**
     * Adds the passed task (or creates a new task) before itself
     * @param {Gnt.model.Task} addTaskAbove (optional) The task to add
     * @return {Gnt.model.Task} the newly added task
     */
    addTaskAbove : function (task) {
        task = task || new this.self();

        return this.parentNode.insertBefore(task, this);
    },

    /**
     * Adds the passed task (or creates a new task) after itself
     * @param {Gnt.model.Task} task (optional) The task to add
     * @return {Gnt.model.Task} the newly added task
     */
    addTaskBelow : function (task) {
        task = task || new this.self();

        if (this.nextSibling) {
            return this.parentNode.insertBefore(task, this.nextSibling);
        } else {
            return this.parentNode.appendChild(task);
        }
    },

    // Returns true if this task model is 'above' the passed task model
    isAbove : function(otherTask) {
        var me          = this,
            minDepth    = Math.min(me.data.depth, otherTask.data.depth);

        var current     = this;

        // Walk upwards until tasks are on the same level
        while (current.data.depth > minDepth) {
            current     = current.parentNode;

            if (current == otherTask) return false;
        }
        while (otherTask.data.depth > minDepth) {
            otherTask   = otherTask.parentNode;

            if (otherTask == me) return true;
        }

        // At this point, depth of both tasks should be identical.
        // Walk up to find common parent, to be able to compare indexes
        while (otherTask.parentNode !== current.parentNode) {
            otherTask   = otherTask.parentNode;
            current     = current.parentNode;
        }

        return otherTask.data.index > current.data.index;
    },

    /**
     * Cascades the children of a task. The given function is not called for this node itself.
     * @param {Function} fn The function to call for each child
     * @param {Object} scope The 'this' object to use for the function, defaults to the current node.
     */
    cascadeChildren : function(fn, scope) {
        var me = this;

        if (me.isLeaf()) return;

        var childNodes      = this.childNodes;

        for (var i = 0, len = childNodes.length; i < len; i++) childNodes[ i ].cascadeBy(fn, scope);
    },


    getViolatedConstraints : function () {
        if (!this.get('leaf') || this.isManuallyScheduled()) return false;

        var value   = this.getEarlyStartDate();

        if (this.getStartDate() < value) {
            return [{
                task        : this,
                startDate   : value
            }];
        }

        return null;
    },

    resolveViolatedConstraints : function (errors) {
        errors = errors || this.getViolatedConstraints();

        if (!errors) return;

        if (!Ext.isArray(errors)) errors = [errors];

        var store   = this.getTaskStore();

        for (var error, i = 0, l = errors.length; i < l; i++) {
            error   = errors[i];

            if (error.startDate) {
                error.task.setStartDate(error.startDate, true, store.skipWeekendsDuringDragDrop);
            } else if (error.endDate) {
                error.task.setEndDate(error.endDate, true, store.skipWeekendsDuringDragDrop);
            }
        }
    },

    /**
     * Returns the _slack_ (or _float_) of this task.
     * The _slack_ is the amount of time that this task can be delayed without causing a delay
     * to any of its successors.
     *
     * @param {String} unit The time unit used to calculate the slack.
     * @return {Number} The _slack_ of this task.
     */
    getSlack : function (unit) {
        unit = unit || Sch.util.Date.DAY;

        var earlyStart  = this.getEarlyStartDate(),
            lateStart   = this.getLateStartDate();

        if (!earlyStart || !lateStart) return null;

        // slack taking into account only working period of time
        return this.getCalendar().calculateDuration(earlyStart, lateStart, unit);
    },

    /**
     * Returns the _early start date_ of this task.
     * The _early start date_ is the earliest possible start date of a task.
     * This value is calculated based on the earliest end dates of the task predecessors.
     * If the task has no predecessors, its start date is the early start date.
     *
     * @return {Date} The early start date.
     */
    getEarlyStartDate : function () {
        var store = this.getTaskStore();
        if (!store) return this.getEndDate();

        var internalId = this.internalId;
        if (store.earlyStartDates[internalId]) return store.earlyStartDates[internalId];

        var dt, result = 0, i, l;

        // for a parent task we take the minimum Early Start from its children
        if (this.childNodes.length) {

            for (i = 0, l = this.childNodes.length; i < l; i++) {
                dt = this.childNodes[i].getEarlyStartDate();
                if (dt < result || !result) result = dt;
            }

            store.earlyStartDates[internalId] = result;

            return result;
        }

        // for manually scheduled task we simply return its start date
        if (this.isManuallyScheduled())  {
            result = store.earlyStartDates[internalId] = this.getStartDate();
            return result;
        }

        var deps = this.getIncomingDependencies(true),
            fromTask;

        if (!deps.length) {
            result = store.earlyStartDates[internalId] = this.getStartDate();
            return result;
        }

        var depType     = Gnt.model.Dependency.Type,
            cal         = this.getCalendar(),
            projectCal  = this.getProjectCalendar(),
            lag;

        // Early Start Date is the largest of Early Finish Dates of the preceding tasks
        for (i = 0, l = deps.length; i < l; i++) {

            fromTask = deps[i].getSourceTask();

            if (fromTask) {
                switch (deps[i].getType()) {
                    case depType.StartToStart: // start-to-start
                        dt  = fromTask.getEarlyStartDate();
                        break;
                    case depType.StartToEnd: // start-to-end
                        dt  = fromTask.getEarlyStartDate();
                        // minus duration to get start
                        dt  = cal.calculateStartDate(dt, this.getDuration(), this.getDurationUnit());
                        break;
                    case depType.EndToStart: // end-to-start
                        dt  = fromTask.getEarlyEndDate();
                        break;
                    case depType.EndToEnd: // end-to-end
                        dt  = fromTask.getEarlyEndDate();
                        // minus duration to get start
                        dt  = cal.calculateStartDate(dt, this.getDuration(), this.getDurationUnit());
                        break;
                }

                // plus dependency Lag
                lag = deps[i].getLag();
                if (lag) dt = projectCal.skipWorkingTime(dt, lag, deps[i].getLagUnit());
                dt = projectCal.skipNonWorkingTime(dt, true);
            }

            if (dt > result) result = dt;
        }

        // store found value into the cache
        store.earlyStartDates[internalId] = result;

        return result;
    },

    /**
     * Returns the _early end date_ of the task.
     * The _early end date_ is the earliest possible end date of the task.
     * This value is calculated based on the earliest end dates of predecessors.
     * If the task has no predecessors then its end date is used as its earliest end date.
     *
     * @return {Date} The early end date.
     */
    getEarlyEndDate : function () {
        var store = this.getTaskStore();

        if (!store) return this.getEndDate();

        var internalId = this.internalId;

        if (store.earlyEndDates[internalId]) return store.earlyEndDates[internalId];

        var result = 0;
        // for parent task we take maximum Early Finish from its children
        if (this.childNodes.length) {
            var dt, i, l;

            for (i = 0, l = this.childNodes.length; i < l; i++) {
                dt = this.childNodes[i].getEarlyEndDate();
                if (dt > result) result = dt;
            }

            store.earlyEndDates[internalId] = result;

            return result;
        }

        // for manually scheduled task we simply return its end date
        if (this.isManuallyScheduled())  {
            result = store.earlyEndDates[internalId] = this.getEndDate();

            return result;
        }

        // Early Finish Date is Early Start Date plus duration
        var value = this.getEarlyStartDate();

        if (!value) return null;

        result = store.earlyEndDates[internalId] = this.getCalendar().calculateEndDate(value, this.getDuration(), this.getDurationUnit());

        return result;
    },

    /**
     * Returns the _late end date_ of the task.
     * The _late end date_ is the latest possible end date of the task.
     * This value is calculated based on the latest start dates of its successors.
     * If the task has no successors, the project end date is used as its latest end date.
     *
     * @return {Date} The late end date.
     */
    getLateEndDate : function () {
        var store = this.getTaskStore();
        if (!store) return this.getEndDate();

        var internalId = this.internalId;
        if (store.lateEndDates[internalId]) return store.lateEndDates[internalId];

        var dt, result = 0, i, l;

        // for parent task we take maximum Late Finish from its children
        if (this.childNodes.length) {
            for (i = 0, l = this.childNodes.length; i < l; i++) {
                dt = this.childNodes[i].getLateEndDate();
                if (dt > result) result = dt;
            }

            store.lateEndDates[internalId] = result;

            return result;
        }

        // for manually scheduled task we simply return its end date
        if (this.isManuallyScheduled())  {
            result = store.lateEndDates[internalId] = this.getEndDate();
            return result;
        }

        var deps = this.getOutgoingDependencies(true);

        if (!deps.length) {
            result = store.lateEndDates[internalId] = store.getProjectEndDate();
            return result;
        }

        var depType     = Gnt.model.Dependency.Type,
            cal         = this.getCalendar(),
            projectCal  = this.getProjectCalendar(),
            toTask, lag;

        // Late Finish Date is the smallest of Late Start Dates of succeeding tasks
        for (i = 0, l = deps.length; i < l; i++) {
            toTask = deps[i].getTargetTask();

            if (toTask) {
                switch (deps[i].getType()) {
                    case depType.StartToStart: // start-to-start
                        dt  = toTask.getLateStartDate();
                        // plus duration to get end
                        dt  = cal.calculateEndDate(dt, this.getDuration(), this.getDurationUnit());
                        break;
                    case depType.StartToEnd: // start-to-end
                        dt  = toTask.getLateEndDate();
                        // plus duration to get end
                        dt  = cal.calculateEndDate(dt, this.getDuration(), this.getDurationUnit());
                        break;
                    case depType.EndToStart: // end-to-start
                        dt  = toTask.getLateStartDate();
                        break;
                    case depType.EndToEnd: // end-to-end
                        dt  = toTask.getLateEndDate();
                        break;
                }

                // minus dependency Lag
                lag = deps[i].getLag();
                if (lag) dt  = projectCal.skipWorkingTime(dt, -lag, deps[i].getLagUnit());
                dt = projectCal.skipNonWorkingTime(dt, false);

                if (dt < result || !result) result = dt;
            }
        }

        // cache found value
        store.lateEndDates[internalId] = result || store.getProjectEndDate();

        return store.lateEndDates[internalId];
    },

    /**
     * Returns the _late start date_ of the task.
     * The _late start date_ is the latest possible start date of this task.
     * This value is calculated based on the latest start dates of its successors.
     * If the task has no successors, this value is calculated as the _project end date_ minus the task duration
     * (_project end date_ is the latest end date of all the tasks in the taskStore).
     *
     * @return {Date} The late start date.
     */
    getLateStartDate : function () {
        var store = this.getTaskStore();
        if (!store) return this.getStartDate();

        var internalId = this.internalId;
        if (store.lateStartDates[internalId]) return store.lateStartDates[internalId];

        var result;
        // for parent task we take minimum Late Start from its children
        if (this.childNodes.length) {
            var dt, i, l;

            for (i = 0, l = this.childNodes.length; i < l; i++) {
                dt = this.childNodes[i].getLateStartDate();
                if (dt < result || !result) result = dt;
            }

            store.lateStartDates[internalId] = result;

            return result;
        }

        // for manually scheduled task we simply return its start date
        if (this.isManuallyScheduled())  {
            result = store.lateStartDates[internalId] = this.getStartDate();
            return result;
        }

        // Late Start Date is Late Finish Date minus duration
        var value = this.getLateEndDate();
        if (!value) return null;

        result = store.lateStartDates[internalId] = this.getCalendar().calculateStartDate(value, this.getDuration(), this.getDurationUnit());

        return result;
    },

    resetEarlyDates : function () {
        var store = this.getTaskStore();
        if (!store) return;

        var internalId = this.internalId;
        store.earlyStartDates[internalId]    = null;
        store.earlyEndDates[internalId]      = null;
    },

    resetLateDates : function () {
        var store = this.getTaskStore();
        if (!store) return;

        var internalId = this.internalId;
        store.lateStartDates[internalId]    = null;
        store.lateEndDates[internalId]      = null;
    },


    getTopParent : function (all) {
        var root    = this.getTaskStore().getRootNode(),
            p       = this,
            path    = [ this ],
            result;

        while (p) {
            if (p === root) return all ? path : result;

            path.push(p);

            result  = p;
            p       = p.parentNode;
        }
    },
    
    
    getInDepthWalker : function (includeThisNode) {
        var current         = includeThisNode ? this : this.childNodes && this.childNodes[ 0 ];
        var stopAt          = this;
        
        var visitedParents  = {};
        var prev            = null;
        
        var next            = function (from) {
            var current     = from;
            var internalId  = current.internalId;
            
            if (current.isLeaf() || !current.childNodes.length) 
                current     = current.nextSibling;
            else {
                if (visitedParents[ internalId ] === true) {
                    visitedParents[ internalId ] = false;
                    
                    current = current.nextSibling;
                } else {
                    visitedParents[ internalId ] = true;
                    
                    current = current.childNodes[ 0 ];
                }
            }
            
            if (!current) {
                current     = from;
                
                do {
                    if (current === stopAt) return null;
                    
                    current = current.parentNode;
                    
                    if (current === stopAt) return null;
                } while (visitedParents[ current.internalId ] === false);
                
                return next(current);
            }
            
            return current;
        };
        
        return function () {
            var task    = current;
            
            if (current) current  = next(current);
            
            return task; 
        };
    }
});
