Ext.define('SampleApp.view.GridWellList', {
    extend: 'Ext.container.Container',
    requires: [
        'Ext.grid.Panel'
    ],
    xtype: 'gridWellList',
    items: [{
            xtype: 'grid',
            title: 'Well List',
            itemId: 'GridPanel',
            height: 450,
            margin: 5,
            //width: 700,
            store: 'SampleApp.store.WellListStore',
            flex: 1,
            columns: [
                {header: '',
                    columns: [{header: ' ', dataIndex: 'ID'}]
                },
                {header: '',
                    columns: [{header: 'OP', dataIndex: 'OP'}]
                },
                {header: '',
                    columns: [{header: 'Partner', dataIndex: 'Partner'}]
                },
                {header: '',
                    columns: [{header: 'Country', dataIndex: 'Country'}]
                },
                {header: '',
                    columns: [{header: 'State', dataIndex: 'State'}]
                },
                {header: '',
                    columns: [{header: 'Prospect Name', dataIndex: 'Prospect Name'}]
                },
                {header: '',
                    columns: [{header: 'Area', dataIndex: 'Area'}]
                },
                {header: '',
                    columns: [{header: 'New?', dataIndex: 'New?'}]
                },
                {header: '',
                    columns: [{header: 'Dev/Expl', dataIndex: 'Dev/Expl'}]
                },
                {header: 'Accounting',
                    columns: [{
                            header: 'Lease & Well #',
                            dataIndex: 'Accounting'
                        }]
                },
                {header: '',
                    columns: [{header: 'Well Name', dataIndex: 'Well Name'}]
                },
                {header: '',
                    columns: [{header: ' CR WI ', dataIndex: ' CR WI '}]
                },
                {header: 'SPUD',
                    columns: [{header: 'DATE', dataIndex: 'SPUD'}]
                },
                {header: 'RIG',
                    columns: [{header: 'RELEASE', dataIndex: 'RIG'}]
                },
                {header: 'COMP',
                    columns: [{header: 'FINISH', dataIndex: 'COMP'}]
                },
                {header: 'Perf/Frac',
                    columns: [{header: 'Start', dataIndex: 'Perf/Frac'}]
                },
                {header: ' Frac ',
                    columns: [{header: 'Release', dataIndex: ' Frac '}]
                },
                {header: 'COMP',
                    columns: [{header: 'FINISH', dataIndex: 'COMP'}]
                },
                {header: 'Rod',
                    columns: [{header: 'Up', dataIndex: 'Rod'}]
                },
                {header: 'WIP',
                    columns: [{
                            header: 'Drill Cost', dataIndex: 'Drill Cost'
                        },
                        {
                            header: 'Comp Cost', dataIndex: 'Comp Cost'
                        }
                    ]
                },
                {header: 'First Water',
                    columns: [{
                            header: 'Flow', dataIndex: 'Flow'
                        },
                        {
                            header: 'Results', dataIndex: 'Results'
                        }
                    ]
                },
                {header: ' Oil/Gas ',
                    columns: [{header: 'Started', dataIndex: ' Oil/Gas '}]
                },
                {header: '',
                    columns: [{header: 'TD', dataIndex: 'TD'}]
                },
                {header: ' ',
                    columns: [{header: 'Comments', dataIndex: 'Comments'}]
                },
                {header: '',
                    columns: [{header: '90-DAYS FM PRODUCTION', dataIndex: '90-DAYS FM PRODUCTION'}]
                },
                {header: 'drill',
                    columns: [{header: 'day', dataIndex: 'drill'}]
                },
                {header: ' comp ',
                    columns: [{header: 'day', dataIndex: ' comp '}]
                }
            ],
            tools: [{
                    xtype: 'toolbar',
                    dock: 'top',
                    items: [{
                            xtype: 'tbfill'
                        },
                        {
                            xtype: 'image',
                            src: 'resources/images/ic-expand.png',
                            height: 20,
                            width: 20,
                            itemId: 'WellListExpand'
                        },
                        {
                            xtype: 'image',
                            src: 'resources/images/ic-collapse.png',
                            height: 20,
                            width: 20,
                            itemId: 'WellListCollapse',
                            //imgCls: 'cursorCls',
                            hidden: true
                        }
                    ]
                }],
            columnLines :true,
            viewConfig: {
                getRowClass: function (record, rowIndex, rowParams, store)
                {
                    //console.log(record.get('Prospect Name'));
                    if (rowIndex === 12)
                    {
                        return 'alertExpeditedCls';
                    }
                    else
                    {
                        return " ";
                    }
                }
            }
        }]
});

