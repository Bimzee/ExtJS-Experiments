/*

Ext Gantt 2.2.23
Copyright(c) 2009-2014 Bryntum AB
http://bryntum.com/contact
http://bryntum.com/license

*/
/**

@class Gnt.widget.calendar.Calendar
@extends Ext.form.Panel
@aside guide gantt_calendars

{@img gantt/images/calendar.png}

This widget can be used to edit the calendar content. As the input it should receive an instance of the {@link Gnt.data.Calendar} class.
Once the editing is done and user is happy with the result the {@link #applyChanges} method should be called. It will apply
all the changes user made in UI to the calendar.

Note, this widget does not have the "Ok", "Apply changes" etc button intentionally, as you might want to combine it with your widgets.
See {@link Gnt.widget.calendar.CalendarWindow} for this widget embedded in the Ext.window.Window instance.


*/
Ext.define('Gnt.widget.calendar.Calendar', {
    extend                      : 'Ext.form.Panel',

    requires                    : [
        'Ext.XTemplate',
        'Ext.data.Store',
        'Ext.grid.Panel',
        'Ext.grid.plugin.CellEditing',
        'Gnt.data.Calendar',
        'Gnt.model.CalendarDay',
        'Gnt.widget.calendar.DayEditor',
        'Gnt.widget.calendar.WeekEditor',
        'Gnt.widget.calendar.DatePicker'
    ],

    mixins                      : ['Gnt.mixin.Localizable'],

    alias                       : 'widget.calendar',

    defaults                    : { padding: 10, border: false },

    /**
     * @cfg {String} workingDayCls class will be applied to all working days at legend block and datepicker
     */
    workingDayCls               : 'gnt-datepicker-workingday',

    /**
     * @cfg {string} nonWorkingDayCls class will be applied to all non-working days at legend block and datepicker
     */
    nonWorkingDayCls            : 'gnt-datepicker-nonworkingday',

    /**
     * @cfg {String} overriddenDayCls class will be applied to all overridden days at legend block and datepicker
     */
    overriddenDayCls            : 'gnt-datepicker-overriddenday',

    /**
     * @cfg {String} overriddenWeekDayCls class will be applied to all overridden days inside overridden week at legend block and date picker
     */
    overriddenWeekDayCls        : 'gnt-datepicker-overriddenweekday',

    /**
     * @cfg {Gnt.data.Calendar} calendar An instance of the {@link Gnt.data.Calendar} to read/change the holidays from/in.
     */
    calendar                    : null,

    /**
     * @cfg {Object} l10n
     * A object, purposed for the class localization. Contains the following keys/values:

        - dayOverrideNameHeaderText : 'Name',
        - overrideName        : 'Name',
        - startDate           : 'Start Date',
        - endDate             : 'End Date',
        - error               : 'Error',
        - dateText            : 'Date',
        - addText             : 'Add',
        - editText            : 'Edit',
        - removeText          : 'Remove',
        - workingDayText      : 'Working day',
        - weekendsText        : 'Weekends',
        - overriddenDayText   : 'Overridden day',
        - overriddenWeekText  : 'Overridden week',
        - workingTimeText     : 'Working time',
        - nonworkingTimeText  : 'Non-working time',
        - dayOverridesText    : 'Day overrides',
        - weekOverridesText   : 'Week overrides',
        - okText              : 'OK',
        - cancelText          : 'Cancel',
        - parentCalendarText  : 'Parent calendar',
        - noParentText        : 'No parent',
        - selectParentText    : 'Select parent',
        - newDayName          : '[Without name]',
        - calendarNameText    : 'Calendar name',
        - tplTexts            : {
            - tplWorkingHours : 'Working hours for',
            - tplIsNonWorking : 'is non-working',
            - tplOverride     : 'override',
            - tplInCalendar   : 'in calendar',
            - tplDayInCalendar: 'standard day in calendar'
        },
        - overrideErrorText   : 'There is already an override for this day',
        - overrideDateError   : 'There is already week override on this date: {0}',
        - startAfterEndError  : 'Start date should be less than end date',
        - weeksIntersectError : 'Week overrides should not intersect'
     */
    /**
     * @cfg {String} dayOverrideNameHeaderText The text to show in the day override name column header
     * @deprecated Please use {@link #l10n} instead.
     */
    /**
     * @cfg {String} dateText The text to show in the date column header
     * @deprecated Please use {@link #l10n} instead.
     */
    /**
     * @cfg {String} addText The text to show on the add button
     * @deprecated Please use {@link #l10n} instead.
     */
    /**
     * @cfg {String} editText The text to show on the edit button
     * @deprecated Please use {@link #l10n} instead.
     */
    /**
     * @cfg {String} removeText The text to show on the remove button
     * @deprecated Please use {@link #l10n} instead.
     */
    /**
     * @cfg {String} workingDayText The "working day" text to include in the calendar legend.
     * @deprecated Please use {@link #l10n} instead.
     */
    /**
     * @cfg {String} weekendsText The "weekends" text to in the calendar legend.
     * @deprecated Please use {@link #l10n} instead.
     */
    /**
     * @cfg {String} overriddenDayText The "Overridden day" text to in the calendar legend.
     * @deprecated Please use {@link #l10n} instead.
     */
    /**
     * @cfg {String} overriddenWeekText The "Overridden week" text to in the calendar legend.
     * @deprecated Please use {@link #l10n} instead.
     */
    /**
     * @cfg {String} workingTimeText The text to use for the working time radio button
     * @deprecated Please use {@link #l10n} instead.
     */
    /**
     * @cfg {String} nonworkingTimeText The text to use for the non-working time radio button
     * @deprecated Please use {@link #l10n} instead.
     */
    /**
     * @cfg {String} dayOverridesText The text to show in the day overrides tab panel title and edit window title.
     * @deprecated Please use {@link #l10n} instead.
     */
    /**
     * @cfg {String} weekOverridesText The text to show in the week overrides tab panel title and edit window title.
     * @deprecated Please use {@link #l10n} instead.
     */
    /**
     * @cfg {String} okText The text to show in the OK button
     * @deprecated Please use {@link #l10n} instead.
     */
    /**
     * @cfg {String} cancelText The text to show in the Cancel button
     * @deprecated Please use {@link #l10n} instead.
     */
    /**
     * @cfg {String} calendarNameText The text to show before the calendar name in the form.
     * @deprecated Please use {@link #l10n} instead.
     */
    /**
     * @cfg {Object} tplTexts The texts used in the date info template
     * @deprecated Please use {@link #l10n} instead.
     */
    /**
     * @cfg {String} parentCalendarText Label for the parent calendar field
     * @deprecated Please use {@link #l10n} instead.
     */
    /**
     * @cfg {String} noParentText Text shown when no parent calendar selected
     * @deprecated Please use {@link #l10n} instead.
     */
    /**
     * @cfg {String} selectParentText Empty text for the parent calendar combo field.
     * @deprecated Please use {@link #l10n} instead.
     */
    /**
     * @cfg {String} newDayName Name for a new day override.
     * @deprecated Please use {@link #l10n} instead.
     */

    /**
     * @cfg {Object} dayGridConfig A custom config object to use when configuring the Gnt.widget.calendar.DayGrid instance.
     */
    dayGridConfig               : null,

    /**
     * @cfg {Object} weekGridConfig A custom config object to use when configuring the Gnt.widget.calendar.WeekGrid instance.
     */
    weekGridConfig              : null,

    /**
     * @cfg {Object} datePickerConfig A custom config object to use when configuring the Gnt.widget.calendar.DatePicker instance.
     */
    datePickerConfig            : null,

    /**
     * @cfg {String} overrideErrorText Text for error shown when an attempt to override
     * an already overridden day is being made.
     */

    dayGrid                     : null,
    weekGrid                    : null,
    datePicker                  : null,

    legendTpl                   : '<ul class="gnt-calendar-legend">' +
            '<li class="gnt-calendar-legend-item">' +
                '<div class="gnt-calendar-legend-itemstyle {workingDayCls}"></div>' +
                '<span class="gnt-calendar-legend-itemname">{workingDayText}</span>' +
                '<div style="clear: both"></div>' +
            '</li>' +
            '<li>' +
                '<div class="gnt-calendar-legend-itemstyle {nonWorkingDayCls}"></div>' +
                '<span class="gnt-calendar-legend-itemname">{weekendsText}</span>' +
                '<div style="clear: both"></div>' +
            '</li>' +
            '<li class="gnt-calendar-legend-override">' +
                '<div class="gnt-calendar-legend-itemstyle {overriddenDayCls}">31</div>' +
                '<span class="gnt-calendar-legend-itemname">{overriddenDayText}</span>' +
                '<div style="clear: both"></div>' +
            '</li>' +
            '<li class="gnt-calendar-legend-override">' +
                '<div class="gnt-calendar-legend-itemstyle {overriddenWeekDayCls}">31</div>' +
                '<span class="gnt-calendar-legend-itemname">{overriddenWeekText}</span>' +
                '<div style="clear: both"></div>' +
            '</li>' +
        '</ul>',

    dateInfoTpl                 : null,

    dayOverridesCalendar        : null,
    weekOverridesStore          : null,

    copiesIndexByOriginalId     : null,

    // reference to a window with day override editor used only in tests for now
    currentDayOverrideEditor    : null,


    getDayGrid : function() {
        if (!this.dayGrid) {
            var calendarDayModel        = this.calendar.model.prototype;

            // create day overrides grid
            this.dayGrid = new Ext.grid.Panel(Ext.apply({
                title       : this.L('dayOverridesText'),
                tbar        : [
                    { text: this.L('addText'), action: 'add', iconCls: 'gnt-action-add', handler: this.addDay, scope: this },
                    { text: this.L('editText'), action: 'edit', iconCls: 'gnt-action-edit', handler: this.editDay, scope: this },
                    { text: this.L('removeText'), action: 'remove', iconCls: 'gnt-action-remove', handler: this.removeDay, scope: this }
                ],
                store       : new Gnt.data.Calendar(),
                plugins     : [ new Ext.grid.plugin.CellEditing({ clicksToEdit : 2 }) ],
                columns     : [
                    {
                        header      : this.L('dayOverrideNameHeaderText'),
                        dataIndex   : calendarDayModel.nameField,
                        flex        : 1,
                        editor      : { allowBlank : false }
                    },
                    {
                        header      : this.L('dateText'),
                        dataIndex   : calendarDayModel.dateField,
                        width       : 100,
                        xtype       : 'datecolumn',
                        editor      : { xtype : 'datefield' }
                    }
                ]
            }, this.dayGridConfig || {}));

            this.dayOverridesCalendar   = this.dayGrid.store;
        }

        return this.dayGrid;
    },


    getWeekGrid : function() {
        if (!this.weekGrid) {
            // create week overrides grid
            this.weekGrid = new Ext.grid.Panel(Ext.apply({
                title       : this.L('weekOverridesText'),
                border      : true,

                plugins     : [ new Ext.grid.plugin.CellEditing({ clicksToEdit : 2 }) ],

                store       : new Ext.data.Store({
                    fields      : [ 'name', 'startDate', 'endDate', 'weekAvailability', 'mainDay' ]
                }),

                tbar        : [
                    { text: this.L('addText'), action: 'add', iconCls: 'gnt-action-add', handler: this.addWeek, scope: this },
                    { text: this.L('editText'), action: 'edit', iconCls: 'gnt-action-edit', handler: this.editWeek, scope: this },
                    { text: this.L('removeText'), action: 'remove', iconCls: 'gnt-action-remove', handler: this.removeWeek, scope: this }
                ],

                columns     : [
                    {
                        header      : this.L('overrideName'),
                        dataIndex   : 'name',
                        flex        : 1,
                        editor      : { allowBlank : false }
                    },
                    {
                        xtype       : 'datecolumn',
                        header      : this.L('startDate'),
                        dataIndex   : 'startDate',
                        width       : 100,
                        editor      : { xtype : 'datefield' }
                    },
                    {
                        xtype       : 'datecolumn',
                        header      : this.L('endDate'),
                        dataIndex   : 'endDate',
                        width       : 100,
                        editor      : { xtype : 'datefield' }
                    }
                ]

            }, this.weekGridConfig || {}));

            this.weekOverridesStore     = this.weekGrid.store;
        }

        return this.weekGrid;
    },


    getDatePicker : function() {
        if (!this.datePicker) {
            this.datePicker = new Gnt.widget.calendar.DatePicker(Ext.apply({
                dayOverridesCalendar    : this.getDayGrid().store,
                weekOverridesStore      : this.getWeekGrid().store
            }, this.datePickerConfig));
        }

        return this.datePicker;
    },


    initComponent : function() {

        this.copiesIndexByOriginalId        = {};

        var me = this;

        me.setupTemplates();

        if (!(this.legendTpl instanceof Ext.Template))      this.legendTpl      = new Ext.XTemplate(this.legendTpl);
        if (!(this.dateInfoTpl instanceof Ext.Template))    this.dateInfoTpl    = new Ext.XTemplate(this.dateInfoTpl);

        var calendar        = this.calendar;

        if (!calendar) {
            Ext.Error.raise('Required attribute "calendar" is missed during initialization of `Gnt.widget.Calendar`');
        }

        var weekGrid        = this.getWeekGrid(),
            dayGrid         = this.getDayGrid(),
            datePicker      = this.getDatePicker();

        dayGrid.on({
            selectionchange : this.onDayGridSelectionChange,
            validateedit    : this.onDayGridValidateEdit,
            edit            : this.onDayGridEdit,
            scope           : this
        });

        dayGrid.store.on({
            update          : this.refreshView,
            remove          : this.refreshView,
            add             : this.refreshView,
            scope           : this
        });

        weekGrid.on({
            selectionchange : this.onWeekGridSelectionChange,
            validateedit    : this.onWeekGridValidateEdit,
            edit            : this.onWeekGridEdit,
            scope           : this
        });

        weekGrid.store.on({
            update          : this.refreshView,
            remove          : this.refreshView,
            add             : this.refreshView,
            scope           : this
        });

        datePicker.on({
            select          : this.onDateSelect,
            scope           : this
        });

        this.fillDaysStore();
        this.fillWeeksStore();

        this.mon(calendar, {
            calendarchange  : this.onCalendarChange,
            scope           : this
        });

        this.dateInfoPanel = new Ext.Panel({
            cls             : 'gnt-calendar-dateinfo',
            columnWidth     : 0.33,
            border          : false,
            height          : 200
        });

        this.items = [
            {
                xtype       : 'container',
                layout      : 'hbox',
                pack        : 'start',
                align       : 'stretch',
                items       : [
                    {
                        html            : Ext.String.format('{0}: "{1}"', this.L('calendarNameText'), calendar.name),
                        border          : false,
                        flex            : 1
                    },
                    {
                        xtype           : 'combobox',
                        name            : 'cmb_parentCalendar',
                        fieldLabel      : this.L('parentCalendarText'),

                        store           : new Ext.data.Store({
                            fields  : [ 'Id', 'Name' ],
                            data    : [ { Id : -1, Name : this.L('noParentText') } ].concat(calendar.getParentableCalendars())
                        }),

                        queryMode       : 'local',
                        displayField    : 'Name',
                        valueField      : 'Id',

                        editable        : false,
                        emptyText       : this.L('selectParentText'),

                        value           : calendar.parent ? calendar.parent.calendarId : -1,
                        flex            : 1
                    }
                ]
            },
            {
                layout      : 'column',
                defaults    : { border : false },
                items       : [
                    {
                        margin          : '0 15px 0 0',
                        columnWidth     : 0.3,
                        html            : this.legendTpl.apply({
                            workingDayText          : this.L('workingDayText'),
                            weekendsText            : this.L('weekendsText'),
                            overriddenDayText       : this.L('overriddenDayText'),
                            overriddenWeekText      : this.L('overriddenWeekText'),
                            workingDayCls           : this.workingDayCls,
                            nonWorkingDayCls        : this.nonWorkingDayCls,
                            overriddenDayCls        : this.overriddenDayCls,
                            overriddenWeekDayCls    : this.overriddenWeekDayCls
                        })
                    },
                    {
                        columnWidth     : 0.37,
                        margin          : '0 5px 0 0',
                        items           : [ datePicker ]
                    },
                    this.dateInfoPanel
                ]
            },
            {
                xtype       : 'tabpanel',
                height      : 220,
                items       : [ dayGrid, weekGrid ]
            }
        ];

        this.callParent(arguments);
    },

    onCalendarChange : function() {
        this.fillDaysStore();
        this.fillWeeksStore();
        this.refreshView();
    },

    setupTemplates : function () {
        var tplTexts    = this.L('tplTexts');

        this.dateInfoTpl = this.dateInfoTpl || Ext.String.format(
            '<tpl if="isWorkingDay == true"><div>{0} {date}:</div></tpl>' +
            '<tpl if="isWorkingDay == false"><div>{date} {1}</div></tpl>' +
            '<ul class="gnt-calendar-availabilities"><tpl for="availability"><li>{.}</li></tpl></ul>' +
            '<span>{5}: ' +
                '<tpl if="override == true">{2} "{name}" {3} "{calendarName}"</tpl><tpl if="override == false">{4} "{calendarName}"</tpl>' +
            '</span>',
            tplTexts.tplWorkingHours,
            tplTexts.tplIsNonWorking,
            tplTexts.tplOverride,
            tplTexts.tplInCalendar,
            tplTexts.tplDayInCalendar,
            tplTexts.tplBasedOn
        );
    },

    afterRender : function() {
        this.callParent(arguments);

        this.onDateSelect(this.getDatePicker(), new Date());
    },


    fillDaysStore : function() {
        // only filter days with type "DAY" that has "Date" set
        var dataTemp        = Gnt.util.Data.cloneModelSet(this.calendar, function (calendarDay) {
            return (calendarDay.getType() == 'DAY' && calendarDay.getDate());
        });

        this.dayOverridesCalendar.loadData(dataTemp);
    },


    copyCalendarDay : function (calendarDay) {
        var copy            = calendarDay.copy();

        copy.__COPYOF__     = calendarDay.internalId;

        this.copiesIndexByOriginalId[ calendarDay.internalId ]   = copy.internalId;

        return copy;
    },


    fillWeeksStore : function () {
        var me              = this;
        var data            = [];

        this.calendar.forEachNonStandardWeek(function (nonStandardWeek) {
            var week                = Ext.apply({}, nonStandardWeek);

            week.weekAvailability   = Ext.Array.map(week.weekAvailability, function (day) {
                return day && me.copyCalendarDay(day) || null;
            });

            week.mainDay            = me.copyCalendarDay(week.mainDay);

            data.push(week);
        });

        this.weekOverridesStore.loadData(data);
    },


    addDay : function(){
        var date        = this.getDatePicker().getValue();

        // do not allow duplicate day overrides
        if (this.dayOverridesCalendar.getOwnCalendarDay(date)) {
            this.alert({ msg : this.L('overrideErrorText') });
            return;
        }

        var newDay      = new this.calendar.model ({
            Name            : this.L('newDayName'),
            Type            : 'DAY',
            Date            : date,
            IsWorkingDay    : false
        });

        this.dayOverridesCalendar.insert(0, newDay);
        this.getDayGrid().getSelectionModel().select([ newDay ], false, false);
    },


    editDay : function(){
        var me          = this,
            selection   = this.getDayGrid().getSelectionModel().getSelection();

        if (selection.length === 0) return;

        var day         = selection[ 0 ];

        var editor      = this.currentDayOverrideEditor = new Gnt.widget.calendar.DayEditor({
            addText             : this.L('addText'),
            removeText          : this.L('removeText'),
            workingTimeText     : this.L('workingTimeText'),
            nonworkingTimeText  : this.L('nonworkingTimeText'),

            calendarDay         : day
        });

        var editorWindow      = Ext.create('Ext.window.Window', {
            title           : this.L('dayOverridesText'),
            modal           : true,

            width           : 280,
            height          : 260,

            layout          : 'fit',
            items           : editor,

            buttons         : [
                {
                    text        : this.L('okText'),
                    handler     : function () {
                        if (editor.isValid()) {
                            var calendarDay = editor.calendarDay;

                            calendarDay.setIsWorkingDay(editor.isWorkingDay());
                            calendarDay.setAvailability(editor.getIntervals());

                            me.applyCalendarDay(calendarDay, day);

                            me.refreshView();

                            editorWindow.close();
                        }
                    }
                },
                {
                    text        : this.L('cancelText'),
                    handler     : function () {
                        editorWindow.close();
                    }
                }
            ]
        });

        editorWindow.show();
    },


    removeDay : function () {
        var grid        = this.getDayGrid(),
            selection   = grid.getSelectionModel().getSelection();

        if (!selection.length) return;

        grid.getStore().remove(selection[0]);

        this.refreshView();
    },


    refreshView : function () {
        var date        = this.getDatePicker().getValue(),
            day         = this.getCalendarDay(date),
            weekGrid    = this.getWeekGrid(),
            dayGrid     = this.getDayGrid(),
            dayOverride = this.dayOverridesCalendar.getOwnCalendarDay(date),
            weekOverride;

        var name;

        // First check if there is an override on day level
        if (dayOverride) {
            dayGrid.getSelectionModel().select([ dayOverride ], false, true);
            name        = dayOverride.getName();
        } else {
            // Now check if there is an override on week level
            weekOverride = this.getWeekOverrideByDate(date);
            if (weekOverride) {
                weekGrid.getSelectionModel().select([ weekOverride ], false, true);
                name    = weekOverride.get('name');
            }
        }

        var dayData = {
            name            : name || day.getName(),
            date            : Ext.Date.format(date, 'M j, Y'),
            calendarName    : this.calendar.name || this.calendar.calendarId,
            availability    : day.getAvailability(true),
            override        : Boolean(dayOverride || weekOverride),
            isWorkingDay    : day.getIsWorkingDay()
        };

        this.dateInfoPanel.update(this.dateInfoTpl.apply(dayData));

        this.datePicker.refreshCssClasses();
    },


    onDayGridSelectionChange : function (selection) {
        if (selection.getSelection().length === 0) return;

        var day     = selection.getSelection()[ 0 ];

        this.getDatePicker().setValue(day.getDate());
        this.refreshView();
    },


    onDayGridEdit : function (editor, context){
        if (context.field === 'Date') {
            context.grid.getStore().clearCache();
            this.getDatePicker().setValue(context.value);
        }

        this.refreshView();
    },


    onDayGridValidateEdit : function (editor, context){
        var calendar = this.getDayGrid().store;

        if (context.field === calendar.model.prototype.dateField && calendar.getOwnCalendarDay(context.value) && context.value !== context.originalValue) {
            this.alert({ msg : this.L('overrideErrorText') });
            return false;
        }
    },


    onDateSelect : function (picker, date) {
        this.refreshView();
    },


    getCalendarDay: function (date) {
        var day     = this.dayOverridesCalendar.getOwnCalendarDay(date);

        if (day) return day;

        day         = this.getWeekOverrideDay(date);

        if (day) return day;

        return this.calendar.weekAvailability[ date.getDay() ] || this.calendar.defaultWeekAvailability[ date.getDay() ];
    },


    getWeekOverrideDay : function (date) {
        var dateTime            = new Date(date),
            internalWeekModel   = this.getWeekOverrideByDate(date),
            index               = dateTime.getDay();

        if (internalWeekModel == null) return null;

        var weekAvailability = internalWeekModel.get('weekAvailability');

        if (!weekAvailability) return null;

        return weekAvailability[ index ];
    },


    getWeekOverrideByDate: function(date) {
        var week = null;

        this.weekOverridesStore.each(function (internalWeekModel) {
            if (Ext.Date.between(date, internalWeekModel.get('startDate'), internalWeekModel.get('endDate'))) {
                week = internalWeekModel;
                return false;
            }
        });

        return week;
    },


    intersectsWithCurrentWeeks : function (startDate, endDate, except) {
        var result                          = false;

        this.weekOverridesStore.each(function (internalWeekModel) {
            if (internalWeekModel == except) return;

            var weekStartDate       = internalWeekModel.get('startDate');
            var weekEndDate         = internalWeekModel.get('endDate');

            if (weekStartDate <= startDate && startDate < weekEndDate || weekStartDate < endDate && endDate <= weekEndDate) {
                result      = true;

                // stop the iteration
                return false;
            }
        });

        return result;
    },


    addWeek : function () {
        var weekOverridesStore      = this.weekOverridesStore;
        var startDate               = this.getDatePicker().getValue();
        var endDate;

        // we are about to create a week override and we need to make sure it does not
        // intersect with already created week overrides. Also we'd like to make it 1w long initially
        // but in case there will be an intersection with current overrides we are ok to shorten it
        for (var duration = 7; duration > 0; duration--) {
            endDate     = Sch.util.Date.add(startDate, Sch.util.Date.DAY, duration);

            if (!this.intersectsWithCurrentWeeks(startDate, endDate)) break;
        }

        if (!duration) {
            this.alert({ msg : Ext.String.format(this.L('overrideDateError'), Ext.Date.format(startDate, 'Y/m/d')) });
            return;
        }

        var mainDay     = new this.calendar.model();

        mainDay.setType('WEEKDAYOVERRIDE');
        mainDay.setName(this.L('newDayName'));
        mainDay.setOverrideStartDate(startDate);
        mainDay.setOverrideEndDate(endDate);
        mainDay.setWeekday(-1);

        var newWeek                 = weekOverridesStore.insert(0, {
            name                : this.L('newDayName'),
            startDate           : startDate,
            endDate             : endDate,

            weekAvailability    : [],
            mainDay             : mainDay
        })[ 0 ];

        this.getWeekGrid().getSelectionModel().select([ newWeek ], false, false);
    },


    editWeek : function(){
        var selection   = this.getWeekGrid().getSelectionModel().getSelection(),
            me          = this;

        if (selection.length === 0) return;

        var weekModel   = selection[ 0 ];

        var editor      = new Gnt.widget.calendar.WeekEditor({
            startDate                   : weekModel.get('startDate'),
            endDate                     : weekModel.get('endDate'),
            weekName                    : weekModel.get('name'),
            calendarDayModel            : this.calendar.model,
            // keep the "weekModel" private and pass individual fields to the editor
            weekAvailability            : weekModel.get('weekAvailability'),
            calendarWeekAvailability    : this.calendar.weekAvailability,
            defaultWeekAvailability     : this.calendar.defaultWeekAvailability
        });

        var editorWindow    = Ext.create('Ext.window.Window', {
            title       : this.L('weekOverridesText'),
            modal       : true,
            width       : 370,
            defaults    : { border : false },

            layout      : 'fit',
            items       : editor,

            buttons     : [
                {
                    // this property will be used in test to locate the button
                    action      : 'ok',

                    text        : this.L('okText'),
                    handler     : function () {
                        if (editor.applyChanges(weekModel.get('weekAvailability'))) {
                            me.refreshView();
                            editorWindow.close();
                        }
                    }
                },
                {
                    text        : this.L('cancelText'),
                    handler     : function() {
                        editorWindow.close();
                    }
                }
            ]
        });

        editorWindow.show();
    },


    removeWeek: function () {
        var selection   = this.getWeekGrid().getSelectionModel().getSelection(),
            me          = this;

        if (selection.length === 0) return;

        this.weekOverridesStore.remove(selection[ 0 ]);

        this.refreshView();
    },


    onWeekGridSelectionChange : function (selModel){
        var selection       = selModel.getSelection();

        if (selection.length === 0) return;

        this.getDatePicker().setValue(selection[ 0 ].get('startDate'));
    },


    onWeekGridEdit : function (editor, context){
        var weekModel       = context.record,
            startDate       = weekModel.get('startDate'),
            endDate         = weekModel.get('endDate');

        if (context.field == 'startDate' || context.field == 'endDate') {
            Ext.Array.each(weekModel.get('weekAvailability').concat(weekModel.get('mainDay')), function (weekDay) {
                if (weekDay) {
                    weekDay.setOverrideStartDate(startDate);
                    weekDay.setOverrideEndDate(endDate);
                }
            });

            this.getDatePicker().setValue(startDate);
        }

        if (context.field == 'name') {
            Ext.Array.each(weekModel.get('weekAvailability').concat(weekModel.get('mainDay')), function (weekDay) {
                if (weekDay) {
                    weekDay.setName(weekModel.get('name'));
                }
            });
        }

        this.refreshView();
    },

    alert : function (config) {
        config = config || {};

        Ext.MessageBox.show(Ext.applyIf(config, {
            title       : this.L('error'),
            icon        : Ext.MessageBox.WARNING,
            buttons     : Ext.MessageBox.OK
        }));
    },

    onWeekGridValidateEdit : function (editor, context) {
        var weekModel            = context.record,
            startDate            = context.field == 'startDate' ? context.value : weekModel.get('startDate'),
            endDate              = context.field == 'endDate' ? context.value : weekModel.get('endDate');

        if (startDate > endDate) {
            this.alert({ msg : this.L('startAfterEndError') });
            return false;
        }

        if (this.intersectsWithCurrentWeeks(startDate, endDate, weekModel)) {
            this.alert({ msg : this.L('weeksIntersectError') });
            return false;
        }
    },


    applyCalendarDay : function (from, to){
        to.beginEdit();

        to.setId(from.getId());
        to.setName(from.getName());
        to.setIsWorkingDay(from.getIsWorkingDay());
        to.setDate(from.getDate());
        to.setOverrideStartDate(from.getOverrideStartDate());
        to.setOverrideEndDate(from.getOverrideEndDate());

        var fromAvailability    = from.getAvailability(true);
        var toAvailability      = to.getAvailability(true);

        if (fromAvailability + '' != toAvailability + '') to.setAvailability(from.getAvailability());

        to.endEdit();
    },


    applySingleDay : function (copyDay, toAdd) {
        if (copyDay.__COPYOF__)
            this.applyCalendarDay(copyDay, this.calendar.getByInternalId(copyDay.__COPYOF__));
        else {
            copyDay.unjoin(copyDay.stores[ 0 ]);
            toAdd.push(copyDay);
        }
    },


    /**
     * Call this method when user is satisfied with the current state of the calendar in the UI. It will apply all the changes made in the UI
     * to the original calendar.
     *
     */
    applyChanges : function () {
        var me              = this;
        var calendar        = this.calendar;
        var parent          = this.down('combobox[name="cmb_parentCalendar"]').getValue();

        calendar.suspendEvents(true);
        calendar.suspendCacheUpdate++;

        calendar.setParent(parent ? Gnt.data.Calendar.getCalendar(parent) : null);

        calendar.proxy.extraParams.calendarId   = calendar.calendarId;

        // days part
        Gnt.util.Data.applyCloneChanges(this.dayOverridesCalendar, calendar);

        var daysToAdd               = [];
        var daysToRemove            = [];
        var remainingWeekDays       = {};

        // weeks part
        this.weekOverridesStore.each(function (weekModel) {
            Ext.Array.each(weekModel.get('weekAvailability').concat(weekModel.get('mainDay')), function (weekDay) {
                if (weekDay) {
                    if (weekDay.__COPYOF__) remainingWeekDays[ weekDay.__COPYOF__ ] = true;

                    me.applySingleDay(weekDay, daysToAdd);
                }
            });
        });

        calendar.forEachNonStandardWeek(function (originalWeek) {
            Ext.Array.each(originalWeek.weekAvailability.concat(originalWeek.mainDay), function (originalWeekDay) {
                if (originalWeekDay && !remainingWeekDays[ originalWeekDay.internalId ]) daysToRemove.push(originalWeekDay);
            });
        });

        calendar.add(daysToAdd);
        calendar.remove(daysToRemove);

        calendar.suspendCacheUpdate--;
        calendar.resumeEvents();

        calendar.clearCache();
    }
});
