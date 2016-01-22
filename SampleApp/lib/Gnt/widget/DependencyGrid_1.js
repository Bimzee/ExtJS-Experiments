/*

Ext Gantt 2.2.23
Copyright(c) 2009-2014 Bryntum AB
http://bryntum.com/contact
http://bryntum.com/license

*/
/**
@class Gnt.widget.DependencyGrid
@extends Ext.grid.Panel

A widget used to display and edit the dependencies of a task.
This widget is used as the `Predecessors` tab of the {@link Gnt.widget.taskeditor.TaskEditor}.
There you can configure it through the {@link Gnt.widget.taskeditor.TaskEditor#dependencyGridConfig dependencyGridConfig} object
available both on the {@link Gnt.widget.taskeditor.TaskEditor} and on the {@link Gnt.plugin.TaskEditor} classes.

{@img gantt/images/dependency-grid.png}

You can create an instance of the grid like this:

        dependencyGrid = Ext.create('Gnt.widget.DependencyGrid', {
            renderTo : Ext.getBody()
        });

To load data into the grid you can use the {@link #loadDependencies} method:

        // create grid
        dependencyGrid = Ext.create('Gnt.widget.DependencyGrid', {
            renderTo : Ext.getBody()
        });

        // load data
        dependencyGrid.loadDependencies(someTask);

* **Note:** If you plan to use this grid for tasks that don't belong to any taskStore you should specify a {@link #dependencyStore}:

        dependencyGrid = Ext.create('Gnt.widget.DependencyGrid', {
            renderTo        : Ext.getBody(),
            dependencyStore : dependencyStore
        });

Let's make our example more interesting by adding toolbar with buttons for editing:

        dependencyGrid = Ext.create('Gnt.widget.DependencyGrid', {
            renderTo        : Ext.getBody(),
            dependencyStore : dependencyStore,

            // toolbar with buttons
            tbar            : {
                items   : [
                    {
                        xtype       : 'button',
                        iconCls     : 'gnt-action-add',
                        text        : 'Add',
                        handler     : function() {
                            dependencyGrid.insertDependency();
                        }
                    },
                    {
                        xtype       : 'button',
                        iconCls     : 'gnt-action-remove',
                        text        : 'Remove',
                        handler     : function() {
                            var recs = dependencyGrid.getSelectionModel().getSelection();
                            if (recs && recs.length) {
                                dependencyGrid.store.remove(recs);
                            }
                        }
                    }
                ]
            }
        });

#Set grid direction

By default this grid displays predecessors of a task. To display successors instead, set the {@link #cfg-direction} config to 'successors'.
Example:

        dependencyGrid = Ext.create('Gnt.widget.DependencyGrid', {
            // set grid to display successors
            direction : 'successors'
        });

#Embedded checks

This class contains embedded transitivity and cycle detection algorithms. It runs them every time a new dependency is being added.
* **For example**: There is `Task A`->`Task B` and `Task B`->`Task C` dependencies.
In this case dependency `Task A`->`Task C` will be **transitive** and therefore will be considered invalid.
And dependency `Task C`->`Task A` (or `Task B`->`Task A`) will form a **cycle** and will also be considered invalid.

*/
Ext.define('Gnt.widget.DependencyGrid', {
    extend              : 'Ext.grid.Panel',
    alias               : 'widget.dependencygrid',

    requires            : [
        'Ext.data.JsonStore',
        'Ext.grid.plugin.CellEditing',
        'Ext.form.field.ComboBox',
        'Ext.util.Filter',
        'Gnt.model.Dependency',
        'Gnt.util.Data',
        'Gnt.field.Duration'
    ],

    mixins              : ['Gnt.mixin.Localizable'],

    /**
     * @cfg {Boolean} readOnly Whether this grid is read only.
     */
    readOnly            : false,

    /**
     * @cfg {Boolean} showCls Whether to show the column for `Cls` field of the dependencies.
     */
    showCls             : false,

    cls                 : 'gnt-dependencygrid',

    /**
     * @property {Gnt.model.Task} task A task dependencies of which are displayed.
     * @readonly
     */
    task                : null,

    /**
     * @cfg {Gnt.data.DependencyStore} dependencyStore A store with dependencies.
     */
    dependencyStore     : null,

    /**
     * @cfg {Gnt.model.Task} taskModel A task model class.
     * **Note:** This setting might be required when the grid shows dependencies of a task which subclasses {@link Gnt.model.Task}
     * and does not belong to any task store (and task store is not specified in dependency store as well).
     */
    taskModel           : null,

    /**
     * @property {String} direction The type of dependencies that are displayed in the grid. Either 'predecessors' or 'successors'.
     * @readonly
     * **Note:** You should use this property for *reading only*.
     */

    /**
     * @cfg {String} direction Defines what kind of dependencies will be displayed in a grid. Either 'predecessors' or 'successors'.
     */
    direction           : 'predecessors',

    oppositeStore       : null,

    taskStoreListeners  : null,

    refreshTimeout      : 100,

    /**
     * @cfg {Boolean} allowParentTaskDependencies Set to `true` to include parent tasks in the list of possible predecessors/successors.
     */
    allowParentTaskDependencies     : false,

    /**
     * @cfg {Boolean} useSequenceNumber Set to `true` to use auto-generated sequential identifiers
     * to reference other tasks (see {@link Gnt.model.Task#getSequenceNumber} for definition).
     * If value is `false` then "real" id (that is stored in the database) will be used.
     */
    useSequenceNumber : false,

    /**
     * @cfg {Object} l10n
     * A object, purposed for class localization. Contains the following keys/values:

        - idText                      : 'ID',
        - taskText                    : 'Task Name',
        - blankTaskText               : 'Please select task',
        - invalidDependencyText       : 'Invalid dependency',
        - parentChildDependencyText   : 'Dependency between child and parent found',
        - duplicatingDependencyText   : 'Duplicating dependency found',
        - transitiveDependencyText    : 'Transitive dependency',
        - cyclicDependencyText        : 'Cyclic dependency',
        - typeText                    : 'Type',
        - lagText                     : 'Lag',
        - clsText                     : 'CSS class',
        - endToStartText              : 'Finish-To-Start',
        - startToStartText            : 'Start-To-Start',
        - endToEndText                : 'Finish-To-Finish',
        - startToEndText              : 'Start-To-Finish'
     */
    /**
     * @cfg {String} idText The text to use for `ID` column header.
     * @deprecated Please use {@link #l10n} instead.
     */
    /**
     * @cfg {String} taskText The text to use for `Task Name` column header.
     * @deprecated Please use {@link #l10n} instead.
     */
    /**
     * @cfg {String} blankTaskText The error text to display if no task is selected.
     * @deprecated Please use {@link #l10n} instead.
     */
    /**
     * @cfg {String} invalidDependencyText The error text to display if an invalid dependency is found.
     * @deprecated Please use {@link #l10n} instead.
     */
    /**
     * @cfg {String} parentChildDependencyText The error text to display if a parent-child or child-parent dependency is found.
     * @deprecated Please use {@link #l10n} instead.
     */
    /**
     * @cfg {String} duplicatingDependencyText The error text to display if there is more than one dependency found between two tasks.
     * @deprecated Please use {@link #l10n} instead.
     */
    /**
     * @cfg {String} transitiveDependencyText The error text to display if a transitive dependency is found.
     * @deprecated Please use {@link #l10n} instead.
     */
    /**
     * @cfg {String} cyclicDependencyText The error text to display if a cyclic dependency id found.
     * @deprecated Please use {@link #l10n} instead.
     */
    /**
     * @cfg {String} typeText The text to use for `Type` column header.
     * @deprecated Please use {@link #l10n} instead.
     */
    /**
     * @cfg {String} lagText The text to use for `Lag` column header
     * @deprecated Please use {@link #l10n} instead.
     */
    /**
     * @cfg {String} clsText The text to use for `CSS class` column header
     * @deprecated Please use {@link #l10n} instead.
     */
    /**
     * @cfg {String} endToStartText The text for `end-to-start` dependency type
     * @deprecated Please use {@link #l10n} instead.
     */
    /**
     * @cfg {String} startToStartText The text for `start-to-start` dependency type
     * @deprecated Please use {@link #l10n} instead.
     */
    /**
     * @cfg {String} endToEndText The text for `end-to-end` dependency type
     * @deprecated Please use {@link #l10n} instead.
     */
    /**
     * @cfg {String} startToEndText The text for `start-to-end` dependency type
     * @deprecated Please use {@link #l10n} instead.
     */

    constructor : function (config) {
        config = config || {};

        // map locales from legacy configs
        Ext.Array.each(
            [
                'idText',
                'taskText',
                'blankTaskText',
                'invalidDependencyText',
                'parentChildDependencyText',
                'duplicatingDependencyText',
                'transitiveDependencyText',
                'cyclicDependencyText',
                'typeText',
                'lagText',
                'clsText',
                'endToStartText',
                'startToStartText',
                'endToEndText',
                'startToEndText'
            ],
            function (prop) {
                if (prop in config) this[prop] = config[prop];
            },
            this
        );


        this.store  = config.store || new Ext.data.JsonStore({
            model   : config.dependencyStore ? config.dependencyStore.model : 'Gnt.model.Dependency'
        });

        if (!this.readOnly) {
            this.plugins    = this.buildPlugins();
        }

        this.direction = config.direction || this.direction;

        // tweak to fill taskModel automatically if not provided
        if (!config.taskModel) {
            config.taskModel    = Ext.ClassManager.get('Gnt.model.Task');

            if (config.dependencyStore) {
                var taskStore   = config.dependencyStore.getTaskStore();
                if (taskStore) config.taskModel    = taskStore.model;
            }
        }

        if (config.oppositeStore) {
            this.setOppositeStore(config.oppositeStore);
        }

        if (config.task) {
            this.loadDependencies(config.task);
        }

        this.callParent([ config ]);
    },

    initComponent : function() {
        this.columns = this.buildColumns();

        this.callParent(arguments);
    },

    destroy : function () {
        this.cellEditing.destroy();

        if (this.deferredStoreBind) {
            this.tasksCombo.un('render', this.bindTaskStore, this);
        }
        this.tasksCombo.destroy();
        this.lagEditor.destroy();

        this.callParent(arguments);
    },


    setTask : function (task) {
        if (!task) return;

        this.task               = task;

        var dependencyStore     = task.dependencyStore || task.getTaskStore().dependencyStore;

        if (dependencyStore && dependencyStore !== this.dependencyStore) {
            this.dependencyStore    = dependencyStore;

            if (this.typesCombo) {
                this.typesCombo.store.filter();
            }

            this.mon(this.dependencyStore, {
                datachanged : function () {
                    this.loadDependencies();
                },
                scope       : this
            });
        }

    },


    buildPlugins : function() {

        var cellEditing = this.cellEditing = new Ext.grid.plugin.CellEditing({ clicksToEdit : 1 });

        cellEditing.on({
            beforeedit  : this.onEditingStart,
            edit        : this.onEditingDone,

            scope   : this
        });

        return [cellEditing];
    },


    hide : function() {
        this.cellEditing.cancelEdit();
        this.callParent(arguments);
    },


    onEditingStart  : function (ed, e) {
        var model   = this.store.model.prototype;

        switch (e.field) {
            case model.lagField: this.lagEditor.durationUnit = e.record.getLagUnit(); break;

            case model.typeField:
                this.typesCombo.store.filter();
                // if set of dependency types is restricted and allowed number of types is less than 2
                // we won't show dropdown list
                if (this.typesCombo.store.count() < 2) return false;
                break;

            //case model.fromField:
                //this.idValue    = this.direction === 'predecessors' ? e.record.getSourceId() : e.record.getTargetId();
                //break;
        }
    },


    onEditingDone : function (ed, e) {
        var model = this.store.model.prototype;

        if (e.field == model.lagField) {
            e.record.setLagUnit(this.lagEditor.durationUnit);
        }

        // after editing we refresh view since some records could become invalid
        this.getView().refresh();
    },

    // dependency type column renderer
    dependencyTypeRender : function (value) {
        var type  = this.store.model.Type;

        switch (value) {
            case type.EndToStart    : return this.L('endToStartText');
            case type.StartToStart  : return this.L('startToStartText');
            case type.EndToEnd      : return this.L('endToEndText');
            case type.StartToEnd    : return this.L('startToEndText');
        }

        return value;
    },


    // gets list of dependency errors, used at task column renderer
    taskValidate : function (value, depRec) {
        if (!value) {
            return [this.L('blankTaskText')];
        }
        if (!depRec.isValid()) {
            var errors  = this.getDependencyErrors(depRec);
            if (errors && errors.length) {
                return errors;
            }
            return [this.L('invalidDependencyText')];
        }
    },

    // task name column renderer
    taskRender : function (value, meta, depRec) {
        var errors  = this.taskValidate(value, depRec),
            record;

        if (errors && errors.length) {
            meta.tdCls  = Ext.baseCSSPrefix + 'form-invalid';
            meta.tdAttr = 'data-errorqtip="'+errors.join('<br>')+'"';
        } else {
            meta.tdCls  = '';
            meta.tdAttr = 'data-errorqtip=""';
        }

        var taskStore   = this.dependencyStore && this.dependencyStore.getTaskStore();
        if (taskStore) {
            record = taskStore.getById(value) || taskStore.getByInternalId(value);
            return (record && Ext.String.htmlEncode(record.getName())) || '';
        }

        return '';
    },


    filterTasks : function (record) {
        var me      = this,
            taskId  = record.getInternalId(),
            method;

        if (this.direction === 'predecessors') {
            method  = 'getSourceId';
        } else {
            method  = 'getTargetId';
        }

        // filter out task itself
        return taskId != this.task.getInternalId() &&
            // a links between a parent and its child
            !this.task.contains(record) && !record.contains(this.task) &&
            (this.allowParentTaskDependencies || record.isLeaf()) /*&&
            (!me.idValue ||
                ((taskId != me.idValue) &&
                    (this.store.findBy(function (dep) { return taskId == dep[method](); }) < 0)))*/;
    },


    bindTaskStore : function() {
        var taskStore   = this.dependencyStore && this.dependencyStore.getTaskStore();

        if (taskStore) {

            if (!this.taskStoreListeners) {
                // merge multiple refreshes to single one
                var refreshTasks    = Ext.Function.createBuffered(this.bindTaskStore, this.refreshTimeout, this, []);

                this.taskStoreListeners = this.mon(taskStore, {
                    append      : refreshTasks,
                    insert      : refreshTasks,
                    update      : refreshTasks,
                    remove      : refreshTasks,
                    refresh     : refreshTasks,
                    clear       : refreshTasks,
                    'nodestore-datachange-end'    : refreshTasks,
                    scope       : this,
                    destroyable : true
                });
            }

            // make new store
            var store   = new Ext.data.JsonStore({
                model   : taskStore.model,
                sorters : taskStore.model.prototype.nameField
            });

            var root = taskStore.tree.getRootNode();

            // load tasks from tasks store
            store.loadData(Gnt.util.Data.cloneModelSet(taskStore.tree.flatten(), function (rec, src) {
                if (src === root || src.hidden) return false;
                // set phantomId as Id for records without Id
                // we need it since combo's valueField is 'Id'
                if (!src.getId()) {
                    rec.setId(src.getPhantomId());
                }
            }));

            this.tasksFilter    = new Ext.util.Filter({
                filterFn    : this.filterTasks,
                scope       : this
            });

            // and apply filter to it
            store.filter(this.tasksFilter);

            this.tasksCombo.bindStore(store);
        }
    },


    buildTasksCombo : function () {
        var me  = this;

        return new Ext.form.field.ComboBox({
            queryMode       : 'local',
            alowBlank       : false,
            editing         : false,
            forceSelection  : true,
            valueField      : this.taskModel.prototype.idProperty,
            displayField    : this.taskModel.prototype.nameField,
            queryCaching    : false,
            listConfig      : {
                // HTML encode combobox items
                getInnerTpl : function () {
                    return '{' + this.displayField + ':htmlEncode}';
                }
            },
            validator       : function (value) {
                if (!value) {
                    return me.L('blankTaskText');
                }

                return true;
            }
        });
    },


    filterAllowedTypes : function (record) {
        if (!this.dependencyStore || !this.dependencyStore.allowedDependencyTypes) return true;

        var allowed     = this.dependencyStore.allowedDependencyTypes;
        var depType     = this.store.model.Type;

        for (var i = 0, l = allowed.length; i < l; i++) {
            var type    = depType[allowed[i]];
            if (record.getId() == type) return true;
        }

        return false;
    },


    buildTypesCombo : function () {
        var depType         = this.store.model.Type;

        this.typesFilter    = new Ext.util.Filter({
            filterFn    : this.filterAllowedTypes,
            scope       : this
        });

        var store           = new Ext.data.ArrayStore({
            fields      : [
               { name : 'id', type : 'int' },
               'text'
            ],
            data        : [
                [   depType.EndToStart,     this.L('endToStartText')     ],
                [   depType.StartToStart,   this.L('startToStartText')   ],
                [   depType.EndToEnd,       this.L('endToEndText')       ],
                [   depType.StartToEnd,     this.L('startToEndText')     ]
            ]
        });

        // and apply filter to it
        store.filter(this.typesFilter);

        return new Ext.form.field.ComboBox({
            triggerAction   : 'all',
            queryMode       : 'local',
            editable        : false,
            valueField      : 'id',
            displayField    : 'text',
            store           : store
        });
    },


    buildColumns : function () {
        var me          = this,
            model       = this.store.model.prototype,
            depType     = this.store.model.Type,
            cols        = [],
            taskStore   = this.dependencyStore && this.dependencyStore.getTaskStore();

        // task name column editor
        this.tasksCombo = this.buildTasksCombo();

        // if no taskStore yet let`s defer its binding
        if (!taskStore) {
            this.deferredStoreBind = true;
            this.tasksCombo.on('render', this.bindTaskStore, this);
        // let`s build & bind combobox store
        } else {
            this.bindTaskStore();
        }

        var idColumn    = {};

        if (this.useSequenceNumber) {
            idColumn =
                {
                    text        : this.L('snText'),
                    dataIndex   : model.fromField,
                    renderer    : function (value, meta, record) {
                        var store   = me.dependencyStore && me.dependencyStore.getTaskStore(),
                            node    = store && store.getNodeById(record.get('From'));

                        return node ? node.getSequenceNumber() : '';
                    },
                    width       : 50
                };
        } else {
            idColumn =
                {
                    text        : this.L('idText'),
                    dataIndex   : model.fromField,
                    width       : 50
                };
        }

        if (this.direction === 'predecessors') {
            cols.push(
                idColumn,
                {
                    text        : this.L('taskText'),
                    dataIndex   : model.fromField,
                    flex        : 1,
                    editor      : this.tasksCombo,
                    renderer    : function (value, meta, depRec) {
                        return me.taskRender(value, meta, depRec);
                    }
                }
            );
        } else {
            cols.push(
                idColumn,
                {
                    text        : this.L('taskText'),
                    dataIndex   : model.toField,
                    flex        : 1,
                    editor      : this.tasksCombo,
                    renderer    : function (value, meta, depRec) {
                        return me.taskRender(value, meta, depRec);
                    }
                }
            );
        }

        this.lagEditor = new Gnt.field.Duration({
            minValue : Number.NEGATIVE_INFINITY
        });

        this.typesCombo = this.buildTypesCombo();

        cols.push(
            {
                text        : this.L('typeText'),
                dataIndex   : model.typeField,
                width       : 120,
                renderer    : function (value) {
                    return me.dependencyTypeRender(value);
                },
                editor      : this.typesCombo
            },
            {
                text        : this.L('lagText'),
                dataIndex   : model.lagField,
                width       : 100,
                editor      : this.lagEditor,
                renderer    : function(value, meta, record) {
                    return me.lagEditor.valueToVisible(value, record.get(model.lagUnitField), 2);
                }
            },
            {
                text        : this.L('clsText'),
                dataIndex   : model.clsField,
                hidden      : !this.showCls,
                width       : 100
            }
        );

        return cols;
    },


    /**
     * Creates new record and starts process of its editing.
     * @param {Gnt.model.Dependency/Object} [newRecord] New dependency to be added.
     * @param {Boolean} [doNotActivateEditor=false] `true` to just insert record without starting the editing after insertion.
     * @return {Gnt.model.Dependency[]} The records that were added.
     */
    insertDependency  : function (newRecord, doNotActivateEditor) {
        if (!this.dependencyStore) return;

        var taskId  = this.task.getInternalId(),
            model   = this.store.model.prototype,
            newRec  = {},
            me      = this;

        if (newRecord) {
            newRec = newRecord;
        } else {
            newRec[model.typeField]     = this.typesCombo.store.getAt(0).getId();
            newRec[model.lagField]      = 0;
            newRec[model.lagUnitField]  = 'd';
        }

        if (this.direction === 'predecessors') {
            newRec[model.toField]   = taskId;
        } else {
            newRec[model.fromField] = taskId;
        }

        var added   = this.store.insert(0, newRec);
        // bind our validator
        if (added.length) {
            var oldValidator    = added[0].isValid;
            added[0].isValid    = function () {
                return oldValidator.call(this, false) && me.isValidDependency(this);
            };
        }

        if (!doNotActivateEditor) {
            this.cellEditing.startEditByPosition({ row : 0, column : 1 });
        }

        return added;
    },

    onOppositeStoreChange : function () {
        this.getView().refresh();
    },

    setOppositeStore : function (store) {

        // this can be made public after resolving the problem with transitivity detection
        //
        // Sets store with opposite to the grid dependencies direction.
        // This can be used for example to implement two grids one with predecessors and another one with successors of the task.
        // Grids will work in conjunction and validation of one grid will instantly react on changes made in another one.
        // @param {Ext.data.Store} store Store with dependencies.
        // @example
        //      var predecessorsGrid = Ext.create('Gnt.widget.DependencyGrid', {
        //          direction       : 'predecessors',
        //          dependencyStore : dependencyStore,
        //          task            : task
        //      });
        //
        //      var successorsGrid = Ext.create('Gnt.widget.DependencyGrid', {
        //          direction       : 'successors',
        //          dependencyStore : dependencyStore,
        //          // set predecessors grid store as opposite to successors
        //          oppositeStore   : predecessorsGrid.store,
        //          task            : task
        //      });
        //
        //      // set successors grid store as opposite to predecessors
        //      predecessorsGrid.setOppositeStore(successorsGrid.store);
        //

        var listeners = {
            update      : this.onOppositeStoreChange,
            datachanged : this.onOppositeStoreChange,
            scope       : this
        };

        if (this.oppositeStore) {
            this.mun(this.oppositeStore, listeners);
        }

        this.oppositeStore = store;

        // on opposite store changes we will refresh grid view
        // since it can affect rows validity
        this.mon(this.oppositeStore, listeners);
    },

    /**
     * Loads task dependencies to grid store.
     * @param {Gnt.model.Task} task Task dependencies of which should be loaded.
     */
    loadDependencies : function (task) {
        var me = this;

        task = task || this.task;

        if (!task) return;

        if (this.task !== task) {
            this.setTask(task);
        }

        var data;

        if (this.direction === 'predecessors') {
            data = task.getIncomingDependencies(true);
            if (!this.oppositeStore) {
                this.oppositeData   = task.getOutgoingDependencies(true);
            }
        } else {
            data = task.getOutgoingDependencies(true);
            if (!this.oppositeStore) {
                this.oppositeData   = task.getIncomingDependencies(true);
            }
        }

        // let`s clone it to not affect real data
        // we save changes only by saveDependencies() call
        var result  = Gnt.util.Data.cloneModelSet(data, function (rec) {
            // validate record by our own validator
            var oldValidator    = rec.isValid;
            rec.isValid         = function () {
                return oldValidator.call(this, false) && me.isValidDependency(this);
            };
        });

        this.store.loadData(result);

        this.fireEvent('loaddependencies', this, this.store, result, task);
    },


    /*
     * Gets an array of error messages for provided dependency.
     */
    getDependencyErrors : function (dependency) {
        var me          = this,
            depStore    = me.dependencyStore,
            fromId      = me.task.getInternalId(),
            toId        = fromId,
            errors      = [];

        if (me.direction === 'predecessors') {
            fromId      = dependency.getSourceId();
        } else {
            toId        = dependency.getTargetId();
        }

        var fromTask    = depStore.getSourceTask(fromId);
        var toTask      = depStore.getTargetTask(toId);

        me.store.each(function (dep) {
            var sourceId    = dep.getSourceId(),
                targetId    = dep.getTargetId();
            // check duplicating records
            if ((fromId == sourceId) && (toId == targetId) && (dep !== dependency)) {
                errors.push(me.L('duplicatingDependencyText'));
                return false;
            }
        });

        if (errors.length) return errors;

        // let's ask dependency store to validate the dependency
        // we have to provide list of records that we're gonna add to the dependency store
        var toAdd   = me.store.getRange();
        // ..minus dependency that we're validating
        toAdd.splice(Ext.Array.indexOf(toAdd, dependency), 1);
        // and list of existing ..old dependencies ..that we plan to remove/replace
        var oldDependencies = me.task[me.direction];
        // run validation
        var error   = depStore.getDependencyError(dependency, toAdd, oldDependencies);

        if (error) {
            switch (error) {
                case -3: case -8: case -5: case -6:
                    return [me.L('transitiveDependencyText')];
                case -4: case -7:
                    return [me.L('cyclicDependencyText')];
                case -9:
                    return [me.L('parentChildDependencyText')];
            }

            return [this.L('invalidDependencyText')];
        }

        return errors;
    },


    /*
     * Checks if the dependency is valid.
     */
    isValidDependency : function (dependency) {
        var errors = this.getDependencyErrors(dependency);

        return !errors || !errors.length;
    },


    /*
     * Checks if the grid is valid.
     */
    isValid : function () {
        var result  = true;
        this.store.each(function (record) {
            if (!record.isValid()) {
                result  = false;
                return false;
            }
        });
        return result;
    },

    /**
     * Applies all changes that have been made to grid data to dependency store.
     */
    saveDependencies : function () {
        if (!this.dependencyStore || !this.isValid()) return;

        // push changes from grid store to real dependencyStore
        Gnt.util.Data.applyCloneChanges(this.store, this.dependencyStore);
    }

});
