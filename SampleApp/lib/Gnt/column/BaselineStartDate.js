/*

Ext Gantt 2.2.23
Copyright(c) 2009-2014 Bryntum AB
http://bryntum.com/contact
http://bryntum.com/license

*/
/**

@class Gnt.column.BaselineStartDate
@extends Ext.grid.column.Date

A Column displaying the baseline start date of a task.

    var gantt = Ext.create('Gnt.panel.Gantt', {
        height      : 600,
        width       : 1000,

        columns         : [
            ...
            {
                xtype       : 'baselinestartdatecolumn',
                width       : 80
            }
            ...
        ],
        ...
    })

Note, that this class inherit from [Ext.grid.column.Date](http://docs.sencha.com/ext-js/4-2/#!/api/Ext.grid.column.Date) and supports its configuration options, notably the "format" option.
*/
Ext.define('Gnt.column.BaselineStartDate', {
    extend              : 'Ext.grid.column.Date',

    mixins              : ['Gnt.mixin.Localizable'],

    alias               : 'widget.baselinestartdatecolumn',

    width               : 100,

    /**
     * @cfg {Boolean} adjustMilestones When set to `true`, the start/end dates of the milestones will be adjusted -1 day *during rendering and editing*. The task model will still hold the unmodified date.
     */
    adjustMilestones    : true,

    constructor : function (config) {
        config          = config || {};

        this.text   = config.text || this.L('text');

        this.callParent(arguments);

        this.renderer   = config.renderer || this.rendererFunc;
        this.scope      = config.scope || this;

        this.hasCustomRenderer = true;
    },

    rendererFunc : function (value, meta, task) {
        meta.tdCls = (meta.tdCls || '') + ' sch-column-readonly';

        return task.getDisplayStartDate(this.format, this.adjustMilestones, task.getBaselineStartDate(), false, true);
    }
});
