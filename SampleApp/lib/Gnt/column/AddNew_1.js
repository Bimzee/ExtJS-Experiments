/*

Ext Gantt 2.2.23
Copyright(c) 2009-2014 Bryntum AB
http://bryntum.com/contact
http://bryntum.com/license

*/
/**
@class Gnt.column.AddNew
@extends Ext.grid.column.Column

Shows an extra column allowing the user to add a new column for any field in the data model.

*/
Ext.define("Gnt.column.AddNew", {
    extend      : "Ext.grid.column.Column",

    alias       : "widget.addnewcolumn",

    requires    : [
        'Ext.form.field.ComboBox',
        'Ext.Editor'
    ],

    mixins      : ['Gnt.mixin.Localizable'],

    /**
     * @cfg {Object} l10n
     * A object, purposed for the class localization. Contains the following keys/values:

        - text  : 'Add new column...'
     */

    width       : 100,
    resizable   : false,
    sortable    : false,
    draggable   : false,

    colEditor   : null,

    /**
     * @cfg {Array} [columnList] An array of column definition objects. It should be a list containing data as seen below
     *
     *      [
     *          { clsName : 'Gnt.column.StartDate', text : 'Start Date', config : {...} },
     *          { clsName : 'Gnt.column.Duration', text : 'Duration', config : {...} },
     *          ...
     *      ]
     *
     * If not provided, a list containing all the columns from the `Gnt.column.*` namespace will be created.
     */
    columnList  : null,

    initComponent : function() {
        if (!this.text) this.text = this.L('text');

        this.addCls('gnt-addnewcolumn');

        this.on({
            headerclick         : this.myOnHeaderClick,
            headertriggerclick  : this.myOnHeaderClick,
            scope               : this
        });

        this.callParent(arguments);
    },

    getGantt : function () {
        if (!this.gantt) {
            this.gantt = this.up('ganttpanel');
        }

        return this.gantt;
    },

    getContainingPanel : function() {
        if (!this.panel) {
            this.panel = this.up('tablepanel');
        }

        return this.panel;
    },

    myOnHeaderClick : function() {
        var me = this,
            panel,
            editor,
            titleEl;

        if (!me.combo) {
            panel = this.getContainingPanel();

            me.columnList = me.columnList || Gnt.column.AddNew.buildDefaultColumnList();
 
            editor = this.colEditor = new Ext.Editor({
                shadow      : false,
                updateEl    : false,
                itemId      : 'addNewEditor',

                // HACK: we need this editor to exist in the column header for scrolling of the grid
                renderTo    : me.el,
                offsets     : [20, 0],
                field       : new Ext.form.field.ComboBox({
                    displayField    : 'text',
                    valueField      : 'clsName',
                    hideTrigger     : true,
                    queryMode       : 'local',
                    forceSelection  : true,
                    listConfig      : {
                        itemId      : 'addNewEditorComboList',
                        minWidth    : 150
                    },
                    store           : new Ext.data.Store({
                        fields  : ['text', 'clsName', 'config'],
                        data    : me.columnList
                    }),
                    listeners : {
                        render  : function() {
                            this.on('blur', function(){
                                editor.cancelEdit();
                            });
                        },
                        select  : me.onSelect,
                        scope   : me
                    }
                })
            });
        }
        titleEl = me.el.down('.' + Ext.baseCSSPrefix + 'column-header-text');
        me.colEditor.startEdit(titleEl, '');
        me.colEditor.field.reset();
        me.colEditor.field.setWidth(this.getWidth() - 20);
        me.colEditor.field.expand();

        return false;
    },

    onSelect : function(combo, records) {
        var me              = this;
        var rec             = records[0];
        var owner           = me.ownerCt;
        var text            = rec.get('text');
        var config          = rec.get('config') || {};
        var clsName         = rec.get('clsName') || config.xclass || 'Ext.grid.column.Column';
        var view            = me.getContainingPanel().getView();
        var hasRefreshed,
            checkerFn       = function() { hasRefreshed = true; };

        view.on('refresh', checkerFn);

        me.colEditor.cancelEdit();

        Ext.require(clsName, function() {
            var cls = Ext.ClassManager.get(clsName);

            var col = Ext.create(Ext.applyIf(config, {
                xclass    : clsName,
                dataIndex : me.getGantt().taskStore.model.prototype[cls.prototype.fieldProperty],
                text      : text
            }));
            
            owner.insert(owner.items.indexOf(me), col);

            // Ext 4.2.1- doesn't refresh on header insert, 4.2.2+ does
            if (!hasRefreshed) {
                view.refresh();
            }
            view.un('refresh', checkerFn);

        });
    },

    statics : {
        /**
         * Builds default column list.
         *
         * List will contain all columns from Gnt.column.* namespace (but Gnt.column.AddNew and it's descendants) which doesn't have
         * _isGanttColumn property set to false.
         *
         * @return {{className: string, text: string, config: Object}[]}
         */
        buildDefaultColumnList : function() {
            var list = [];

            Ext.Array.each(Ext.ClassManager.getNamesByExpression('Gnt.column.*'), function(name) {
                var cls = Ext.ClassManager.get(name);

                if (
                    cls.prototype._isGanttColumn !== false && 
                    cls !== Gnt.column.AddNew &&
                    !Gnt.column.AddNew.prototype.isPrototypeOf(cls.prototype)
                ) {
                    list.push({
                        clsName : name,
                        text    : cls.prototype.localize ? cls.prototype.localize('text') : cls.prototype.text
                    });
                }
            });

            return Ext.Array.sort(list, function(a, b) { return a.text > b.text ? 1 : -1; });
        }
    } 
});
