/*

Ext Gantt 2.2.23
Copyright(c) 2009-2014 Bryntum AB
http://bryntum.com/contact
http://bryntum.com/license

*/
/**

@class Gnt.field.Assignment
@extends Ext.form.field.Picker

A specialized field to be used for editing in the {@link Gnt.column.ResourceAssignment} column.

*/

Ext.define('Gnt.field.Assignment', {
    extend              : 'Ext.form.field.Picker',

    alias               : ['widget.assignmentfield', 'widget.assignmenteditor'],
    alternateClassName  : 'Gnt.widget.AssignmentField',

    requires            : ['Gnt.widget.AssignmentGrid'],

    mixins              : ['Gnt.mixin.Localizable'],

    matchFieldWidth     : false,
    editable            : false,
    task                : null,

    /**
     * @cfg {String} cancelText A text for the `Cancel` button
     * @deprecated Please use {@link #l10n l10n} instead.
     */
    /**
     * @cfg {String} closeText A text for the `Close` button
     * @deprecated Please use {@link #l10n l10n} instead.
     */
    /**
     * @cfg {Object} l10n
     * A object, purposed for the class localization. Contains the following keys/values:

            - cancelText : 'Cancel',
            - closeText  : 'Save and Close'
     */

    /**
     * @cfg {Gnt.data.AssignmentStore} assignmentStore A store with assignments
     */
    assignmentStore     : null,

    /**
     * @cfg {Gnt.data.ResourceStore} resourceStore A store with resources
     */
    resourceStore       : null,

    /**
     * @cfg {Object} gridConfig A custom config object used to configure the Gnt.widget.AssignmentGrid instance
     */
    gridConfig          : null,

    /**
     * @cfg {String} formatString A string defining how an assignment should be rendered. Defaults to '{0} [{1}%]'
     */
    formatString        : '{0} [{1}%]',

    /**
     * @cfg {Boolean} expandPickerOnFocus true to show the grid picker when this field receives focus.
     */
    expandPickerOnFocus : false,

    afterRender : function() {
        this.callParent(arguments);
        this.on('expand', this.onPickerExpand, this);

        if (this.expandPickerOnFocus) {
            this.on('focus', function() {
                this.expand();
            }, this);
        }
    },

    createPicker: function() {
        var grid = new Gnt.widget.AssignmentGrid(Ext.apply({
            ownerCt     : this.ownerCt,

            renderTo    : document.body,

            frame       : true,
            floating    : true,
            hidden      : true,

            height      : 200,
            width       : 300,

            resourceStore       : this.task.getResourceStore(),
            assignmentStore     : this.task.getAssignmentStore(),

            fbar                : this.buildButtons()
        }, this.gridConfig || {}));

        return grid;
    },


    buildButtons : function() {
        return [
            '->',
            {
                text        : this.L('closeText'),

                handler     : function () {
                    // when clicking on "close" button with editor visible
                    // grid will be destroyed right away and seems in IE there will be no
                    // "blur" event for editor
                    // this is also sporadically reproducable in FF
                    // doing a defer to let the editor to process the "blur" first (will take 1 + 10 ms delay)
                    // only then close the editor window
                    Ext.Function.defer(this.onSaveClick, Ext.isIE && !Ext.isIE9 ? 60 : 30, this);
                },
                scope       : this
            },
            {
                text        : this.L('cancelText'),

                handler     : function() {
                    this.collapse();

                    // HACK, trick the owning Editor into thinking we're no longer editing
                    this.fireEvent('blur', this);
                },
                scope       : this
            }
        ];
    },

    setTask : function(task){
        this.task = task;
        this.setRawValue(this.getDisplayValue(task));
    },

    onPickerExpand: function() {
        // Select the assigned resource in the grid
        this.picker.loadTaskAssignments(this.task.getInternalId());
    },


    onSaveClick : function() {
        // Update the assignment store with the assigned resource data
        var sm = this.picker.getSelectionModel(),
            selections = sm.selected;

        this.collapse();

        // HACK, trick the owning Editor into thinking we're no longer editing
        this.fireEvent('blur', this);

        this.fireEvent('select', this, selections);

        // Without this defer, a visible field realignment is noticed
        Ext.Function.defer(this.picker.saveTaskAssignments, 1, this.picker);
    },

    // http://www.sencha.com/forum/showthread.php?187632-4.1.0-B3-getEditorParent-is-ignored-nested-cell-editing-is-not-possible&p=755211
    // @OVERRIDE
    collapseIf: function(e) {
        var me = this;

        // HACK: Not trivial to find all cases, menus, editors etc.
        if (this.picker && !e.getTarget('.' + Ext.baseCSSPrefix + 'editor') && !e.getTarget('.' + Ext.baseCSSPrefix + 'menu-item')) {
            me.callParent(arguments);
        }
    },

    // Required as of 4.1.2
    // @OVERRIDE
    mimicBlur: function(e) {
        var me = this;

        if (!e.getTarget('.' + Ext.baseCSSPrefix + 'editor') && !e.getTarget('.' + Ext.baseCSSPrefix + 'menu-item')) {
            me.callParent(arguments);
        }
    },

    isDirty : function (task) {
        task            = task || this.task;
        if (!task) return false;

        var assignmentStore = this.picker && this.picker.assignmentStore || task.getAssignmentStore(),
            assignments     = task.getAssignments(),
            assignment;

        // check if some of task assignments are dirty
        for (var i = 0, l = assignments.length; i < l; i++) {
            if (assignments[i].dirty || assignments[i].phantom) return true;
        }

        if (assignmentStore) {
            assignments = assignmentStore.getRemovedRecords();
            // check if there are some unsaved assignments removed from the task
            for (i = 0, l = assignments.length; i < l; i++) {
                if (assignments[i].getTaskId() == task.getInternalId()) return true;
            }
        }

        return false;
    },

    getDisplayValue : function(task) {
        task = task || this.task;

        var names               = [],
            assignmentStore     = this.assignmentStore,
            assignment,
            taskId              = task.getInternalId(),
            assignments         = task.getAssignments();

        for (var i = 0, l = assignments.length; i < l; i++) {
            assignment  = assignments[i];

            if (assignment.data.Units > 0) {
                names.push(Ext.String.format(this.formatString, assignment.getResourceName(), assignment.getUnits()));
            }
        }
        return names.join(', ');
    }
}, function() {

    // @BWCOMPAT 2.2
    Gnt.widget.AssignmentCellEditor = function() {
        var con = console;
        if (con && con.log) {
            con.log('Gnt.widget.AssignmentCellEditor is deprecated and should no longer be used. Instead simply use Gnt.field.Assignment.');
        }
    };
});
