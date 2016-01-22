/*

Ext Gantt 2.2.23
Copyright(c) 2009-2014 Bryntum AB
http://bryntum.com/contact
http://bryntum.com/license

*/
/**

@class Gnt.model.Calendar
@extends Sch.model.Customizable

A model representing a single calendar.

*/

Ext.define('Gnt.model.Calendar', {
    extend      : 'Sch.model.Customizable',
    
    idProperty  : 'Id',
    
    customizableFields      : [
        'Id',

        /**
         * @method getName
         * 
         * Gets the "name" of the calendar
         * 
         * @return {String} name The "name" of the calendar
         */        
        /**
         * @method setName
         * 
         * Sets the "name" of the calendar
         * 
         * @param {String} name The new name of the calendar
         */        
        'Name'
    ]
});
