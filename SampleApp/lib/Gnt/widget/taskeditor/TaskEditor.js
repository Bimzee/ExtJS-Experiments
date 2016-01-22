/*

Ext Gantt 2.2.23
Copyright(c) 2009-2014 Bryntum AB
http://bryntum.com/contact
http://bryntum.com/license

*/
/**
@class Gnt.widget.taskeditor.TaskEditor
@extends Ext.tab.Panel

A widget used to display and edit task information.
By default the widget is an Ext.tab.Panel instance which can contain the following tabs:

 - General information
 - Predecessors
 - Resources
 - Advanced
 - Notes

You can easily add new custom tabs using {@link #items} config.

# General

{@img gantt/images/taskeditor-panel-general.png}

Contains a customizable {@link Gnt.widget.TaskForm form} instance for viewing and editing the following task data:

 - the name of the task
 - the start date of the task
 - the end date of the task
 - the task duration
 - the task effort
 - the current status of a task, expressed as the percentage completed
 - the baseline start date of the task (editing of this field is optional)
 - the baseline end date of the task (editing of this field is optional)
 - the baseline status of a task, expressed as the percentage completed (editing of this field is optional)

### Task form customization

There is a {@link #taskFormConfig} config which can be used to customize the form panel.

        Ext.create('Gnt.widget.taskeditor.TaskEditor', {
            // Configure the form located in the "General" tab
            taskFormConfig : {
                // turn off fields highlighting
                highlightTaskUpdates : false,
                // alter panel margin
                margin : 20
            }
        });

### Fields configuration

The {@link Gnt.widget.TaskForm} class has a config for each field presented at the `General` tab.
And using {@link #taskFormConfig} we can get access for those options to setup fields.
For example:

        Ext.create('Gnt.widget.taskeditor.TaskEditor', {
            // setup form located at "General" tab
            taskFormConfig : {
                // set Baseline Finish Date field invisible
                baselineFinishConfig : {
                    hidden : true
                }
            }
        });

Here are some more configs for other fields:

 - {@link Gnt.widget.TaskForm#taskNameConfig taskNameConfig} (the name of the task field)
 - {@link Gnt.widget.TaskForm#startConfig startConfig} (the start date of the task field)
 - {@link Gnt.widget.TaskForm#finishConfig finishConfig} (the end date of the task field)
 - {@link Gnt.widget.TaskForm#durationConfig durationConfig} (the task duration field)

Please see {@link Gnt.widget.TaskForm} class to see the full list of available config options.

### Extending the General field set

If you want to add a new field to the `General` tab you will have to extend the {@link Gnt.widget.TaskForm TaskForm} class.
After that you will need to configure the task editor to use your extended class:

        // extend standard TaskForm class
        Ext.define('MyTaskForm', {
            extend : 'Gnt.widget.taskeditor.TaskForm',

            constructor : function(config) {
                this.callParent(arguments);

                // add some custom field
                this.add({
                    fieldLabel  : 'Foo',
                    name        : 'Name',
                    width       : 200
                });
            }
        });

        // Let task editor know which class to use
        Ext.create('Gnt.widget.taskeditor.TaskEditor', {
            // to use MyTaskForm to build the "General" tab
            taskFormClass : 'MyTaskForm'
        });

#Predecessors

Contains a {@link Gnt.widget.DependencyGrid grid} instance displaying the predecessors for the task.
You can add, edit or remove dependencies of the task using this panel.

{@img gantt/images/taskeditor-panel-predecessors.png}

You can enable/disable this tab by setting the {@link #showDependencyGrid} option.
To rename this tab you can use `dependencyText` property of {@link #l10n} config.
Customizing the grid itself can be done via the {@link #dependencyGridConfig} config.
To change make this tab display successors instead of predecessors - use the following code:

        Ext.create('Gnt.widget.taskeditor.TaskEditor', {
            l10n : {
                // here we change tab title
                dependencyText : 'Successors'
            },
            // here is the grid config
            dependencyGridConfig : {
                // set grid to display successors
                direction : 'successors'
            }
        });

### Customizing dependency grid class

You can also configure the task editor to use a custom class to build this tab using the {@link #dependencyGridClass} option.
If you need to add an extra column to the grid, you can do it like this:

        // extend standard DependencyGrid
        Ext.define('MyDependencyGrid', {
            extend: 'Gnt.widget.DependencyGrid',

            // extend buildColumns method to append extra column
            buildColumns : function () {
                // add custom column as last one
                return this.callParent(arguments).concat({
                    header    : 'Foo',
                    dataIndex : 'foo',
                    width     : 100
                });
            }
        });

        // setup task editor
        Ext.create('Gnt.widget.taskeditor.TaskEditor', {
            // to use extended class to build tab
            dependencyGridClass : 'MyDependencyGrid'
        });

#Resources

Contains a {@link Gnt.widget.AssignmentEditGrid grid} instance displaying the task assignments.
It allows you to add, edit or remove task assignments.

{@img gantt/images/taskeditor-panel-resources2.png}

It also supports inline resource adding (for more details, take a look at the {@link Gnt.widget.AssignmentEditGrid#addResources} config.

{@img gantt/images/taskeditor-panel-resources1.png}

You can enable/disable this tab by setting the {@link #showAssignmentGrid} option.
To rename this tab you can use the `resourcesText` property of {@link #l10n} config.
Customizing the grid can be done via the {@link #assignmentGridConfig} config.

Example:

        Ext.create('Gnt.widget.taskeditor.TaskEditor', {
            assignmentStore : assignmentStore,
            resourceStore : resourceStore,
            l10n : {
                // rename tab
                resourcesText : 'Assignments'
            },
            // here is grid the config
            assignmentGridConfig : {
                // disable in-place resources adding
                addResources : false
            }
        });

### Customizing assignment grid class

You can use a custom grid class for this tab by using the {@link #assignmentGridClass} option.
For example if you need to add extra column to the grid you can do it like this:

        // Extend the standard AssignmentGrid
        Ext.define('MyAssignmentGrid', {
            extend: 'Gnt.widget.AssignmentEditGrid',

            // extend buildColumns method to append extra column
            buildColumns : function () {
                // add custom column as last one
                return this.callParent(arguments).concat({
                    header       : 'Foo',
                    dataIndex    : 'foo',
                    width        : 100
                });
            }
        });

        // setup task editor
        Ext.create('Gnt.widget.taskeditor.TaskEditor', {
            // use extended class
            assignmentGridClass : 'MyAssignmentGrid'
        });

#Advanced

Contains a {@link Gnt.widget.TaskForm form} instance which can be customized, allowing the user to view and edit the following task data:

 - the calendar assigned to the task
 - the scheduling mode for the task

{@img gantt/images/taskeditor-panel-advanced.png}

You can enable/disable this tab by setting the {@link #showAdvancedForm} option.
To rename this tab you can use the `advancedText` property of {@link #l10n} config.

Customizing the form itself can be done via the {@link #advancedFormConfig} config. For example this is how form content can be overwritten:

        Ext.create("Gnt.widget.taskeditor.TaskEditor", {
            advancedFormConfig: {
                items: [
                     // new fields that will go here
                     // will replace standard presented in the "Advanced" tab
                     ...
                ]
            }
        });

### Customizing the form class

You can use your own custom class to build this tab by using the {@link #advancedFormClass} config:
For example if you need to add some extra field you can do it like this:

        // Extend standard TaskForm class
        Ext.define('MyAdvancedForm', {
            extend : 'Gnt.widget.taskeditor.TaskForm',

            constructor : function(config) {
                this.callParent(arguments);

                // add some custom field
                this.add({
                    fieldLabel  : 'Foo',
                    name        : 'Name',
                    width       : 200
                });
            }
        });

        // setup task editor
        Ext.create("Gnt.widget.taskeditor.TaskEditor", {
            // to use new class to build the "Advanced" tab
            advancedFormClass: 'MyAdvancedForm',
        });

#Notes

Contains an {@link Ext.form.field.HtmlEditor HTML editor instance} for viewing and editing a freetext note about the task.

{@img gantt/images/taskeditor-panel-notes.png}

You can enable/disable this tab by setting the {@link #showNotes} option.
To rename this tab you can use the `notesText` property of {@link #l10n} config.
Customizing the grid itself can be done via the {@link #notesConfig} config.

*/
Ext.define('Gnt.widget.taskeditor.TaskEditor', {

    extend                  : 'Ext.tab.Panel',

    alias                   : 'widget.taskeditor',

    requires                : [
        'Ext.panel.Panel',
        'Ext.form.Panel',
        'Gnt.widget.taskeditor.TaskForm',
        'Gnt.widget.AssignmentEditGrid',
        'Gnt.widget.DependencyGrid',
        'Gnt.field.Calendar',
        'Gnt.field.SchedulingMode',
        'Ext.form.field.HtmlEditor',
        'Gnt.util.Data'
    ],

    mixins                  : ['Gnt.mixin.Localizable'],
    margin                  : '5 0 0 0',
    alternateClassName      : ['Gnt.widget.TaskEditor'],

    border                  : false,

    plain                   : true,

    defaults                : {
        margin          : 5,
        border          : false
    },

    /**
     * @event loadtask
     * Fires after task has been loaded into the editor.
     * @param {Gnt.widget.taskeditor.TaskEditor} taskEditor The task editor widget instance.
     * @param {Gnt.model.Task} task The task.
     *
     * This event can be used to do additional data loading if task editor was extended with some extra fields.
     * Also please take a look at {@link #afterupdatetask} event to have an example of how to implement custom data saving.
     *
     *      // some custom user form
     *      var customForm = new Gnt.widget.taskeditor.TaskForm({
     *          title : 'Custom form panel',
     *          xtype : 'taskform',
     *          items : [
     *              {
     *                  fieldLabel  : 'Foo field',
     *                  name        : 'foo',
     *                  allowBlank  : false
     *              }
     *          ],
     *          taskStore   : taskStore
     *      });
     *
     *      var taskEditor = Ext.create('Gnt.plugin.TaskEditor', {
     *          // register custom form as an additional tab
     *          items       : customForm,
     *          listeners   : {
     *              // populate custom form with task values
     *              loadtask : function (taskeditor, task) {
     *                  customForm.loadRecord(task);
     *              },
     *              ....
     *          }
     *      });
     */

    /**
     * @event beforeupdatetask
     * Fires before task updating occurs. Return `false` to prevent the update.
     * @param {Gnt.widget.taskeditor.TaskEditor} taskEditor The task editor widget instance.
     * @param {Function} proceedCallback The function which can be called manually to continue task updating. Example:
     *
     *      var taskEditor = Ext.create('Gnt.widget.taskeditor.TaskEditor', {
     *          listeners   : {
     *              beforeupdatetask    : function (taskeditor, proceedCallback) {
     *                  var me  = this;
     *                  Ext.MessageBox.confirm('Confirm', 'Are you sure you want to do that?', function (buttonId) {
     *                      if (buttonId == 'yes') {
     *                          // here we continue updating asynchronously after user click "Yes" button
     *                          proceedCallback();
     *                          me.hide();
     *                      }
     *                  });
     *                  // here we return false to stop updating
     *                  return false;
     *              }
     *          }
     *      });
     *
     */

    /**
     * @event afterupdatetask
     * Fires after a task has been updated.
     * @param {Gnt.widget.taskeditor.TaskEditor} taskEditor The task editor instance.
     *
     * This event can be used to do some extra processing after task was updated by task editor.
     * For example in case when you have some additional fields you can implement saving of them using this event.
     * Also please take a look at {@link #loadtask} event to have an example of how to implement custom data loading.
     *
     *      // some custom user form
     *      var customForm = new Gnt.widget.taskeditor.TaskForm({
     *          title : 'Custom form panel',
     *          xtype : 'taskform',
     *          items : [
     *              {
     *                  fieldLabel  : 'Foo field',
     *                  // foo - is the name of custom task field
     *                  name        : 'foo',
     *                  allowBlank  : false
     *              }
     *          ],
     *          taskStore   : taskStore
     *      });
     *
     *      var taskEditor = Ext.create('Gnt.plugin.TaskEditor', {
     *          // register custom form as an additional tab
     *          items       : customForm,
     *          listeners   : {
     *              afterupdatetask : function (taskeditor) {
     *                  // update form fields to loaded task
     *                  customForm.updateRecord();
     *              },
     *              ....
     *          }
     *      });
     */

    /**
     * @event validate
     * Fires when task validating occurs.
     * @param {Gnt.widget.taskeditor.TaskEditor} taskEditor The task editor instance.
     * @param {Ext.Component} tabToFocus The tab panel item where one or more invalid fields was detected.
     *
     * Fires during a {@link #method-validate} method call when task validation occurs.
     * Return `false` to make the validation fail, but take care of marking invalid component somehow (to let user know of error)
     * since normally invalid components are being highlighted during validate call.
     * For example:
     *
     *      var taskEditor = Ext.create('Gnt.widget.taskeditor.TaskEditor', {
     *          items       : {
     *              title   : 'Some custom tab',
     *              items   : [{
     *                  xtype       : 'textfield',
     *                  fieldLabel  : 'Enter your name',
     *                  id          : 'enter-your-name',
     *                  allowBlank  : false,
     *                  blankText   : 'Please enter your name'
     *              }]
     *          },
     *          listeners   : {
     *              validate    : function (taskeditor, tabToFocus) {
     *                  var field = taskeditor.down('#enter-your-name');
     *                  // if validation of our field failed
     *                  if (!field.isValid()) {
     *                      // if no other tabs with some invalid control
     *                      if (!tabToFocus) {
     *                          var activeTab = taskeditor.getActiveTab();
     *                          // if our field is not placed at currently active tab
     *                          if (!field.isDescendantOf(activeTab)) {
     *                              // then we'll switch to tab where our field resides
     *                              taskeditor.setActiveTab(taskeditor.getTabByComponent(field));
     *                          }
     *                      }
     *                      // return false since validation failed
     *                      return false;
     *                  }
     *              }
     *          }
     *      });
     *
     */

    /**
     * @cfg {Gnt.model.Task} task The task to edit.
     */
    task                    : null,

    /**
     * @cfg {Gnt.data.TaskStore} taskStore A store with tasks.
     *
     * **Note:** This is a required option if the task being edited doesn't belong to any task store.
     */
    taskStore               : null,

    /**
     * @cfg {Gnt.data.AssignmentStore} assignmentStore A store with assignments.
     *
     * **Note:** It has to be provided to show the `Resources` tab (See also {@link #resourceStore}).
     */
    assignmentStore         : null,

    /**
     * @cfg {Gnt.data.ResourceStore} resourceStore A store with resources.
     *
     * **Note:** It has to be provided to show the `Resources` tab (See also {@link #assignmentStore}).
     */
    resourceStore           : null,

    /**
     * @cfg {String} taskFormClass Class representing the form in the `General` tab.
     *
     * This option supposed to be used to implement a custom form in the `General` tab content.
     */
    taskFormClass           : 'Gnt.widget.taskeditor.TaskForm',

    /**
     * @cfg {String} advancedFormClass Class representing the form in the `Advanced` tab.
     *
     * This option supposed to be used to implement a custom form in the `Advanced` tab content.
     */
    advancedFormClass       : 'Gnt.widget.taskeditor.TaskForm',

    /**
     * @cfg {Boolean} showAssignmentGrid `true` to display a `Resources` tab.
     */
    showAssignmentGrid      : true,

    /**
     * @cfg {Boolean} showDependencyGrid `true` to display a `Predecessors` tab.
     */
    showDependencyGrid      : true,

    /**
     * @cfg {Boolean} allowParentTaskDependencies `true` to display a `Predecessors` tab for parent tasks
     * (requires {@link #showDependencyGrid} to be `true` as well) and also include parent tasks in the list
     * of possible predecessors.
     */
    allowParentTaskDependencies     : false,

    /**
     * @cfg {Boolean} showNotes `true` to display a `Notes` tab.
     */
    showNotes               : true,

    showStyle               : true,

    /**
     * @cfg {Boolean} showAdvancedForm `true` to display an `Advanced` tab.
     */
    showAdvancedForm        : true,

    /**
     * @cfg {Boolean} showRollup `true` to display rollup field in the `Advanced` tab.
     */
    showRollup            :  false,

    /**
     * @cfg {Object/Object[]} items A single item, or an array of child Components to be **appended** after default tabs to this container.
     * For example:
     *
     *      var taskEditor = Ext.create('Gnt.widget.taskeditor.TaskEditor', {
     *          items: [{
     *              title   : "Some custom tab",
     *              items   : [{
     *                  xtype       : 'textfield',
     *                  fieldLabel  : 'Enter your name',
     *                  id          : 'enter-your-name',
     *                  allowBlank  : false,
     *                  blankText   : 'Please enter your name'
     *              }]
     *          }]
     *      });
     */

    /**
     * @cfg {Boolean} showBaseline `true` to display baseline fields in the `General` tab.
     */
    showBaseline            : true,

    /**
     * @cfg {Object} tabsConfig TabPanel configuration. Any Ext.tab.Panel options can be used.
     * @deprecated After refactoring {@link Gnt.widget.taskeditor.TaskEditor} itself became an Ext.tab.Panel instance so no need for separate config anymore.
     */
    tabsConfig              : null,

    /**
     * @cfg {Object} taskFormConfig Configuration options to be supplied to the `General` tab.
     * For possible options take a look at the {@link Gnt.widget.TaskForm}.
     */
    taskFormConfig          : null,

    /**
     * @cfg {String} dependencyGridClass Class representing the grid panel in the `Predecessor` tab.
     *
     * Override this to provide your own implementation subclassing the {@link Gnt.widget.DependencyGrid} class.
     */
    dependencyGridClass     : 'Gnt.widget.DependencyGrid',

    /**
     * @cfg {Object} dependencyGridConfig Configuration options for the `Predecessors` tab.
     * For possible options take a look at the {@link Gnt.widget.DependencyGrid}.
     *
     */
    dependencyGridConfig    : null,

    /**
     * @cfg {String} assignmentGridClass Class representing the grid panel in the `Resources` tab.
     *
     * Override this to provide your own implementation subclassing the {@link Gnt.widget.AssignmentEditGrid} class.
     */
    assignmentGridClass     : 'Gnt.widget.AssignmentEditGrid',

    /**
     * @cfg {Object} assignmentGridConfig Configuration options for the `Resources` tab.
     * For possible options take a look at the {@link Gnt.widget.AssignmentEditGrid}.
     *
     */
    assignmentGridConfig    : null,

    styleFormConfig         : null,

    /**
     * @cfg {Object} advancedFormConfig Configuration options for the `Advanced` tab.
     * For possible options take a look at the {@link Gnt.widget.TaskForm}.
     *
     */
    advancedFormConfig      : null,

    /**
     * @cfg {Object} notesConfig Configuration options for the HTML-editor placed in the `Notes` tab.
     * For possible options take a look at the {@link Ext.form.field.HtmlEditor}.
     */
    notesConfig             : null,

    /**
     * @property {Ext.panel.Panel} notesPanel The `Notes` tab.
     * Please use {@link #notesEditor} to access an enclosed HTML-editor.
     */
    notesPanel              : null,

    /**
     * @property {Ext.form.field.HtmlEditor} notesEditor The HTML-editor presented in the `Notes` tab.
     * To specify setting for the HTML-editor please use {@link #notesConfig}.
     */
    notesEditor             : null,

    height                  : 340,
    width                   : 600,
    layout                  : 'fit',

    /**
     * @property {Ext.tab.Panel} tabs Main TabPanel contained by task editor widget.
     * @deprecated After refactoring {@link Gnt.widget.taskeditor.TaskEditor} itself became an Ext.tab.Panel instance so no need for this property anymore.
     */
    tabs                    : null,

    /**
     * @property {Gnt.widget.TaskForm} taskForm The `General` tab task form.
     * By default it's a {@link Gnt.widget.TaskForm} instance but it might be customized by using {@link #taskFormClass} option.
     */
    taskForm                : null,

    /**
     * @property {Gnt.widget.AssignmentEditGrid} assignmentGrid The grid used for the `Resources` tab.
     *
     */
    assignmentGrid          : null,

    /**
     * @property {Gnt.widget.DependencyGrid} dependencyGrid The `Predecessors` tab instance.
     *
     */
    dependencyGrid          : null,
    /**
     * @property {Gnt.widget.TaskForm} advancedForm The `Advanced` tab form.
     * By default it's a {@link Gnt.widget.TaskForm} instance but it can be customized by using {@link #advancedFormClass} option.
     *
     */
    advancedForm            : null,

    /**
     * @cfg {Object} l10n
     * A object, purposed for the class localization. Contains the following keys/values:

            - generalText         : 'General',
            - resourcesText       : 'Resources',
            - dependencyText      : 'Predecessors',
            - addDependencyText   : 'Add new',
            - dropDependencyText  : 'Remove',
            - notesText           : 'Notes',
            - advancedText        : 'Advanced',
            - wbsCodeText         : 'WBS code',
            - addAssignmentText   : 'Add new',
            - dropAssignmentText  : 'Remove'
     */
    /**
     * @cfg {String} generalText A text for the `General` tab title.
     * @deprecated Please use {@link #l10n} instead.
     */
    /**
     * @cfg {String} resourcesText A text for the `Resources` tab title.
     * @deprecated Please use {@link #l10n} instead.
     */
    /**
     * @cfg {String} dependencyText A text for the `Predecessors` tab title.
     * @deprecated Please use {@link #l10n} instead.
     */
    /**
     * @cfg {String} addDependencyText A text for the `Add new` button in the `Predecessors` tab.
     * @deprecated Please use {@link #l10n} instead.
     */
    /**
     * @cfg {String} dropDependencyText A text for the `Remove` button in the "Predecessors" tab.
     * @deprecated Please use {@link #l10n} instead.
     */
    /**
     * @cfg {String} notesText A text for the `Notes` tab title.
     * @deprecated Please use {@link #l10n} instead.
     */
    /**
     * @cfg {String} advancedText A text for the `Advanced` tab title.
     * @deprecated Please use {@link #l10n} instead.
     */
    /**
     * @cfg {String} wbsCodeText A text for the `WBS code` field label.
     * @deprecated Please use {@link #l10n} instead.
     */
    /**
     * @cfg {String} addAssignmentText A text for the `Add new` button in the `Resources` tab.
     * @deprecated Please use {@link #l10n} instead.
     */
    /**
     * @cfg {String} dropAssignmentText A text for the `Remove` button in the `Resources` tab.
     * @deprecated Please use {@link #l10n} instead.
     */

    stylingText             : 'Styling',
    clsText                 : 'CSS Class',
    backgroundText          : 'Background',
    doneBackgroundText      : 'Progress Background',

    clonedStores            : null,

    constructor : function (config) {
        var me          = this;

        config = config || {};

        Ext.apply(this, config);

        var taskModel = (this.taskStore && this.taskStore.model) ? this.taskStore.model.prototype : Gnt.model.Task.prototype;

        this.taskFormConfig = this.taskFormConfig || {};

        Ext.applyIf(this.taskFormConfig, {
            showBaseline    : this.showBaseline,
            showRollup      : false //we show it here
        });

        // Prepare stores clones without actual data loading (loading occurs inside loadTask() method).
        var clonedStores    = this.clonedStores   = (this.task || this.taskStore) ? this.cloneStores() : {};

        var items   = [];

        // create TaskForm instance
        this.taskForm = Ext.create(this.taskFormClass || 'Gnt.widget.taskeditor.TaskForm', Ext.applyIf(this.taskFormConfig, {
            task        : this.task,
            taskStore   : this.taskStore
        }));

        items.push(this.taskForm);

        // create DependencyGrid instance
        if (this.showDependencyGrid) {
            this.dependencyGrid = Ext.create(this.dependencyGridClass, Ext.apply({
                allowParentTaskDependencies     : this.allowParentTaskDependencies,
                taskModel   : this.taskStore.model,
                task        : this.task,
                margin      : 5,
                tbar        : {
                    items   : [
                        {
                            xtype       : 'button',
                            iconCls     : 'gnt-action-add',
                            text        : this.L('addDependencyText'),
                            handler     : function() {
                                me.dependencyGrid.insertDependency();
                            }
                        },
                        {
                            xtype       : 'button',
                            iconCls     : 'gnt-action-remove',
                            text        : this.L('dropDependencyText'),
                            itemId      : 'drop-dependency-btn',
                            disabled    : true,
                            handler     : function() {
                                var recs = me.dependencyGrid.getSelectionModel().getSelection();
                                if (recs && recs.length) {
                                    me.dependencyGrid.store.remove(recs);
                                }
                            }
                        }
                    ]
                },
                listeners   : {
                    selectionchange : function(sm, sel) {
                        var grid    = me.dependencyGrid;
                        if (!grid.dropDepBtn) {
                            grid.dropDepBtn  = grid.down('#drop-dependency-btn');
                        }
                        grid.dropDepBtn && grid.dropDepBtn.setDisabled(!sel.length);
                    }
                }
            }, this.dependencyGridConfig));

            items.push(this.dependencyGrid);
        }

        // if AssignmentGrid required
        if (this.showAssignmentGrid && this.assignmentStore && this.resourceStore) {
            // clone assignment and resource stores if they were not copied before
            if (!clonedStores.assignmentStore) clonedStores.assignmentStore = this.cloneAssignmentStore(this.task);
            if (!clonedStores.resourceStore) clonedStores.resourceStore     = this.cloneResourceStore(this.task);

            // create AssignmentGrid instance
            this.assignmentGrid     = Ext.create(this.assignmentGridClass, Ext.apply({
                assignmentStore     : this.assignmentStore,
                resourceStore       : this.resourceStore,
                // we use clone of assignment store as assignmentGrid.store
                store               : clonedStores.assignmentStore,
                resourceDupStore    : clonedStores.resourceStore,
                tbar                : {
                    items   : [
                        {
                            xtype       : 'button',
                            iconCls     : 'gnt-action-add',
                            text        : this.L('addAssignmentText'),
                            handler     : function() {
                                me.assignmentGrid.insertAssignment();
                            }
                        },
                        {
                            xtype       : 'button',
                            iconCls     : 'gnt-action-remove',
                            text        : this.L('dropAssignmentText'),
                            itemId      : 'drop-assignment-btn',
                            disabled    : true,
                            handler     : function() {
                                var recs = me.assignmentGrid.getSelectionModel().getSelection();
                                if (recs && recs.length) {
                                    me.assignmentGrid.store.remove(recs);
                                }
                            }
                        }
                    ]
                },
                listeners       : {
                    // we need this to draw selection properly on very first activation of tab
                    // to gracefully process deferredRender = true
                    afterrender : {
                        fn      : function(el) {
                            el.loadTaskAssignments(me.task.get(me.task.idProperty));
                        },
                        single  : true
                    },
                    selectionchange : function(sm, sel) {
                        var grid    = me.assignmentGrid;
                        if (!grid.dropBtn) {
                            grid.dropBtn = grid.down('#drop-assignment-btn');
                        }
                        grid.dropBtn && grid.dropBtn.setDisabled(!sel.length);
                    }
                }
            }, this.assignmentGridConfig));

            items.push(this.assignmentGrid);
        }

        // if advanced form required
        if (this.showAdvancedForm) {
            var frm = Ext.ClassManager.get(this.advancedFormClass || 'Gnt.widget.taskeditor.TaskForm').prototype;

            this.advancedFormConfig = this.advancedFormConfig || {};

            var advancedItems = [
                {
                    xtype       : 'calendarfield',
                    fieldLabel  : frm.L('calendarText'),
                    name        : this.task ? this.task.calendarIdField : taskModel.calendarIdField,
                    value       : this.task && this.task.getCalendarId(true),
                    taskStore   : this.taskStore,
                    task        : this.task
                },
                {
                    xtype       : 'schedulingmodefield',
                    fieldLabel  : frm.L('schedulingModeText'),
                    name        : this.task ? this.task.schedulingModeField : taskModel.schedulingModeField,
                    value       : this.task && this.task.getSchedulingMode(),
                    allowBlank  : false,
                    taskStore   : this.taskStore,
                    task        : this.task
                },
                {
                    xtype       : 'displayfield',
                    fieldLabel  : this.L('wbsCodeText'),
                    name        : 'wbsCode',
                    value       : this.task && this.task.getWBSCode()
                }
            ];

            if (this.showRollup) {
                advancedItems.push(Ext.apply({
                    xtype       : 'checkboxfield',
                    fieldLabel  : frm.L('rollupText'),
                    name        : this.task ? this.task.rollupField : taskModel.rollupField,
                    value       : this.task && this.task.getRollup(),
                    taskStore   : this.taskStore,
                    task        : this.task
                }, this.taskForm.rollupConfig));
            }

            // create TaskForm instance for the "Advanced" tab form
            this.advancedForm = Ext.create(this.advancedFormClass || 'Gnt.widget.taskeditor.TaskForm', Ext.applyIf(this.advancedFormConfig, {
                items       : advancedItems,
                task        : this.task,
                taskStore   : this.taskStore
            }));

            items.push(this.advancedForm);
        }

        // create notes panel
        if (this.showNotes) {
            // create notes HtmlEditor instance
            this.notesEditor = Ext.create('Ext.form.field.HtmlEditor', Ext.apply({
                listeners       : {
                    // we need this to draw content of HtmlEditor properly on very first activation of tab
                    // to gracefully process deferredRender = true
                    afterrender : function(el) {
                        me.notesEditor.setValue(me.task.get(me.task.noteField));
                    }
                }
            }, this.notesConfig));

            // we have to wrap it to panel since it's gonna be tab in TabPanel
            // (to avoid some render bugs)
            this.notesPanel = Ext.create('Ext.panel.Panel', {
                border  : false,
                layout  : 'fit',
                items   : this.notesEditor
            });

            items.push(this.notesPanel);
        }

        // show style tab
        /*if (this.showStyle) {
            var fname = this.task ? this.task.clsField : taskModel.clsField;

            this.styleFormConfig = this.styleFormConfig || {};

            this.styleFormConfig.items = [
                {
                    xtype       : 'textfield',
                    fieldLabel  : this.clsText,
                    name        : fname,
                    value       : this.task ? this.task.get(fname) : ''
                },
                {
                    xtype       : 'backgroundfield',
                    fieldLabel  : this.backgroundText
                },
                {
                    xtype       : 'backgroundfield',
                    fieldLabel  : this.doneBackgroundText
                }
            ];

            this.styleForm  = Ext.create('Ext.form.Panel', Ext.applyIf(this.styleFormConfig, {
                border      : false,
                task        : this.task,
                taskStore   : this.taskStore
            }));

            items.push(this.styleForm);
        }*/

        // make sure that each panel has its title
        if (!this.taskForm.title) this.taskForm.title                                       = this.L('generalText');
        if (this.dependencyGrid && !this.dependencyGrid.title) this.dependencyGrid.title    = this.L('dependencyText');
        if (this.assignmentGrid && !this.assignmentGrid.title) this.assignmentGrid.title    = this.L('resourcesText');
        if (this.advancedForm && !this.advancedForm.title) this.advancedForm.title          = this.L('advancedText');
        if (this.notesPanel && !this.notesPanel.title) this.notesPanel.title                = this.L('notesText');
        if (this.styleForm && !this.styleForm.title) this.styleForm.title                   = this.stylingText;

        var its     = this.items || (this.tabsConfig && this.tabsConfig.items);
        // user defined tabs go after our predefined ones
        if (its) {
            items.push.apply(items, Ext.isArray(its) ? its : [its]);

            delete config.items;
            if (this.tabsConfig && this.tabsConfig.items) {
                delete this.tabsConfig.items;
            }
        }

        this.items  = items;

        // support deprecated config
        Ext.apply(this, this.tabsConfig);

        // if we have the only tab let's hide the tabBar
        if (items.length <= 1) {
            config.tabBar   = config.tabBar || {};
            Ext.applyIf(config.tabBar, { hidden : true });
        }

        // support deprecated property
        this.tabs   = this;

        this.callParent(arguments);
    },


    getTaskStore : function () {
        return this.taskStore || this.task && this.task.getTaskStore();
    },


    // We need fake taskStore to give task copy ability to ask it for the project calendar
    cloneTaskStore : function (task, config) {
        var store   = this.getTaskStore();

        if (!store) return null;

        return new (Ext.getClass(store))(Ext.apply({
            isCloned                            : true,
            calendar                            : store.getCalendar(),
            model                               : store.model,
            weekendsAreWorkdays                 : store.weekendsAreWorkdays,
            cascadeChanges                      : store.cascadeChanges,
            batchSync                           : false,
            recalculateParents                  : false,
            skipWeekendsDuringDragDrop          : store.skipWeekendsDuringDragDrop,
            moveParentAsGroup                   : store.moveParentAsGroup,
            enableDependenciesForParentTasks    : store.enableDependenciesForParentTasks,
            availabilitySearchLimit             : store.availabilitySearchLimit,
            dependenciesCalendar                : 'project',
            proxy                               : {
                type        : 'memory',
                reader      : {
                    type    : 'json'
                }
            }
        }, config));
    },


    cloneDependencyStore : function (task, config) {
        var taskStore   = this.getTaskStore();
        var store       = this.dependencyStore || taskStore && taskStore.getDependencyStore();

        if (!store) return null;

        return new (Ext.getClass(store))(Ext.apply({
            isCloned                    : true,
            model                       : store.model,
            strictDependencyValidation  : store.strictDependencyValidation,
            allowedDependencyTypes      : store.allowedDependencyTypes,
            proxy                       : {
                type        : 'memory',
                reader      : {
                    type    : 'json'
                }
            }
        }, config));
    },


    cloneAssignmentStore : function (task, config) {
        var taskStore   = this.getTaskStore();
        var store       = this.assignmentStore || taskStore && taskStore.getAssignmentStore();

        if (!store) return null;

        return new (Ext.getClass(store))(Ext.apply({
            isCloned        : true,
            model           : store.model,
            proxy           : {
                type        : 'memory',
                reader      : {
                    type    : 'json'
                }
            }
        }, config));
    },


    cloneResourceStore : function (task, config) {
        var taskStore   = this.getTaskStore();
        var store       = this.resourceStore || taskStore && taskStore.getResourceStore();

        if (!store) return null;

        return new (Ext.getClass(store))(Ext.apply({
            isCloned        : true,
            model           : store.model,
            proxy           : {
                type        : 'memory',
                reader      : {
                    type    : 'json'
                }
            }
        }, config));
    },


    cloneStores : function (config) {
        var task                = this.task,
            resourceStore       = this.cloneResourceStore(task, config && config.resourceStore),
            assignmentStore     = this.cloneAssignmentStore(task, config && config.assignmentStore),
            dependencyStore     = this.cloneDependencyStore(task, config && config.dependencyStore);

        var taskStore           = this.cloneTaskStore(task, Ext.apply({
            assignmentStore     : assignmentStore,
            resourceStore       : resourceStore,
            dependencyStore     : dependencyStore
        }, config && config.taskStore));

        return {
            resourceStore   : resourceStore,
            assignmentStore : assignmentStore,
            dependencyStore : dependencyStore,
            taskStore       : taskStore
        };
    },


    cloneTask : function (task) {
        return task.copy(task.getInternalId(), false);
    },


    bindDependencyGrid : function () {
        var depsClone           = this.clonedStores.dependencyStore;
        var grid                = this.dependencyGrid;

        // dependency grid store have to use cloned task store
        grid.store.taskStore    = this.clonedStores.taskStore;

        if (depsClone) {

            this.mon(grid, {
                loaddependencies : function (grid, store) {
                    depsClone.loadData( store.getRange().concat(Gnt.util.Data.cloneModelSet(grid.oppositeData)) );
                }
            });

            this.mon(grid.store, {
                add     : function (store, records) {
                    depsClone.add(records);
                },
                remove  : function (store, record) {
                    depsClone.remove(record);
                }
            });

            this.dependencyGridBound    = true;
        }
    },


    /**
     * Loads task data into task editor.
     * @param {Gnt.model.Task} task Task to load to editor.
     */
    loadTask : function (task) {
        if (!task) return;

        var me              = this;

        this.task           = task;

        var taskForm        = this.taskForm;

        // on task loading step let's suppress task updating
        taskForm.setSuppressTaskUpdate(true);
        taskForm.getForm().reset();

        var clonedStores    = this.clonedStores;

        var taskStore       = this.getTaskStore();

        var taskBuffer      = this.cloneTask(task);

        // copy relevant tasks for TaskStore clone
        var tasks           = [ taskBuffer ];

        Ext.Array.each(task.predecessors, function (d) {
            var t       = me.cloneTask(d.getSourceTask());
            // update task store refs on task
            t.taskStore = clonedStores.taskStore;
            tasks.push(t);
        });

        Ext.Array.each(task.successors, function (d) {
            var t       = me.cloneTask(d.getTargetTask());
            // update task store refs on task
            t.taskStore = clonedStores.taskStore;
            tasks.push(t);
        });


        // clone stores that were not cloned yet
        if (!clonedStores.dependencyStore) clonedStores.dependencyStore = this.cloneDependencyStore(task);
        if (!clonedStores.assignmentStore) clonedStores.assignmentStore = this.cloneAssignmentStore(task);
        if (!clonedStores.resourceStore) clonedStores.resourceStore     = this.cloneResourceStore(task);

        if (!clonedStores.taskStore) {
            clonedStores.taskStore  = this.cloneTaskStore(task, {
                assignmentStore     : clonedStores.assignmentStore,
                resourceStore       : clonedStores.resourceStore,
                dependencyStore     : clonedStores.dependencyStore
            });
        }

        taskBuffer.taskStore        = clonedStores.taskStore;

        taskBuffer.taskStore.on({
            update : function (store, record, operation) {
                if (record === taskBuffer && operation == Ext.data.Model.EDIT) {
                    record.fireEvent('taskupdated', record);
                }
            }
        });

        // helper function to copy Id of a record being cloned
        // used in further cloneModelSet calls (by default it generates new Id for a record copy)
        var copyId = function (copy, original) { copy.setId(original.getId()); };

        var assignmentGrid  = this.assignmentGrid;

        if (assignmentGrid) {
            // we use clone of assignment store as assignmentGrid.store
            if (clonedStores.assignmentStore !== assignmentGrid.getStore()) assignmentGrid.reconfigure(clonedStores.assignmentStore);
            if (assignmentGrid.resourceDupStore !== clonedStores.resourceStore) assignmentGrid.resourceDupStore = clonedStores.resourceStore;

            assignmentGrid.loadResources();
            // load task assignments to grid
            assignmentGrid.loadTaskAssignments(task.getId() || task.getPhantomId());

            assignmentGrid.task = taskBuffer;

        // if we don't have assignments grid we still need to have assignments store copy filled
        } else {
            if (clonedStores.resourceStore) {
                clonedStores.resourceStore.loadData( Gnt.util.Data.cloneModelSet(this.resourceStore || this.getTaskStore().getResourceStore(), copyId) );
            }
            if (clonedStores.assignmentStore) {
                clonedStores.assignmentStore.loadData( Gnt.util.Data.cloneModelSet(task.assignments, copyId) );
            }
        }

        var dependencyGrid  = this.dependencyGrid;

        if (dependencyGrid) {
            if (!this.dependencyGridBound) this.bindDependencyGrid();
            // we always load records into the grid event when tab is not visible
            // since we use its ability to load task dependencies to fill our dependency store clone with records
            dependencyGrid.loadDependencies(task);

            if (this.allowParentTaskDependencies || task.isLeaf()) {
                dependencyGrid.tab.show();
            } else {
                dependencyGrid.tab.hide();
            }

        // if we don't have dependency grid we still need to have dependency store copy filled
        } else if (clonedStores.dependencyStore) {
            clonedStores.dependencyStore.loadData( Gnt.util.Data.cloneModelSet(task.getAllDependencies(), copyId) );
        }

        clonedStores.taskStore.setRootNode({
            expanded    : true,
            children    : tasks
        });

        taskForm.loadRecord(task, taskBuffer);

        if (this.advancedForm) {
            // disable 'taskupdated' event processing for advancedForm
            this.advancedForm.setSuppressTaskUpdate(true);

            var form    = this.advancedForm.getForm();

            form.reset();

            // we point advancedForm.taskBuffer to taskForm.taskBuffer
            // it will allow them to share changes of each other
            this.advancedForm.loadRecord(task, taskForm.taskBuffer);

            var field   = form.findField('wbsCode');
            if (field) {
                field.setValue(task.getWBSCode());
            }

            // enable 'taskupdated' event processing for advancedForm back
            this.advancedForm.setSuppressTaskUpdate(false);
        }

        // enable 'taskupdated' event processing back
        taskForm.setSuppressTaskUpdate(false);

        if (this.styleForm) {
            this.styleForm.loadRecord(task);
        }

        if (this.notesEditor) {
            this.notesEditor.setValue(task.get(task.noteField));
        }


        this.fireEvent('loadtask', this, task);
    },

    /**
     * Returns the task editor tab that contains specified component.
     * @return {Ext.Component} Tab containing specified component or `undefined` if item is not found.
     */
    getTabByComponent : function (component) {
        var result;
        this.items.each(function (el) {
            if (component === el || component.isDescendantOf(el)) {
                result = el;
                return false;
            }
        }, this);

        return result;
    },

    /**
     * Checks data loaded or entered to task editor for errors.
     * Calls isValid methods of taskForm, dependencyGrid, advancedForm (if corresponding objects are presented at the task editor).
     * In case some of calls returns `false` switch active tab so that user can view invalid object.
     * Validation can be customized by handling {@link #event-validate} event.
     *
     * Returns `false` in that case.
     * @return {Boolean} Returns `true` if all components are valid.
     */
    validate : function () {
        var activeTab   = this.getActiveTab(),
            result      = true,
            tabToFocus;

        if (activeTab) {
            if (!this.taskForm.isValid()) {
                // if we are already at tab with error
                if (this.taskForm === activeTab || this.taskForm.isDescendantOf(activeTab)) {
                    return false;
                }

                result      = false;
                // get tab to switch to
                tabToFocus  = this.getTabByComponent(this.taskForm);
            }

            if (this.dependencyGrid && !this.dependencyGrid.isValid()) {
                // if we are already at tab with error
                if (this.dependencyGrid === activeTab || this.dependencyGrid.isDescendantOf(activeTab)) {
                    return false;
                }

                result      = false;
                // get tab to switch to
                tabToFocus  = tabToFocus || this.getTabByComponent(this.dependencyGrid);
            }

            if (this.assignmentGrid && !this.assignmentGrid.isValid()) {
                // if we are already at tab with error
                if (this.assignmentGrid === activeTab || this.assignmentGrid.isDescendantOf(activeTab)) {
                    return false;
                }

                result      = false;
                // get tab to switch to
                tabToFocus  = tabToFocus || this.getTabByComponent(this.assignmentGrid);
            }

            if (this.advancedForm && !this.advancedForm.isValid()) {
                // if we are already at tab with error
                if (this.advancedForm === activeTab || this.advancedForm.isDescendantOf(activeTab)) {
                    return false;
                }

                result      = false;
                // get tab to switch to
                tabToFocus  = tabToFocus || this.getTabByComponent(this.advancedForm);
            }
        }

        // switch to another tab with error
        if (tabToFocus) {
            this.setActiveTab(tabToFocus);
        }

        // validation result
        return (this.fireEvent('validate', this, tabToFocus) !== false) && result;
    },

    /**
     * Persists the values in this task editor into corresponding {@link Gnt.model.Task} object provided to showTask.
     * @return {Boolean} Returns `true` if task was updated. Returns False if some {@link #beforeupdatetask} listener returns False.
     */
    updateTask : function () {
        // process finalization function code to allow to use return "false" in
        // "beforeupdatetask" handler and call finalization asynchronously
        var cont = Ext.Function.bind(function () {
            this.taskForm.updateRecord();

            if (this.advancedForm) {
                this.advancedForm.updateRecord();
            }

            if (this.notesEditor) {
                this.task.set(this.task.noteField, this.notesEditor.getValue());
            }

            if (this.styleForm) {
                this.styleForm.getForm().updateRecord();
            }

            if (this.assignmentGrid) {
                this.assignmentGrid.saveTaskAssignments();
            }

            if (this.dependencyGrid) {
                this.dependencyGrid.saveDependencies();
            }

            this.fireEvent('afterupdatetask', this);
        }, this);


        if (this.fireEvent('beforeupdatetask', this, cont) !== false) {
            cont();

            return true;
        }

        return false;
    },

    onDestroy : function() {
        if (this.clonedStores.taskStore) {
            this.clonedStores.taskStore.destroy();
        }

        this.callParent(arguments);
    }

});
