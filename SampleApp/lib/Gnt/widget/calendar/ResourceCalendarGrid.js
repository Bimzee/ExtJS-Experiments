/*

Ext Gantt 2.2.23
Copyright(c) 2009-2014 Bryntum AB
http://bryntum.com/contact
http://bryntum.com/license

*/
Ext.define('Gnt.widget.calendar.ResourceCalendarGrid', {
    extend          : 'Ext.grid.Panel',

    requires        : [
        'Gnt.model.Calendar',
        'Gnt.data.Calendar',
        'Sch.util.Date'
    ],

    mixins          : ['Gnt.mixin.Localizable'],

    alias           : 'widget.resourcecalendargrid',

    resourceStore   : null,
    calendarStore   : null,

    /*
     * @cfg {Object} l10n
     * A object, purposed for the class localization. Contains the following keys/values:

            - name      : 'Name',
            - calendar  : 'Calendar'
     */

    initComponent   : function() {
        var me = this;

        this.calendarStore = this.calendarStore || {
            xclass : 'Ext.data.Store',
            model  : 'Gnt.model.Calendar'
        };

        if (!(this.calendarStore instanceof Ext.data.Store)) {
            this.calendarStore = Ext.create(this.calendarStore);
        }

        Ext.apply(me, {
            store           : me.resourceStore,

            columns: [{
                header      : this.L('name'),
                dataIndex   : 'Name',
                flex        : 1
            }, {
                header      : this.L('calendar'),
                dataIndex   : 'CalendarId',
                flex        : 1,
                renderer    : function(value, meta, record, col, index, store) {
                    if (!value) {
                        var cal = record.getCalendar();
                        value = cal ? cal.calendarId : "";
                    }
                    var rec = me.calendarStore.getById(value);
                    return rec ? rec.get('Name') : value;
                },
                editor      : {
                    xtype           : 'combobox',
                    store           : me.calendarStore,
                    queryMode       : 'local',
                    displayField    : 'Name',
                    valueField      : 'Id',
                    editable        : false,
                    allowBlank      : false
                }
            }],
            border      : true,
            height      : 180,
            plugins     : Ext.create('Ext.grid.plugin.CellEditing', { clicksToEdit : 2 })
        });

        this.calendarStore.loadData(this.getCalendarData());
        this.callParent(arguments);
    },

    getCalendarData : function(){
        var result = [];
        Ext.Array.each(Gnt.data.Calendar.getAllCalendars(), function (cal) {
            result.push({ Id : cal.calendarId, Name : cal.name || cal.calendarId });
        });
        return result;
    }
});
