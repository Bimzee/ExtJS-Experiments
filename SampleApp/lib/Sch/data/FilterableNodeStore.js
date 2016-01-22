/*

Ext Scheduler 2.5.2
Copyright(c) 2009-2014 Bryntum AB
http://bryntum.com/contact
http://bryntum.com/license

*/
Ext.define("Sch.data.FilterableNodeStore", {
    extend          : 'Ext.data.NodeStore',
    
    onNodeExpand: function (parent, records, suppressEvent) {
        var treeStore           = this.treeStore;
        var isFiltered          = treeStore.isTreeFiltered(true);
        
        if (isFiltered && parent == this.node) {
            // the expand of the root node - most probably its the data loading
            treeStore.reApplyFilter();
        } else
            return this.callParent(arguments);
    },
    
    
    // @OVERRIDE
    handleNodeExpand : function (parent, records, toAdd) {
        var visibleRecords      = [];
        
        var treeStore           = this.treeStore;
        var isFiltered          = treeStore.isTreeFiltered();
        var currentFilterGeneration = treeStore.currentFilterGeneration;
        
        for (var i = 0; i < records.length; i++) {
            var record          = records[ i ];
            
            if (
                !(isFiltered && record.__filterGen != currentFilterGeneration || record.hidden)
            ) {
                visibleRecords[ visibleRecords.length ] = record;
            }
        }
        
        return this.callParent([ parent, visibleRecords, toAdd ]);
    },
    
    
    onNodeCollapse: function (parent, records, suppressEvent, callback, scope) {
        var me                  = this;
        var data                = this.data;
        var prevContains        = data.contains;
        
        var treeStore           = this.treeStore;
        var isFiltered          = treeStore.isTreeFiltered();
        var currentFilterGeneration = treeStore.currentFilterGeneration;
        
        // the default implementation of `onNodeCollapse` only checks if the 1st record from collapsed nodes
        // exists in the node store. Meanwhile, that 1st node can be hidden, so we need to check all of them
        // thats what we do in the `for` loop below
        // then, if we found a node, we want to do actual removing of nodes and we override the original code from NodeStore
        // by always returning `false` from our `data.contains` override
        data.contains           = function () {
            var node, sibling, lastNodeIndexPlus;
            
            var collapseIndex   = me.indexOf(parent) + 1;
            var found           = false;
            
            for (var i = 0; i < records.length; i++) 
                if (
                    !(records[ i ].hidden || isFiltered && records[ i ].__filterGen != currentFilterGeneration) && 
                    prevContains.call(this, records[ i ])
                ) {
                    // this is our override for internal part of `onNodeCollapse` method
                    
                    // Calculate the index *one beyond* the last node we are going to remove
                    // Need to loop up the tree to find the nearest view sibling, since it could
                    // exist at some level above the current node.
                    node = parent;
                    while (node.parentNode) {
                        sibling = node;
                        do {
                            sibling = sibling.nextSibling;
                        } while (sibling && (sibling.hidden || isFiltered && sibling.__filterGen != currentFilterGeneration));
                        
                        if (sibling) {
                            found = true;
                            lastNodeIndexPlus = me.indexOf(sibling); 
                            break;
                        } else {
                            node = node.parentNode;
                        }
                    }
                    if (!found) {
                        lastNodeIndexPlus = me.getCount();
                    }
        
                    // Remove the whole collapsed node set.
                    me.removeAt(collapseIndex, lastNodeIndexPlus - collapseIndex);
                    
                    break;
                }
            
            // always return `false`, so original NodeStore code won't execute
            return false;
        };
        
        this.callParent(arguments);
        
        data.contains           = prevContains;
    },
    
    
    onNodeAppend: function (parent, node, index) {
        var me = this,
            refNode, sibling;
            
        var treeStore           = this.treeStore;
        var isFiltered          = treeStore.isTreeFiltered();
        var currentFilterGeneration = treeStore.currentFilterGeneration;
        
        // mark node as passing current filter - so that following nodes  
        if (isFiltered) node.__filterGen = currentFilterGeneration;

        // Only react to a node append if it is to a node which is expanded, and is part of a tree
        if (me.isVisible(node)) {
            if (index === 0) {
                refNode = parent;
            } else {
                sibling = node; 
                
                do {
                    sibling = sibling.previousSibling;
                } while (sibling && (sibling.hidden || isFiltered && sibling.__filterGen != currentFilterGeneration));
                
                if (!sibling) 
                    refNode = parent;
                else {
                    while (sibling.isExpanded() && sibling.lastChild) {
                        sibling = sibling.lastChild;
                    }
                    refNode = sibling;
                }
            }
            me.insert(me.indexOf(refNode) + 1, node);
            if (!node.isLeaf() && node.isExpanded()) {
                if (node.isLoaded()) {
                    // Take a shortcut
                    me.onNodeExpand(node, node.childNodes, true);
                } else if (!me.treeStore.fillCount ) {
                    // If the node has been marked as expanded, it means the children
                    // should be provided as part of the raw data. If we're filling the nodes,
                    // the children may not have been loaded yet, so only do this if we're
                    // not in the middle of populating the nodes.
                    node.set('expanded', false);
                    node.expand();
                }
            }
        }
    }
    
});