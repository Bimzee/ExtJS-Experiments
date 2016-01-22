/*

Ext Gantt 2.2.23
Copyright(c) 2009-2014 Bryntum AB
http://bryntum.com/contact
http://bryntum.com/license

*/
Ext.define('Gnt.patches.IETreeStore', {
    extend      : 'Sch.util.Patch',

    requires    : ['Gnt.data.TaskStore'],
    target      : 'Gnt.data.TaskStore',

    ieOnly      : true,

    overrides   : {

        // @OVERRIDE
        // Need a hack to protect IE
        onNodeAdded : function (parent, node) {
            var me = this,
                proxy = me.getProxy(),
                reader = proxy.getReader(),
                data = node.raw || node[node.persistenceProperty],
                dataRoot;

            Ext.Array.remove(me.removed, node);
            node.join(me);

            if (!node.isLeaf()) {
                dataRoot = reader.getRoot(data);
                if (dataRoot) {
                    me.fillNode(node, reader.extractData(dataRoot));
                    if (data[reader.root]) {        // MODIFIED, ADDED IF CHECK
                        delete data[reader.root];
                    }
                }
            }

            if (me.autoSync && !me.autoSyncSuspended && (node.phantom || node.dirty)) {
                me.sync();
            }
        }
    }
});
