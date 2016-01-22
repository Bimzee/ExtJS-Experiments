/*

Ext Gantt 2.2.23
Copyright(c) 2009-2014 Bryntum AB
http://bryntum.com/contact
http://bryntum.com/license

*/
/**

@class Gnt.panel.Gantt
@extends Sch.panel.TimelineTreePanel

A gantt panel, which allows you to visualize and manage tasks and their dependencies.

Please refer to the <a href="#!/guide/gantt_getting_started">getting started guide</a> for a detailed introduction.

{@img gantt/images/gantt-panel.png}

*/
Ext.define("Gnt.panel.Gantt", {
    extend              : "Sch.panel.TimelineTreePanel",

    alias               : ['widget.ganttpanel'],
    alternateClassName  : ['Sch.gantt.GanttPanel'],

    requires            : [
        'Ext.layout.container.Border',
        'Gnt.model.Dependency',
        'Gnt.data.ResourceStore',
        'Gnt.data.AssignmentStore',
        'Gnt.feature.WorkingTime',
        'Gnt.data.Calendar',
        'Gnt.data.TaskStore',
        'Gnt.data.DependencyStore',
        'Gnt.view.Gantt'
    ],

    uses                : [
        'Sch.plugin.CurrentTimeLine'
    ],

    viewType        : 'ganttview',
    layout          : 'border',
    rowLines        : true,
    syncRowHeight   : false,
    useSpacer       : false,
    rowHeight       : 24,

    /**
     * @cfg {String/Object} topLabelField
     * A configuration used to show/edit the field to the top of the task.
     * It can be either string indicating the field name in the data model or a custom object where you can set the following possible properties:
     *
     * - `dataIndex` : String - The field name in the data model
     * - `editor` : Ext.form.Field - The field used to edit the value inline
     * - `renderer` : Function - A renderer method used to render the label. The renderer is called with the 'value' and the record as parameters.
     * - `scope` : Object - The scope in which the renderer is called
     */
    topLabelField               : null,

    /**
     * @cfg {String/Object} leftLabelField
     * A configuration used to show/edit the field to the left of the task.
     * It can be either string indicating the field name in the data model or a custom object where you can set the following possible properties:
     *
     * - `dataIndex` : String - The field name in the data model
     * - `editor` : Ext.form.Field - The field used to edit the value inline
     * - `renderer` : Function - A renderer method used to render the label. The renderer is called with the 'value' and the record as parameters.
     * - `scope` : Object - The scope in which the renderer is called
     */
    leftLabelField              : null,

    /**
     * @cfg {String/Object} bottomLabelField
     * A configuration used to show/edit the field to the bottom of the task.
     * It can be either string indicating the field name in the data model or a custom object where you can set the following possible properties:
     *
     * - `dataIndex` : String - The field name in the data model
     * - `editor` : Ext.form.Field - The field used to edit the value inline
     * - `renderer` : Function - A renderer method used to render the label. The renderer is called with the 'value' and the record as parameters.
     * - `scope` : Object - The scope in which the renderer is called
     */
    bottomLabelField            : null,

     /**
     * @cfg {String/Object} rightLabelField
     * A configuration used to show/edit the field to the right of the task.
     * It can be either string indicating the field name in the data model or a custom object where you can set the following possible properties:
     *
     * - `dataIndex` : String - The field name in the data model
     * - `editor` : Ext.form.Field - The field used to edit the value inline
     * - `renderer` : Function - A renderer method used to render the label. The renderer is called with the 'value' and the record as parameters.
     * - `scope` : Object - The scope in which the renderer is called
     */
    rightLabelField             : null,

    /**
     * @cfg {Boolean} highlightWeekends
     * True (default) to highlight weekends and holidays, using the {@link Gnt.feature.WorkingTime} plugin.
     */
    highlightWeekends           : true,

    /**
     * @cfg {Boolean} weekendsAreWorkdays
     * Set to `true` to treat *all* days as working, effectively removing the concept of non-working time from gantt. Defaults to `false`.
     * This option just will be translated to the {@link Gnt.data.Calendar#weekendsAreWorkdays corresponding option} of the calendar
     */
    weekendsAreWorkdays         : false,

    /**
     * @cfg {Boolean} skipWeekendsDuringDragDrop
     * True to skip the weekends/holidays during drag&drop operations (moving/resizing) and also during cascading. Default value is `true`.
     *
     * Note, that holidays will still be excluded from the duration of the tasks. If you need to completely disable holiday skipping you
     * can do that on the gantt level with the {@link #weekendsAreWorkdays} option, or on the task level with the `SchedulingMode` field.
     *
     *
     * This option just will be translated to the {@link Gnt.data.TaskStore#skipWeekendsDuringDragDrop corresponding option} of the task store
     */
    skipWeekendsDuringDragDrop  : true,

    /**
     * @cfg {Boolean} enableTaskDragDrop
     * True to allow drag drop of tasks (defaults to `true`). To customize the behavior of drag and drop, you can use {@link #dragDropConfig} option
     */
    enableTaskDragDrop          : true,

    /**
     * @cfg {Boolean} enableDependencyDragDrop
     * True to allow creation of dependencies by using drag and drop between task terminals (defaults to `true`)
     */
    enableDependencyDragDrop    : true,

    /**
     * @cfg {Boolean} enableProgressBarResize
     * True to allow resizing of the progress bar indicator inside tasks (defaults to `false`)
     */
    enableProgressBarResize     : false,


    /**
     * @cfg {Boolean} toggleParentTasksOnClick
     * True to toggle the collapsed/expanded state when clicking a parent task bar (defaults to `true`)
     */
    toggleParentTasksOnClick    : true,

    /**
     * @cfg {Boolean} addRowOnTab
     * True to automatically insert a new row when tabbing out of the last cell of the last row. Defaults to true.
     */
    addRowOnTab                 : true,

    /**
     * @cfg {Boolean} recalculateParents
     * True to update parent start/end dates after a task has been updated (defaults to `true`). This option just will be translated
     * to the {@link Gnt.data.TaskStore#recalculateParents corresponding option} of the task store
     */
    recalculateParents          : true,

    /**
     * @cfg {Boolean} cascadeChanges
     * True to cascade changes to dependent tasks (defaults to `false`). This option just will be translated
     * to the {@link Gnt.data.TaskStore#cascadeChanges corresponding option} of the task store
     */
    cascadeChanges              : false,

   /**
    * @cfg {Boolean} showTodayLine
    * True to show a line indicating current time. Default value is `false`.
    */
    showTodayLine               : false,


    /**
    * @cfg {Boolean} enableBaseline
    * True to enable showing a base lines for tasks. Baseline information should be provided as the `BaselineStartDate`, `BaselineEndDate` and `BaselinePercentDone` fields.
    * Default value is `false`.
    */
    enableBaseline              : false,

    /**
     * @cfg {Boolean} baselineVisible
     * True to show the baseline in the initial rendering. You can show and hide the baseline programmatically via {@link #showBaseline} and {@link #hideBaseline}.
     * Default value is `false`.
     */
    baselineVisible             : false,

    enableAnimations            : false,
    animate                     : false,

    /**
     * If the {@link #highlightWeekends} option is set to true, you can access the created zones plugin through this property.
     * @property {Sch.plugin.Zones} workingTimePlugin
     */
    workingTimePlugin           : null,
    todayLinePlugin             : null,

    /**
     * @cfg {Boolean} allowParentTaskMove True to allow moving parent tasks. Please note, that when moving a parent task, the
     * {@link Gnt.data.TaskStore#cascadeDelay cascadeDelay} option will not be used and cascading will happen synchronously (if enabled).
     *
     * Also, its possible to move the parent task as a group (along with its child tasks) or as individual task. This can be controlled with
     * {@link Gnt.data.TaskStore#moveParentAsGroup} option.
     */
    allowParentTaskMove         : true,

    /**
     * @cfg {Boolean} enableDragCreation
     * True to allow dragging to set start and end dates
     */
    enableDragCreation          : true,

    /**
    * @cfg {Function} eventRenderer
    * An empty function by default, but provided so that you can override it. This function is called each time a task
    * is rendered into the gantt grid. The function should return an object with properties that will be applied to the relevant task template.
    * By default, the task templates include placeholders for :
    *
    * - `cls` - CSS class which will be added to the task bar element
    * - `ctcls` - CSS class which will be added to the 'root' element containing the task bar and labels
    * - `style` - inline style declaration for the task bar element
    * - `progressBarStyle` - an inline CSS style to be applied to the progress bar of this task
    * - `leftLabel` - the content for the left label (usually being extracted from the task, using the {@link Gnt.panel.Gantt#leftLabelField leftLabelField} option.
    *   You still need to provide some value for the `leftLabelField` to activate the label rendering
    * - `rightLabel` - the content for the right label (usually being extracted from the task, using the {@link Gnt.panel.Gantt#rightLabelField rightLabelField} option
    *   You still need to provide a value for the `rightLabelField` to activate the label rendering
    * - `topLabel` - the content for the top label (usually being extracted from the task, using the {@link Gnt.panel.Gantt#topLabelField topLabelField} option
    *   You still need to provide a value for the `topLabelField` to activate the label rendering
    * - `bottomLabel` - the content for the bottom label (usually being extracted from the task, using the {@link Gnt.panel.Gantt#bottomLabelField bottomLabelField} option
    *   You still need to provide some value for the `bottomLabelField` to activate the label rendering
    * - `basecls` - a CSS class to be add to the baseline DOM element, only applicable when the {@link Gnt.panel.Gantt#showBaseline showBaseline} option is true and the task contains baseline information
    * - `baseProgressBarStyle` - an inline CSS style to be applied to the baseline progress bar element
    *
    * Here is a sample usage of eventRenderer:

        eventRenderer : function (taskRec) {
            return {
                style : 'background-color:white',        // You can use inline styles too.
                cls   : taskRec.get('Priority'),         // Read a property from the task record, used as a CSS class to style the event
                foo   : 'some value'                     // Some custom value in your own template
            };
        }
    *
    * @param {Gnt.model.Task} taskRecord The task about to be rendered
    * @param {Gnt.data.TaskStore} ds The task store
    * @return {Object} The data which will be applied to the task template, creating the actual HTML
    */
    eventRenderer           : Ext.emptyFn,

    /**
    * @cfg {Object} eventRendererScope The scope (the "this" object)to use for the `eventRenderer` function
    */
    eventRendererScope      : null,

    /**
     * @cfg {Ext.XTemplate} eventTemplate The template used to render leaf tasks in the gantt view.
     * See {@link Ext.XTemplate} for more information, see also {@link Gnt.template.Task} for the definition.
     */
    eventTemplate           : null,

    /**
     * @cfg {Ext.XTemplate} parentEventTemplate The template used to render parent tasks in the gantt view. See {@link Ext.XTemplate} for more information, see also {@link Gnt.template.ParentTask} for the definition
     */
    parentEventTemplate     : null,


    /**
     * @cfg {Ext.XTemplate} rollupTemplate The template used to rollup tasks to the parent in the gantt view. See {@link Ext.XTemplate} for more information, see also {@link Gnt.template.RollupTask} for the definition
     */
    rollupTemplate     : null,

    /**
     * @cfg {Ext.XTemplate} milestoneTemplate The template used to render milestone tasks in the gantt view.
     * See {@link Ext.XTemplate} for more information, see also {@link Gnt.template.Milestone} for the definition.
     */
    milestoneTemplate       : null,

    /**
     * @cfg {String} taskBodyTemplate The markup making up the body of leaf tasks in the gantt view. See also {@link Gnt.template.Task#innerTpl} for the definition.
     */
    taskBodyTemplate        : null,

    /**
     * @cfg {String} parentTaskBodyTemplate The markup making up the body of parent tasks in the gantt view. See also {@link Gnt.template.ParentTask#innerTpl} for the definition.
     */
    parentTaskBodyTemplate  : null,

    /**
     * @cfg {String} milestoneBodyTemplate The markup making up the body of milestone tasks in the gantt view. See also {@link Gnt.template.Milestone#innerTpl} for the definition.
     */
    milestoneBodyTemplate   : null,

    /**
     * @cfg {Boolean} autoHeight Always hardcoded to null, the `true` value is not yet supported (by Ext JS).
     */
    autoHeight              : null,

    /**
     * @cfg {Gnt.data.Calendar} calendar a {@link Gnt.data.Calendar calendar} instance for this gantt panel. Can be also provided
     * as a {@link Gnt.data.TaskStore#calendar configuration option} of the `taskStore`.
     */
    calendar                : null,

    /**
     * @cfg {Gnt.data.TaskStore} taskStore The {@link Gnt.data.TaskStore store} holding the tasks to be rendered into the gantt chart (required).
     */
    taskStore               : null,

    /**
     * @cfg {Gnt.data.DependencyStore} dependencyStore The {@link Gnt.data.DependencyStore store} holding the dependency information (optional).
     * See also {@link Gnt.model.Dependency}
     */
    dependencyStore         : null,

    /**
     * @cfg {Gnt.data.ResourceStore} resourceStore The {@link Gnt.data.ResourceStore store} holding the resources that can be assigned to the tasks in the task store(optional).
     * See also {@link Gnt.model.Resource}
     */
    resourceStore           : null,

    /**
     * @cfg {Gnt.data.AssignmentStore} assignmentStore The {@link Gnt.data.AssignmentStore store} holding the assignments information (optional).
     * See also {@link Gnt.model.Assignment}
     */
    assignmentStore         : null,

    columnLines             : false,

    /**
     * @cfg {Function} dndValidatorFn
     * An empty function by default, but provided so that you can perform custom validation on
     * the task being dragged. This function is called during the drag and drop process and also after the drop is made.
     *
     * @param {Gnt.model.Task} taskRecord The task record being dragged
     * @param {Date} date The new start date
     * @param {Number} duration The duration of the item being dragged, in minutes
     * @param {Ext.EventObject} e The event object
     *
     * @return {Boolean} true if the drop position is valid, else false to prevent a drop
     */
    dndValidatorFn          : Ext.emptyFn,

    /**
    * @cfg {Function} createValidatorFn
    * An empty function by default, but provided so that you can perform custom validation when a new task is being scheduled using drag and drop.
    * To indicate the newly scheduled dates of a task are invalid, simply return false from this method.
    *
    * @param {Gnt.model.Task} taskRecord the task
    * @param {Date} startDate The start date
    * @param {Date} endDate The end date
    * @param {Event} e The browser event object
    * @return {Boolean} true if the creation event is valid, else false
    */
    createValidatorFn       : Ext.emptyFn,

    /**
     * @cfg {String} resizeHandles A string containing one of the following values
     *
     * - `none` - to disable resizing of tasks
     * - `left` - to enable changing of start date only
     * - `right` - to enable changing of end date only
     * - `both` - to enable changing of both start and end dates
     *
     * Default value is `both`. Resizing is performed with the {@link Gnt.feature.TaskResize} plugin.
     * You can customize it with the {@link #resizeConfig} and {@link #resizeValidatorFn} options
     */
    resizeHandles           : 'both',

    /**
     * @cfg {Function} resizeValidatorFn
     * An empty function by default, but provided so that you can perform custom validation on
     * a task being resized. Simply return false from your function to indicate that the new duration is invalid.
     *
     * @param {Gnt.model.Task} taskRecord The task being resized
     * @param {Date} startDate The new start date
     * @param {Date} endDate The new end date
     * @param {Ext.EventObject} e The event object
     *
     * @return {Boolean} true if the resize state is valid, else false to cancel
     */
    resizeValidatorFn       : Ext.emptyFn,

    /**
     *  @cfg {Object} resizeConfig A custom config object to pass to the {@link Gnt.feature.TaskResize} feature.
     */
    resizeConfig            : null,

    /**
     *  @cfg {Object} progressBarResizeConfig A custom config object to pass to the {@link Gnt.feature.ProgressBarResize} feature.
     */
    progressBarResizeConfig : null,

    /**
     *  @cfg {Object} dragDropConfig A custom config object to pass to the {@link Gnt.feature.TaskDragDrop} feature.
     */
    dragDropConfig          : null,

    /**
     *  @cfg {Object} createConfig A custom config to pass to the {@link Gnt.feature.DragCreator} instance
     */
    createConfig            : null,

    /**
     *  @cfg {Boolean} autoFitOnLoad True to change the timeframe of the gantt to fit all the tasks in it after every task store load.
     *
     * See also {@link #zoomToFit}.
     */

    autoFitOnLoad           : false,

    /**
     *  @cfg {Boolean} showRollupTasks True to rollup information of tasks to their parent task bar.
     *  Only tasks with the `Rollup` field set to true will rollup.
     */
    showRollupTasks : false,

    refreshLockedTreeOnDependencyUpdate     : false,
    _lockedDependencyListeners : null,

    earlyStartColumn    : null,
    earlyEndColumn      : null,
    lateStartColumn     : null,
    lateEndColumn       : null,

    earlyDatesListeners : null,
    lateDatesListeners  : null,
    slackListeners      : null,

    refreshTimeout      : 100,

    lastFocusedRecord           : null,
    lastFocusedRecordFrom       : null,

    // If number of affected tasks is below this number, do a per-row update instead of a full refresh
    simpleCascadeThreshold : 30,

    
    /**
     * This method shows or hides the visual presentation of task's rollups in the view.
     * 
     * @param {Boolean} show A boolean value indicating whether the visual presentation of task's rollups should be visible or not.
     */
    setShowRollupTasks: function (show) {
        this.showRollupTasks = show;
        var view = this.getSchedulingView();
        view.setShowRollupTasks(show);
    },

    getEventSelectionModel : function() {
        // By default return the underlying grid selection model
        return this.getSelectionModel();
    },


    initStores : function() {
        debugger;
        if (!this.taskStore) {
            Ext.Error.raise("You must specify a taskStore config.");
        }

        var taskStore = Ext.StoreMgr.lookup(this.taskStore);

        if (!taskStore) {
            Ext.Error.raise("You have provided an incorrect taskStore identifier");
        }

        if (!(taskStore instanceof Gnt.data.TaskStore)) {
            Ext.Error.raise("A `taskStore` should be an instance of `Gnt.data.TaskStore` (or of a subclass)");
        }

        Ext.apply(this, {
            store       : taskStore,          // For the grid panel API
            taskStore   : taskStore
        });

        var calendar    = this.calendar = taskStore.calendar;

        if (this.dependencyStore) {
            this.dependencyStore    = Ext.StoreMgr.lookup(this.dependencyStore);
            taskStore.setDependencyStore(this.dependencyStore);
        } else {
            this.dependencyStore    = taskStore.dependencyStore;
        }

        if (!(this.dependencyStore instanceof Gnt.data.DependencyStore)) {
            Ext.Error.raise("The Gantt dependency store should be a Gnt.data.DependencyStore, or a subclass thereof.");
        }

        // this resource store will be assigned to the task store in the "bindResourceStore" method
        var resourceStore           = this.resourceStore ? Ext.StoreMgr.lookup(this.resourceStore) : taskStore.getResourceStore();

        if (!(resourceStore instanceof Gnt.data.ResourceStore)) {
            Ext.Error.raise("A `ResourceStore` should be an instance of `Gnt.data.ResourceStore` (or of a subclass)");
        }

        // this assignment store will be assigned to the task store in the "bindAssignmentStore" method
        var assignmentStore         = this.assignmentStore ? Ext.StoreMgr.lookup(this.assignmentStore) : taskStore.getAssignmentStore();

        if (!(assignmentStore instanceof Gnt.data.AssignmentStore)) {
            Ext.Error.raise("An `assignmentStore` should be an instance of `Gnt.data.AssignmentStore` (or of a subclass)");
        }

        this.bindAssignmentStore(assignmentStore, true);
        this.bindResourceStore(resourceStore, true);

        if (this.needToTranslateOption('weekendsAreWorkdays')) {
            // may trigger a renormalization of all tasks - need all stores to be defined
            calendar.setWeekendsAreWorkDays(this.weekendsAreWorkdays);
        }
    },


    initComponent : function() {
        var me = this;

        // @BackwardsCompat, remove in Gantt 3.0
        if (Ext.isBoolean(this.showBaseline)) {
            this.enableBaseline = this.baselineVisible = this.showBaseline;
            this.showBaseline = Gnt.panel.Gantt.prototype.showBaseline;
        }

        this.autoHeight     = false;

        this.initStores();

        if (this.needToTranslateOption('cascadeChanges')) {
            this.setCascadeChanges(this.cascadeChanges);
        }

        if (this.needToTranslateOption('recalculateParents')) {
            this.setRecalculateParents(this.recalculateParents);
        }

        if (this.needToTranslateOption('skipWeekendsDuringDragDrop')) {
            this.setSkipWeekendsDuringDragDrop(this.skipWeekendsDuringDragDrop);
        }

        var viewConfig = this.normalViewConfig = this.normalViewConfig || {};

        // Copy some properties to the view instance
        Ext.apply(this.normalViewConfig, {
            taskStore                   : this.taskStore,
            dependencyStore             : this.dependencyStore,
            snapRelativeToEventStartDate: this.snapRelativeToEventStartDate,

            enableDependencyDragDrop    : this.enableDependencyDragDrop,
            enableTaskDragDrop          : this.enableTaskDragDrop,
            enableProgressBarResize     : this.enableProgressBarResize,
            enableDragCreation          : this.enableDragCreation,

            allowParentTaskMove         : this.allowParentTaskMove,
            toggleParentTasksOnClick    : this.toggleParentTasksOnClick,

            resizeHandles               : this.resizeHandles,
            enableBaseline              : this.baselineVisible || this.enableBaseline,

            leftLabelField              : this.leftLabelField,
            rightLabelField             : this.rightLabelField,
            topLabelField               : this.topLabelField,
            bottomLabelField            : this.bottomLabelField,

            eventTemplate               : this.eventTemplate,
            parentEventTemplate         : this.parentEventTemplate,
            milestoneTemplate           : this.milestoneTemplate,

            taskBodyTemplate            : this.taskBodyTemplate,
            parentTaskBodyTemplate      : this.parentTaskBodyTemplate,
            milestoneBodyTemplate       : this.milestoneBodyTemplate,

            resizeConfig                : this.resizeConfig,
            dragDropConfig              : this.dragDropConfig,
            showRollupTasks             : this.showRollupTasks
        });


        if (this.topLabelField || this.bottomLabelField) {
            this.addCls('sch-gantt-topbottom-labels ' + (this.topLabelField ? 'sch-gantt-top-label' : ''));
            this.normalViewConfig.rowHeight = 52;
        }

        this.configureFunctionality();

        this.mon(this.taskStore, {
            beforecascade   : this.onBeforeCascade,
            cascade         : this.onAfterCascade,

            beforeindentationchange     : this.onBeforeIndentChange,
            indentationchange           : this.onIndentChange,

            scope           : this
        });

        this.callParent(arguments);

        if (this.autoFitOnLoad) {
            var root = this.store.getRootNode();
            var doZoom = function () { this.zoomToFit(); };

            // if store is already loaded, zoom after rendering is done
            if (root.childNodes.length > 0) {
                this.on('afterrender', doZoom, this);
            }

            this.mon(this.store, 'load', doZoom, this);
        }

        this.bodyCls = (this.bodyCls || '') + " sch-ganttpanel-container-body";

        var ganttView = this.getSchedulingView();
        ganttView.store.calendar = this.calendar;

        this.relayEvents(ganttView, [
            /**
            * @event taskclick
            * Fires when a task is clicked
            *
            * @param {Gnt.view.Gantt} gantt The gantt panel instance
            * @param {Gnt.model.Task} taskRecord The task record
            * @param {Ext.EventObject} e The event object
            */
            'taskclick',

            /**
            * @event taskdblclick
            * Fires when a task is double clicked
            *
            * @param {Gnt.view.Gantt} gantt The gantt panel instance
            * @param {Gnt.model.Task} taskRecord The task record
            * @param {Ext.EventObject} e The event object
            */
            'taskdblclick',

            /**
            * @event taskcontextmenu
            * Fires when contextmenu is activated on a task
            *
            * @param {Gnt.view.Gantt} gantt The gantt panel instance
            * @param {Gnt.model.Task} taskRecord The task record
            * @param {Ext.EventObject} e The event object
            */
            'taskcontextmenu',

            // Resizing events start --------------------------
            /**
            * @event beforetaskresize
            * Fires before a resize starts, return false to stop the execution
            *
            * @param {Gnt.view.Gantt} gantt The gantt panel instance
            * @param {Gnt.model.Task} taskRecord The task about to be resized
            * @param {Ext.EventObject} e The event object
            */
            'beforetaskresize',

            /**
            * @event taskresizestart
            * Fires when resize starts
            *
            * @param {Gnt.view.Gantt} gantt The gantt panel instance
            * @param {Gnt.model.Task} taskRecord The task about to be resized
            */
            'taskresizestart',

            /**
            * @event partialtaskresize
            * Fires during a resize operation and provides information about the current start and end of the resized event
            * @param {Gnt.view.Gantt} gantt The gantt panel instance
            * @param {Gnt.model.Task} taskRecord The task being resized
            * @param {Date} startDate The start date of the task
            * @param {Date} endDate The end date of the task
            * @param {Ext.Element} element The element being resized
            */
            'partialtaskresize',

            /**
            * @event aftertaskresize
            * Fires after a succesful resize operation
            * @param {Gnt.view.Gantt} gantt The gantt panel instance
            * @param {Gnt.model.Task} taskRecord The task that has been resized
            */
            'aftertaskresize',
            // Resizing events end --------------------------

            // Task progress bar resizing events start --------------------------
            /**
            * @event beforeprogressbarresize
            * Fires before a progress bar resize starts, return false to stop the execution
            * @param {Gnt.view.Gantt} gantt The gantt panel instance
            * @param {Gnt.model.Task} taskRecord The record about to be have its progress bar resized
            */
            'beforeprogressbarresize',

            /**
            * @event progressbarresizestart
            * Fires when a progress bar resize starts
            * @param {Gnt.view.Gantt} gantt The gantt panel instance
            * @param {Gnt.model.Task} taskRecord The record about to be have its progress bar resized
            */
            'progressbarresizestart',

            /**
            * @event afterprogressbarresize
            * Fires after a succesful progress bar resize operation
            * @param {Gnt.view.Gantt} gantt The gantt panel instance
            * @param {Gnt.model.Task} taskRecord record The updated record
            */
            'afterprogressbarresize',
            // Task progressbar resizing events end --------------------------

            // Dnd events start --------------------------
            /**
            * @event beforetaskdrag
            * Fires before a task drag drop is initiated, return false to cancel it
            * @param {Gnt.view.Gantt} gantt The gantt panel instance
            * @param {Gnt.model.Task} taskRecord The task record that's about to be dragged
            * @param {Ext.EventObject} e The event object
            */
            'beforetaskdrag',

            /**
            * @event taskdragstart
            * Fires when a dnd operation starts
            * @param {Gnt.view.Gantt} gantt The gantt panel instance
            * @param {Gnt.model.Task} taskRecord The record being dragged
            */
            'taskdragstart',

            /**
             * @event beforetaskdropfinalize
             * Fires before a succesful drop operation is finalized. Return false to finalize the drop at a later time.
             * To finalize the operation, call the 'finalize' method available on the context object. Pass `true` to it to accept drop or false if you want to cancel it
             * NOTE: you should **always** call `finalize` method whether or not drop operation has been canceled
             * @param {Mixed} view The gantt view instance
             * @param {Object} dragContext An object containing 'record', 'start', 'duration' (in minutes), 'finalize' properties.
             * @param {Ext.EventObject} e The event object
             */
            'beforetaskdropfinalize',

            /**
             * @event beforetaskresizefinalize
             * Fires before a succesful resize operation is finalized. Return false to finalize the resize at a later time.
             * To finalize the operation, call the 'finalize' method available on the context object. Pass `true` to it to accept drop or false if you want to cancel it
             * NOTE: you should **always** call `finalize` method whether or not drop operation has been canceled
             * @param {Mixed} view The gantt view instance
             * @param {Object} resizeContext An object containing 'record', 'start', 'end', 'finalize' properties.
             * @param {Ext.EventObject} e The event object
             */
            'beforetaskresizefinalize',

            /**
             * @event beforedragcreatefinalize
             * Fires before a succesful create operation is finalized. Return false to finalize creating at a later time.
             * To finalize the operation, call the 'finalize' method available on the context object. Pass `true` to it to accept drop or false if you want to cancel it
             * NOTE: you should **always** call `finalize` method whether or not drop operation has been canceled
             * @param {Mixed} view The gantt view instance
             * @param {Object} createContext An object containing 'record', 'start', 'end', 'finalize' properties.
             * @param {Ext.EventObject} e The event object
             */
            'beforedragcreatefinalize',

            /**
            * @event taskdrop
            * Fires after a succesful drag and drop operation
            * @param {Gnt.view.Gantt} gantt The gantt panel instance
            * @param {Gnt.model.Task} taskRecord The dropped record
            */
            'taskdrop',

            /**
            * @event aftertaskdrop
            * Fires after a drag and drop operation, regardless if the drop valid or invalid
            * @param {Gnt.view.Gantt} gantt The gantt panel instance
            */
            'aftertaskdrop',
            // Dnd events end --------------------------

            /**
            * @event labeledit_beforestartedit
            * Fires before editing is started for a field
            * @param {Gnt.view.Gantt} gantt The gantt view instance
            * @param {Gnt.model.Task} taskRecord The task record
            * @param {Mixed} value The field value being set
            * @param {Gnt.feature.LabelEditor} editor The editor instance
            */
            'labeledit_beforestartedit',

            /**
            * @event labeledit_beforecomplete
            * Fires after a change has been made to a label field, but before the change is reflected in the underlying field.
            * @param {Gnt.view.Gantt} gantt The gantt view instance
            * @param {Mixed} value The current field value
            * @param {Mixed} startValue The original field value
            * @param {Gnt.model.Task} taskRecord The affected record
            * @param {Gnt.feature.LabelEditor} editor The editor instance
            */
            'labeledit_beforecomplete',

            /**
            * @event labeledit_complete
            * Fires after editing is complete and any changed value has been written to the underlying field.
            * @param {Gnt.view.Gantt} gantt The gantt view instance
            * @param {Mixed} value The current field value
            * @param {Mixed} startValue The original field value
            * @param {Gnt.model.Task} taskRecord The affected record
            * @param {Gnt.feature.LabelEditor} editor The editor instance
            */
            'labeledit_complete',

            // Dependency drag drop events --------------------------
            /**
            * @event beforedependencydrag
            * Fires before a dependency drag operation starts (from a "task terminal"). Return false to prevent this operation from starting.
            * @param {Gnt.view.Dependency} gantt The gantt panel instance
            * @param {Gnt.model.Task} taskRecord The source task record
            */
            'beforedependencydrag',

            /**
            * @event dependencydragstart
            * Fires when a dependency drag operation starts
            * @param {Gnt.view.Dependency} gantt The gantt panel instance
            */
            'dependencydragstart',

            /**
            * @event dependencydrop
            * Fires when a dependency drag drop operation has completed successfully and a new dependency has been created.
            * @param {Gnt.view.Dependency} gantt The gantt panel instance
            * @param {Gnt.model.Task} fromRecord The source task record
            * @param {Gnt.model.Task} toRecord The destination task record
            * @param {Number} type The dependency type
            */
            'dependencydrop',

            /**
            * @event afterdependencydragdrop
            * Always fires after a dependency drag-drop operation
            * @param {Gnt.view.Dependency} gantt The gantt panel instance
            */
            'afterdependencydragdrop',

            /**
             * @event dependencyclick
             * Fires after clicking on a dependency line/arrow
             * @param {Gnt.view.Dependency} g The dependency view instance
             * @param {Gnt.model.Dependency} record The dependency record
             * @param {Ext.EventObject} event The event object
             * @param {HTMLElement} target The target of this event
             */
            'dependencyclick',

            /**
             * @event dependencycontextmenu
             * Fires after right clicking on a dependency line/arrow
             * @param {Gnt.view.Dependency} g The dependency view instance
             * @param {Gnt.model.Dependency} record The dependency record
             * @param {Ext.EventObject} event The event object
             * @param {HTMLElement} target The target of this event
             */
            'dependencycontextmenu',

            /**
            * @event dependencydblclick
            * Fires after double clicking on a dependency line/arrow
            * @param {Gnt.view.Dependency} g The dependency view instance
            * @param {Gnt.model.Dependency} record The dependency record
            * @param {Ext.EventObject} event The event object
            * @param {HTMLElement} target The target of this event
            */
            'dependencydblclick',
            // EOF Dependency drag drop events --------------------------

            /**
             * @event scheduleclick
             * Fires after a click on the schedule area
             * @param {Gnt.panel.Gantt} gantt The gantt panel object
             * @param {Date} clickedDate The clicked date
             * @param {Number} rowIndex The row index
             * @param {Ext.EventObject} e The event object
             */
            'scheduleclick',

            /**
             * @event scheduledblclick
             * Fires after a doubleclick on the schedule area
             * @param {Gnt.panel.Gantt} gantt The gantt panel object
             * @param {Date} clickedDate The clicked date
             * @param {Number} rowIndex The row index
             * @param {Ext.EventObject} e The event object
             */
            'scheduledblclick',

            /**
             * @event schedulecontextmenu
             * Fires after a context menu click on the schedule area
             * @param {Gnt.panel.Gantt} gantt The gantt panel object
             * @param {Date} clickedDate The clicked date
             * @param {Number} rowIndex The row index
             * @param {Ext.EventObject} e The event object
             */
            'schedulecontextmenu'
        ]);

        if (this.addRowOnTab) {
            var sm = this.getSelectionModel();

            // HACK overwriting private Ext JS method
            sm.onEditorTab = Ext.Function.createInterceptor(sm.onEditorTab, this.onEditorTabPress, this);
        }

        var view = this.getSchedulingView();
        this.registerRenderer(view.columnRenderer, view);

        var cls = ' sch-ganttpanel sch-horizontal ';

        if (this.highlightWeekends) {
            cls += ' sch-ganttpanel-highlightweekends ';
        }

        if (!this.rtl) {
            cls += ' sch-ltr ';
        }

        this.addCls(cls);

        if (this.baselineVisible) {
            this.showBaseline();
        }

        // Editors belong in the locked grid, otherwise they float visibly on top of the normal grid when scrolling the locked grid
        this.on('add', function(me, cmp) {
            if (cmp instanceof Ext.Editor) {
                me.lockedGrid.suspendLayouts();
                Ext.suspendLayouts();
                me.lockedGrid.add(cmp);
                Ext.resumeLayouts();

                me.lockedGrid.resumeLayouts();
            }
        });
    },


    getTimeSpanDefiningStore : function () {
        return this.taskStore;
    },


    bindAutoTimeSpanListeners : function () {
        if (!this.autoFitOnLoad) {
            this.callParent(arguments);
        }
    },


    // Make sure views doesn't react to store changes during cascading
    onBeforeCascade : function () {
        var normalStore = this.normalGrid.getView().store;

        normalStore.suspendEvents();

        Ext.suspendLayouts();
    },


    // Re-activate view->store listeners and update views if needed
    onAfterCascade : function (treeStore, context) {
        var me              = this;
        var normalStore     = this.normalGrid.getView().store;

        normalStore.resumeEvents();
        Ext.resumeLayouts();

        if (context.nbrAffected > 0) {
            var lockedView  = this.lockedGrid.getView();

            // Manual refresh of a few row nodes is way faster in large DOM scenarios where the
            // refresh operation takes too long (read/set scroll position, gridview refreshSize etc)
            if (context.nbrAffected < me.simpleCascadeThreshold) {
                var view                = this.getView();
                var ganttView           = this.getSchedulingView();
                var affectedParents     = {};

                // let the view finish redrawing all the rows before we are trying to repaint dependencies
                ganttView.suspendEvents(true);

                for (var id in context.affected) {
                    var task            = context.affected[ id ];

                    // refresh affected node + its parents

                    // get array of node and its parents
                    var nodes     = task.getTopParent(true);
                    for (var i = 0, l = nodes.length; i < l; i++) {
                        var parent  = nodes[i];

                        if (!affectedParents[ parent.id ]) {
                            var parentIndex = lockedView.store.indexOf(parent);
                            affectedParents[ parent.id ] = true;

                            // The target task may be inside a collapsed parent, in which case we should ignore updating it
                            if (parentIndex >= 0) {
                                view.refreshNode(parentIndex);
                            }
                        }
                    }

                }

                ganttView.resumeEvents();

                return;
            }

            var normalView  = this.normalGrid.getView();
            var ed = this.lockedGrid.plugins[0] && this.lockedGrid.plugins[0].activeEditor;
            var old, old2, old3, old4;

            if (ed) {
                // MONSTERHACK, To avoid scroll position + editor moving around after the side-effect refresh
                // we need to get rid of some methods, which also causes crashes in IE8.
                old = ed.realign;
                old2 = ed.alignTo;
                old3 = ed.setPosition;
                old4 = lockedView.preserveScrollOnRefresh;
                ed.realign = Ext.emptyFn;
                ed.alignTo = Ext.emptyFn;
                ed.setPosition = Ext.emptyFn;
                lockedView.preserveScrollOnRefresh = true;
            }

            normalView.refreshKeepingScroll(true);

            Ext.suspendLayouts();

            lockedView.refresh();

            Ext.resumeLayouts(true);

            // MONSTERHACK, continued
            if (ed) {
                ed.realign = old;
                ed.alignTo = old2;
                ed.setPosition = old3;
                lockedView.preserveScrollOnRefresh = old4;
            }
        }
    },

    onBeforeIndentChange : function(store) {
        var lockedView      = this.lockedGrid.view;
        var activeElement   = document.activeElement;

        Ext.suspendLayouts();

        lockedView.blockRefresh = true;

        // Scroll pos may change if removing last row in the table for example
        lockedView.saveScrollState();

        // sometimes activeElement is empty, sometimes (in IE10) its an empty JS object (not a DOM element at all)
        if (!lockedView.rendered || !activeElement || !activeElement.tagName) return;

        var rowEl           = Ext.fly(activeElement).findParent(lockedView.itemSelector);

        if (rowEl) {
            var lastFocusedRecord   = lockedView.getRecord(rowEl);

            if (lastFocusedRecord) {
                this.lastFocusedRecordFrom = lockedView.el.contains(rowEl) ? 'lockedGrid' : 'normalGrid';
            }

            this.lastFocusedRecord  = lastFocusedRecord;
        }
    },

    onIndentChange : function(store) {
        var lastFocusedRecord       = this.lastFocusedRecord;
        var lockedView      = this.lockedGrid.view;

        if (lastFocusedRecord) {
            this[ this.lastFocusedRecordFrom ].view.focusRow(lastFocusedRecord);

            this.lastFocusedRecord  = null;
        }

        lockedView.blockRefresh = false;

        Ext.resumeLayouts();
        lockedView.restoreScrollState();

        if (lockedView.bufferedRenderer) {
            lockedView.refresh();
        }
    },

    bindFullRefreshListeners : function (column) {
        var me                      = this;
        var refreshTimeout;

        var refreshColumn           = function () {
            if (refreshTimeout) return;

            refreshTimeout          = setTimeout(function () {
                refreshTimeout      = null;

                me.redrawColumns([ column ]);

            }, me.refreshTimeout);
        };

        this.mon(this.taskStore, {
            append  : refreshColumn,
            insert  : refreshColumn,
            remove  : refreshColumn,

            scope   : this
        });
    },

    bindSequentialDataListeners: function (column) {
        var lockedView              = this.lockedGrid.view;
        var taskStore               = this.taskStore;

        // the combination of buffered renderer + tree will perform a full refresh on any CRUD,
        // no need to update only some of the cells
        if (lockedView.bufferedRenderer) return;

        this.mon(taskStore, {
            append  : function (parent, newNode) {
                if (!taskStore.fillCount) this.updateAutoGeneratedCells(column, lockedView.store.indexOf(newNode));
            },

            insert  : function (parent, newNode, insertedBefore) {
                this.updateAutoGeneratedCells(column, lockedView.store.indexOf(insertedBefore));
            },

            move    : function (node, oldParent, newParent) {
                // if there's no record below, then its a move of the last node, which means
                // the refresh already happened in the "insert" or "append" listeners
                if (node.__recordBelow) {
                    var nodeStore       = lockedView.store;
                    var lowest          = Math.min(nodeStore.indexOf(node), nodeStore.indexOf(node.__recordBelow));

                    // note, that we should not remove the __recordBelow property here, as it can be used in several "move" handlers

                    this.updateAutoGeneratedCells(column, lowest);
                }
            },

            remove  : function (store, record, isMove) {
                // HACK private property 'removeContext'
                var ctx             = record.removeContext;
                var recordBelow     = ctx.nextSibling || (ctx.parentNode && ctx.parentNode.nextSibling);
                var index           = recordBelow ? lockedView.store.indexOf(recordBelow) : -1;

                if (isMove)
                    // the actual update will happen in one of the listeners above
                    record.__recordBelow  = recordBelow;
                else
                    if (index >= 0) {
                        this.updateAutoGeneratedCells(column, index);
                    }
            },
            scope : this
        });
    },


    bindSlackListeners : function () {
        var updateSlackColumns = Ext.Function.createBuffered(this.updateSlackColumns, this.refreshTimeout, this, []);

        this.slackListeners = this.mon(this.taskStore, {
            resetearlydates : updateSlackColumns,
            resetlatedates  : updateSlackColumns,
            scope           : this,
            destroyable     : true
        });
    },

    bindEarlyDatesListeners : function () {
        var updateEarlyDateColumns = Ext.Function.createBuffered(this.updateEarlyDateColumns, this.refreshTimeout, this, []);

        this.earlyDatesListeners = this.mon(this.taskStore, {
            resetearlydates : updateEarlyDateColumns,
            scope           : this,
            destroyable     : true
        });
    },

    bindLateDatesListeners : function () {
        var updateLateDateColumns = Ext.Function.createBuffered(this.updateLateDateColumns, this.refreshTimeout, this, []);

        this.lateDatesListeners = this.mon(this.taskStore, {
            resetlatedates  : updateLateDateColumns,
            scope           : this,
            destroyable     : true
        });
    },

    onEditorTabPress : function(editingPlugin, e) {
        var view                = this.lockedGrid.view,
            record              = editingPlugin.getActiveRecord(),
            header              = editingPlugin.getActiveColumn(),
            position            = view.getPosition(record, header),
            headerCt            = this.lockedGrid.headerCt,
            isLastRow           = position.row === this.lockedGrid.view.store.getCount()- 1,

            isLastColChecker    = function(col) {
                return headerCt.items.indexOf(col) > position.column && col.isVisible() && col.getEditor();
            };

        // Check if this is the last (visible) column of the last row
        if (isLastRow && headerCt.items.findIndexBy(isLastColChecker) < 0) {
            var newRec = record.addTaskBelow({ leaf : true });

            // Need to do an extra 'realign' call since the Ext call to show the editor messes up the scrollposition
            // See test 1002_tabbing.t.js
            editingPlugin.on('beforeedit', function(plug, context) {
                var col = context.column;
                var ed = editingPlugin.getEditor(newRec, col);

                ed.on('startedit', function() {
                    view.scrollCellIntoView(view.getCell(newRec, col));
                }, null, { single : true });

            }, this, { single : true });
        }
    },

    // this function checks whether the configuration option should be translated to task store or calendar
    // idea is that some configuration option (`cascadeChanges` for example) actually belongs to TaskStore
    // so they are not persisted in the gantt panel (panel only provides accessors which reads/write from/to TaskStore)
    // however the values for those options could also be specified in the prototype of the Gnt.panel.Gantt subclass
    // see #172
    needToTranslateOption : function (optionName) {
        return this.hasOwnProperty(optionName) || this.self.prototype.hasOwnProperty(optionName) && this.self != Gnt.panel.Gantt;
    },

    /**
     * Getter function returning the dependency view instance
     * @return {Gnt.view.Dependency} dependencyView The dependency view instance
     */
    getDependencyView : function() {
        return this.getSchedulingView().getDependencyView();
    },

    /**
     * Toggles the weekend highlighting on or off
     * @param {Boolean} disabled
     */
    disableWeekendHighlighting : function(disabled) {
        this.workingTimePlugin.setDisabled(disabled);
    },

    /**
     * <p>Returns the task record for a DOM node</p>
     * @param {Ext.Element/HTMLElement} el The DOM node or Ext Element to lookup
     * @return {Gnt.model.Task} The task record
     */
    resolveTaskRecord: function (el) {
        return this.getSchedulingView().resolveTaskRecord(el);
    },

    /**
     * Tries to fit the time columns to the available view width
     */
    fitTimeColumns : function() {
        this.getSchedulingView().fitColumns();
    },

    /**
     * Returns the resource store associated with the Gantt panel instance
     * @return {Gnt.data.ResourceStore}
     */
    getResourceStore : function() {
        return this.getTaskStore().getResourceStore();
    },

    /**
     * Returns the assignment store associated with the Gantt panel instance
     * @return {Gnt.data.AssignmentStore}
     */
    getAssignmentStore : function() {
        return this.getTaskStore().getAssignmentStore();
    },

    /**
     * Returns the associated task store
     * @return {Gnt.data.TaskStore}
     */
    getTaskStore : function() {
        return this.taskStore;
    },

    /**
     * Returns the task store instance
     * @return {Gnt.data.TaskStore}
     */
    getEventStore: function () {
        return this.taskStore;
    },

    /**
     * Returns the associated dependency store
     * @return {Gnt.data.DependencyStore}
     */
    getDependencyStore : function() {
        return this.dependencyStore;
    },



    // private
    onDragDropStart : function() {
        if (this.tip) {
            this.tip.hide();
            this.tip.disable();
        }
    },

    // private
    onDragDropEnd : function() {
        if (this.tip) {
            this.tip.enable();
        }
    },


    // private
    configureFunctionality : function() {
        // Normalize to array
        var plugins     = this.plugins    = [].concat(this.plugins || []);

        if (this.highlightWeekends) {

            this.workingTimePlugin = Ext.create("Gnt.feature.WorkingTime", {
                calendar        : this.calendar
            });

            plugins.push(this.workingTimePlugin);
        }

        if (this.showTodayLine) {
            this.todayLinePlugin = new Sch.plugin.CurrentTimeLine();
            plugins.push(this.todayLinePlugin);
        }
    },

    /**
     * If configured to highlight non-working time, this method returns the {@link Gnt.feature.WorkingTime workingTime} feature
     * responsible for providing this functionality.
     * @return {Gnt.feature.WorkingTime} workingTime
     */
    getWorkingTimePlugin : function() {
        return this.workingTimePlugin;
    },

    registerLockedDependencyListeners : function() {
        var me = this;
        var depStore = this.getDependencyStore();

        // Need to save these to be able to deregister them properly.
        this._lockedDependencyListeners = this._lockedDependencyListeners || {
            load    : function() {
                var taskStore = me.getTaskStore();

                // reset cached early/late dates
                taskStore.resetEarlyDates();
                taskStore.resetLateDates();

                me.lockedGrid.getView().refresh();
            },

            clear : function () {
                var taskStore = me.getTaskStore();

                // reset cached early/late dates
                taskStore.resetEarlyDates();
                taskStore.resetLateDates();

                me.lockedGrid.getView().refresh();
            },

            add     : function(depStore, records) {
                for (var i = 0; i < records.length; i++) {
                    me.updateDependencyTasks(records[i]);
                }
            },

            update  : function(depStore, record) {
                // Don't perform any view updates for Model#COMMIT operations
                if (record.previous) {

                    var view = me.lockedGrid.view;
                    var viewStore = view.store;

                    if (record.previous[record.fromField]) {
                        var prevFromTask = me.taskStore.getByInternalId(record.previous[record.fromField]);

                        if (prevFromTask) {
                            view.refreshNode(viewStore.indexOf(prevFromTask));
                        }
                    }

                    if (record.previous[record.toField]) {
                        var prevToTask = me.taskStore.getByInternalId(record.previous[record.toField]);

                        if (prevToTask) {
                            view.refreshNode(viewStore.indexOf(prevToTask));
                        }
                    }

                    me.updateDependencyTasks(record);
                }
            },

            remove  : function(depStore, record) {
                me.updateDependencyTasks(record);
            }
        };

        // This could be called multiple times, if both predecessor and successor columns are used
        this.mun(depStore, this._lockedDependencyListeners);
        this.mon(depStore, this._lockedDependencyListeners);
    },

    updateDependencyTasks : function(depRecord) {
        var sourceTask = depRecord.getSourceTask(this.taskStore);
        var targetTask = depRecord.getTargetTask(this.taskStore);
        var lockedView = this.lockedGrid.getView();
        var sourceIndex = lockedView.store.indexOf(sourceTask);
        var targetIndex = lockedView.store.indexOf(targetTask);

        if (sourceTask && sourceIndex >= 0) {
            lockedView.refreshNode(sourceIndex);
        }
        if (targetTask && targetIndex >= 0) {
            lockedView.refreshNode(targetIndex);
        }
    },

    /**
     * Shows the baseline tasks
     */
    showBaseline : function() {
        this.addCls('sch-ganttpanel-showbaseline');
    },

    /**
     * Hides the baseline tasks
     */
    hideBaseline : function() {
        this.removeCls('sch-ganttpanel-showbaseline');
    },

    /**
     * Toggles the display of the baseline
     */
    toggleBaseline : function () {
        this.toggleCls('sch-ganttpanel-showbaseline');
    },

    /**
     * Changes the timeframe of the gantt to fit all the tasks in it.
     * @param {Gnt.model.Task/Gnt.model.Task[]} [tasks] List of tasks to fit.
     * If not specified then the gantt will try to fit all the tasks from the {@link #taskStore task store}.
     */
    zoomToFit : function (tasks) {
        var span = tasks ? this.taskStore.getTasksTimeSpan(tasks) : this.taskStore.getTotalTimeSpan();

        if (this.zoomToSpan(span, { adjustStart : 1, adjustEnd   : 1 }) === null) {
            // if no zooming was performed - fit columns to view space
            if (!tasks) this.fitTimeColumns();
        }
    },


    /**
     * "Get" accessor for the `cascadeChanges` option
     */
    getCascadeChanges : function () {
        return this.taskStore.cascadeChanges;
    },


    /**
     * "Set" accessor for the `cascadeChanges` option
     */
    setCascadeChanges : function (value) {
        this.taskStore.cascadeChanges = value;
    },


    /**
     * "Get" accessor for the `recalculateParents` option
     */
    getRecalculateParents : function () {
        return this.taskStore.recalculateParents;
    },


    /**
     * "Set" accessor for the `recalculateParents` option
     */
    setRecalculateParents : function (value) {
        this.taskStore.recalculateParents = value;
    },


    /**
     * "Set" accessor for the `skipWeekendsDuringDragDrop` option
     */
    setSkipWeekendsDuringDragDrop : function (value) {
        this.taskStore.skipWeekendsDuringDragDrop = this.skipWeekendsDuringDragDrop = value;
    },


    /**
     * "Get" accessor for the `skipWeekendsDuringDragDrop` option
     */
    getSkipWeekendsDuringDragDrop : function () {
        return this.taskStore.skipWeekendsDuringDragDrop;
    },

    bindResourceStore : function(resourceStore, initial) {
        var me = this;
        var listeners = {
            scope       : me,
            update      : me.onResourceStoreUpdate,
            datachanged : me.onResourceStoreDataChanged
        };

        if (!initial && me.resourceStore) {
            if (resourceStore !== me.resourceStore && me.resourceStore.autoDestroy) {
                me.resourceStore.destroy();
            }
            else {
                me.mun(me.resourceStore, listeners);
            }
            if (!resourceStore) {
                me.resourceStore = null;
            }
        }
        if (resourceStore) {
            resourceStore = Ext.data.StoreManager.lookup(resourceStore);
            me.mon(resourceStore, listeners);
            this.taskStore.setResourceStore(resourceStore);
        }

        me.resourceStore = resourceStore;

        if (resourceStore && !initial) {
            me.refreshViews();
        }
    },

    refreshViews : function() {
        if (!this.rendered) return;

        var lockedView = this.lockedGrid.getView(),
            lockedScrollLeft = lockedView.el.dom.scrollLeft,
            lockedScrollTop = lockedView.el.dom.scrollTop;

        lockedView.refresh();

        this.getSchedulingView().refreshKeepingScroll();
        lockedView.el.dom.scrollLeft = lockedScrollLeft;
        lockedView.el.dom.scrollTop = lockedScrollTop;
    },

    bindAssignmentStore : function(assignmentStore, initial) {
        var me = this;
        var listeners = {
            scope                           : me,

            beforetaskassignmentschange     : me.onBeforeSingleTaskAssignmentChange,
            taskassignmentschanged          : me.onSingleTaskAssignmentChange,

            update                          : me.onAssignmentStoreUpdate,
            datachanged                     : me.onAssignmentStoreDataChanged
        };

        if (!initial && me.assignmentStore) {
            if (assignmentStore !== me.assignmentStore && me.assignmentStore.autoDestroy) {
                me.assignmentStore.destroy();
            }
            else {
                me.mun(me.assignmentStore, listeners);
            }
            if (!assignmentStore) {
                me.assignmentStore = null;
            }
        }
        if (assignmentStore) {
            assignmentStore = Ext.data.StoreManager.lookup(assignmentStore);
            me.mon(assignmentStore, listeners);
            this.taskStore.setAssignmentStore(assignmentStore);
        }

        me.assignmentStore = assignmentStore;

        if (assignmentStore && !initial) {
            me.refreshViews();
        }
    },

    // BEGIN RESOURCE STORE LISTENERS
    onResourceStoreUpdate : function(store, resource) {
        var tasks = resource.getTasks();

        Ext.Array.each(tasks, function(task) {
            var index = this.lockedGrid.view.store.indexOf(task);

            if (index >= 0) {
                this.getView().refreshNode(index);
            }
        }, this);
    },

    onResourceStoreDataChanged : function() {
        if (this.taskStore.getRootNode().childNodes.length > 0) {
            this.refreshViews();
        }
    },
    // EOF RESOURCE STORE LISTENERS

    // BEGIN ASSIGNMENT STORE LISTENERS
    onAssignmentStoreDataChanged : function() {
        if (this.taskStore.getRootNode().childNodes.length > 0) {
            this.refreshViews();
        }
    },

    onAssignmentStoreUpdate : function(store, assignment) {
        var task = assignment.getTask();

        if (task) {
            var index = this.lockedGrid.view.store.indexOf(task);

            if (index >= 0) {
                this.getView().refreshNode(index);
            }
        }
    },

    // We should not react to changes in the assignment store when it is happening for a single resource
    // We rely on the "taskassignmentschanged" event for updating the UI
    onBeforeSingleTaskAssignmentChange : function() {
        this.assignmentStore.un('datachanged', this.onAssignmentStoreDataChanged, this);
    },

    onSingleTaskAssignmentChange : function(assignmentStore, taskId, newAssignments) {

        this.assignmentStore.on('datachanged', this.onAssignmentStoreDataChanged, this);

        var task = this.taskStore.getById(taskId);

        if (task) {
            var index = this.lockedGrid.view.store.indexOf(task);

            if (index >= 0) {
                this.getView().refreshNode(index);
            }
        }
    },
    // EOF ASSIGNMENT STORE LISTENERS

    updateAutoGeneratedCells : function (column, recordIndex) {
        var view        = this.lockedGrid.view;
        var startIndex  = view.all.startIndex;
        var endIndex    = view.all.endIndex;

        if (recordIndex < 0 || recordIndex > endIndex) return;

        for (var i = Math.max(startIndex, recordIndex); i <= endIndex; i++)  {
            var rec     = view.store.getAt(i);
            var cell    = this.getCellDom(view, rec, column);

            if (cell) {
                cell.firstChild.innerHTML = column.renderer(null, null, rec);
            }
        }
    },


    getCellDom : function (view, record, column) {
        var row = view.getNode(record, true);

        return Ext.fly(row).down(column.getCellSelector(), true);
    },


    redrawColumns : function (cols) {
        // this method is called a lot from various buffered listeners, need to check
        // if component has not been destroyed
        if (cols.length && !this.isDestroyed) {
            var view            = this.lockedGrid.view;

            var isLessThan422   = Ext.getVersion('extjs').isLessThan('4.2.2.1144');

            for (var i = view.all.startIndex; i <= view.all.endIndex; i++)  {
                var rec         = view.store.getAt(i);

                for (var j = 0, ll = cols.length; j < ll; j++)  {

                    var cell    = this.getCellDom(view, rec, cols[j]);
                    var out     = [];

                    if (isLessThan422) {
                        view.renderCell(cols[j], rec, i, cols[j].getIndex(), out);
                    } else {
                        view.renderCell(cols[j], rec, i, cols[j].getIndex(), i, out);
                    }

                    cell.innerHTML = out.join('');
                }
            }
        }
    },

    updateSlackColumns : function () {
        var view = this.lockedGrid.view;

        if (this.slackColumn) this.redrawColumns([ this.slackColumn ]);
    },

    updateEarlyDateColumns : function () {
        var view = this.lockedGrid.view;

        var cols = [];
        if (this.earlyStartColumn) cols.push(this.earlyStartColumn);
        if (this.earlyEndColumn) cols.push(this.earlyEndColumn);

        if (cols.length) this.redrawColumns(cols);
    },

    updateLateDateColumns : function () {
        var view = this.lockedGrid.view;

        var cols = [];
        if (this.lateStartColumn) cols.push(this.lateStartColumn);
        if (this.lateEndColumn) cols.push(this.lateEndColumn);

        if (cols.length) this.redrawColumns(cols);
    },

    afterRender : function() {
        this.callParent(arguments);

        // HACK to solve a bug with cell editing in Ext 4.2.1
        this.getSelectionModel().view = this.lockedGrid.getView();

        // Prevent editing of non-editable fields
        this.on('beforeedit', function(editor, o) {
            return !this.isReadOnly() && o.record.isEditable(o.field);
        }, this);

        this.setupColumnListeners();


        /* For clients using the Row Expand plugin */
        var depView = this.getDependencyView();

        this.getView().on({
            expandbody      : depView.renderAllDependencies,
            collapsebody    : depView.renderAllDependencies,
            scope           : depView
        });
    },

    setupColumnListeners : function() {
        var me = this;
        var lockedHeader = this.lockedGrid.headerCt;

        lockedHeader.on('add', this.onLockedColumnAdded, this);

        lockedHeader.items.each(function(col) {
            me.onLockedColumnAdded(lockedHeader, col);
        });
    },

    onLockedColumnAdded : function(ct, col) {
        var GntCol = Gnt.column;

        if (
            (GntCol.WBS && col instanceof GntCol.WBS) ||
            (GntCol.Sequence && col instanceof GntCol.Sequence)
        ) {
            this.bindSequentialDataListeners(col);
        } else if (GntCol.Dependency && col instanceof GntCol.Dependency && col.useSequenceNumber) {
            this.bindFullRefreshListeners(col);
        } else if (GntCol.EarlyStartDate && col instanceof GntCol.EarlyStartDate) this.earlyStartColumn = col;
        else if (GntCol.EarlyEndDate && col instanceof GntCol.EarlyEndDate) this.earlyEndColumn   = col;
        else if (GntCol.LateStartDate && col instanceof GntCol.LateStartDate) this.lateStartColumn = col;
        else if (GntCol.LateEndDate && col instanceof GntCol.LateEndDate) this.lateEndColumn     = col;
        else if (GntCol.Slack && col instanceof GntCol.Slack) this.slackColumn = col;

        if (!this.slackListeners && this.slackColumn) {
            this.bindSlackListeners();
        }

        if (!this.earlyDatesListeners && (this.earlyStartColumn || this.earlyEndColumn)) {
            this.bindEarlyDatesListeners();
        }

        if (!this.lateDatesListeners && (this.lateStartColumn || this.lateEndColumn)) {
            this.bindLateDatesListeners();
        }
    },

    getState: function () {
        var me = this,
            state = me.callParent(arguments);

        state.lockedWidth = me.lockedGrid.getWidth();

        return state;
    },

    applyState: function (state) {
        var me = this;

        me.callParent(arguments);

        if (state && state.lockedWidth) {
            me.lockedGrid.setWidth(state.lockedWidth);
        }
    }
});
