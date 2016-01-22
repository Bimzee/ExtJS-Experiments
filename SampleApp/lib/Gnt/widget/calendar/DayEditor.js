/*

Ext Gantt 2.2.23
Copyright(c) 2009-2014 Bryntum AB
http://bryntum.com/contact
http://bryntum.com/license

*/
Ext.define('Gnt.widget.calendar.DayEditor', {
    extend      : 'Gnt.widget.calendar.AvailabilityGrid',

    requires    : [
        'Ext.grid.plugin.CellEditing',
        'Gnt.data.Calendar',
        'Sch.util.Date'
    ],

    mixins      : ['Gnt.mixin.Localizable'],

    alias       : 'widget.calendardayeditor',

    height      : 160,

    /*
     * @cfg {String} workingTimeText The text to use for the working time radio button
     * @deprecated Please use {@link #l10n l10n} instead.
     */
    /*
     * @cfg {String} nonworkingTimeText The text to use for the non-working time radio button
     * @deprecated Please use {@link #l10n l10n} instead.
     */
    /*
     * @cfg {Object} l10n
     * A object, purposed for the class localization. Contains the following keys/values:

            - startText           : 'Start',
            - endText             : 'End',
            - workingTimeText     : 'Working time',
            - nonworkingTimeText  : 'Non-working time'
     */

    initComponent : function() {

        var isWorkingDay        = this.calendarDay.getIsWorkingDay();

        Ext.applyIf(this, {
            dockedItems : [
                {
                    xtype       : 'radiogroup',
                    dock        : 'top',
                    name        : 'dayType',
                    padding     : "0 5px",
                    margin      : 0,
                    items       : [
                        { boxLabel : this.L('workingTimeText'), name: 'IsWorkingDay', inputValue : true, checked : isWorkingDay },
                        { boxLabel : this.L('nonworkingTimeText'), name: 'IsWorkingDay', inputValue : false, checked : !isWorkingDay }
                    ],

                    listeners   : {
                        change      : this.onDayTypeChanged,
                        scope       : this
                    }
                }
            ]
        });

        this.on('viewready', this.applyState, this);

        this.callParent(arguments);
    },


    getDayTypeRadioGroup : function(){
        return this.down('radiogroup[name="dayType"]');
    },


    applyState : function () {
        if (!this.isWorkingDay()) {
            this.getView().disable();
            this.addButton.disable();
        }
    },


    onDayTypeChanged : function(sender) {
        var value = sender.getValue();

        if (Ext.isArray(value.IsWorkingDay)) return;

        this.getView().setDisabled(!value.IsWorkingDay);

        this.addButton.setDisabled(!value.IsWorkingDay || this.getStore().getCount() >= this.maxIntervalsNum);
    },


    isWorkingDay : function() {
        return this.getDayTypeRadioGroup().getValue().IsWorkingDay;
    },


    isValid: function () {
        if (this.isWorkingDay()) return this.callParent();

        return true;
    },


    getIntervals : function () {
        if (!this.isWorkingDay()) return [];

        return this.callParent();
    }
});
