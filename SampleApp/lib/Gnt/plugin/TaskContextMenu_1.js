/*

Ext Gantt 2.2.23
Copyright(c) 2009-2014 Bryntum AB
http://bryntum.com/contact
http://bryntum.com/license

*/
/**
@class Gnt.plugin.TaskContextMenu
@extends Ext.menu.Menu

Plugin (ptype = 'gantt_taskcontextmenu') for showing a context menu when right clicking a task:

{@img gantt/images/context-menu.png}

You can add it to your gantt chart like this:

    var gantt = Ext.create('Gnt.panel.Gantt', {
        plugins             : [
            Ext.create("Gnt.plugin.TaskContextMenu")
        ],
        ...
    })


To customize the content of the menu, subclass this plugin and provide your own implementation of the `createMenuItems` method.
You can also customize various handlers for menu items, like `addTaskAbove`, `deleteTask` etc. For example:

    Ext.define('MyProject.plugin.TaskContextMenu', {
        extend     : 'Gnt.plugin.TaskContextMenu',

        createMenuItems : function () {
            return this.callParent().concat({
                text        : 'My handler',

                handler     : this.onMyHandler,
                scope       : this
            });

            this.on('beforeshow', this.onMyBeforeShow, this);
        },

        onMyHandler : function () {
            // the task on which the right click have occured
            var task        = this.rec;

            ...
        },

        onMyBeforeShow : function() {
            // Allow delete only based on some condition
            var isDeleteAllowed = this.rec.get('AllowDelete');

            this.down('#deleteTask').setVisible(isDeleteAllowed);
        }
    });

    var gantt = Ext.create('Gnt.panel.Gantt', {
        selModel : new Ext.selection.TreeModel({ ignoreRightMouseSelection : false }),
        plugins             : [
            Ext.create("MyProject.plugin.TaskContextMenu")
        ],
        ...
    })

Note that when using right click to show the menu you should the 'ignoreRightMouseSelection' to false on your selection model (as seen in the source above).

*/
Ext.define("Gnt.plugin.TaskContextMenu", {
    extend        : "Ext.menu.Menu",
    alias         : 'plugin.gantt_taskcontextmenu',
    mixins        : ['Ext.AbstractPlugin', 'Gnt.mixin.Localizable'],
    lockableScope : 'top',

    requires : ['Gnt.model.Dependency'],

    legacyHolderProp : 'texts',

    plain : true,

    /**
     * @cfg {String} triggerEvent
     * The event upon which the menu shall be shown. Defaults to 'itemcontextmenu', meaning the menu is shown when right-clicking a row or task bar.
     * You can change this to 'taskcontextmenu' if you want the menu to be shown only when right clicking a task bar.
     */
    triggerEvent : 'itemcontextmenu',

    /**
     * @cfg {Object} texts A object, purposed for localization.
     * @deprecated Please use {@link #l10n l10n} instead.
     */

    /**
     * @cfg {Object} l10n
     * A object, purposed for the class localization. Contains the following keys/values:

     - newTaskText         : 'New task',
     - deleteTask          : 'Delete task(s)',
     - editLeftLabel       : 'Edit left label',
     - editRightLabel      : 'Edit right label',
     - add                 : 'Add...',
     - deleteDependency    : 'Delete dependency...',
     - addTaskAbove        : 'Task above',
     - addTaskBelow        : 'Task below',
     - addMilestone        : 'Milestone',
     - addSubtask          : 'Sub-task',
     - addSuccessor        : 'Successor',
     - addPredecessor      : 'Predecessor'
     */

    grid : null,

    /**
     * @property {Gnt.model.Task} rec The task model, for which the menu was activated
     */
    rec  : null,

    lastHighlightedItem : null,

    taskEditorInjected  : false,

    /**
     * This method is being called during plugin initialization. Override if you need to customize the items in the menu.
     * The method should return an array of menu items, which will be used as the value of the `items` property.
     *
     * Each menu item is decorated with an itemId property for testability.
     *
     * @return {Array}
     */
    createMenuItems : function () {
        return [
            {
                handler      : this.deleteTask,
                requiresTask : true,
                itemId       : 'deleteTask',
                text         : this.L('deleteTask')
            },
            {
                handler      : this.editLeftLabel,
                requiresTask : true,
                itemId       : 'editLeftLabel',
                text         : this.L('editLeftLabel')
            },
            {
                handler      : this.editRightLabel,
                requiresTask : true,
                itemId       : 'editRightLabel',
                text         : this.L('editRightLabel')
            },
            {
                handler      : this.toggleMilestone,
                requiresTask : true,
                itemId       : 'toggleMilestone',
                text         : this.L('convertToMilestone')
            },
            {
                text   : this.L('add'),
                itemId : 'addTaskMenu',
                menu   : {
                    plain : true,
                    defaults : { scope : this },
                    items : [
                        {
                            handler      : this.addTaskAboveAction,
                            requiresTask : true,
                            itemId       : 'addTaskAbove',
                            text         : this.L('addTaskAbove')
                        },
                        {
                            handler      : this.addTaskBelowAction,
                            itemId       : 'addTaskBelow',
                            text         : this.L('addTaskBelow')
                        },
                        {
                            handler      : this.addMilestone,
                            itemId       : 'addMilestone',
                            requiresTask : true,
                            text         : this.L('addMilestone')
                        },
                        {
                            handler      : this.addSubtask,
                            requiresTask : true,
                            itemId       : 'addSubtask',
                            text         : this.L('addSubtask')
                        },
                        {
                            handler      : this.addSuccessor,
                            requiresTask : true,
                            itemId       : 'addSuccessor',
                            text         : this.L('addSuccessor')
                        },
                        {
                            handler      : this.addPredecessor,
                            requiresTask : true,
                            itemId       : 'addPredecessor',
                            text         : this.L('addPredecessor')
                        }
                    ]
                }
            },
            {
                text         : this.L('deleteDependency'),
                requiresTask : true,
                itemId       : 'deleteDependencyMenu',

                isDependenciesMenu : true,

                menu : {
                    plain : true,

                    listeners : {
                        beforeshow : this.populateDependencyMenu,

                        // highlight dependencies on mouseover of the menu item
                        mouseover  : this.onDependencyMouseOver,

                        // unhighlight dependencies on mouseout of the menu item
                        mouseleave : this.onDependencyMouseOut,

                        scope : this
                    }
                }
            }
        ];
    },


    // backward compat
    buildMenuItems  : function () {
        this.items = this.createMenuItems();
    },


    initComponent : function () {
        this.defaults = this.defaults || {};
        this.defaults.scope = this;

        this.buildMenuItems();

        this.callParent(arguments);
    },


    init : function (grid) {
        grid.on('destroy', this.cleanUp, this);
        var scheduleView = grid.getSchedulingView(),
            lockedView = grid.lockedGrid.getView();

        if (this.triggerEvent === 'itemcontextmenu') {
            lockedView.on('itemcontextmenu', this.onItemContextMenu, this);
            scheduleView.on('itemcontextmenu', this.onItemContextMenu, this);
        }
        // Always listen to taskcontext menu
        scheduleView.on('taskcontextmenu', this.onTaskContextMenu, this);

        // Handle case of empty schedule too
        scheduleView.on('containercontextmenu', this.onContainerContextMenu, this);
        lockedView.on('containercontextmenu', this.onContainerContextMenu, this);

        this.grid = grid;
    },


    populateDependencyMenu : function (menu) {
        var grid = this.grid,
            taskStore = grid.getTaskStore(),
            dependencies = this.rec.getAllDependencies(),
            depStore = grid.dependencyStore;

        menu.removeAll();

        if (dependencies.length === 0) {
            return false;
        }

        var taskId = this.rec.getId() || this.rec.internalId;

        Ext.each(dependencies, function (dependency) {
            var fromId = dependency.getSourceId(),
                task = taskStore.getById(fromId == taskId ? dependency.getTargetId() : fromId);

            if (task) {
                menu.add({
                    depId : dependency.internalId,
                    text  : Ext.util.Format.ellipsis(Ext.String.htmlEncode(task.getName()), 30),

                    scope   : this,
                    handler : function (menuItem) {
                        // in 4.0.2 `indexOfId` returns the record by the `internalId`
                        // in 4.0.7 `indexOfId` returns the record by its "real" id
                        // so need to manually scan the store to find the record

                        var record;

                        depStore.each(function (dependency) {
                            if (dependency.internalId == menuItem.depId) {
                                record = dependency;
                                return false;
                            }
                        });

                        depStore.remove(record);
                    }
                });
            }
        }, this);
    },


    onDependencyMouseOver : function (menu, item, e) {
        if (item) {
            var schedulingView = this.grid.getSchedulingView();

            if (this.lastHighlightedItem) {
                schedulingView.unhighlightDependency(this.lastHighlightedItem.depId);
            }

            this.lastHighlightedItem = item;

            schedulingView.highlightDependency(item.depId);
        }
    },


    onDependencyMouseOut : function (menu, e) {
        if (this.lastHighlightedItem) {
            this.grid.getSchedulingView().unhighlightDependency(this.lastHighlightedItem.depId);
        }
    },


    cleanUp : function () {
        this.destroy();
    },

    onTaskContextMenu : function (g, record, e) {
        this.activateMenu(record, e);
    },

    onItemContextMenu : function (view, record, item, index, e) {
        this.activateMenu(record, e);
    },

    onContainerContextMenu : function (g, e) {
        this.activateMenu(null, e);
    },

    activateMenu : function (rec, e) {
        // Do not show menu for the root node of task store and in readonly mode of the gantt chart
        if (this.grid.isReadOnly() || this.grid.taskStore.getRootNode() === rec) {
            return;
        }

        e.stopEvent();

        this.rec = rec;
        this.configureMenuItems();

        this.showAt(e.getXY());
    },


    configureMenuItems : function () {
        // if there is a TaksEditor plugin instance let's insert "Task information..." entry as the first menu item
        if (this.grid.taskEditor && !this.taskEditorInjected) {
            this.insert(0, {
                text            : this.L('taskInformation'),
                requiresTask    : true,
                handler         : function () {
                    this.grid.taskEditor.showTask(this.rec);
                },
                scope           : this
            });
            // remember that we added the entry
            this.taskEditorInjected = true;
        }

        var reqTasks = this.query('[requiresTask]');
        var rec = this.rec;

        Ext.each(reqTasks, function (item) {
            item.setDisabled(!rec);
        });

        var dependenciesItem = this.query('[isDependenciesMenu]')[ 0 ];

        if (rec && dependenciesItem) dependenciesItem.setDisabled(!rec.getAllDependencies().length);

        var toggleMilestone = this.down('#toggleMilestone');

        if (rec && toggleMilestone) {
            toggleMilestone.setText(rec.isMilestone() ? this.L('convertToRegular') : this.L('convertToMilestone'));
        }
    },


    copyTask : function (original) {
        var model = this.grid.getTaskStore().model;

        var newTask = new model({
            leaf : true
        });

        newTask.setPercentDone(0);
        newTask.setName(this.L('newTaskText', this.texts));
        newTask.set(newTask.startDateField, (original && original.getStartDate()) || null);
        newTask.set(newTask.endDateField, (original && original.getEndDate()) || null);
        newTask.set(newTask.durationField, (original && original.getDuration()) || null);
        newTask.set(newTask.durationUnitField, (original && original.getDurationUnit()) || 'd');
        return newTask;
    },


    // Actions follow below
    // ---------------------------------------------

    /**
     * Handler for the "add task above" menu item
     */
    addTaskAbove : function (newTask) {
        var task = this.rec;

        if (task) {
            task.addTaskAbove(newTask);
        } else {
            this.grid.taskStore.getRootNode().appendChild(newTask);
        }
    },

    /**
     * Handler for the "add task below" menu item
     */
    addTaskBelow : function (newTask) {
        var task = this.rec;

        if (task) {
            task.addTaskBelow(newTask);
        } else {
            this.grid.taskStore.getRootNode().appendChild(newTask);
        }
    },

    /**
     * Handler for the "delete task" menu item
     */
    deleteTask : function () {
        var selected = this.grid.getSelectionModel().selected;

        this.grid.taskStore.remove(selected.getRange());
    },

    /**
     * Handler for the "edit left label" menu item
     */
    editLeftLabel : function () {
        this.grid.getSchedulingView().editLeftLabel(this.rec);
    },

    /**
     * Handler for the "edit right label" menu item
     */
    editRightLabel : function () {
        this.grid.getSchedulingView().editRightLabel(this.rec);
    },


    /**
     * Handler for the "add task above" menu item
     */
    addTaskAboveAction : function () {
        this.addTaskAbove(this.copyTask(this.rec));
    },


    /**
     * Handler for the "add task below" menu item
     */
    addTaskBelowAction : function () {
        this.addTaskBelow(this.copyTask(this.rec));
    },


    /**
     * Handler for the "add subtask" menu item
     */
    addSubtask : function () {
        var task = this.rec;
        task.addSubtask(this.copyTask(task));
    },

    /**
     * Handler for the "add successor" menu item
     */
    addSuccessor : function () {
        var task = this.rec;
        task.addSuccessor(this.copyTask(task));
    },

    /**
     * Handler for the "add predecessor" menu item
     */
    addPredecessor : function () {
        var task = this.rec;
        task.addPredecessor(this.copyTask(task));
    },


    /**
     * Handler for the "add milestone" menu item
     */
    addMilestone : function () {
        var task = this.rec,
            newTask = this.copyTask(task);

        task.addTaskBelow(newTask);
        newTask.setStartEndDate(task.getEndDate(), task.getEndDate());
    },

    /**
     * Handler for the "Convert to milestone" menu item
     */
    toggleMilestone : function () {
        if (this.rec.isMilestone()) {
            this.rec.convertToRegular();
        } else {
            this.rec.convertToMilestone();
        }
    }
});
