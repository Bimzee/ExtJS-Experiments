/* 
 * To change this license header, choose License Headers in Project Properties.
 * To change this template file, choose Tools | Templates
 * and open the template in the editor.
 */




//  var ganttChartStore = Ext.create('Gnt.data.GanttChartStore', {
//Ext.define('Gnt.data.GanttChartStore', {
Ext.define('SampleApp.store.GanttChartStore', {
    extend: 'Ext.data.Store',
    storeId: 'GanttChartStore',
    autoLoad: true,
//    model: 'SampleApp.model.Gantt',
    fields: ['StartDate','EndDate','Id','Name','expanded','children'],
    /*proxy       : {
     type    : 'memory',
     reader  : {
     type: 'json'
     }            
     },*/
    data: [
        {
            "StartDate": "2010-01-18",
            "EndDate": "2010-02-02",
            "Id": 1,
            "Name": "Planning",
            "expanded": true,
            "children": [
                {
                    "StartDate": "2010-01-18",
                    "EndDate": "2010-01-26",
                    "Id": 2,
                    "leaf": true,
                    "Name": "Investigate",
                    "parentId": 1
                },
                {
                    "StartDate": "2010-01-22",
                    "EndDate": "2010-01-25",
                    "Id": 3,
                    "leaf": true,
                    "Name": "Investigate2",
                    "parentId": 1
                },
                {
                    "StartDate": "2010-01-28",
                    "EndDate": "2010-01-28",
                    "Id": 4,
                    "leaf": true,
                    "Name": "Investigate3",
                    "parentId": 1
                }
            ]
        }
    ]
            // eof data
            // eof proxy
});