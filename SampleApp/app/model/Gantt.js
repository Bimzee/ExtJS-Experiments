/* 
 * I think model is not a compulsary field to store data.
 * Belive Data can be directly obtained from the store.
 */


Ext.define('SampleApp.model.Gantt',{
    extend: 'Ext.data.Model',
    fields: ['StartDate','EndDate','Id','Name','expanded','children']
    
});