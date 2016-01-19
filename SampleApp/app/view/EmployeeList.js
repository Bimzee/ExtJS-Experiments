Ext.define("SampleApp.view.EmployeeList", {
    extend : "Ext.grid.Panel",
    alias : 'widget.EmployeeList',
    title: 'Employees',
    region : 'center',
    
    store : 'Employees',

    initComponent : function() {
        var me = this;
        this.addEvents('RemoveResource');

        Ext.apply(me, {
            plugins : Ext.create('Ext.grid.plugin.CellEditing', {
                clicksToEdit: 1
            }), 
            
            columns: [
                {
                    xtype: 'actioncolumn',
                    width: 30,
                    items: [
                        {
                            iconCls : 'icon-delete',  
                            tooltip: 'Clear row',
                            action : 'RemoveResource',
                            handler: function(c, rowIndex) {
                                me.fireEvent('RemoveResource', me, rowIndex);
                            }
                        }
                    ]
                },
                {header: 'Name', dataIndex: 'Name', flex : 1, tdCls : 'user', sortable: true, field : new Ext.form.TextField()},
                {header: 'Salary', dataIndex: 'Salary', width: 100, renderer:'usMoney', align: 'right', sortable: true},
                {header: 'Active', dataIndex: 'Active', width: 50, xtype: 'booleancolumn', trueText: 'Yes', falseText: 'No', align: 'center'}
            ],
        
            tbar : [
                {
                    text : 'Add new employee',
                    action : 'AddEmployee',
                    iconCls : 'icon-add'
                }
            ]
        });

        this.callParent(arguments);
    }
});