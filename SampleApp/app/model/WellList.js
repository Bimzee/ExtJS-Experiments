/* 
 * To change this license header, choose License Headers in Project Properties.
 * To change this template file, choose Tools | Templates
 * and open the template in the editor.
 */
Ext.define('SampleApp.model.WellList', {
    extend: 'Ext.data.Model',
//    fields: ['OP', 'Partner', 'County', 'State', 'Prospect Name',
//        'Area', 'New?', 'Dev/Expl', 'Accounting', 'Well Name', 'CR WI'
//    ]
    fields: ['ID','OP','Partner','County','State','Prospect Name',
    'Area','New?','Dev/Expl','Accounting','Well Name','CR WI',
    'SPUD','RIG','COMP','Perf/Frac','Frac','COMP',
    'Rod','Drill Cost','Comp Cost','Flow','Results','Oil/Gas',
    'TD (feet)','Comments','90-DAYS FM PRODUCTION','drill','comp']
});

