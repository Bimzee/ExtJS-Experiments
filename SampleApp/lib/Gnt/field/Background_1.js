/*

Ext Gantt 2.2.23
Copyright(c) 2009-2014 Bryntum AB
http://bryntum.com/contact
http://bryntum.com/license

*/
Ext.define('Gnt.field.Background', {

    extend          : 'Ext.form.field.Picker',

    alias           : 'widget.backgroundfield',

    requires        : ['Gnt.widget.BackgroundPicker'],

    //cls             : 'gnt-backgroundfield',

    //fieldSubTpl     : [
        //'<div id="{id}"',
        //'<tpl if="fieldStyle"> style="{fieldStyle}"</tpl>',
        //' class="{fieldCls}">{value}</div>',
        //{
            //compiled: true,
            //disableFormats: true
        //}
    //],

    invalidText     : "{0} is not a valid background",

    triggerCls      : Ext.baseCSSPrefix + 'form-color-trigger',

    matchFieldWidth : false,

    initValue: function() {
        var me = this,
            value = me.value;

        if (Ext.isString(value)) {
            me.value = me.rawToValue(value);
        }

        me.callParent();
    },

    getErrors: function(value) {
    },

    rawToValue: function(rawValue) {
        return rawValue || '';
    },

    valueToRaw: function(value) {
        return value || '';
    },

    getSubmitValue: function() {
        var format = this.submitFormat || this.format,
            value = this.getValue();

        return value ? Ext.Date.format(value, format) : '';
    },

    createPicker: function() {
        var me = this,
            format = Ext.String.format;

        return new Gnt.widget.BackgroundPicker({
            pickerField     : me,
            ownerCt         : me.ownerCt,
            renderTo        : document.body,
            floating        : true,
            hidden          : true,
            focusOnShow     : true,
            listeners       : {
                scope   : me,
                select  : me.onSelect
            },
            keyNavConfig    : {
                esc     : function() {
                    me.collapse();
                }
            }
        });
    },

    onDownArrow: function(e) {
        this.callParent(arguments);
        if (this.isExpanded) {
            this.getPicker().focus();
        }
    },

    onSelect: function(m, d) {
        var me = this;

        me.setValue(d);
        me.fireEvent('select', me, d);
        me.collapse();
    },


    setValue : function (value) {
        this.value = value;
        if (this.rendered) {
            this.inputEl.setStyle('background', value ? '#'+value : '');
        }
    },

    onExpand: function() {
        var value = this.getValue();
        this.picker.select(value, true);
    },


    onCollapse: function() {
        this.focus(false, 60);
    }

});
