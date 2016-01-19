Ext.define("SampleApp.view.Schedule.Settings", {
    extend      : 'Ext.FormPanel',

    // Ext JS configs
    alias       : 'widget.settings',
    bodyCls     : 'settings',
    region      : 'south',
    title       : 'SETTINGS',
    height      : 200,
    hidden      : true,
    bodyPadding : 10,

    initComponent : function () {
        var me = this;

        Ext.apply(this, {
            defaults : {
                labelWidth : 150,
                width      : 300
            },
            items    : [
                {
                    xtype      : 'numberfield',
                    fieldLabel : 'Row height',
                    minValue   : 18,
                    value      : 26,
                    step       : 4,
                    itemId     : 'gantt-rowheight',
                    listeners  : {
                        spinup   : me.onRowHeightChange,
                        spindown : me.onRowHeightChange,
                        scope    : me,
                        buffer   : 1
                    }
                },
                {
                    xtype        : 'pickerfield',
                    itemId       : 'gantt-task-bg-color',
                    fieldLabel   : 'Task bg color',
                    createPicker : function () {
                        return Ext.create('Ext.picker.Color', {
                            floating : true,
                            select   : function (selColor) {
                                me.fireEvent('bg-color-change', this, "#" + selColor);
                            }
                        });
                    }
                },
                {
                    xtype        : 'pickerfield',
                    itemId       : 'gantt-task-progressbar-color',
                    fieldLabel   : 'Task progress bar color',
                    createPicker : function () {
                        return Ext.create('Ext.picker.Color', {
                            floating : true,
                            select   : function (selColor) {
                                me.fireEvent('progress-color-change', this, "#" + selColor);
                            }
                        });
                    }
                },
                {
                    xtype        : 'pickerfield',
                    itemId       : 'gantt-dependency-color',
                    fieldLabel   : 'Dependency line color',
                    createPicker : function () {
                        return Ext.create('Ext.picker.Color', {
                            floating : true,
                            select   : function (selColor) {
                                me.fireEvent('dependency-color-change', this, "#" + selColor);
                            }
                        });
                    }
                }
            ]
        });

        this.callParent(arguments);
    },

    onRowHeightChange : function (field) {
        this.fireEvent('row-height-change', field, field.getValue());
    }
});
