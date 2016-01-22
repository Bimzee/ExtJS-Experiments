/*

Ext Gantt 2.2.23
Copyright(c) 2009-2014 Bryntum AB
http://bryntum.com/contact
http://bryntum.com/license

*/
Ext.define('Gnt.widget.BackgroundPicker', {

    extend          : 'Ext.picker.Color',

    alias           : 'widget.backgroundpicker',

    cls             : 'gnt-backgroundpicker',

    value           : null,

    clickEvent      : 'click',

    allowReselect   : false,

    colors          : [
        'none',
        '#000000', '#993300', '#333300', '#003300', '#003366', '#000080', '#333399', '#333333',
        '#800000', '#FF6600', '#808000', '#008000', '#008080', '#0000FF', '#666699', '#808080',
        '#FF0000', '#FF9900', '#99CC00', '#339966', '#33CCCC', '#3366FF', '#800080', '#969696',
        '#FF00FF', '#FFCC00', '#FFFF00', '#00FF00', '#00FFFF', '#00CCFF', '#993366', '#C0C0C0',
        '#FF99CC', '#FFCC99', '#FFFF99', '#CCFFCC', '#CCFFFF', '#99CCFF', '#CC99FF', '#FFFFFF',
        {
            id  : 'bg1',
            css : 'url(data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAMAAAADCAYAAABWKLW/AAAAGklEQVQIW2OMq7zlwwAFjCDOona1LSA+CgcAwNoKAR/wcvgAAAAASUVORK5CYII=) repeat'
        }
    ],

    renderTpl: [
        '<tpl for="colors">',
            '<a href="#" class="{parent.itemCls}" hidefocus="on" gnt-background="{.}">',
                '<span class="{parent.itemCls}-inner" style="background:{.}">&#160;</span>',
            '</a>',
        '</tpl>'
    ],

    handleClick : function (event, target) {
        var me  = this,
            value;

        event.stopEvent();

        if (!me.disabled) {
            value = target.getAttribute('gnt-background');
            me.select(value);
        }
    },

    select : function (background, suppressEvent) {

        var me          = this,
            selectedCls = me.selectedCls,
            value       = me.value,
            el;

        if (!me.rendered) {
            me.value    = background;
            return;
        }

        if (background !== value || me.allowReselect) {
            el = me.el;

            if (value) {
                el.down('a[gnt-background=' + value + ']').removeCls(selectedCls);
            }
            el.down('a[gnt-background=' + (background || 'none') + ']').addCls(selectedCls);

            me.value = background;
            if (suppressEvent !== true) {
                me.fireEvent('select', me, background);
            }
        }
    },


    getValue: function(){
        return this.value || null;
    }
});
