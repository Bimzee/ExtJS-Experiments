/*

Ext Gantt 2.2.23
Copyright(c) 2009-2014 Bryntum AB
http://bryntum.com/contact
http://bryntum.com/license

*/
/**
@class Gnt.field.Effort
@extends Gnt.field.Duration

A specialized field, allowing a user to also specify a duration unit when editing the effort value.
This class inherits from the {@link Gnt.field.Duration} field, which inherits from `Ext.form.field.Number` so any regular {@link Ext.form.field.Number} configs can be used (like `minValue/maxValue` etc).

*/
Ext.define('Gnt.field.Effort', {
    extend                  : 'Gnt.field.Duration',

    requires                : ['Gnt.util.DurationParser'],

    alias                   : 'widget.effortfield',
    alternateClassName      : ['Gnt.column.effort.Field', 'Gnt.widget.EffortField'],

    /**
     * @cfg {String} invalidText Text shown when field value cannot be parsed to valid effort amount.
     */
    invalidText             : 'Invalid effort value',

    taskField               : 'effortField',
    getDurationUnitMethod   : 'getEffortUnit',
    setDurationMethod       : 'setEffort',
    getDurationMethod       : 'getEffort'
});
