/* 
 * To change this license header, choose License Headers in Project Properties.
 * To change this template file, choose Tools | Templates
 * and open the template in the editor.
 */
Ext.define('SampleApp.store.WellListStore',{
    extend: 'Ext.data.Store',
    model: 'SampleApp.model.WellList',
    autoLoad:true,
    proxy: {
      type: 'ajax',
      url: 'resources/WellList.json',
      reader : {
          type:'json',
          root:''
      }
    }
});

