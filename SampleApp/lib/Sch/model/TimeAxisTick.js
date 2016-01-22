/*

Ext Scheduler 2.5.2
Copyright(c) 2009-2014 Bryntum AB
http://bryntum.com/contact
http://bryntum.com/license

*/
/*
 * @class Sch.model.TimeAxisTick
 * @extends Sch.model.Range
 *
 * A simple model with a start/end date interval defining a 'tick' on the time axis.
 */
Ext.define('Sch.model.TimeAxisTick', {
    extend          : 'Sch.model.Range',

    startDateField  : 'start',
    endDateField    : 'end'
});
