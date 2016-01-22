/*

Ext Gantt 2.2.23
Copyright(c) 2009-2014 Bryntum AB
http://bryntum.com/contact
http://bryntum.com/license

*/
/**

@class Gnt.plugin.TaskEditor
@extends Ext.window.Window

{@img gantt/images/taskeditor-general.png}

A plugin (ptype = 'gantt_taskeditor') which shows a {@link Gnt.widget.taskeditor.TaskEditor} in a window when a user double-clicks a task bar in the gantt chart.

You can enable this plugin in your Gantt chart like this:

    var gantt = Ext.create('Gnt.panel.Gantt', {
        ...
        plugins : Ext.create("Gnt.plugin.TaskEditor", {
            // window title
            title           : 'Task Editor'
        }),
        ...
    })


{@img gantt/images/taskeditor-general.png}

#Plugin customizing
Essentially this widget extends Ext.window.Window so any regular window configs can be used for it.
Also it supports a lot of configs provided by the {@link Gnt.widget.taskeditor.TaskEditor} class.
So if you want to customize task editor content (task form, resources grid etc.) you can read
the {@link Gnt.widget.taskeditor.TaskEditor} guide and apply corresponding configs to the plugin.

Another way to customize the task editor panel is {@link #panelConfig} config. With it you can
customize any config of the task editor panel, even the ones not translated by this plugin
(like `title`, `width`, `height` etc). For example:

    var plugin = Ext.create("Gnt.plugin.TaskEditor", {
        title       : 'I am window title',
        // some window elements
        items       : [...],
        panelConfig : {
            title   : 'I am panel title'
            // append some tabs to task editor panel
            items       : [...],
        }
    });

* **Note:** Please see {@link Gnt.widget.taskeditor.TaskEditor} class for details on how to customize the components of the tabs.

#Buttons customizing

By default window has two buttons `Ok` and `Cancel` to apply and rollback changes respectively.
If you want to just rename them you can use {@link #l10n} config. Like this:

    var plugin = Ext.create("Gnt.plugin.TaskEditor", {
        l10n : {
            okText      : 'Apply changes',
            cancelText  : 'Reject changes'
        }
    });

And if you need to implement custom buttons you can easily do it using `buttons` config. Like this:

    var plugin = Ext.create("Gnt.plugin.TaskEditor", {
        buttons : [
            {
                text    : 'Show some alert',
                handler : function() {
                    alert('Some alert');
                }
            }
        ]
    });

And finally if you don't want any buttons at all you can overwrite `buttons` config with an empty array. Like this:

    var plugin = Ext.create("Gnt.plugin.TaskEditor", {
        buttons : []
    });


*/
Ext.define('Gnt.plugin.TaskEditor', {
    extend          : 'Ext.window.Window',

    requires        : [
        'Ext.window.MessageBox',
        'Gnt.widget.taskeditor.TaskEditor'
    ],

    alias           : 'plugin.gantt_taskeditor',
    mixins          : ['Ext.AbstractPlugin', 'Gnt.mixin.Localizable'],

    lockableScope   : 'top',

    /**
     * @property {Gnt.widget.taskeditor.TaskEditor} taskEditor The task editor widget contained by the plugin.
     */
    taskEditor      : null,

    /**
     * @cfg {Object} panelConfig Configuration for {@link Gnt.widget.taskeditor.TaskEditor} instance.
     */
    panelConfig     : null,

    height          : 340,

    width           : 600,
    layout          : 'fit',

    /**
     * @cfg {String} triggerEvent
     * The event upon which the editor shall be shown. Defaults to 'taskdblclick'.
     */
    triggerEvent    : 'taskdblclick',

    closeAction     : 'hide',

    modal           : true,

    gantt           : null,

    /**
     * @cfg {Gnt.data.AssignmentStore} assignmentStore A store with assignments.
     * If this config is not provided plugin will try to retrieve assignments store from {@link Gnt.panel.Gantt} instance.
     */
    assignmentStore : null,

    /**
     * @cfg {Gnt.data.ResourceStore} resourceStore A store with resources.
     * If this config is not provided plugin will try to retrieve resources store from {@link Gnt.panel.Gantt} instance.
     */
    resourceStore   : null,

    /**
     * @cfg {Gnt.data.TaskStore} taskStore A store with tasks.
     * If this config is not provided plugin will try to retrieve tasks store from {@link Gnt.panel.Gantt} instance.
     * **Note:** Task store is required if task doesn't belong to any task store yet.
     */
    taskStore       : null,

    /**
     * @cfg {String} alertCaption A caption for message box displaying on validation errors.
     * @deprecated Please use {@link #l10n} instead.
     */
    /**
     * @cfg {String} alertText A text for message displaying on validation errors.
     * @deprecated Please use {@link #l10n} instead.
     */
    /**
     * @cfg {String} okText A text for Ok button.
     * @deprecated Please use {@link #l10n} instead.
     */
    /**
     * @cfg {String} cancelText A text Cancel button.
     * @deprecated Please use {@link #l10n} instead.
     */

    /**
     * @cfg {Gnt.model.Task} task The task to show in the task editor.
     */

    /**
     * @cfg {String} taskFormClass Class instance of which will represent form in the `General` tab.
     *
     * This option supposed to be used to implement custom form in the `General` tab content.
     */

    /**
     * @cfg {String} advancedFormClass Class instance of which will represent form in the `Advanced` tab.
     *
     * This option supposed to be used to implement custom form in the `Advanced` tab content.
     */

    /**
     * @cfg {Boolean} showAssignmentGrid `true` to display `Resources` tab.
     */

    /**
     * @cfg {Boolean} showDependencyGrid `true` to display `Predecessors` tab.
     */

    /**
     * @cfg {Boolean} allowParentTaskDependencies `true` to display a `Predecessors` tab for parent tasks
     * (requires {@link #showDependencyGrid} to be `true` as well) and also include parent tasks in the list
     * of possible predecessors. Defaults to `false`.
     */

    /**
     * @cfg {Boolean} showNotes `true` to display `Notes` tab.
     */

    /**
     * @cfg {Boolean} showAdvancedForm `true` to display `Advanced` tab.
     */

    /**
     * @cfg {Object} tabsConfig TabPanel configuration. Any Ext.tab.Panel options can be used.
     * @deprecated After refactoring {@link Gnt.widget.taskeditor.TaskEditor} itself became an Ext.tab.Panel instance so no need for this config anymore.
     */

    /**
     * @cfg {Object} taskFormConfig Configuration of task form placed at `General` tab.
     * For possible options take a look at {@link Gnt.widget.TaskForm}.
     */

    /**
     * @cfg {String} dependencyGridClass Class representing the grid panel in the `Predecessor` tab.
     *
     * Override this to provide your own implementation subclassing the {@link Gnt.widget.DependencyGrid} class.
     */
    /**
     * @cfg {Object} dependencyGridConfig Configuration of grid placed at `Predecessors` tab.
     * For possible options take a look at {@link Gnt.widget.DependencyGrid}.
     *
     * **Note:** This grid may not be created if {@link #showDependencyGrid} set to `false`.
     */

    /**
     * @cfg {String} assignmentGridClass Class representing the grid panel in the `Resources` tab.
     *
     * Override this to provide your own implementation subclassing the {@link Gnt.widget.AssignmentEditGrid} class.
     */
    /**
     * @cfg {Object} assignmentGridConfig Configuration of grid placed at `Resources` tab.
     * For possible options take a look at {@link Gnt.widget.AssignmentEditGrid}.
     *
     * **Note:** This grid may not be created if {@link #showAssignmentGrid} set to `false`
     * or {@link #assignmentStore} or {@link #resourceStore} is not specified.
     */

    /**
     * @cfg {Object} advancedFormConfig Configuration of task form placed at `Advanced` tab.
     * For possible options take a look at {@link Gnt.widget.TaskForm}.
     *
     * **Note:** This form may not be created if {@link #showAdvancedForm} set to `false`.
     */

    /**
     * @cfg {Object} l10n
     * A object, purposed for the class localization. Contains the following keys/values:

            - title               : 'Task Information',
            - alertCaption        : 'Information',
            - alertText           : 'Please correct marked errors to save changes',
            - okText              : 'Ok',
            - cancelText          : 'Cancel',
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

    constructor : function (config) {
        config = config || {};

        // we need to apply config to let locale()
        // know about legacy locales since it will check them in 'this'
        Ext.apply(this, config);

        this.title = this.L('title');

        // by default we make 'Ok', 'Cancel' buttons
        if (!config.buttons) {
            this.buttons = ['->',
                {
                    text    : this.L('okText'),
                    handler : function() {
                        this.completeEditing() || Ext.Msg.alert(this.L('alertCaption'), this.L('alertText'));
                    },
                    scope   : this
                },
                {
                    text    : this.L('cancelText'),
                    handler : this.close,
                    scope   : this
                }
            ];
        }

        this.callParent(arguments);
        this.addCls('gnt-taskeditor-window');
    },

    init : function (cmp) {
        // if assignmentStore or resourceStore wasn't defined as configuration options
        // during plugin constructing we get them from Gnt.panel.Gantt instance
        this.assignmentStore    = this.assignmentStore || cmp.getAssignmentStore();
        this.resourceStore      = this.resourceStore || cmp.getResourceStore();
        this.taskStore          = this.taskStore || cmp.getTaskStore();

        // let's map some configuration options from plugin to taskEditor
        var cfg = {
                width   : null,
                height  : null,
                border  : false
            },
            map = [
                'l10n',
                'task',
                'taskStore',
                'assignmentStore',
                'resourceStore',
                'generalText',
                'resourcesText',
                'dependencyText',
                'addDependencyText',
                'dropDependencyText',
                'notesText',
                'advancedText',
                'wbsCodeText',
                'addAssignmentText',
                'dropAssignmentText',
                'showAssignmentGrid',
                'showDependencyGrid',
                'allowParentTaskDependencies',
                'showNotes',
                'showStyle',
                'showAdvancedForm',
                'taskFormClass',
                'advancedFormClass',
                'tabsConfig',
                'taskFormConfig',
                'dependencyGridConfig',
                'assignmentGridConfig',
                'advancedFormConfig',
                'styleFormConfig',
                'dependencyGridClass',
                'assignmentGridClass'
            ];

        for (var i = 0, l = map.length; i < l; i++) {
            if (this[map[i]] !== undefined) cfg[map[i]] = this[map[i]];
        }

        cfg.showBaseline    = cmp.enableBaseline;

        cfg.showRollup      = cmp.showRollupTasks;

        Ext.apply(cfg, this.panelConfig);

        this.buildTaskEditor(cfg);

        /**
         * @event loadtask
         * Fires after task loading complete.
         * @param {Gnt.widget.taskeditor.TaskEditor} taskEditor Task editor widget instance used for editing.
         * @param {Gnt.model.Task} task The loaded task.
         *
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
         *          panelConfig : {
         *              items       : customForm
         *          },
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
         * @event validate
         * Fires when task validation occurs. Take a look at example of using this event {@link Gnt.widget.taskeditor.TaskEditor#event-validate here}.
         * @param {Gnt.widget.taskeditor.TaskEditor} taskEditor Task editor widget instance.
         */

        /**
         * @event beforeupdatetask
         * Fires before task updating occurs. Return false to prevent the update.
         * @param {Gnt.widget.taskeditor.TaskEditor} taskEditor Task editor widget instance used for editing.
         * @param {Function} proceedCallback The function which can be called manually to continue task updating. Example:
         *
         *      var taskEditor = Ext.create('Gnt.plugin.TaskEditor', {
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
         * Fires after task updating is finished.
         * @param {Gnt.widget.taskeditor.TaskEditor} taskEditor Task editor widget instance.
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
         *          panelConfig : {
         *              items       : customForm
         *          },
         *          listeners   : {
         *              afterupdatetask : function (taskeditor) {
         *                  // update form fields to loaded task
         *                  customForm.updateRecord();
         *              },
         *              ....
         *          }
         *      });
         */

        this.add(this.taskEditor);

        // relay TaskEditor widget events
        this.relayEvents(this.taskEditor, ['validate', 'beforeupdatetask', 'afterupdatetask', 'loadtask']);

        this.mon(cmp, this.triggerEvent, this.onTriggerEvent, this);

        this.gantt      = cmp;
        cmp.taskEditor  = this;
    },


    buildTaskEditor : function (cfg) {
        this.taskEditor = new Gnt.widget.taskeditor.TaskEditor(cfg);
    },


    onTriggerEvent : function (gantt, task) {
        this.showTask(task);
    },

    /**
     * Shows window and loads task into the task editor.
     * @param {Gnt.model.Task} task Task to load.
     */
    showTask : function (task) {
        if (this.taskEditor && task) {
            this.taskEditor.loadTask(task);
            this.show();
        }
    },

    validate : function () {
        if (this.taskEditor) {
            return this.taskEditor.validate();
        }
    },

    /**
     * This function is a shorthand for the following typical steps:
     *
     *      if (!taskEditor.validate()) {
     *          Ext.MessageBox.alert('Information', 'Please correct marked errors to save changes');
     *      } else {
     *          if (taskEditor.updateTask()) taskEditor.hide();
     *      }
     *
     * Instead of above code you can write:
     *
     *      if (!taskEditor.completeEditing()) {
     *          Ext.MessageBox.alert('Information', 'Please correct marked errors to save changes');
     *      }
     *
     * @return {Boolean} true if validation successfully passed and record was successfully updated as well.
     */
    completeEditing : function () {

        if (this.taskEditor) {
            var activeTab = this.taskEditor.getActiveTab();

            // Force any active editing to complete first
            if (activeTab.editingPlugin && activeTab.editingPlugin.completeEdit) {
                activeTab.editingPlugin.completeEdit();
            }

            if (!this.taskEditor.validate()) return false;

            if (this.taskEditor.updateTask()) {
                this.hide();
                return true;
            }

            return false;
        }
    },

    /**
     * Persists the values in this task editor into corresponding {@link Gnt.model.Task}
     * object provided to {@link #showTask}.
     * Internally just calls {@link Gnt.widget.taskeditor.TaskEditor#updateTask updateTask} method of task editor panel.
     */
    updateTask : function () {
        if (this.taskEditor) {
            return this.taskEditor.updateTask();
        }
    }

});
