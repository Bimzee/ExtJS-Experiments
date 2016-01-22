/*

Ext Gantt 2.2.23
Copyright(c) 2009-2014 Bryntum AB
http://bryntum.com/contact
http://bryntum.com/license

*/
/**

A specialized field to enter percent values.
This class inherits from the standard Ext JS "number" field, so any usual `Ext.form.field.Number` configs can be used.

@class Gnt.field.Percent
@extends Ext.form.field.Number

*/
Ext.define('Gnt.field.Percent', {
    extend              : 'Ext.form.field.Number',

    alias               : 'widget.percentfield',

    alternateClassName  : ['Gnt.widget.PercentField'],

    disableKeyFilter    : false,

    minValue            : 0,
    maxValue            : 100,
    allowExponential    : false,

    invalidText         : 'Invalid percent value',
    baseChars           : '0123456789%',

    valueToRaw: function (value) {
        if (Ext.isNumber(value)) {
            return parseFloat(Ext.Number.toFixed(value, this.decimalPrecision)) + '%';
        }
        return '';
    },

    getErrors: function (value) {
        var percent = this.parseValue(value);

        if (percent === null) {
            if (value !== null && value !== '') {
                return [this.invalidText];
            } else {
                percent = '';
            }
        }
        return this.callParent([percent]);
    }
});
