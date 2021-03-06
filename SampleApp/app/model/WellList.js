Ext.define('SampleApp.model.WellList', {
    extend: 'Ext.data.Model',
//    fields: ['OP', 'Partner', 'County', 'State', 'Prospect Name',
//        'Area', 'New?', 'Dev/Expl', 'Accounting', 'Well Name', 'CR WI'
//    ]
    fields: ['ID','OP','Partner','County','State','Prospect Name',
    'Area','New?','Dev/Expl','Accounting','Well Name','CR WI',
    {name:'SPUD', mapping: 'SPUD', type:'date',dateFormat: 'm/d/y'},'RIG','COMP','Perf/Frac','Frac','COMP',
    'Rod','Drill Cost','Comp Cost','Flow','Results','Oil/Gas',
    'TD (feet)','Comments','90-DAYS FM PRODUCTION','drill','comp']
});

