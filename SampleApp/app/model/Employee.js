Ext.define('SampleApp.model.Employee', {
    extend: 'Sch.model.Resource',
    nameField: "preReq_name",
//    idField: "EmpId",
    idProperty :"EmpId",
    fields: [
//        {name: 'Salary', type: 'float'},
//        {name: 'Active', type: 'boolean'},

//{name: 'preReq_id',type:'int'},
        {name: 'preReq_name', type: 'string', convert: function(values){
                debugger;
        }}
        
    ],
    proxy : {
        type : 'ajax',
        
//            url : 'resources/PreRequisites.json',
//            url : 'resources/data-employees.js',
            url : 'resources/data-employees.json',
            reader : {
                        type : 'json'
                    }
    }
});