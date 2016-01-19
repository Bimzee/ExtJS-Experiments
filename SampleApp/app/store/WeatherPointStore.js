/* 
 * To change this license header, choose License Headers in Project Properties.
 * To change this template file, choose Tools | Templates
 * and open the template in the editor.
 */
/*var store = Ext.create('Ext.data.Store',{
    model: 'WeatherPoint',
    data: [
         { temperature: 58, date: new Date(2011, 1, 1, 8) },
        { temperature: 63, date: new Date(2011, 1, 1, 9) },
        { temperature: 73, date: new Date(2011, 1, 1, 10) },
        { temperature: 78, date: new Date(2011, 1, 1, 11) },
        { temperature: 81, date: new Date(2011, 1, 1, 12) }
    ]
});*/

Ext.define('SampleApp.store.WeatherPointStore',{
    extend: 'Ext.data.Store',
    //Model, where the data specification done, need to be assigned here.
    //The data should hold with the data model specification.
    //This step i think is optional. Need to confirm.
    model: 'SampleApp.model.WeatherPoint',
    data: [
         { AFEType: 'Drilling Development',data1: 68.3 },
        { AFEType: 'Drilling Injection',data1: 17.9 },
        { AFEType: 'Capital Workover',data1: 10.2 },
        { AFEType: 'Drilling Exploration',data1: 1.7 },
        { AFEType: 'Others',data1: 1.9 }
    ]
});

