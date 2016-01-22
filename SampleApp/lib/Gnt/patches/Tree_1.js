/*

Ext Gantt 2.2.23
Copyright(c) 2009-2014 Bryntum AB
http://bryntum.com/contact
http://bryntum.com/license

*/
// We need to override `onNodeRemove` to not remove a node from nodes hash (only in case of moving node from one parent to another)
// to not cause `getNodeById` calls failure.
// This failure happens when we call `getNodeById` during `appenChild` (or `insertBefore`) call since there
// we first remove node from previous parent and then append it to the new one.
// And when we call `getNodeById` between that two steps we cannot find the node (which actually still belongs to the tree).
// We faced this issue in relateion with recalculating of early/late dates.
//
// http://www.sencha.com/forum/showthread.php?270802-4.2.1-NodeInterface-removeContext-needs-to-be-passed-as-an-arg
Ext.define('Gnt.patches.Tree', {
    override      : 'Ext.data.Tree',

    onNodeRemove: function(parent, node, isMove) {
        if (!isMove) this.unregisterNode(node, true);
    }
});
