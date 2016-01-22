/*

Ext Gantt 2.2.23
Copyright(c) 2009-2014 Bryntum AB
http://bryntum.com/contact
http://bryntum.com/license

*/
/**
@class Gnt.widget.AssignmentEditGrid
@extends Ext.grid.Panel

A widget used to display and edit the task assignments.
You can find this widget at the `Resources` tab of {@link Gnt.widget.taskeditor.TaskEditor}.
There you can configure it through the {@link Gnt.widget.taskeditor.TaskEditor#assignmentGridConfig assignmentGridConfig} object
available both on the {@link Gnt.widget.taskeditor.TaskEditor} and on the {@link Gnt.plugin.TaskEditor} (if you use TaskEditor by plugin).

{@img gantt/images/assignment-edit-grid2.png}

{@img gantt/images/assignment-edit-grid1.png}

You can also use this grid in your components, standalone:

    // the task store of the project
    var taskStore           = myGanttPanel.taskStore

    var assignmentGrid      = new Gnt.widget.AssignmentEditGrid({
        assignmentStore         : taskStore.assignmentStore,
        resourceStore           : taskStore.resourceStore,

        // identifier of task which assignments have to be displayed
        taskId                  : 100,
        // turn off in-place resource adding
        addResources            : false,

        renderTo                : Ext.getBody(),

        width                   : 800,
        height                  : 600
    })

*/
Ext.define('Gnt.widget.AssignmentEditGrid', {
    extend      : 'Ext.grid.Panel',

    alias       : 'widget.assignmenteditgrid',

    requires    : [
        'Ext.data.JsonStore',
        'Ext.window.MessageBox',
        'Ext.form.field.ComboBox',
        'Ext.grid.plugin.CellEditing',
        'Gnt.util.Data',
        'Gnt.data.AssignmentStore',
        'Gnt.data.ResourceStore',
        'Gnt.model.Resource',
        'Gnt.model.Assignment',
        'Gnt.column.ResourceName',
        'Gnt.column.AssignmentUnits'
    ],

    mixins                  : ['Gnt.mixin.Localizable'],

    /**
     * @cfg {Gnt.data.AssignmentStore} assignmentStore A store with assignments.
     */
    assignmentStore         : null,

    /**
     * @cfg {Gnt.data.ResourceStore} resourceStore A store with resources.
     */
    resourceStore           : null,

    /**
     * @cfg {Boolean} readOnly Whether this grid is read only.
     */
    readOnly                : false,

    cls                     : 'gnt-assignmentgrid',

    /**
     * @cfg {Number} defaultAssignedUnits Default amount of units. This value applies for new assignments.
     */
    defaultAssignedUnits    : 100,

    /**
     * @cfg {Object} l10n
     * A object, purposed for the class localization. Contains the following keys/values:

            - confirmAddResourceTitle : 'Confirm',
            - confirmAddResourceText  : 'No resource &quot;{0}&quot; in storage yet. Would you like to add it?',
            - noValueText             : 'Please select resource to assign',
            - noResourceText          : 'No resource &quot;{0}&quot; in storage'
     */
    /**
     * @cfg {String} confirmAddResourceTitle A title for the confirmation window when a new resource is about to be added.
     * @deprecated Please use {@link #l10n} instead.
     */
    /**
     * @cfg {Mixed} confirmAddResourceText A title for the confirmation window when a new resource is about to be added.
     * If you set this to `false`, no confirmation window will be displayed.
     * In this mode, for every "unknown" resource name entered into the combobox field, a new resource will be created.
     * @deprecated Please use {@link #confirmAddResource} and {@link #l10n} instead.
     */

    /**
     * @cfg {String} noValueText A text for the error message displayed when no resource is selected in the resource combobox.
     * @deprecated Please use {@link #l10n} instead.
     */
    /**
     * @cfg {String} noResourceText A text for the error message displayed when an unknown resource name is entered in the resource combobox.
     * You can use "{0}" placeholder in this parameter. It will be replaced with the text entered in the combobox.
     * For example: 'Cannot find resource: &quot;{0}&quot;'.
     * @deprecated Please use {@link #l10n} instead.
     */

    /**
     * @cfg {Boolean} confirmAddResource False to not display a confirmation window before adding a new resource.
     */
    confirmAddResource      : true,

    /**
     * @cfg {Boolean} addResources `true` to enable in-place resource adding.
     */
    addResources            : true,

    /**
     * @property {String/Number} taskId Identifier of the task to which the assignments belong.
     */
    /**
     * @cfg {String/Number} taskId The task id indicating which assignments to load.
     * **Note**, that if the task doesn't have an identifier yet (a 'phantom' record), you can use its phantomId instead.
     */
    taskId                  : null,

    refreshTimeout          : 100,

    // copy of resource store
    resourceDupStore        : null,

    // copy of resource store used for resources combobox
    // (this store is affected by filters so we don't use `resourceDupStore` to always have "clean" copy there)
    resourceComboStore      : null,

    assignmentUnitsEditor   : null,

    constructor : function (config) {

        Ext.apply(this, config);

        // backward compatibility: config.confirmAddResourceText may also contain False so we treat it like this:
        this.confirmAddResource = this.confirmAddResourceText !== false;

        // grid store ..we make it Gnt.data.AssignmentStore instance since
        // we need it could play this role in case we link grid with TaskForm.taskBuffer
        this.store      = config.store || new Gnt.data.AssignmentStore({
            taskStore   : config.taskStore || config.assignmentStore.getTaskStore()
        });

        this.resourceDupStore = config.resourceDupStore || new Gnt.data.ResourceStore({
            taskStore   : config.taskStore || config.assignmentStore.getTaskStore()
        });

        // resource combo store
        this.resourceComboStore = new Ext.data.JsonStore({
            model   :this.resourceDupStore.model
        });

        if (config.addResources !== undefined) {
            this.addResources = config.addResources;
        }

        this.columns        = this.buildColumns();

        if (!this.readOnly) {
            this.plugins = this.buildPlugins();
        }

        this.callParent(arguments);
    },


    suspendRefreshResources : function () {
        this.refreshResourcesSuspended++;
    },


    resumeRefreshResources : function () {
        this.refreshResourcesSuspended--;
    },


    refreshResources : function () {
        if (!this.refreshResourcesSuspended) {
            this.loadResources();
        }
    },



    suspendRefreshAssignments : function () {
        this.refreshAssignmentsSuspended++;
    },


    resumeRefreshAssignments : function () {
        this.refreshAssignmentsSuspended--;
    },


    refreshAssignments : function () {
        if (!this.refreshAssignmentsSuspended) {
            this.loadTaskAssignments();
        }
    },


    initComponent : function() {
        this.loadResources();

        var refreshResources        = Ext.Function.createBuffered(this.refreshResources, this.refreshTimeout, this, []);

        this.mon(this.resourceStore, {
            add         : refreshResources,
            remove      : refreshResources,
            load        : refreshResources,
            clear       : refreshResources
        });

        this.loadTaskAssignments();

        var refreshAssignments      = Ext.Function.createBuffered(this.refreshAssignments, this.refreshTimeout, this, []);

        this.mon(this.assignmentStore, {
            add         : refreshAssignments,
            remove      : refreshAssignments,
            load        : refreshAssignments,
            clear       : refreshAssignments
        });

        this.callParent(arguments);
    },


    loadResources : function (justResources) {
        if (!this.resourceStore) return false;

        // make a copy of resourceStore
        var data = Gnt.util.Data.cloneModelSet(this.resourceStore, function (copiedResource, srcResource) {
            // each record without Id will be referred by internalId
            if (!copiedResource.getId()) {
                // but we need to put it to Id field for combobox,
                // since combobox valueField is set to get values from Id
                copiedResource.setId(srcResource.getInternalId());
            }
        });

        this.resourceDupStore.loadData(data);

        // clone data to not affect real store
        this.resourceComboStore.loadData(data);

        // we reload assignments as well since they depend on resources list
        if (!justResources) {
            this.loadTaskAssignments();
        }

        return true;
    },

    setEditableFields : function (task) {
        if (!this.assignmentUnitsEditor) this.assignmentUnitsEditor = this.down('assignmentunitscolumn').getEditor();

        switch (task.getSchedulingMode()) {
            case 'DynamicAssignment' :
                this.assignmentUnitsEditor.setReadOnly(true);
                break;
            default :
                this.assignmentUnitsEditor.setReadOnly(false);
        }
    },

    /**
     * Loads task assignments from {@link #assignmentStore}.
     *
     * @param {Mixed} [taskId] The task id indicating which assignments to load.
     * If this parameter is not specified then it will use current {@link #property-taskId} value (identifier provided to this function before (if any)
     * or initially specified by {@link #cfg-taskId} config).
     * **Note**, that if the task doesn't have an identifier yet (a 'phantom' record), you can use the task phantomId instead.
     *
     * @return {Boolean} False if {@link #assignmentStore} doesn't yet exist or if no task identifier has been provided.
     * Otherwise returns `true`.
     */
    loadTaskAssignments : function (taskId) {
        taskId          = taskId || this.taskId;

        if (!taskId) return false;

        var taskStore   = this.taskStore || this.assignmentStore.getTaskStore(),
            task        = taskStore && taskStore.getByInternalId(taskId),
            taskAssignments;

        if (task) {
            taskAssignments = task.assignments;

        } else {
            if (!this.assignmentStore) return false;

            // grab assignments for this task only
            taskAssignments = this.assignmentStore.queryBy(function(a) {
                return a.getTaskId() == taskId;
            });
        }

        this.taskId     = taskId;

        var store       = this.store,
            resStore    = this.resourceDupStore,
            // clone assignments to not affect real records
            data        = Gnt.util.Data.cloneModelSet(taskAssignments, function (copiedAssignment, srcAssignment) {
                // get original resource Id
                var resId       = srcAssignment.getResourceId();
                // get cloned version of that resource
                var clonedRes   = resStore.queryBy(function (resource) {
                    var r   = resource.originalRecord;
                    return (r.getId() || r.internalId) == resId;
                });
                if (clonedRes.getCount()) {
                    clonedRes   = clonedRes.first();
                    // and bind cloned resource to copy of assignment instead of real resource
                    copiedAssignment.setResourceId(clonedRes.getId() || clonedRes.internalId);
                }
            });

        // load data to the store
        store.loadData(data);

        if (task && this.rendered) {
            this.setEditableFields(task);
        }

        return true;
    },


    /**
     * Adds a new assignment record and starts the editor.
     *
     * @param {Gnt.model.Assignment/Object} [newRecord] The new assignment to be added.
     * If this parameter is not provided, a new record will be created using the TaskId of the current task,
     * empty ResourceId field and Units field set to {@link #defaultAssignedUnits} amount.
     * @param {Boolean} [doNotActivateEditor=False] `true` to just insert record without activating editor after insertion.
     *
     * @return {Gnt.model.Assignment[]} The records that were added.
     */
    insertAssignment : function (newRecord, doNotActivateEditor) {
        if (!this.store) return;

        var model   = this.store.model.prototype,
            newRec  = {};

        if (newRecord) {
            newRec = newRecord;
        } else {
            newRec[model.unitsField]    = this.defaultAssignedUnits;
        }

        newRec[model.taskIdField]       = this.taskId;

        var added   = this.store.insert(0, newRec);

        var me              = this,
            oldValidator    = added[0].isValid;

        added[0].isValid    = function () {
            return oldValidator.apply(this, arguments) && me.isValidAssignment(this);
        };

        if (!doNotActivateEditor) {
            this.cellEditing.startEditByPosition({ row : 0, column : 0 });
        }

        return added;
    },

    /**
     * Checks if the data in the grid store is valid.
     * @return {Boolean}
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
     * Returns an array of task assignment error messages.
     * @return {String[]} Array of error messages.
     */
    getAssignmentErrors : function (assignment) {
        var resourceId  = assignment.getResourceId();
        if (!resourceId) return [this.L('noValueText')];

        if (!this.resourceDupStore.getByInternalId(resourceId)) {
            return [Ext.String.format(this.L('noResourceText'), resourceId)];
        }
    },

    isValidAssignment : function (assignment) {
        return !this.getAssignmentErrors(assignment);
    },


    // @private
    buildPlugins : function() {
        var cellEditing = this.cellEditing = Ext.create('Ext.grid.plugin.CellEditing', {
            clicksToEdit : 1
        });

        var oldStartEdit = cellEditing.startEdit;

        cellEditing.startEdit = function() {
            this.completeEdit();

            return oldStartEdit.apply(this, arguments);
        };

        cellEditing.on({
            beforeedit  : this.onEditingStart,

            scope       : this
        });

        return [cellEditing];
    },

    hide : function() {
        this.cellEditing.cancelEdit();
        return this.callParent(arguments);
    },

    onEditingStart  : function (ed, e) {
        var model   = this.store.model.prototype;

        if (e.field == model.resourceIdField) {
            this.assignment = e.record;
            // keep resourceId of record being edited
            this.resourceId = e.record.getResourceId();

            this.resourceComboStore.loadData(this.resourceDupStore.getRange());

            // and re-apply filter to refresh dataset
            this.resourceComboStore.filter(this.resourcesFilter);
        }
    },

    resourceRender : function (value, meta, assignment) {
        var errors  = this.getAssignmentErrors(assignment);

        if (errors && errors.length) {
            meta.tdCls  = Ext.baseCSSPrefix + 'form-invalid';
            meta.tdAttr = 'data-errorqtip="'+errors.join('<br>')+'"';
        } else {
            meta.tdCls  = '';
            meta.tdAttr = 'data-errorqtip=""';
        }

        var record  = this.resourceDupStore.getByInternalId(value);
        return Ext.String.htmlEncode((record && record.getName()) || value);
    },

    // filters resources store to exclude resources that already assigned to the task.
    filterResources : function (resource) {
        var resourceId      = resource.getInternalId(),
            resourceField   = this.store.model.prototype.resourceIdField,
            show            = true;

        // record that is being edited should always be presented in combobox dataset
        if (resourceId !== this.resourceId) {
            // filter out already assigned resources
            this.store.each(function (assignment) {
                if (resourceId == assignment.get(resourceField)) {
                    show    = false;
                    return false;
                }
            });
        }

        return show;
    },

    onResourceComboAssert : function (combo) {
        var rawValue    = combo.getRawValue();

        if (rawValue) {

            var idx = this.resourceDupStore.findExact(combo.displayField, rawValue);

            var record  = idx !== -1 ? this.resourceDupStore.getAt(idx) : false;

            // if no matching record in store
            if (!record) {
                var assignment  = this.assignment;
                var me          = this;

                // callback to proceed with resource creation
                var addResource = function (deferred) {
                    var model       = me.resourceStore.model,
                        newResource = {};

                    // let`s add a new record with such name
                    newResource[model.prototype.nameField]    = combo.rawValue;

                    newResource = new model(newResource);
                    // set resource Id equal to internalId
                    // we need filled Id to combobox proper working
                    newResource.setId(newResource.internalId);

                    // push to store
                    var added   = me.resourceDupStore.add(newResource);
                    if (added && added.length) {
                        if (!deferred) {
                            combo.getStore().add(newResource);
                            // and set combobox value
                            combo.setValue(added[0].getId());
                        } else {
                            assignment.setResourceId(added[0].getId());
                        }
                    }
                };

                // if confirmation required
                if (this.confirmAddResource) {
                    var text    = Ext.String.format(this.L('confirmAddResourceText'), Ext.String.htmlEncode(rawValue));

                    Ext.Msg.confirm(this.L('confirmAddResourceTitle'), text, function (buttonId) {
                        if (buttonId == 'yes') {
                            addResource(true);
                        }
                    });
                } else {
                    addResource();
                }
            } else {
                combo.select(record, true);
            }
        }
    },

    buildColumns : function() {
        var me  = this;

        // task name column editor
        this.resourceCombo  = new Ext.form.field.ComboBox({
            queryMode           : 'local',
            store               : this.resourceComboStore,
            allowBlank          : false,
            editing             : this.addResources,
            validateOnChange    : false,
            autoSelect          : false,
            forceSelection      : !this.addResources,
            valueField          : this.resourceComboStore.model.prototype.idProperty,
            displayField        : this.resourceComboStore.model.prototype.nameField,
            queryCaching        : false,
            listConfig          : {
                // HTML encode combobox items
                getInnerTpl : function () {
                    return '{' + this.displayField + ':htmlEncode}';
                }
            }
        });

        this.resourcesFilter    = Ext.create('Ext.util.Filter', {
            filterFn    : this.filterResources,
            scope       : this
        });

        if (this.addResources) {

            // add new resource record to combo store before assertValue call
            Ext.Function.interceptBefore(this.resourceCombo, 'assertValue', function () {
                me.onResourceComboAssert(this);
            });
        }

        var task;

        // if taskId was provided on a construction step
        if (this.taskId) {
            var taskStore   = this.taskStore || this.assignmentStore.getTaskStore();
            // trying to get task
            task            = taskStore && taskStore.getByInternalId(this.taskId);
        }

        return [
            {
                xtype           : 'resourcenamecolumn',
                editor          : this.resourceCombo,
                dataIndex       : this.assignmentStore.model.prototype.resourceIdField,
                renderer        : this.resourceRender,
                scope           : this
            },
            {
                xtype           : 'assignmentunitscolumn',
                width           : 70,
                assignmentStore : this.assignmentStore,
                editor          : {
                    xtype       : 'percentfield',
                    step        : 10,
                    // don't allow to edit for tasks with DynamicAssignment scheduling mode
                    readOnly    : task && task.getSchedulingMode() == 'DynamicAssignment'
                }
            }
        ];
    },


    saveResources : function () {
        Gnt.util.Data.applyCloneChanges(this.resourceDupStore, this.resourceStore);
    },


    /**
     * Persists task assignments to {@link #assignmentStore}.
     * @return {Boolean} `false` if saving error occures. Otherwise returns `true`.
     */
    saveTaskAssignments : function () {
        // suspend the grid reacting on resource and assignment store changes
        // during applying changes to these stores
        this.suspendRefreshResources();
        this.suspendRefreshAssignments();

        // first we have to save resources in case of *new* resource assignment
        this.saveResources();

        var model       = this.store.model,
            comboStore  = this.resourceDupStore,
            result      = true;

        Gnt.util.Data.applyCloneChanges(this.store, this.assignmentStore, function (data) {
            // get assigned resource
            var resource    = comboStore.getByInternalId(this.getResourceId());
            // and its original record
            if (!resource || !resource.originalRecord) {
                // normally it should`t occur this way since we had to save resources at first
                result  = false;
                return;
            }
            var r   = resource.originalRecord;
            // now let's use real resource ID for saving
            data[model.prototype.resourceIdField] = r.getId() || r.internalId;
        });

        // resume reacting on stores changes
        this.resumeRefreshResources();
        this.resumeRefreshAssignments();

        return result;
    }
});
